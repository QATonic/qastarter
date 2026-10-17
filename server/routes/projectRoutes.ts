/**
 * Project Generation Routes
 * Endpoints for generating, previewing, and managing projects
 */

import { Router, Request } from 'express';
import { ipKeyGenerator } from 'express-rate-limit';
import { sharedRateLimit } from '../middleware/sharedRateLimit';
import { type ProjectConfig } from '@shared/schema';
import { parseProjectConfiguration } from '../services/configurationService';
import { projectService } from '../services/projectService';
import { sanitizeProjectName } from '@shared/sanitize';
import { ErrorCode, generateRequestId, asyncHandler } from '../errors';
import { createRequestLogger } from '../utils/logger';
import { mcpConfig, rateLimitConfig } from '../config';
import { trackEvent, generateSessionId } from '../services/analyticsService';
import { timingSafeEqual } from 'crypto';

/** Constant-time string equality so attackers can't derive the bypass token via timing. */
function safeTokenEqual(a: string, b: string): boolean {
  if (!a || !b) return false;
  const aBuf = Buffer.from(a, 'utf8');
  const bBuf = Buffer.from(b, 'utf8');
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

const router = Router();

/**
 * Classify the caller so we can (a) tag analytics with a `source` field and
 * (b) give MCP-aware AI clients a higher rate-limit budget — they iterate
 * far faster than humans clicking through the wizard.
 *
 *  - `mcp-trusted`: `X-QAStarter-Client: mcp` **and** `X-QAStarter-Token`
 *    matches the server's `QASTARTER_MCP_BYPASS_TOKEN` env. Gets the
 *    elevated `rateLimitConfig.mcpGeneration.max`.
 *  - `mcp`:     `X-QAStarter-Client: mcp` without a valid token — still
 *    tagged for telemetry but subject to the default anonymous limit.
 *  - `cli`:     CLI-shaped user agents (curl / node-fetch / go-http / …).
 *  - `web`:     everything else (presumed a browser).
 */
export type ClientSource = 'mcp-trusted' | 'mcp' | 'cli' | 'web';

export function detectClientSource(req: Request): ClientSource {
  const client = String(req.headers[mcpConfig.clientHeader] || '').toLowerCase();
  if (client === mcpConfig.clientHeaderValue) {
    const token = String(req.headers[mcpConfig.tokenHeader] || '');
    if (mcpConfig.bypassToken && safeTokenEqual(token, mcpConfig.bypassToken)) {
      return 'mcp-trusted';
    }
    return 'mcp';
  }
  const ua = String(req.headers['user-agent'] || '').toLowerCase();
  if (/(curl|wget|node|axios|fetch|undici|go-http)/.test(ua)) return 'cli';
  return 'web';
}

// Project generation rate limiter.
//
// The `max` is resolved per-request: trusted MCP clients (valid bypass token)
// get `rateLimitConfig.mcpGeneration.max`, everyone else gets the default
// anonymous cap. This keeps wizard users honest while letting AI assistants
// iterate quickly during a single session.
const generateProjectLimiter = sharedRateLimit('generation', {
  windowMs: rateLimitConfig.generation.windowMs,
  max: (req) =>
    detectClientSource(req as Request) === 'mcp-trusted'
      ? rateLimitConfig.mcpGeneration.max
      : rateLimitConfig.generation.max,
  // Explicit keyGenerator: `req.ip` already respects `app.set('trust proxy', N)` from
  // server/index.ts, so this equals the real client IP for the N upstream hops we trust.
  // If `trust proxy` is misconfigured, fail closed on 'anon' rather than per-request unique
  // keys (which would effectively disable the limit).
  keyGenerator: (req) => ipKeyGenerator(req.ip || 'anon'),
  message: {
    success: false,
    error: {
      code: ErrorCode.RATE_LIMIT_EXCEEDED,
      message: 'Too many project generation requests. Please try again in 15 minutes.',
      timestamp: new Date().toISOString(),
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

/**
 * Generate and download project
 */
router.post(
  '/v1/generate-project',
  generateProjectLimiter,
  asyncHandler(async (req, res) => {
    const requestId = generateRequestId('gen');

    const config: ProjectConfig = await parseProjectConfiguration(req.body, requestId);

    const reqLogger = createRequestLogger(requestId);

    // Tag the generation event with the client source so we can distinguish
    // AI/MCP picks from human wizard picks in analytics.
    trackEvent(
      'project_generate',
      generateSessionId(),
      {
        source: detectClientSource(req),
        testingType: config.testingType,
        framework: config.framework,
        language: config.language,
        testRunner: config.testRunner,
        buildTool: config.buildTool,
        testingPattern: config.testingPattern,
      },
      {
        userAgent:
          typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : undefined,
      }
    );

    await projectService.generateAndStreamProject(config, res, requestId, reqLogger);
  })
);

/**
 * Get project dependencies
 */
router.post(
  '/v1/project-dependencies',
  asyncHandler(async (req, res) => {
    const requestId = generateRequestId('deps');

    const config: ProjectConfig = await parseProjectConfiguration(req.body, requestId);

    const dependencies = await projectService.getDependencies(config);

    res.json({
      success: true,
      data: {
        dependencies,
        buildTool: config.buildTool,
        language: config.language,
      },
    });
  })
);

/**
 * Get project preview (structure and sample files)
 */
router.post(
  '/v1/project-preview',
  asyncHandler(async (req, res) => {
    const requestId = generateRequestId('preview');

    const config: ProjectConfig = await parseProjectConfiguration(req.body, requestId);

    const files = await projectService.generatePreview(config);

    // Build file tree structure
    interface PreviewFile {
      name: string;
      type: 'file' | 'folder';
      content?: string;
      children?: PreviewFile[];
    }

    const buildFileTree = (
      files: Awaited<ReturnType<typeof projectService.generatePreview>>
    ): PreviewFile[] => {
      const children: PreviewFile[] = [];
      for (const file of [...files].sort(
        (a, b) => a.path.split('/').length - b.path.split('/').length
      )) {
        const parts = file.path.split('/');
        let level = children;
        parts.forEach((name, index) => {
          if (index === parts.length - 1) {
            level.push({
              name,
              type: 'file',
              content: Buffer.isBuffer(file.content)
                ? '(binary file, ' + file.content.length + ' bytes)'
                : file.content,
            });
          } else {
            let folder = level.find((item) => item.name === name && item.type === 'folder');
            if (!folder) {
              folder = { name, type: 'folder', children: [] };
              level.push(folder);
            }
            level = folder.children!;
          }
        });
      }
      return [{ name: config.projectName, type: 'folder', children }];
    };

    const projectStructure = buildFileTree(files);

    const sampleFiles = files
      .filter((file) => {
        const fileName = file.path.split('/').pop()?.toLowerCase() || '';
        return (
          fileName.includes('pom.xml') ||
          fileName.includes('readme') ||
          fileName.includes('test') ||
          fileName.includes('base') ||
          fileName.includes('page') ||
          fileName.includes('config')
        );
      })
      .slice(0, 8)
      .map((file) => {
        // Binary files (e.g. gradle-wrapper.jar) can't be inlined as
        // text; show a size marker instead of a corrupted preview.
        if (Buffer.isBuffer(file.content)) {
          return {
            path: file.path,
            content: `(binary file, ${file.content.length} bytes)`,
          };
        }
        return {
          path: file.path,
          content:
            file.content.substring(0, 2000) +
            (file.content.length > 2000 ? '\n\n... (content truncated for preview)' : ''),
        };
      });

    const estimatedSize = files.reduce((total, file) => {
      return total + (file.content?.length || 0);
    }, 0);

    const keyFiles = files
      .filter((file) => {
        const fileName = file.path.split('/').pop()?.toLowerCase() || '';
        const path = file.path.toLowerCase();
        return (
          path.includes('test') ||
          fileName.includes('readme') ||
          fileName.includes('pom.xml') ||
          fileName.includes('build.gradle') ||
          fileName.includes('package.json') ||
          fileName.includes('requirements.txt') ||
          fileName.includes('config') ||
          fileName.includes('.csproj') ||
          fileName.includes('jenkinsfile') ||
          fileName.includes('.yml') ||
          fileName.includes('.yaml')
        );
      })
      .map((file) => ({
        path: file.path,
        type: file.path.toLowerCase().includes('test')
          ? 'test'
          : file.path.toLowerCase().includes('readme')
            ? 'documentation'
            : 'configuration',
      }));

    const dependencies = await projectService.getDependencies(config);
    const dependencyCount = Object.keys(dependencies).length;

    res.json({
      success: true,
      data: {
        projectStructure,
        sampleFiles,
        totalFiles: files.length,
        estimatedSize: Math.ceil(estimatedSize / 1024),
        keyFiles,
        dependencyCount,
        projectConfig: config,
      },
    });
  })
);

/**
 * Public API v1 - Generate project with query parameters
 */
router.get(
  '/v1/generate',
  generateProjectLimiter,
  asyncHandler(async (req, res) => {
    const requestId = generateRequestId('api-gen');

    const input = {
      projectName: 'my-qa-project',
      testingType: 'web',
      framework: 'selenium',
      language: 'java',
      ...req.query,
    };
    if (typeof input.projectName === 'string')
      input.projectName = sanitizeProjectName(input.projectName);
    const config = await parseProjectConfiguration(input, requestId);

    // Tag the generation event with the client source (mcp / cli / web).
    trackEvent(
      'project_generate',
      generateSessionId(),
      {
        source: detectClientSource(req),
        testingType: config.testingType,
        framework: config.framework,
        language: config.language,
        testRunner: config.testRunner,
        buildTool: config.buildTool,
      },
      {
        userAgent:
          typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : undefined,
      }
    );

    const reqLogger = createRequestLogger(requestId);
    await projectService.generateAndStreamProject(config, res, requestId, reqLogger);
  })
);

export default router;
