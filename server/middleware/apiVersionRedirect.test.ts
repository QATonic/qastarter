/**
 * Unit Tests for API Version Redirect Middleware
 */

import { describe, it, expect, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { apiVersionRedirect } from './apiVersionRedirect';

vi.mock('../utils/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

function createApp() {
  const app = express();
  app.use(apiVersionRedirect);

  // Register v1 routes that the middleware should redirect to
  app.get('/v1/health', (req, res) => res.json({ route: 'v1-health' }));
  app.get('/v1/stats', (req, res) => res.json({ route: 'v1-stats' }));
  app.post('/v1/validate-config', express.json(), (req, res) =>
    res.json({ route: 'v1-validate-config', body: req.body })
  );
  app.post('/v1/analytics/events', express.json(), (req, res) =>
    res.json({ route: 'v1-analytics-events', body: req.body })
  );
  app.get('/v1/analytics/stats', (req, res) => res.json({ route: 'v1-analytics-stats' }));
  app.get('/v1/analytics/session', (req, res) => res.json({ route: 'v1-analytics-session' }));
  app.post('/v1/generate-project', express.json(), (req, res) =>
    res.json({ route: 'v1-generate-project' })
  );
  app.post('/v1/project-dependencies', express.json(), (req, res) =>
    res.json({ route: 'v1-project-dependencies' })
  );
  app.post('/v1/project-preview', express.json(), (req, res) =>
    res.json({ route: 'v1-project-preview' })
  );

  // A v1 route that should NOT be rewritten
  app.get('/v1/metadata', (req, res) => res.json({ route: 'v1-metadata' }));

  return app;
}

describe('apiVersionRedirect', () => {
  describe('should rewrite deprecated paths to v1', () => {
    const redirectCases = [
      { old: '/health', expected: 'v1-health', method: 'get' },
      { old: '/stats', expected: 'v1-stats', method: 'get' },
      { old: '/analytics/events', expected: 'v1-analytics-events', method: 'post' },
      { old: '/analytics/stats', expected: 'v1-analytics-stats', method: 'get' },
      { old: '/analytics/session', expected: 'v1-analytics-session', method: 'get' },
      { old: '/generate-project', expected: 'v1-generate-project', method: 'post' },
      { old: '/project-dependencies', expected: 'v1-project-dependencies', method: 'post' },
      { old: '/project-preview', expected: 'v1-project-preview', method: 'post' },
    ] as const;

    for (const { old, expected, method } of redirectCases) {
      it(`${method.toUpperCase()} ${old} -> /v1/...`, async () => {
        const app = createApp();
        const req = method === 'get' ? request(app).get(old) : request(app).post(old).send({});
        const res = await req;

        expect(res.status).toBe(200);
        expect(res.body.route).toBe(expected);
      });
    }
  });

  describe('should add deprecation headers on redirected requests', () => {
    it('should set X-API-Deprecated-Path header', async () => {
      const app = createApp();
      const res = await request(app).get('/health');

      expect(res.headers['x-api-deprecated-path']).toBe('/health');
      expect(res.headers['x-api-migration-note']).toContain('/api/v1/health');
    });
  });

  describe('should NOT redirect v1 paths', () => {
    it('should pass through /v1/metadata unchanged', async () => {
      const app = createApp();
      const res = await request(app).get('/v1/metadata');

      expect(res.status).toBe(200);
      expect(res.body.route).toBe('v1-metadata');
      expect(res.headers['x-api-deprecated-path']).toBeUndefined();
    });
  });

  describe('should preserve POST body through redirect', () => {
    it('should forward POST body to v1 route', async () => {
      const app = createApp();
      const body = { testingType: 'web', framework: 'selenium' };
      const res = await request(app)
        .post('/validate-config')
        .send(body)
        .set('Content-Type', 'application/json');

      expect(res.status).toBe(200);
      expect(res.body.route).toBe('v1-validate-config');
      expect(res.body.body).toEqual(body);
    });
  });
});
