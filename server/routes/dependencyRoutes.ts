/**
 * Dependency Registry Routes
 *
 * Thin HTTP layer over {@link server/services/dependencyRegistry.ts}.
 * Powers the Express Generator's "search dependencies" UX by
 * proxying searches to Maven Central and the npm registry.
 */

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  searchRegistry,
  getRegistryVersions,
  type RegistryId,
  type NormalizedDependency,
} from '../services/dependencyRegistry';
// (humanizeUpstreamError is defined below)
import { ValidationError, ExternalServiceError, asyncHandler, generateRequestId } from '../errors';

const router = Router();

const SUPPORTED_REGISTRIES: readonly RegistryId[] = ['maven', 'npm', 'nuget', 'pypi'] as const;

// Per-IP rate limiter — dependency search can easily be abused to proxy
// arbitrary traffic, so we keep it tight.
const dependencyLimiter = rateLimit({
  windowMs: 60_000, // 1 minute
  max: 60, // 60 searches per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many dependency search requests. Please slow down.',
    },
  },
});

function parseRegistry(value: unknown, requestId: string): RegistryId {
  if (typeof value !== 'string' || !SUPPORTED_REGISTRIES.includes(value as RegistryId)) {
    throw new ValidationError(
      `registry must be one of: ${SUPPORTED_REGISTRIES.join(', ')}`,
      [{ field: 'registry', message: 'Unsupported registry' }],
      requestId
    );
  }
  return value as RegistryId;
}

function parseLimit(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return undefined;
  return Math.min(Math.floor(n), 25);
}

/**
 * @swagger
 * /api/v1/dependencies/search:
 *   get:
 *     summary: Search a public package registry (Maven Central or npm)
 *     tags: [Dependencies]
 *     parameters:
 *       - in: query
 *         name: registry
 *         required: true
 *         schema:
 *           type: string
 *           enum: [maven, npm, nuget, pypi]
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 25
 *     responses:
 *       200:
 *         description: List of matching dependencies
 */
router.get(
  '/v1/dependencies/search',
  dependencyLimiter,
  asyncHandler(async (req, res) => {
    const requestId = generateRequestId('dep');
    const registry = parseRegistry(req.query.registry, requestId);
    const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const limit = parseLimit(req.query.limit);

    if (!query) {
      throw new ValidationError(
        'Query string "q" is required',
        [{ field: 'q', message: 'Query is required' }],
        requestId
      );
    }

    try {
      const results: NormalizedDependency[] = await searchRegistry(registry, query, { limit });
      res.json({
        success: true,
        data: {
          registry,
          query,
          count: results.length,
          results,
        },
      });
    } catch (err) {
      throw new ExternalServiceError(
        registry === 'maven' ? 'Maven Central' : 'npm registry',
        humanizeUpstreamError(err, registry),
        requestId,
        { cause: err instanceof Error ? err : undefined }
      );
    }
  })
);

/**
 * @swagger
 * /api/v1/dependencies/versions:
 *   get:
 *     summary: List available versions for a given dependency
 *     tags: [Dependencies]
 *     parameters:
 *       - in: query
 *         name: registry
 *         required: true
 *         schema:
 *           type: string
 *           enum: [maven, npm, nuget, pypi]
 *       - in: query
 *         name: id
 *         required: true
 *         description: "For Maven: group:artifact. For npm: package name."
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Array of versions, newest-first
 */
router.get(
  '/v1/dependencies/versions',
  dependencyLimiter,
  asyncHandler(async (req, res) => {
    const requestId = generateRequestId('dep');
    const registry = parseRegistry(req.query.registry, requestId);
    const id = typeof req.query.id === 'string' ? req.query.id.trim() : '';

    if (!id) {
      throw new ValidationError(
        'Query parameter "id" is required',
        [{ field: 'id', message: 'Dependency id is required' }],
        requestId
      );
    }

    try {
      const versions = await getRegistryVersions(registry, id);
      res.json({
        success: true,
        data: {
          registry,
          id,
          count: versions.length,
          versions,
        },
      });
    } catch (err) {
      throw new ExternalServiceError(
        registry === 'maven' ? 'Maven Central' : 'npm registry',
        humanizeUpstreamError(err, registry),
        requestId,
        { cause: err instanceof Error ? err : undefined }
      );
    }
  })
);

/**
 * Translate raw upstream errors into human-readable messages.
 * Both Maven Central and the npm registry can be slow / flaky, and the
 * default Node fetch errors ("This operation was aborted", "fetch failed")
 * are unhelpful surfaced to end users.
 */
function humanizeUpstreamError(err: unknown, registry: RegistryId): string {
  const registryNames: Record<RegistryId, string> = {
    maven: 'Maven Central',
    npm: 'the npm registry',
    nuget: 'the NuGet registry',
    pypi: 'PyPI',
  };
  const upstream = registryNames[registry];

  if (err instanceof Error) {
    const name = err.name;
    const msg = err.message.toLowerCase();

    if (name === 'UpstreamTimeoutError' || msg.includes('upstream did not respond')) {
      return `${upstream} took too long to respond. It may be experiencing issues — please try again in a moment.`;
    }
    if (msg.includes('aborted')) {
      return `${upstream} did not respond in time. Please try again.`;
    }
    if (
      msg.includes('econnreset') ||
      msg.includes('socket hang up') ||
      msg.includes('fetch failed')
    ) {
      return `Could not reach ${upstream}. Please check your network connection and try again.`;
    }
    if (msg.includes('enotfound')) {
      return `Could not resolve ${upstream}. Please check your DNS / network connection.`;
    }
    if (msg.includes('502') || msg.includes('503') || msg.includes('504')) {
      return `${upstream} is temporarily unavailable. Please try again in a moment.`;
    }
    return err.message;
  }

  return `Unknown error talking to ${upstream}.`;
}

export default router;
