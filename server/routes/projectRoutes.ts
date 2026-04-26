/**
 * Project Generation Routes
 * Endpoints for generating, previewing, and managing projects
 */

import { Router, Request } from 'express';
import rateLimit from 'express-rate-limit';
import { projectConfigSchema, type ProjectConfig } from '@shared/schema';
import { projectService } from '../services/projectService';
import { WizardValidator } from '@shared/validationMatrix';
import { sanitizeProjectName, sanitizeGroupId, sanitizeArtifactId } from '@shared/sanitize';
import {
  ValidationError,
  IncompatibleCombinationError,
  ErrorCode,
  generateRequestId,
  asyncHandler,
} from '../errors';
import { createRequestLogger } from '../utils/logger';
import { logger } from '../utils/logger';
import { mcpConfig, rateLimitConfig } from '../config';
import { trackEvent, generateSessionId } from '../services/analyticsService';
import { timingSafeEqual } from 'crypto';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';

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
 *  - `mcp`:         `X-QAStarter-Client: mcp` without a valid token — still
 *    tagged for telemetry but subject to the default anonymous limit.
 *  - `cli`:         CLI-shaped user agents (curl / node-fetch / go-http / …).
 *  - `web`:         everything else (presumed a browser).
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

/**
 * Reusable validation helper to reduce code duplication (DRY)
 * Validates request body against projectConfigSchema
 */
function validateProjectConfigBody(body: unknown, requestId: string): ProjectConfig {
  const validationResult = projectConfigSchema.safeParse(body);

  if (!validationResult.success) {
    const errors = validationResult.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    throw new ValidationError('Invalid project configuration', errors, requestId);
  }

  return validationResult.data;
}

/**
 * Build the rate-limit store. Defaults to in-memory for single-instance deployments
 * (unit tests, local dev, small Docker runs). If `REDIS_URL` is set we use the
 * shared Redis so multiple app replicas observe the same counters — without it,
 * each replica enforces its own copy of the limit (so 3 replicas ⇒ effectively 3×).
 */
function buildRateLimitStore(): ReturnType<typeof rateLimit>['store'] | undefined {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    logger.info('Rate limiter using in-memory store (set REDIS_URL for multi-replica accuracy)');
    return undefined; // express-rate-limit falls back to its built-in memory store
  }
  try {
    const client = createClient({ url: redisUrl });
    client.on('error', (err) =>
      logger.warn('Rate-limit Redis client error', { error: (err as Error).message })
    );
    // Fire-and-forget connect. express-rate-limit queues commands until ready.
    void client.connect();
    logger.info('Rate limiter using Redis store', {
      url: redisUrl.replace(/\/\/[^:]+:[^@]+@/, '//*****:*****@'),
    });
    return new RedisStore({
      // `sendCommand` is the v4 redis client's low-level command invoker; rate-limit-redis
      // relies on this signature to remain store-library-version agnostic.
      sendCommand: (...args: string[]) => client.sendCommand(args),
      prefix: 'qastarter-rl:',
    });
  } catch (err) {
    logger.warn('Failed to initialise Redis rate-limit store — falling back to in-memory', {
      error: err instanceof Error ? err.message : String(err),
    });
    return undefined;
  }
}

// Project generation rate limiter.
//
// The `max` is resolved per-request: trusted MCP clients (valid bypass token)
// get `rateLimitConfig.mcpGeneration.max`, everyone else gets the default
// anonymous cap. This keeps wizard users honest while letting AI assistants
// iterate quickly during a single session.
const generateProjectLimiter = rateLimit({
  store: buildRateLimitStore(),
  windowMs: rateLimitConfig.generation.windowMs,
  max: (req) =>
    detectClientSource(req as Request) === 'mcp-trusted'
      ? rateLimitConfig.mcpGeneration.max
      : rateLimitConfig.generation.max,
  // Explicit keyGenerator: `req.ip` already respects `app.set('trust proxy', N)` from
  // server/index.ts, so this equals the real client IP for the N upstream hops we trust.
  // If `trust proxy` is misconfigured, fail closed on 'anon' rather than per-request unique
  // keys (which would effectively disable the limit).
  keyGenerator: (req) => req.ip || 'anon',
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

    const config: ProjectConfig = validateProjectConfigBody(req.body, requestId);

    // Sanitize user inputs
    config.projectName = sanitizeProjectName(config.projectName);
    if (config.groupId) {
      config.groupId = sanitizeGroupId(config.groupId);
    }
    if (config.artifactId) {
      config.artifactId = sanitizeArtifactId(config.artifactId);
    }

    const reqLogger = createRequestLogger(requestId);

    // Validate compatibility
    if (!WizardValidator.isCompatible(config.testingType, config.framework, config.language)) {
      throw new IncompatibleCombinationError(
        config.testingType,
        config.framework,
        config.language,
        requestId
      );
    }

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
        userAgent: typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : undefined,
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

    const config: ProjectConfig = validateProjectConfigBody(req.body, requestId);

    if (!WizardValidator.isCompatible(config.testingType, config.framework, config.language)) {
      throw new IncompatibleCombinationError(
        config.testingType,
        config.framework,
        config.language,
        requestId
      );
    }

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

    const config: ProjectConfig = validateProjectConfigBody(req.body, requestId);

    if (!WizardValidator.isCompatible(config.testingType, config.framework, config.language)) {
      throw new IncompatibleCombinationError(
        config.testingType,
        config.framework,
        config.language,
        requestId
      );
    }

    const files = await projectService.generatePreview(config);

    // Build file tree structure
    interface PreviewFile {
      name: string;
      type: 'file' | 'folder';
      content?: string;
      children?: PreviewFile[];
    }

    const buildFileTree = (files: any[]): PreviewFile[] => {
      const tree: { [key: string]: any } = {};

      const sortedFiles = files.sort((a, b) => {
        const aDepth = a.path.split('/').length;
        const bDepth = b.path.split('/').length;
        return aDepth - bDepth;
      });

      sortedFiles.forEach((file) => {
        const pathParts = file.path.split('/');
        let currentLevel = tree;

        pathParts.forEach((part: string, index: number) => {
          if (index === pathParts.length - 1) {
            // Binary file content is not serializable to the UI as text;
            // substitute a marker so the tree still shows the node.
            const content = Buffer.isBuffer(file.content)
              ? `(binary file, ${file.content.length} bytes)`
              : file.content;
            currentLevel[part] = {
              name: part,
              type: 'file',
              content,
            };
          } else {
            if (!currentLevel[part]) {
              currentLevel[part] = {
                name: part,
                type: 'folder',
                children: {},
              };
            }
            currentLevel = currentLevel[part].children;
          }
        });
      });

      const convertToArray = (obj: any): PreviewFile[] => {
        return Object.values(obj).map((item: any) => {
          if (item.type === 'folder' && item.children) {
            return {
              ...item,
              children: convertToArray(item.children),
            };
          }
          return item;
        });
      };

      return [
        {
          name: config.projectName,
          type: 'folder' as const,
          children: convertToArray(tree),
        },
      ];
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

    const {
      projectName = 'my-qa-project',
      testingType: testingTypeParam = 'web',
      framework = 'selenium',
      language = 'java',
      testRunner,
      buildTool,
      testingPattern = 'page-object-model',
      cicdTool,
      reportingTool,
      cloudDeviceFarm: cloudDeviceFarmParam,
      includeSampleTests = 'true',
      utilities: utilitiesParam,
    } = req.query as Record<string, string>;

    // Narrow cloudDeviceFarm to the allowed set so a caller can't pass an
    // unknown value through and have the template engine trip on it later.
    // browserstack is fully wired; saucelabs and testmu are accepted at
    // the API surface but flagged as "Coming Soon" in the wizard UI —
    // the template engine has yml placeholders only.
    const validCloudFarms = ['none', 'browserstack', 'saucelabs', 'testmu'] as const;
    const cloudDeviceFarm = validCloudFarms.includes(cloudDeviceFarmParam as (typeof validCloudFarms)[number])
      ? cloudDeviceFarmParam
      : undefined;

    const validTestingTypes = ['web', 'mobile', 'api', 'desktop', 'performance'] as const;
    type TestingType = (typeof validTestingTypes)[number];
    const testingType: TestingType = validTestingTypes.includes(testingTypeParam as any)
      ? (testingTypeParam as TestingType)
      : 'web';

    const utilitiesArray = utilitiesParam
      ? utilitiesParam
          .split(',')
          .map((u) => u.trim())
          .filter(Boolean)
      : [];
    const utilities = {
      configReader: utilitiesArray.includes('configReader'),
      jsonReader: utilitiesArray.includes('jsonReader'),
      screenshotUtility:
        utilitiesArray.includes('screenshotUtility') || utilitiesArray.includes('screenshot'),
      logger: utilitiesArray.includes('logger') || utilitiesArray.includes('logging'),
      dataProvider:
        utilitiesArray.includes('dataProvider') || utilitiesArray.includes('dataDriver'),
    };

    const availableTestRunners = WizardValidator.getAvailableTestRunners(language);
    const availableBuildTools = WizardValidator.getAvailableBuildTools(language);

    const finalTestRunner = testRunner || availableTestRunners[0] || 'testng';
    const finalBuildTool = buildTool || availableBuildTools[0] || 'maven';

    const config: ProjectConfig = {
      projectName: sanitizeProjectName(projectName),
      testingType,
      framework,
      language,
      testRunner: finalTestRunner,
      buildTool: finalBuildTool,
      testingPattern,
      cicdTool: cicdTool || undefined,
      reportingTool: reportingTool || undefined,
      cloudDeviceFarm: cloudDeviceFarm || undefined,
      utilities,
      includeSampleTests: includeSampleTests !== 'false',
    };

    const validatedConfig = validateProjectConfigBody(config, requestId);

    if (
      !WizardValidator.isCompatible(
        validatedConfig.testingType,
        validatedConfig.framework,
        validatedConfig.language
      )
    ) {
      throw new IncompatibleCombinationError(
        config.testingType,
        config.framework,
        config.language,
        requestId
      );
    }

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
        userAgent: typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : undefined,
      }
    );

    const reqLogger = createRequestLogger(requestId);
    await projectService.generateAndStreamProject(config, res, requestId, reqLogger);
  })
);

export default router;
