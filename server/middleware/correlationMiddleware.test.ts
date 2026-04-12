/**
 * Unit Tests for Correlation Middleware
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import {
  correlationMiddleware,
  getCorrelationContext,
  getCorrelationId,
  getRequestId,
  getRequestDuration,
  createBackgroundContext,
  runWithContext,
  runWithContextAsync,
  type CorrelationContext,
} from './correlationMiddleware';

function createApp() {
  const app = express();
  app.use(correlationMiddleware);
  return app;
}

describe('correlationMiddleware', () => {
  describe('middleware behavior', () => {
    it('should generate a correlation ID when no header is provided', async () => {
      const app = createApp();
      app.get('/test', (req, res) => {
        res.json({ ok: true });
      });

      const res = await request(app).get('/test');

      expect(res.headers['x-correlation-id']).toBeDefined();
      expect(res.headers['x-request-id']).toBeDefined();
    });

    it('should use x-correlation-id header when provided', async () => {
      const app = createApp();
      app.get('/test', (req, res) => {
        const ctx = getCorrelationContext();
        res.json({ correlationId: ctx?.correlationId });
      });

      const res = await request(app).get('/test').set('x-correlation-id', 'custom-corr-id');

      expect(res.headers['x-correlation-id']).toBe('custom-corr-id');
      expect(res.body.correlationId).toBe('custom-corr-id');
    });

    it('should fall back to x-request-id header', async () => {
      const app = createApp();
      app.get('/test', (req, res) => {
        const ctx = getCorrelationContext();
        res.json({ correlationId: ctx?.correlationId });
      });

      const res = await request(app).get('/test').set('x-request-id', 'req-id-123');

      expect(res.headers['x-correlation-id']).toBe('req-id-123');
    });

    it('should fall back to x-trace-id header', async () => {
      const app = createApp();
      app.get('/test', (req, res) => {
        const ctx = getCorrelationContext();
        res.json({ correlationId: ctx?.correlationId });
      });

      const res = await request(app).get('/test').set('x-trace-id', 'trace-456');

      expect(res.headers['x-correlation-id']).toBe('trace-456');
    });

    it('should set both X-Correlation-Id and X-Request-Id response headers', async () => {
      const app = createApp();
      app.get('/test', (req, res) => res.json({}));

      const res = await request(app).get('/test');

      expect(res.headers['x-correlation-id']).toBeDefined();
      expect(res.headers['x-request-id']).toBeDefined();
      // Request ID should be a short ID, not a UUID
      expect(res.headers['x-request-id']).toMatch(/-/);
    });

    it('should populate full context within request handler', async () => {
      const app = createApp();
      app.get('/test-path', (req, res) => {
        const ctx = getCorrelationContext();
        res.json({
          hasCorrelationId: !!ctx?.correlationId,
          hasRequestId: !!ctx?.requestId,
          hasStartTime: typeof ctx?.startTime === 'number',
          path: ctx?.path,
          method: ctx?.method,
        });
      });

      const res = await request(app).get('/test-path');

      expect(res.body.hasCorrelationId).toBe(true);
      expect(res.body.hasRequestId).toBe(true);
      expect(res.body.hasStartTime).toBe(true);
      expect(res.body.path).toBe('/test-path');
      expect(res.body.method).toBe('GET');
    });
  });

  describe('getCorrelationContext', () => {
    it('should return undefined outside request context', () => {
      expect(getCorrelationContext()).toBeUndefined();
    });
  });

  describe('getCorrelationId', () => {
    it('should return no-context outside request context', () => {
      expect(getCorrelationId()).toBe('no-context');
    });
  });

  describe('getRequestId', () => {
    it('should return no-context outside request context', () => {
      expect(getRequestId()).toBe('no-context');
    });
  });

  describe('getRequestDuration', () => {
    it('should return 0 outside request context', () => {
      expect(getRequestDuration()).toBe(0);
    });
  });

  describe('createBackgroundContext', () => {
    it('should create context with bg- prefixed correlation ID', () => {
      const ctx = createBackgroundContext('cleanup-job');
      expect(ctx.correlationId).toMatch(/^bg-/);
    });

    it('should create context with task- prefixed request ID', () => {
      const ctx = createBackgroundContext('cleanup-job');
      expect(ctx.requestId).toMatch(/^task-/);
    });

    it('should set path to /background/{taskName}', () => {
      const ctx = createBackgroundContext('cleanup-job');
      expect(ctx.path).toBe('/background/cleanup-job');
    });

    it('should set method to TASK', () => {
      const ctx = createBackgroundContext('cleanup-job');
      expect(ctx.method).toBe('TASK');
    });

    it('should set startTime to current time', () => {
      const before = Date.now();
      const ctx = createBackgroundContext('test');
      const after = Date.now();

      expect(ctx.startTime).toBeGreaterThanOrEqual(before);
      expect(ctx.startTime).toBeLessThanOrEqual(after);
    });
  });

  describe('runWithContext', () => {
    it('should run function within provided context', () => {
      const ctx: CorrelationContext = {
        correlationId: 'test-corr',
        requestId: 'test-req',
        startTime: Date.now(),
        path: '/test',
        method: 'GET',
      };

      const result = runWithContext(ctx, () => {
        return getCorrelationId();
      });

      expect(result).toBe('test-corr');
    });

    it('should return the function result', () => {
      const ctx = createBackgroundContext('test');
      const result = runWithContext(ctx, () => 42);
      expect(result).toBe(42);
    });
  });

  describe('runWithContextAsync', () => {
    it('should run async function within provided context', async () => {
      const ctx: CorrelationContext = {
        correlationId: 'async-corr',
        requestId: 'async-req',
        startTime: Date.now(),
        path: '/test',
        method: 'GET',
      };

      const result = await runWithContextAsync(ctx, async () => {
        return getCorrelationId();
      });

      expect(result).toBe('async-corr');
    });

    it('should return the async function result', async () => {
      const ctx = createBackgroundContext('test');
      const result = await runWithContextAsync(ctx, async () => 'hello');
      expect(result).toBe('hello');
    });
  });
});
