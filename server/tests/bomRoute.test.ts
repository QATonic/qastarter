/**
 * BOM Endpoint Tests
 *
 * Focused tests for the Bill of Materials endpoint (GET /api/v1/bom)
 * which powers the CLI `update` command to compare local dependencies
 * against the canonical library versions.
 */

import { describe, it, expect, vi } from 'vitest';
import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import request from 'supertest';
import { BOM } from '../../shared/bom';

// ---------------------------------------------------------------------------
// Mocks — storage is required by configRoutes even though the BOM endpoint
//          does not use it directly
// ---------------------------------------------------------------------------

vi.mock('../storage', () => ({
  storage: {
    saveProjectGeneration: vi.fn().mockResolvedValue('mock-id'),
    getProjectGenerationStats: vi.fn().mockResolvedValue({
      totalGenerated: 0,
      byTestingType: [],
      byFramework: [],
      byLanguage: [],
      recentGenerations: [],
    }),
  },
}));

vi.mock('@octokit/rest', () => ({
  Octokit: vi.fn().mockImplementation(() => ({
    repos: { get: vi.fn().mockResolvedValue({ data: { stargazers_count: 0, forks_count: 0 } }) },
  })),
}));

import configRoutes from '../routes/configRoutes';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createTestApp(): Express {
  const app = express();
  app.use(express.json());
  app.use('/api', configRoutes);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
    });
  });

  return app;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/v1/bom', () => {
  const app = createTestApp();

  it('should return 200 with success flag', async () => {
    const res = await request(app).get('/api/v1/bom').expect(200);

    expect(res.body.success).toBe(true);
  });

  it('should return JSON content-type', async () => {
    await request(app)
      .get('/api/v1/bom')
      .expect('Content-Type', /json/)
      .expect(200);
  });

  // -----------------------------------------------------------------------
  // Language keys completeness
  // -----------------------------------------------------------------------
  describe('Language coverage', () => {
    const expectedLanguages = [
      'java',
      'python',
      'javascript',
      'csharp',
      'kotlin',
      'go',
      'dart',
      'swift',
    ] as const;

    it.each(expectedLanguages)('should include "%s" as a top-level key', async (lang) => {
      const res = await request(app).get('/api/v1/bom').expect(200);
      expect(res.body.data).toHaveProperty(lang);
    });

    it('should not contain unknown top-level keys', async () => {
      const res = await request(app).get('/api/v1/bom').expect(200);
      const keys = Object.keys(res.body.data);
      for (const key of keys) {
        expect(expectedLanguages as readonly string[]).toContain(key);
      }
    });
  });

  // -----------------------------------------------------------------------
  // Per-language library structure
  // -----------------------------------------------------------------------
  describe('Java section', () => {
    it('should list core Java libraries', async () => {
      const res = await request(app).get('/api/v1/bom').expect(200);
      const java = res.body.data.java;

      expect(java.version).toBe('11');
      expect(java).toHaveProperty('selenium');
      expect(java).toHaveProperty('testng');
      expect(java).toHaveProperty('junit5');
      expect(java).toHaveProperty('log4j');
      expect(java).toHaveProperty('extentreports');
      expect(java).toHaveProperty('allure');
      expect(java).toHaveProperty('cucumber');
      expect(java).toHaveProperty('appium');
      expect(java).toHaveProperty('restAssured');
      expect(java).toHaveProperty('datafaker');
    });

    it('should have string version values for all Java entries', async () => {
      const res = await request(app).get('/api/v1/bom').expect(200);
      for (const [, value] of Object.entries(res.body.data.java)) {
        expect(typeof value).toBe('string');
      }
    });
  });

  describe('Python section', () => {
    it('should list core Python libraries', async () => {
      const res = await request(app).get('/api/v1/bom').expect(200);
      const python = res.body.data.python;

      expect(python.version).toBe('3.8+');
      expect(python).toHaveProperty('selenium');
      expect(python).toHaveProperty('pytest');
      expect(python).toHaveProperty('requests');
      expect(python).toHaveProperty('appium');
      expect(python).toHaveProperty('pyautogui');
      expect(python).toHaveProperty('faker');
    });
  });

  describe('JavaScript section', () => {
    it('should list core JavaScript libraries', async () => {
      const res = await request(app).get('/api/v1/bom').expect(200);
      const js = res.body.data.javascript;

      expect(js.node).toBe('18+');
      expect(js).toHaveProperty('selenium');
      expect(js).toHaveProperty('jest');
      expect(js).toHaveProperty('mocha');
      expect(js).toHaveProperty('cypress');
      expect(js).toHaveProperty('playwright');
      expect(js).toHaveProperty('webdriverio');
      expect(js).toHaveProperty('appium');
      expect(js).toHaveProperty('supertest');
      expect(js).toHaveProperty('fakerJs');
    });
  });

  describe('C# section', () => {
    it('should list core C# / .NET libraries', async () => {
      const res = await request(app).get('/api/v1/bom').expect(200);
      const cs = res.body.data.csharp;

      expect(cs.dotnet).toBe('8.0');
      expect(cs).toHaveProperty('selenium');
      expect(cs).toHaveProperty('nunit');
      expect(cs).toHaveProperty('nunitTestAdapter');
      expect(cs).toHaveProperty('testSdk');
      expect(cs).toHaveProperty('restsharp');
      expect(cs).toHaveProperty('appium');
      expect(cs).toHaveProperty('bogus');
    });
  });

  describe('Kotlin section', () => {
    it('should list core Kotlin / Android libraries', async () => {
      const res = await request(app).get('/api/v1/bom').expect(200);
      const kotlin = res.body.data.kotlin;

      expect(kotlin).toHaveProperty('kotlin');
      expect(kotlin).toHaveProperty('espresso');
      expect(kotlin).toHaveProperty('junit5');
      expect(kotlin).toHaveProperty('gradle');
      expect(kotlin).toHaveProperty('androidGradlePlugin');
      expect(kotlin).toHaveProperty('allure');
    });
  });

  describe('Go section', () => {
    it('should list core Go libraries', async () => {
      const res = await request(app).get('/api/v1/bom').expect(200);
      const go = res.body.data.go;

      expect(go.version).toBe('1.21+');
      expect(go).toHaveProperty('playwrightGo');
      expect(go).toHaveProperty('resty');
      expect(go).toHaveProperty('testify');
      expect(go).toHaveProperty('gofakeit');
    });
  });

  describe('Swift section', () => {
    it('should list Swift / XCTest entries', async () => {
      const res = await request(app).get('/api/v1/bom').expect(200);
      const swift = res.body.data.swift;

      expect(swift.swift).toBe('5.9');
      expect(swift.xctest).toBe('latest');
    });
  });

  describe('Dart section', () => {
    it('should list Dart / Flutter entries', async () => {
      const res = await request(app).get('/api/v1/bom').expect(200);
      const dart = res.body.data.dart;

      expect(dart.dart).toBe('3.2.0+');
      expect(dart.flutter).toBe('3.16.0+');
    });
  });

  // -----------------------------------------------------------------------
  // Faker libraries cross-check
  // -----------------------------------------------------------------------
  describe('Faker library versions', () => {
    it('should include DataFaker for Java', async () => {
      const res = await request(app).get('/api/v1/bom').expect(200);
      expect(res.body.data.java.datafaker).toBe(BOM.java.datafaker);
    });

    it('should include Faker for Python', async () => {
      const res = await request(app).get('/api/v1/bom').expect(200);
      expect(res.body.data.python.faker).toBe(BOM.python.faker);
    });

    it('should include @faker-js/faker for JavaScript', async () => {
      const res = await request(app).get('/api/v1/bom').expect(200);
      expect(res.body.data.javascript.fakerJs).toBe(BOM.javascript.fakerJs);
    });

    it('should include Bogus for C#', async () => {
      const res = await request(app).get('/api/v1/bom').expect(200);
      expect(res.body.data.csharp.bogus).toBe(BOM.csharp.bogus);
    });

    it('should include gofakeit for Go', async () => {
      const res = await request(app).get('/api/v1/bom').expect(200);
      expect(res.body.data.go.gofakeit).toBe(BOM.go.gofakeit);
    });
  });

  // -----------------------------------------------------------------------
  // Snapshot — ensure entire BOM matches shared source of truth
  // -----------------------------------------------------------------------
  it('should match the shared BOM export exactly', async () => {
    const res = await request(app).get('/api/v1/bom').expect(200);
    expect(res.body.data).toEqual(BOM);
  });
});
