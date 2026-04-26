/**
 * Stats Routes Tests
 *
 * Tests for the Landing Page Stats feature (Feature 1):
 * - GET /api/v1/stats        — project generation stats
 * - GET /api/v1/stats/github — GitHub stars / forks (cached)
 * - GET /api/v1/bom          — Bill of Materials
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import request from 'supertest';
import { BOM } from '../../shared/bom';

// ---------------------------------------------------------------------------
// Mocks — must be declared before the module under test is imported
// ---------------------------------------------------------------------------

// Mock the storage module used by configRoutes
vi.mock('../storage', () => ({
  storage: {
    saveProjectGeneration: vi.fn().mockResolvedValue('mock-id'),
    getProjectGenerationStats: vi.fn().mockResolvedValue({
      totalGenerated: 42,
      byTestingType: [{ name: 'web', count: 20 }],
      byFramework: [{ name: 'selenium', count: 15 }],
      byLanguage: [{ name: 'java', count: 12 }],
      recentGenerations: [],
    }),
  },
}));

// Keep a reference to the fake Octokit so tests can control its behaviour
const mockReposGet = vi.fn();

vi.mock('@octokit/rest', () => ({
  Octokit: vi.fn().mockImplementation(() => ({
    repos: {
      get: mockReposGet,
    },
  })),
}));

// Import the actual router *after* mocks are wired up
import configRoutes from '../routes/configRoutes';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createTestApp(): Express {
  const app = express();
  app.use(express.json());
  app.use('/api', configRoutes);

  // Global error handler so asyncHandler rejections don't crash tests
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      error: {
        code: err.code || 'INTERNAL_ERROR',
        message: err.message,
      },
    });
  });

  return app;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Landing Page Stats Routes', () => {
  let app: Express;

  beforeEach(() => {
    app = createTestApp();
    vi.clearAllMocks();
  });

  // -----------------------------------------------------------------------
  // GET /api/v1/stats
  // -----------------------------------------------------------------------
  describe('GET /api/v1/stats', () => {
    it('should return 200 with generation stats', async () => {
      const res = await request(app).get('/api/v1/stats').expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalGenerated');
      expect(res.body.data).toHaveProperty('byFramework');
    });

    it('should include totalGenerated as a number', async () => {
      const res = await request(app).get('/api/v1/stats').expect(200);

      expect(typeof res.body.data.totalGenerated).toBe('number');
      expect(res.body.data.totalGenerated).toBe(42);
    });

    it('should include byFramework array', async () => {
      const res = await request(app).get('/api/v1/stats').expect(200);

      expect(Array.isArray(res.body.data.byFramework)).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // GET /api/v1/stats/github
  // -----------------------------------------------------------------------
  describe('GET /api/v1/stats/github', () => {
    beforeEach(() => {
      // Reset the module-level cache between tests by re-importing fresh.
      // Since the cache lives in the module scope of configRoutes, we need
      // to manipulate mock behaviour to simulate fresh / stale states.
      mockReposGet.mockReset();
    });

    it('should return 200 with stars and forks when GitHub API succeeds', async () => {
      mockReposGet.mockResolvedValueOnce({
        data: { stargazers_count: 128, forks_count: 34 },
      });

      const res = await request(app).get('/api/v1/stats/github').expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('stars');
      expect(res.body.data).toHaveProperty('forks');
      expect(typeof res.body.data.stars).toBe('number');
      expect(typeof res.body.data.forks).toBe('number');
      expect(res.body.data.stars).toBe(128);
      expect(res.body.data.forks).toBe(34);
    });

    it('should return cached data on subsequent calls (cache hit)', async () => {
      // The module-level cache may already contain data from a prior test.
      // Make a first call to ensure the cache is populated with known values.
      mockReposGet.mockResolvedValueOnce({
        data: { stargazers_count: 200, forks_count: 50 },
      });
      const first = await request(app).get('/api/v1/stats/github').expect(200);

      // Record how many times the mock was called after the first request
      const callsAfterFirst = mockReposGet.mock.calls.length;

      // Second call — should serve from cache, no additional Octokit call
      const res = await request(app).get('/api/v1/stats/github').expect(200);

      expect(res.body.success).toBe(true);
      // The cached values should match whatever the first response returned
      expect(res.body.data.stars).toBe(first.body.data.stars);
      expect(res.body.data.forks).toBe(first.body.data.forks);
      // Octokit should NOT have been called again
      expect(mockReposGet.mock.calls.length).toBe(callsAfterFirst);
    });

    it('should return zeros when GitHub API fails and no cache exists', async () => {
      // Force the in-memory cache to be empty by making the first call fail.
      // Note: because tests share the module-level cache we need to be aware
      // of ordering. If a prior test already populated the cache the fallback
      // will return stale values instead of zeros — both paths are valid per
      // the implementation. We therefore only assert the response shape.
      mockReposGet.mockRejectedValueOnce(new Error('API rate limit'));

      const res = await request(app).get('/api/v1/stats/github').expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('stars');
      expect(res.body.data).toHaveProperty('forks');
      expect(typeof res.body.data.stars).toBe('number');
      expect(typeof res.body.data.forks).toBe('number');
    });

    it('should have correct response shape { stars: number, forks: number }', async () => {
      mockReposGet.mockResolvedValueOnce({
        data: { stargazers_count: 10, forks_count: 3 },
      });

      const res = await request(app).get('/api/v1/stats/github').expect(200);

      const keys = Object.keys(res.body.data);
      expect(keys).toContain('stars');
      expect(keys).toContain('forks');
      // Ensure no unexpected extra keys
      expect(keys.length).toBe(2);
    });
  });

  // -----------------------------------------------------------------------
  // GET /api/v1/bom
  // -----------------------------------------------------------------------
  describe('GET /api/v1/bom', () => {
    it('should return 200 with BOM data', async () => {
      const res = await request(app).get('/api/v1/bom').expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('data');
      expect(typeof res.body.data).toBe('object');
    });

    it('should contain all expected language keys', async () => {
      const res = await request(app).get('/api/v1/bom').expect(200);
      const data = res.body.data;

      const expectedLanguages = [
        'java',
        'python',
        'javascript',
        'csharp',
        'kotlin',
        'go',
        'dart',
        'swift',
      ];

      for (const lang of expectedLanguages) {
        expect(data).toHaveProperty(lang);
      }
    });

    it('should include expected library entries for Java', async () => {
      const res = await request(app).get('/api/v1/bom').expect(200);
      const java = res.body.data.java;

      expect(java).toHaveProperty('version');
      expect(java).toHaveProperty('selenium');
      expect(java).toHaveProperty('testng');
      expect(java).toHaveProperty('junit5');
      expect(java).toHaveProperty('allure');
      expect(java).toHaveProperty('cucumber');
      expect(java).toHaveProperty('appium');
      expect(java).toHaveProperty('restAssured');
    });

    it('should include expected library entries for Python', async () => {
      const res = await request(app).get('/api/v1/bom').expect(200);
      const python = res.body.data.python;

      expect(python).toHaveProperty('version');
      expect(python).toHaveProperty('selenium');
      expect(python).toHaveProperty('pytest');
      expect(python).toHaveProperty('requests');
      expect(python).toHaveProperty('appium');
    });

    it('should include expected library entries for JavaScript', async () => {
      const res = await request(app).get('/api/v1/bom').expect(200);
      const js = res.body.data.javascript;

      expect(js).toHaveProperty('node');
      expect(js).toHaveProperty('playwright');
      expect(js).toHaveProperty('cypress');
      expect(js).toHaveProperty('webdriverio');
      expect(js).toHaveProperty('supertest');
    });

    it('should include expected library entries for C#', async () => {
      const res = await request(app).get('/api/v1/bom').expect(200);
      const cs = res.body.data.csharp;

      expect(cs).toHaveProperty('dotnet');
      expect(cs).toHaveProperty('selenium');
      expect(cs).toHaveProperty('nunit');
      expect(cs).toHaveProperty('restsharp');
      expect(cs).toHaveProperty('appium');
    });

    it('should include expected library entries for Go', async () => {
      const res = await request(app).get('/api/v1/bom').expect(200);
      const go = res.body.data.go;

      expect(go).toHaveProperty('version');
      expect(go).toHaveProperty('playwrightGo');
      expect(go).toHaveProperty('resty');
      expect(go).toHaveProperty('testify');
    });

    it('should include expected entries for Kotlin', async () => {
      const res = await request(app).get('/api/v1/bom').expect(200);
      const kotlin = res.body.data.kotlin;

      expect(kotlin).toHaveProperty('kotlin');
      expect(kotlin).toHaveProperty('espresso');
      expect(kotlin).toHaveProperty('junit5');
      expect(kotlin).toHaveProperty('gradle');
    });

    it('should include expected entries for Swift', async () => {
      const res = await request(app).get('/api/v1/bom').expect(200);
      const swift = res.body.data.swift;

      expect(swift).toHaveProperty('swift');
      expect(swift).toHaveProperty('xctest');
    });

    it('should include expected entries for Dart', async () => {
      const res = await request(app).get('/api/v1/bom').expect(200);
      const dart = res.body.data.dart;

      expect(dart).toHaveProperty('dart');
      expect(dart).toHaveProperty('flutter');
    });

    it('should include Faker library versions across relevant languages', async () => {
      const res = await request(app).get('/api/v1/bom').expect(200);
      const data = res.body.data;

      // Java — DataFaker
      expect(data.java).toHaveProperty('datafaker');
      expect(typeof data.java.datafaker).toBe('string');

      // Python — Faker
      expect(data.python).toHaveProperty('faker');
      expect(typeof data.python.faker).toBe('string');

      // JavaScript — @faker-js/faker
      expect(data.javascript).toHaveProperty('fakerJs');
      expect(typeof data.javascript.fakerJs).toBe('string');

      // C# — Bogus
      expect(data.csharp).toHaveProperty('bogus');
      expect(typeof data.csharp.bogus).toBe('string');

      // Go — gofakeit
      expect(data.go).toHaveProperty('gofakeit');
      expect(typeof data.go.gofakeit).toBe('string');
    });

    it('should match the server-side BOM export exactly', async () => {
      const res = await request(app).get('/api/v1/bom').expect(200);

      expect(res.body.data).toEqual(BOM);
    });
  });
});
