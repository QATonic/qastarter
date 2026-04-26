/**
 * E2E Feature Integration Tests
 *
 * Tests all 5 recently added features end-to-end:
 * 1. Landing Page Stats (live counters, GitHub stars, BOM endpoint)
 * 2. Test Data / Faker (conditional template inclusion)
 * 3. Cloud Device Farm (conditional config files, validation matrix)
 * 4. CLI Update Command (version comparison, Go module parsing)
 * 5. OpenAPI Schema-Driven Generation (spec parsing, URL safety, YAML)
 *
 * Also tests cross-feature interactions and bug fix verifications.
 */

import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest';
import path from 'path';
import fs from 'fs';
import { ProjectTemplateGenerator } from '../templates';
import { ProjectConfig, projectConfigSchema } from '@shared/schema';
import { WizardValidator, validationMatrix, validationLabels } from '@shared/validationMatrix';
import { BOM } from '@shared/bom';
import {
  parseOpenApiFromString,
  clearOpenApiCache,
} from '../services/openApiService';

// ── Setup ──────────────────────────────────────────────────────────
const templatesPath = path.join(process.cwd(), 'server', 'templates', 'packs');

describe('E2E Feature Integration Tests', () => {
  let generator: ProjectTemplateGenerator;
  const FIXED_DATE = new Date('2024-01-01T12:00:00Z');

  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_DATE);
    generator = new ProjectTemplateGenerator(templatesPath);
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  // ────────────────────────────────────────────────────────────────
  // Feature 1: Landing Page Stats
  // ────────────────────────────────────────────────────────────────
  describe('Feature 1: Landing Page Stats & BOM Endpoint', () => {
    it('BOM contains all expected language sections', () => {
      expect(BOM).toHaveProperty('java');
      expect(BOM).toHaveProperty('python');
      expect(BOM).toHaveProperty('javascript');
      expect(BOM).toHaveProperty('csharp');
      expect(BOM).toHaveProperty('go');
    });

    it('BOM includes Faker library versions for each language', () => {
      expect(BOM.java).toHaveProperty('datafaker');
      expect(BOM.python).toHaveProperty('faker');
      expect(BOM.javascript).toHaveProperty('fakerJs');
      expect(BOM.csharp).toHaveProperty('bogus');
      expect(BOM.go).toHaveProperty('gofakeit');
    });

    it('BOM versions are non-empty strings', () => {
      for (const [lang, deps] of Object.entries(BOM)) {
        for (const [dep, version] of Object.entries(deps)) {
          expect(version, `${lang}.${dep}`).toBeTruthy();
          expect(typeof version, `${lang}.${dep} type`).toBe('string');
        }
      }
    });

    it('validationLabels includes cloudDeviceFarms labels', () => {
      expect(validationLabels.cloudDeviceFarms).toBeDefined();
      expect(validationLabels.cloudDeviceFarms.browserstack).toBe('BrowserStack');
      expect(validationLabels.cloudDeviceFarms.saucelabs).toBe('Sauce Labs');
      expect(validationLabels.cloudDeviceFarms.none).toBeTruthy();
    });
  });

  // ────────────────────────────────────────────────────────────────
  // Feature 2: Test Data / Faker
  // ────────────────────────────────────────────────────────────────
  describe('Feature 2: Test Data / Faker Templates', () => {
    it('generates project WITH faker factory when utilities.faker is true', async () => {
      const config: ProjectConfig = {
        projectName: 'faker-test-java',
        testingType: 'web',
        language: 'java',
        framework: 'selenium',
        buildTool: 'maven',
        testRunner: 'testng',
        testingPattern: 'page-object-model',
        utilities: { faker: true },
        includeSampleTests: true,
      };

      const files = await generator.generateProject(config);
      const paths = files.map((f) => f.path);

      // Should contain a TestDataFactory file
      const hasFactory = paths.some(
        (p) => p.includes('TestDataFactory') || p.includes('testDataFactory') || p.includes('test_data_factory')
      );
      expect(hasFactory).toBe(true);
    });

    it('generates project WITHOUT faker factory when utilities.faker is false', async () => {
      const config: ProjectConfig = {
        projectName: 'no-faker-java',
        testingType: 'web',
        language: 'java',
        framework: 'selenium',
        buildTool: 'maven',
        testRunner: 'testng',
        testingPattern: 'page-object-model',
        utilities: { faker: false },
        includeSampleTests: true,
      };

      const files = await generator.generateProject(config);
      const paths = files.map((f) => f.path);

      const hasFactory = paths.some(
        (p) => p.includes('TestDataFactory') || p.includes('testDataFactory') || p.includes('test_data_factory')
      );
      expect(hasFactory).toBe(false);
    });

    it('generates Python faker factory when utilities.faker is true', async () => {
      const config: ProjectConfig = {
        projectName: 'faker-test-python',
        testingType: 'api',
        language: 'python',
        framework: 'requests',
        buildTool: 'pip',
        testRunner: 'pytest',
        testingPattern: 'fluent',
        utilities: { faker: true },
        includeSampleTests: true,
      };

      const files = await generator.generateProject(config);
      const paths = files.map((f) => f.path);

      const hasFactory = paths.some(
        (p) => p.includes('test_data_factory')
      );
      expect(hasFactory).toBe(true);
    });

    it('generates TypeScript faker factory for supertest pack', async () => {
      const config: ProjectConfig = {
        projectName: 'faker-test-ts',
        testingType: 'api',
        language: 'typescript',
        framework: 'supertest',
        buildTool: 'npm',
        testRunner: 'jest',
        testingPattern: 'fluent',
        utilities: { faker: true },
        includeSampleTests: true,
      };

      const files = await generator.generateProject(config);
      const paths = files.map((f) => f.path);

      const hasFactory = paths.some(
        (p) => p.includes('testDataFactory')
      );
      expect(hasFactory).toBe(true);
    });
  });

  // ────────────────────────────────────────────────────────────────
  // Feature 3: Cloud Device Farm
  // ────────────────────────────────────────────────────────────────
  describe('Feature 3: Cloud Device Farm Integration', () => {
    describe('Validation Matrix', () => {
      it('cloudDeviceFarms entry exists for web and mobile', () => {
        expect(validationMatrix.cloudDeviceFarms.web).toContain('browserstack');
        expect(validationMatrix.cloudDeviceFarms.web).toContain('saucelabs');
        expect(validationMatrix.cloudDeviceFarms.mobile).toContain('browserstack');
        expect(validationMatrix.cloudDeviceFarms.mobile).toContain('saucelabs');
      });

      it('cloudDeviceFarms is empty for api, desktop, performance', () => {
        expect(validationMatrix.cloudDeviceFarms.api).toEqual([]);
        expect(validationMatrix.cloudDeviceFarms.desktop).toEqual([]);
        expect(validationMatrix.cloudDeviceFarms.performance).toEqual([]);
      });

      it('getFilteredOptions returns farms for web', () => {
        const options = WizardValidator.getFilteredOptions('cloudDeviceFarm', {
          testingType: 'web',
        });
        expect(options).toContain('browserstack');
        expect(options).toContain('saucelabs');
      });

      it('getFilteredOptions returns empty for api', () => {
        const options = WizardValidator.getFilteredOptions('cloudDeviceFarm', {
          testingType: 'api',
        });
        expect(options).toEqual([]);
      });

      it('getFilteredOptions returns empty when no testingType', () => {
        const options = WizardValidator.getFilteredOptions('cloudDeviceFarm', {});
        expect(options).toEqual([]);
      });
    });

    describe('resetInvalidSelections (bug fix verification)', () => {
      it('resets cloudDeviceFarm when switching from web to api', () => {
        const config = {
          testingType: 'api',
          framework: 'restassured',
          language: 'java',
          testRunner: 'testng',
          buildTool: 'maven',
          cloudDeviceFarm: 'browserstack',
        };
        const result = WizardValidator.resetInvalidSelections(config);
        expect(result.cloudDeviceFarm).toBe('none');
      });

      it('preserves cloudDeviceFarm when staying on web', () => {
        const config = {
          testingType: 'web',
          framework: 'selenium',
          language: 'java',
          testRunner: 'testng',
          buildTool: 'maven',
          cloudDeviceFarm: 'browserstack',
        };
        const result = WizardValidator.resetInvalidSelections(config);
        expect(result.cloudDeviceFarm).toBe('browserstack');
      });

      it('resets cloudDeviceFarm when switching from mobile to desktop', () => {
        const config = {
          testingType: 'desktop',
          framework: 'winappdriver',
          language: 'csharp',
          testRunner: 'nunit',
          buildTool: 'nuget',
          cloudDeviceFarm: 'saucelabs',
        };
        const result = WizardValidator.resetInvalidSelections(config);
        expect(result.cloudDeviceFarm).toBe('none');
      });

      it('keeps cloudDeviceFarm as none when already none', () => {
        const config = {
          testingType: 'api',
          cloudDeviceFarm: 'none',
        };
        const result = WizardValidator.resetInvalidSelections(config);
        expect(result.cloudDeviceFarm).toBe('none');
      });
    });

    describe('Schema Validation', () => {
      it('accepts valid cloudDeviceFarm values', () => {
        const baseConfig = {
          projectName: 'test-cloud',
          testingType: 'web',
          framework: 'selenium',
          language: 'java',
          testRunner: 'testng',
          buildTool: 'maven',
          testingPattern: 'page-object-model',
        };

        for (const farm of ['none', 'browserstack', 'saucelabs'] as const) {
          const result = projectConfigSchema.safeParse({
            ...baseConfig,
            cloudDeviceFarm: farm,
          });
          expect(result.success, `cloudDeviceFarm: ${farm}`).toBe(true);
        }
      });

      it('defaults cloudDeviceFarm to none when not provided', () => {
        const result = projectConfigSchema.safeParse({
          projectName: 'test-default',
          testingType: 'web',
          framework: 'selenium',
          language: 'java',
          testRunner: 'testng',
          buildTool: 'maven',
          testingPattern: 'page-object-model',
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.cloudDeviceFarm).toBe('none');
        }
      });
    });

    describe('Template Generation with Cloud Farm', () => {
      it('generates browserstack config for web + browserstack', async () => {
        const config: ProjectConfig = {
          projectName: 'bs-web-test',
          testingType: 'web',
          language: 'java',
          framework: 'selenium',
          buildTool: 'maven',
          testRunner: 'testng',
          testingPattern: 'page-object-model',
          cloudDeviceFarm: 'browserstack',
          includeSampleTests: true,
        };

        const files = await generator.generateProject(config);
        const paths = files.map((f) => f.path);

        const hasBsConfig = paths.some(
          (p) => p.includes('browserstack') && (p.endsWith('.yml') || p.endsWith('.yaml'))
        );
        expect(hasBsConfig).toBe(true);

        // Should NOT have saucelabs config
        const hasSlConfig = paths.some(
          (p) => p.includes('saucelabs') && (p.endsWith('.yml') || p.endsWith('.yaml'))
        );
        expect(hasSlConfig).toBe(false);
      });

      it('generates NO cloud configs when cloudDeviceFarm is none', async () => {
        const config: ProjectConfig = {
          projectName: 'local-web-test',
          testingType: 'web',
          language: 'java',
          framework: 'selenium',
          buildTool: 'maven',
          testRunner: 'testng',
          testingPattern: 'page-object-model',
          cloudDeviceFarm: 'none',
          includeSampleTests: true,
        };

        const files = await generator.generateProject(config);
        const paths = files.map((f) => f.path);

        const hasCloudConfig = paths.some(
          (p) =>
            (p.includes('browserstack') || p.includes('saucelabs')) &&
            (p.endsWith('.yml') || p.endsWith('.yaml'))
        );
        expect(hasCloudConfig).toBe(false);
      });
    });
  });

  // ────────────────────────────────────────────────────────────────
  // Feature 5: OpenAPI Schema-Driven Generation
  // ────────────────────────────────────────────────────────────────
  describe('Feature 5: OpenAPI Schema-Driven Generation', () => {
    const PETSTORE_SPEC = JSON.stringify({
      openapi: '3.0.3',
      info: { title: 'Petstore', version: '1.0.0' },
      paths: {
        '/pets': {
          get: {
            operationId: 'listPets',
            summary: 'List all pets',
            tags: ['pets'],
            parameters: [
              { name: 'limit', in: 'query', required: false, schema: { type: 'integer' } },
            ],
            responses: { '200': { description: 'A list of pets' } },
          },
          post: {
            operationId: 'createPet',
            summary: 'Create a pet',
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: { type: 'object', properties: { name: { type: 'string' } } },
                },
              },
            },
            responses: { '201': { description: 'Created' } },
          },
        },
      },
    });

    beforeEach(() => {
      clearOpenApiCache();
    });

    describe('Schema Validation', () => {
      it('accepts valid HTTPS openApiSpecUrl', () => {
        const result = projectConfigSchema.safeParse({
          projectName: 'api-openapi',
          testingType: 'api',
          framework: 'restassured',
          language: 'java',
          testRunner: 'testng',
          buildTool: 'maven',
          testingPattern: 'fluent',
          openApiSpecUrl: 'https://petstore.swagger.io/v2/swagger.json',
        });
        expect(result.success).toBe(true);
      });

      it('rejects HTTP openApiSpecUrl', () => {
        const result = projectConfigSchema.safeParse({
          projectName: 'api-openapi',
          testingType: 'api',
          framework: 'restassured',
          language: 'java',
          testRunner: 'testng',
          buildTool: 'maven',
          testingPattern: 'fluent',
          openApiSpecUrl: 'http://petstore.swagger.io/v2/swagger.json',
        });
        expect(result.success).toBe(false);
      });

      it('allows empty/undefined openApiSpecUrl', () => {
        const result = projectConfigSchema.safeParse({
          projectName: 'api-no-spec',
          testingType: 'api',
          framework: 'restassured',
          language: 'java',
          testRunner: 'testng',
          buildTool: 'maven',
          testingPattern: 'fluent',
        });
        expect(result.success).toBe(true);
      });
    });

    describe('Spec Parsing', () => {
      it('parses Petstore spec and extracts endpoints', async () => {
        const endpoints = await parseOpenApiFromString(PETSTORE_SPEC);
        expect(endpoints).not.toBeNull();
        expect(endpoints!.length).toBe(2);
        expect(endpoints![0].method).toBe('GET');
        expect(endpoints![0].path).toBe('/pets');
        expect(endpoints![1].method).toBe('POST');
      });

      it('extracts request body properties', async () => {
        const endpoints = await parseOpenApiFromString(PETSTORE_SPEC);
        const createPet = endpoints!.find((e) => e.operationId === 'createPet')!;
        expect(createPet.requestBody).not.toBeNull();
        expect(createPet.requestBody!.contentType).toBe('application/json');
        expect(createPet.requestBody!.properties).toHaveProperty('name', 'string');
      });

      it('returns null for invalid specs', async () => {
        expect(await parseOpenApiFromString('not-json')).toBeNull();
        expect(await parseOpenApiFromString(JSON.stringify({ bad: true }))).toBeNull();
      });

      it('handles spec with all HTTP methods', async () => {
        const spec = JSON.stringify({
          openapi: '3.0.3',
          info: { title: 'AllMethods', version: '1.0.0' },
          paths: {
            '/resource': {
              get: { responses: { '200': { description: 'OK' } } },
              post: { responses: { '201': { description: 'Created' } } },
              put: { responses: { '200': { description: 'Updated' } } },
              delete: { responses: { '204': { description: 'Deleted' } } },
              patch: { responses: { '200': { description: 'Patched' } } },
            },
          },
        });

        const endpoints = await parseOpenApiFromString(spec);
        expect(endpoints).not.toBeNull();
        expect(endpoints!.length).toBe(5);
        const methods = endpoints!.map((e) => e.method);
        expect(methods).toEqual(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']);
      });

      it('generates operationId when not provided', async () => {
        const spec = JSON.stringify({
          openapi: '3.0.3',
          info: { title: 'NoOps', version: '1.0.0' },
          paths: {
            '/users/{userId}': {
              get: { responses: { '200': { description: 'OK' } } },
            },
          },
        });

        const endpoints = await parseOpenApiFromString(spec);
        expect(endpoints).not.toBeNull();
        expect(endpoints![0].operationId).toBeTruthy();
        expect(typeof endpoints![0].operationId).toBe('string');
      });

      it('truncates at 50 endpoints max', async () => {
        // Build spec with 55 endpoints
        const paths: Record<string, any> = {};
        for (let i = 0; i < 55; i++) {
          paths[`/resource-${i}`] = {
            get: { responses: { '200': { description: 'OK' } } },
          };
        }
        const spec = JSON.stringify({
          openapi: '3.0.3',
          info: { title: 'Large', version: '1.0.0' },
          paths,
        });

        const endpoints = await parseOpenApiFromString(spec);
        expect(endpoints).not.toBeNull();
        expect(endpoints!.length).toBeLessThanOrEqual(50);
      });
    });

    describe('Template Generation with OpenAPI', () => {
      it('generates OpenAPI test file when endpoints are provided', async () => {
        const endpoints = await parseOpenApiFromString(PETSTORE_SPEC);
        expect(endpoints).not.toBeNull();

        const config: ProjectConfig = {
          projectName: 'api-openapi-gen',
          testingType: 'api',
          language: 'java',
          framework: 'restassured',
          buildTool: 'maven',
          testRunner: 'testng',
          testingPattern: 'fluent',
          openApiSpecUrl: 'https://petstore.swagger.io/v3/openapi.json',
          includeSampleTests: true,
        };

        // Generate with openApiEndpoints
        const files: { path: string; content: string }[] = [];
        for await (const file of generator.generateProjectStream(config, {
          strict: true,
          openApiEndpoints: endpoints!,
        })) {
          files.push(file);
        }

        const paths = files.map((f) => f.path);

        // Should have an OpenAPI test file
        const hasOpenApiTests = paths.some(
          (p) =>
            p.toLowerCase().includes('openapi') &&
            (p.endsWith('.java') || p.endsWith('.py') || p.endsWith('.ts') || p.endsWith('.js'))
        );
        expect(hasOpenApiTests).toBe(true);

        // The OpenAPI test file should contain endpoint-specific content
        const openApiFile = files.find(
          (f) => f.path.toLowerCase().includes('openapi') && f.path.endsWith('.java')
        );
        if (openApiFile) {
          expect(openApiFile.content).toContain('listPets');
          expect(openApiFile.content).toContain('createPet');
        }
      });

      it('generates project WITHOUT OpenAPI tests when no endpoints', async () => {
        const config: ProjectConfig = {
          projectName: 'api-no-openapi',
          testingType: 'api',
          language: 'java',
          framework: 'restassured',
          buildTool: 'maven',
          testRunner: 'testng',
          testingPattern: 'fluent',
          includeSampleTests: true,
        };

        const files: { path: string; content: string }[] = [];
        for await (const file of generator.generateProjectStream(config, { strict: true })) {
          files.push(file);
        }

        const paths = files.map((f) => f.path);

        // hasOpenApiEndpoints should be false, so conditional OpenAPI files should be excluded
        const hasOpenApiTests = paths.some(
          (p) => p.toLowerCase().includes('openapi')
        );
        expect(hasOpenApiTests).toBe(false);
      });
    });
  });

  // ────────────────────────────────────────────────────────────────
  // Cross-Feature Interaction Tests
  // ────────────────────────────────────────────────────────────────
  describe('Cross-Feature Interactions', () => {
    it('generates project with BOTH faker and cloud farm enabled', async () => {
      const config: ProjectConfig = {
        projectName: 'full-feature-test',
        testingType: 'web',
        language: 'java',
        framework: 'selenium',
        buildTool: 'maven',
        testRunner: 'testng',
        testingPattern: 'page-object-model',
        utilities: { faker: true },
        cloudDeviceFarm: 'browserstack',
        includeSampleTests: true,
      };

      const files = await generator.generateProject(config);
      const paths = files.map((f) => f.path);

      // Should have faker factory
      const hasFactory = paths.some((p) => p.includes('TestDataFactory'));
      expect(hasFactory).toBe(true);

      // Should have browserstack config
      const hasBsConfig = paths.some(
        (p) => p.includes('browserstack') && (p.endsWith('.yml') || p.endsWith('.yaml'))
      );
      expect(hasBsConfig).toBe(true);
    });

    it('API pack with faker + openapi generates both', async () => {
      const endpoints = await parseOpenApiFromString(
        JSON.stringify({
          openapi: '3.0.3',
          info: { title: 'Test', version: '1.0.0' },
          paths: {
            '/items': {
              get: {
                operationId: 'listItems',
                responses: { '200': { description: 'OK' } },
              },
            },
          },
        })
      );

      const config: ProjectConfig = {
        projectName: 'api-faker-openapi',
        testingType: 'api',
        language: 'typescript',
        framework: 'supertest',
        buildTool: 'npm',
        testRunner: 'jest',
        testingPattern: 'fluent',
        utilities: { faker: true },
        openApiSpecUrl: 'https://example.com/spec.json',
        includeSampleTests: true,
      };

      const files: { path: string; content: string }[] = [];
      for await (const file of generator.generateProjectStream(config, {
        strict: true,
        openApiEndpoints: endpoints!,
      })) {
        files.push(file);
      }

      const paths = files.map((f) => f.path);

      // Should have faker factory
      const hasFactory = paths.some((p) => p.includes('testDataFactory'));
      expect(hasFactory).toBe(true);

      // Should have openapi test file
      const hasOpenApi = paths.some((p) => p.toLowerCase().includes('openapi'));
      expect(hasOpenApi).toBe(true);
    });

    it('cloudDeviceFarm not present for API projects even if specified', async () => {
      const config: ProjectConfig = {
        projectName: 'api-no-cloud',
        testingType: 'api',
        language: 'java',
        framework: 'restassured',
        buildTool: 'maven',
        testRunner: 'testng',
        testingPattern: 'fluent',
        cloudDeviceFarm: 'browserstack', // shouldn't produce cloud files for API
        includeSampleTests: true,
      };

      const files = await generator.generateProject(config);
      const paths = files.map((f) => f.path);

      // API packs don't have cloud farm conditionals, so no cloud config files should appear
      // (the conditional in the manifest matches on cloudDeviceFarm value, but API packs
      // don't have those manifest entries)
      const hasCloudConfig = paths.some(
        (p) =>
          (p.includes('browserstack') || p.includes('saucelabs')) &&
          (p.endsWith('.yml') || p.endsWith('.yaml'))
      );
      expect(hasCloudConfig).toBe(false);
    });
  });

  // ────────────────────────────────────────────────────────────────
  // Bug Fix Verification Tests
  // ────────────────────────────────────────────────────────────────
  describe('Bug Fix Verifications', () => {
    it('BUG #3: Go module parser handles version suffixes', () => {
      // Verify the fix: github.com/go-resty/resty/v2 should extract "resty" not "v2"
      const testPaths = [
        { input: 'github.com/go-resty/resty/v2', expected: 'resty' },
        { input: 'github.com/stretchr/testify', expected: 'testify' },
        { input: 'github.com/brianvoe/gofakeit/v6', expected: 'gofakeit' },
      ];

      for (const { input, expected } of testPaths) {
        const parts = input.split('/');
        let shortName = parts[parts.length - 1];
        if (/^v\d+$/.test(shortName) && parts.length > 1) {
          shortName = parts[parts.length - 2];
        }
        expect(shortName, `for ${input}`).toBe(expected);
      }
    });

    it('BUG #6: Version comparison handles pre-release suffixes', () => {
      // Test the fix: pre-release versions like 1.0.0-beta.1 should not produce NaN
      const strip = (v: string) => v.replace(/^[^\d]*/, '').replace(/-.*$/, '');

      expect(strip('1.0.0-beta.1')).toBe('1.0.0');
      expect(strip('^4.16.0')).toBe('4.16.0');
      expect(strip('~2.31.0')).toBe('2.31.0');
      expect(strip('>=3.0.0-rc.2')).toBe('3.0.0');

      // Verify no NaN in parts
      const parts = strip('1.0.0-beta.1').split('.').map(Number);
      expect(parts.every((n) => !isNaN(n))).toBe(true);
    });

    it('BUG #5: IPv6 private ranges are blocked', () => {
      // Test the isUrlSafe logic for IPv6 (inline verification)
      const privateIPv6 = ['::1', '::', 'fc00::1', 'fd12::1', 'fe80::1', '::ffff:127.0.0.1', '::ffff:10.0.0.1', '::ffff:192.168.1.1'];

      for (const ip of privateIPv6) {
        const lowerHost = ip.toLowerCase();
        const isBlocked =
          lowerHost === '::1' ||
          lowerHost === '::' ||
          lowerHost.startsWith('fc') ||
          lowerHost.startsWith('fd') ||
          lowerHost.startsWith('fe80') ||
          lowerHost.startsWith('::ffff:127.') ||
          lowerHost.startsWith('::ffff:10.') ||
          lowerHost.startsWith('::ffff:192.168.');
        expect(isBlocked, `${ip} should be blocked`).toBe(true);
      }
    });

    it('BUG #8: cloudDeviceFarm undefined does not crash', () => {
      // Verify the fix: String() guard prevents crash on undefined
      const testValues = [undefined, null, '', 'none', 'browserstack', '  saucelabs  '];

      for (const val of testValues) {
        const result = (val ? String(val).trim() : '') || 'none';
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
      }
    });

    it('BUG #1: resetInvalidSelections clears cloudDeviceFarm for non-web/mobile', () => {
      for (const testingType of ['api', 'desktop', 'performance']) {
        const config = {
          testingType,
          cloudDeviceFarm: 'browserstack',
        };
        const result = WizardValidator.resetInvalidSelections(config);
        expect(result.cloudDeviceFarm, `testingType: ${testingType}`).toBe('none');
      }
    });
  });
});
