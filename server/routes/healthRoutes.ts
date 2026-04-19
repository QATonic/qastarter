/**
 * Health Check Routes
 * Endpoints for monitoring service health and status
 */

import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { getCacheHealth } from '../services/cache';
import { asyncHandler } from '../errors';
import { validationMatrix } from '@shared/validationMatrix';

const router = Router();

/**
 * @swagger
 * /api/v1/health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 */
router.get(
  '/v1/health',
  asyncHandler(async (req, res) => {
    const uptime = process.uptime();
    const cacheHealth = await getCacheHealth();

    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        uptime: Math.floor(uptime),
        environment: process.env.NODE_ENV || 'development',
        cache: cacheHealth,
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          unit: 'MB',
        },
      },
    });
  })
);

/**
 * @swagger
 * /api/v1/health/cache:
 *   get:
 *     summary: Cache health check
 *     tags: [Health]
 */
router.get(
  '/v1/health/cache',
  asyncHandler(async (req, res) => {
    const cacheHealth = await getCacheHealth();

    res.json({
      success: true,
      data: {
        status: cacheHealth.healthy ? 'healthy' : 'unhealthy',
        provider: cacheHealth.provider,
        statistics: cacheHealth.stats,
        timestamp: new Date().toISOString(),
      },
    });
  })
);

/**
 * @swagger
 * /api/v1/health/deep:
 *   get:
 *     summary: Deep health check — verifies the scaffold engine end-to-end.
 *     description: |
 *       Runs the same probes an uptime monitor should care about:
 *         1. Metadata route works (the MCP server and CLI depend on it).
 *         2. Template packs directory is present and non-empty.
 *         3. Cache provider responds.
 *       Returns 503 if any critical probe fails so monitoring services can
 *       page on a hard failure without also paging on slow responses.
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: All probes healthy.
 *       503:
 *         description: At least one critical probe failed.
 */
router.get(
  '/v1/health/deep',
  asyncHandler(async (_req, res) => {
    type Probe = { name: string; ok: boolean; detail?: string; ms?: number };
    const probes: Probe[] = [];

    // 1. Metadata: touch the in-process validation matrix instead of an HTTP
    //    self-call so we don't self-DDoS if the server is under load. This is
    //    the same data the /v1/metadata endpoint serves to the MCP server +
    //    CLI, so if this probe is green so is that route.
    {
      const t = Date.now();
      try {
        const types = validationMatrix.testingTypes;
        const ok = Array.isArray(types) && types.length >= 5; // web, mobile, api, desktop, performance
        probes.push({
          name: 'metadata',
          ok,
          detail: ok ? `${types.length} testing types` : `Only ${types?.length ?? 0} testing types`,
          ms: Date.now() - t,
        });
      } catch (err) {
        probes.push({
          name: 'metadata',
          ok: false,
          detail: err instanceof Error ? err.message : String(err),
          ms: Date.now() - t,
        });
      }
    }

    // 2. Template packs: directory exists and has a sensible number of packs.
    {
      const t = Date.now();
      try {
        const packsDir = path.resolve(process.cwd(), 'server/templates/packs');
        const entries = fs.existsSync(packsDir) ? fs.readdirSync(packsDir) : [];
        const packs = entries.filter((e) => fs.statSync(path.join(packsDir, e)).isDirectory());
        const ok = packs.length >= 40; // 49 at the time of writing; alert if we lose many.
        probes.push({
          name: 'templatePacks',
          ok,
          detail: `${packs.length} packs on disk`,
          ms: Date.now() - t,
        });
      } catch (err) {
        probes.push({
          name: 'templatePacks',
          ok: false,
          detail: err instanceof Error ? err.message : String(err),
          ms: Date.now() - t,
        });
      }
    }

    // 3. Cache.
    {
      const t = Date.now();
      try {
        const cache = await getCacheHealth();
        probes.push({
          name: 'cache',
          ok: !!cache.healthy,
          detail: cache.provider,
          ms: Date.now() - t,
        });
      } catch (err) {
        probes.push({
          name: 'cache',
          ok: false,
          detail: err instanceof Error ? err.message : String(err),
          ms: Date.now() - t,
        });
      }
    }

    const allOk = probes.every((p) => p.ok);
    res.status(allOk ? 200 : 503).json({
      success: allOk,
      data: {
        status: allOk ? 'healthy' : 'degraded',
        probes,
        timestamp: new Date().toISOString(),
      },
    });
  })
);

export default router;
