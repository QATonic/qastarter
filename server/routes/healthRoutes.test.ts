/**
 * Unit Tests for Health Routes
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

// Mock dependencies before importing routes
vi.mock('../services/cache', () => ({
  getCacheHealth: vi.fn().mockReturnValue({
    healthy: true,
    provider: 'memory',
    stats: { hits: 10, misses: 5 },
  }),
}));

import healthRoutes from './healthRoutes';
import { getCacheHealth } from '../services/cache';

function createApp() {
  const app = express();
  app.use('/api', healthRoutes);
  return app;
}

describe('Health Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/health', () => {
    it('should return healthy status', async () => {
      const app = createApp();
      const res = await request(app).get('/api/v1/health');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('healthy');
    });

    it('should include timestamp', async () => {
      const app = createApp();
      const res = await request(app).get('/api/v1/health');

      expect(res.body.data.timestamp).toBeDefined();
      // Should be a valid ISO string
      expect(new Date(res.body.data.timestamp).toISOString()).toBe(res.body.data.timestamp);
    });

    it('should include version', async () => {
      const app = createApp();
      const res = await request(app).get('/api/v1/health');

      expect(res.body.data.version).toBe('1.0.0');
    });

    it('should include uptime', async () => {
      const app = createApp();
      const res = await request(app).get('/api/v1/health');

      expect(typeof res.body.data.uptime).toBe('number');
      expect(res.body.data.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should include memory information', async () => {
      const app = createApp();
      const res = await request(app).get('/api/v1/health');

      expect(res.body.data.memory).toBeDefined();
      expect(res.body.data.memory.unit).toBe('MB');
      expect(typeof res.body.data.memory.used).toBe('number');
      expect(typeof res.body.data.memory.total).toBe('number');
    });

    it('should include cache health', async () => {
      const app = createApp();
      const res = await request(app).get('/api/v1/health');

      expect(res.body.data.cache).toBeDefined();
    });
  });

  describe('GET /api/v1/health/cache', () => {
    it('should return healthy cache status', async () => {
      const app = createApp();
      const res = await request(app).get('/api/v1/health/cache');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('healthy');
      expect(res.body.data.provider).toBe('memory');
    });

    it('should return unhealthy when cache is down', async () => {
      vi.mocked(getCacheHealth).mockReturnValue({
        healthy: false,
        provider: 'redis',
        stats: {},
      } as any);

      const app = createApp();
      const res = await request(app).get('/api/v1/health/cache');

      expect(res.body.data.status).toBe('unhealthy');
      expect(res.body.data.provider).toBe('redis');
    });

    it('should include timestamp', async () => {
      const app = createApp();
      const res = await request(app).get('/api/v1/health/cache');

      expect(res.body.data.timestamp).toBeDefined();
    });
  });
});
