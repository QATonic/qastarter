/**
 * Health Check Routes
 * Endpoints for monitoring service health and status
 */

import { Router } from 'express';
import { getCacheHealth } from '../services/cache';
import { asyncHandler } from '../errors';

const router = Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 */
router.get('/health', (req, res) => {
    const uptime = process.uptime();
    const cacheHealth = getCacheHealth();

    res.json({
        success: true,
        data: {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            uptime: Math.floor(uptime),
            environment: process.env.NODE_ENV || 'development',
            cache: cacheHealth,
            memory: {
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
                unit: 'MB'
            }
        }
    });
});

/**
 * @swagger
 * /api/v1/health/cache:
 *   get:
 *     summary: Cache health check
 *     tags: [Health]
 */
router.get('/v1/health/cache', asyncHandler(async (req, res) => {
    const cacheHealth = await getCacheHealth();

    res.json({
        success: true,
        data: {
            status: cacheHealth.healthy ? 'healthy' : 'unhealthy',
            provider: cacheHealth.provider,
            statistics: cacheHealth.stats,
            timestamp: new Date().toISOString(),
        }
    });
}));

export default router;
