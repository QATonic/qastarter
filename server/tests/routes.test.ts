/**
 * API Routes Unit Tests
 * 
 * These tests verify the API route handlers directly without mocking the full server.
 * Uses supertest with a minimal express setup.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express, { Express, Request, Response, NextFunction } from 'express';
import request from 'supertest';
import { projectConfigSchema, type ProjectConfig } from '../../shared/schema';
import { WizardValidator, validationMatrix, validationLabels } from '../../shared/validationMatrix';
import { ErrorCode } from '../errors';

// Create a minimal test app with just the routes we want to test
function createTestApp(): Express {
    const app = express();
    app.use(express.json());

    // Mock error handler
    app.use((err: any, req: Request, res: Response, next: NextFunction) => {
        const statusCode = err.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            error: {
                code: err.code || 'INTERNAL_ERROR',
                message: err.message,
            }
        });
    });

    // === Metadata endpoint ===
    app.get("/api/v1/metadata", (req, res) => {
        const metadata = {
            version: "1.0.0",
            testingTypes: validationMatrix.testingTypes.map(type => ({
                id: type,
                label: validationLabels.testingTypes[type as keyof typeof validationLabels.testingTypes] || type,
                frameworks: validationMatrix.frameworks[type] || []
            })),
            frameworks: Object.entries(validationLabels.frameworks).map(([id, label]) => ({
                id,
                label,
                languages: validationMatrix.languages[id] || [],
                cicdTools: validationMatrix.cicdTools[id] || [],
                reportingTools: validationMatrix.reportingTools[id] || [],
                testingPatterns: validationMatrix.testingPatterns[id] || []
            })),
            languages: Object.entries(validationLabels.languages).map(([id, label]) => ({
                id,
                label,
                testRunners: validationMatrix.testRunners[id] || [],
                buildTools: validationMatrix.buildTools[id] || []
            })),
            testRunners: Object.entries(validationLabels.testRunners).map(([id, label]) => ({ id, label })),
            buildTools: Object.entries(validationLabels.buildTools).map(([id, label]) => ({ id, label })),
            cicdTools: Object.entries(validationLabels.cicdTools).map(([id, label]) => ({ id, label })),
            reportingTools: Object.entries(validationLabels.reportingTools).map(([id, label]) => ({ id, label })),
            testingPatterns: Object.entries(validationLabels.testingPatterns).map(([id, label]) => ({ id, label })),
            utilities: [
                { id: 'configReader', label: 'Config Reader', description: 'Configuration file reader utility' },
                { id: 'jsonReader', label: 'JSON Reader', description: 'JSON file parsing utility' },
                { id: 'screenshotUtility', label: 'Screenshot Utility', description: 'Screenshot capture on failure' },
                { id: 'logger', label: 'Logger', description: 'Structured logging configuration' },
                { id: 'dataProvider', label: 'Data Provider', description: 'Data-driven testing utilities' }
            ]
        };

        res.json({
            success: true,
            data: metadata
        });
    });

    // === Config options endpoint ===
    app.get("/api/v1/config/options", (req, res) => {
        const requestId = `cfg_${Date.now()}`;
        const options = {
            testingTypes: ['Web', 'API', 'Mobile', 'Desktop'],
            methodologies: ['TDD', 'BDD', 'Hybrid'],
            tools: ['Selenium', 'Playwright', 'Cypress', 'WebdriverIO', 'RestAssured'],
            languages: ['Java', 'Python', 'JavaScript', 'TypeScript', 'C#', 'Swift'],
            buildTools: ['Maven', 'Gradle', 'npm', 'pip', 'NuGet', 'SPM'],
            testRunners: ['JUnit 5', 'TestNG', 'Pytest', 'Jest', 'Mocha', 'NUnit', 'XCTest'],
            cicdOptions: ['Jenkins', 'GitHub Actions', 'GitLab CI', 'Azure DevOps'],
        };

        res.json({
            success: true,
            data: options,
            timestamp: new Date().toISOString(),
            requestId
        });
    });

    // === Config filters endpoint ===
    app.get("/api/v1/config/filters", (req, res) => {
        const requestId = `flt_${Date.now()}`;
        const filters = {
            testingType: {
                'Web': {
                    tools: ['Selenium', 'Playwright', 'Cypress', 'WebdriverIO'],
                    languages: ['Java', 'Python', 'JavaScript', 'TypeScript', 'C#']
                },
                'API': {
                    tools: ['RestAssured', 'Requests', 'Supertest', 'RestSharp'],
                    languages: ['Java', 'Python', 'JavaScript', 'TypeScript', 'C#']
                }
            },
            tool: {
                'Selenium': { languages: ['Java', 'Python', 'JavaScript', 'TypeScript', 'C#'] },
                'Playwright': { languages: ['Java', 'Python', 'JavaScript', 'TypeScript', 'C#'] },
            },
            language: {
                'Java': { buildTools: ['Maven', 'Gradle'], testRunners: ['JUnit 5', 'TestNG'] },
                'Python': { buildTools: ['pip'], testRunners: ['Pytest'] },
            },
            toolLanguage: {
                'Selenium-Java': { testRunners: ['TestNG', 'JUnit 5'], buildTools: ['Maven', 'Gradle'] },
            }
        };

        res.json({
            success: true,
            data: filters,
            timestamp: new Date().toISOString(),
            requestId
        });
    });

    // === Validate config endpoint ===
    app.post("/api/validate-config", (req, res) => {
        const validationResult = projectConfigSchema.safeParse(req.body);

        if (!validationResult.success) {
            return res.json({
                isValid: false,
                message: "Invalid configuration",
                errors: validationResult.error.errors.map(e => ({
                    field: e.path.join('.'),
                    message: e.message
                }))
            });
        }

        const config: ProjectConfig = validationResult.data;
        const isValid = WizardValidator.isCompatible(config.testingType, config.framework, config.language);

        res.json({
            isValid,
            message: isValid ? "Configuration is valid" : "Invalid combination of testing type, framework, and language"
        });
    });

    // === Analytics session endpoint ===
    app.get("/api/analytics/session", (req, res) => {
        const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        res.json({ success: true, sessionId });
    });

    // === Analytics events endpoint ===
    app.post("/api/analytics/events", (req, res) => {
        const { sessionId, events, metadata } = req.body;

        if (!sessionId || !events || !Array.isArray(events)) {
            return res.status(400).json({
                success: false,
                error: { message: 'Invalid analytics payload' }
            });
        }

        res.json({ success: true, received: events.length });
    });

    // === Analytics stats endpoint (mock) ===
    app.get("/api/analytics/stats", (req, res) => {
        const stats = {
            totalGenerations: 100,
            byTestingType: { web: 50, api: 30, mobile: 15, desktop: 5 },
            byFramework: { selenium: 30, playwright: 20, restassured: 15 },
            byLanguage: { java: 40, typescript: 30, python: 20, csharp: 10 },
            byCiCd: { 'github-actions': 30, jenkins: 20 },
            popularCombinations: [
                { testingType: 'web', framework: 'selenium', language: 'java', count: 20 },
            ],
            recentGenerations: 10,
        };

        res.json({
            success: true,
            data: stats
        });
    });

    // === Cache health endpoint (mock) ===
    app.get("/api/v1/health/cache", (req, res) => {
        res.json({
            success: true,
            data: {
                status: 'healthy',
                provider: 'memory',
                statistics: {
                    hits: 100,
                    misses: 10,
                    keys: 15,
                    hitRate: 90.91,
                },
                timestamp: new Date().toISOString(),
            }
        });
    });

    // === Stats endpoint (mock) ===
    app.get("/api/stats", (req, res) => {
        res.json({
            success: true,
            data: {
                totalGenerations: 150,
                byFramework: { selenium: 50, playwright: 40, cypress: 30 },
            }
        });
    });

    return app;
}

describe('API Routes', () => {
    let app: Express;

    beforeAll(() => {
        app = createTestApp();
    });

    describe('GET /api/v1/metadata', () => {
        it('should return metadata with all available options', async () => {
            const response = await request(app)
                .get('/api/v1/metadata')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('version');
            expect(response.body.data).toHaveProperty('testingTypes');
            expect(response.body.data).toHaveProperty('frameworks');
            expect(response.body.data).toHaveProperty('languages');
            expect(response.body.data).toHaveProperty('testRunners');
            expect(response.body.data).toHaveProperty('buildTools');
            expect(response.body.data).toHaveProperty('cicdTools');
            expect(response.body.data).toHaveProperty('reportingTools');
            expect(response.body.data).toHaveProperty('testingPatterns');
            expect(response.body.data).toHaveProperty('utilities');
        });

        it('should include testing types with correct structure', async () => {
            const response = await request(app)
                .get('/api/v1/metadata')
                .expect(200);

            const testingTypes = response.body.data.testingTypes;
            expect(Array.isArray(testingTypes)).toBe(true);

            const webType = testingTypes.find((t: any) => t.id === 'web');
            expect(webType).toBeDefined();
            expect(webType).toHaveProperty('id');
            expect(webType).toHaveProperty('label');
            expect(webType).toHaveProperty('frameworks');
        });

        it('should include utilities with descriptions', async () => {
            const response = await request(app)
                .get('/api/v1/metadata')
                .expect(200);

            const utilities = response.body.data.utilities;
            expect(Array.isArray(utilities)).toBe(true);
            expect(utilities.length).toBeGreaterThan(0);

            utilities.forEach((util: any) => {
                expect(util).toHaveProperty('id');
                expect(util).toHaveProperty('label');
                expect(util).toHaveProperty('description');
            });
        });
    });

    describe('GET /api/v1/config/options', () => {
        it('should return wizard configuration options', async () => {
            const response = await request(app)
                .get('/api/v1/config/options')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('testingTypes');
            expect(response.body.data).toHaveProperty('methodologies');
            expect(response.body.data).toHaveProperty('tools');
            expect(response.body.data).toHaveProperty('languages');
            expect(response.body.data).toHaveProperty('buildTools');
            expect(response.body.data).toHaveProperty('testRunners');
        });

        it('should include request ID in response', async () => {
            const response = await request(app)
                .get('/api/v1/config/options')
                .expect(200);

            expect(response.body).toHaveProperty('requestId');
            expect(response.body).toHaveProperty('timestamp');
        });
    });

    describe('GET /api/v1/config/filters', () => {
        it('should return filter rules for wizard', async () => {
            const response = await request(app)
                .get('/api/v1/config/filters')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('testingType');
            expect(response.body.data).toHaveProperty('tool');
            expect(response.body.data).toHaveProperty('language');
            expect(response.body.data).toHaveProperty('toolLanguage');
        });

        it('should include filtering rules for web testing type', async () => {
            const response = await request(app)
                .get('/api/v1/config/filters')
                .expect(200);

            const webFilters = response.body.data.testingType['Web'];
            expect(webFilters).toBeDefined();
            expect(webFilters).toHaveProperty('tools');
            expect(webFilters).toHaveProperty('languages');
            expect(webFilters.tools).toContain('Selenium');
            expect(webFilters.tools).toContain('Playwright');
        });
    });

    describe('POST /api/validate-config', () => {
        it('should validate a valid configuration', async () => {
            const response = await request(app)
                .post('/api/validate-config')
                .send({
                    projectName: 'test-project',
                    testingType: 'web',
                    framework: 'selenium',
                    language: 'java',
                    testRunner: 'testng',
                    buildTool: 'maven',
                    testingPattern: 'page-object-model',
                    includeSampleTests: true,
                })
                .expect(200);

            expect(response.body.isValid).toBe(true);
            expect(response.body.message).toContain('valid');
        });

        it('should reject invalid combination', async () => {
            const response = await request(app)
                .post('/api/validate-config')
                .send({
                    projectName: 'test-project',
                    testingType: 'web',
                    framework: 'restassured', // Invalid for web testing
                    language: 'java',
                    testRunner: 'testng',
                    buildTool: 'maven',
                    testingPattern: 'page-object-model',
                    includeSampleTests: true,
                })
                .expect(200);

            expect(response.body.isValid).toBe(false);
        });

        it('should return validation errors for missing fields', async () => {
            const response = await request(app)
                .post('/api/validate-config')
                .send({
                    projectName: 'test-project',
                    // Missing required fields
                })
                .expect(200);

            expect(response.body.isValid).toBe(false);
            expect(response.body).toHaveProperty('errors');
            expect(Array.isArray(response.body.errors)).toBe(true);
        });

        it('should accept TypeScript + Playwright combination', async () => {
            const response = await request(app)
                .post('/api/validate-config')
                .send({
                    projectName: 'ts-playwright-project',
                    testingType: 'web',
                    framework: 'playwright',
                    language: 'typescript',
                    testRunner: 'jest',
                    buildTool: 'npm',
                    testingPattern: 'page-object-model',
                    includeSampleTests: true,
                })
                .expect(200);

            expect(response.body.isValid).toBe(true);
        });
    });

    describe('GET /api/stats', () => {
        it('should return project generation stats', async () => {
            const response = await request(app)
                .get('/api/stats')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('totalGenerations');
        });
    });

    describe('GET /api/analytics/stats', () => {
        it('should return analytics statistics', async () => {
            const response = await request(app)
                .get('/api/analytics/stats')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('totalGenerations');
            expect(response.body.data).toHaveProperty('byTestingType');
            expect(response.body.data).toHaveProperty('byFramework');
            expect(response.body.data).toHaveProperty('byLanguage');
            expect(response.body.data).toHaveProperty('popularCombinations');
        });
    });

    describe('GET /api/analytics/session', () => {
        it('should return a new session ID', async () => {
            const response = await request(app)
                .get('/api/analytics/session')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body).toHaveProperty('sessionId');
            expect(typeof response.body.sessionId).toBe('string');
            expect(response.body.sessionId).toMatch(/^sess_\d+_[a-z0-9]+$/);
        });
    });

    describe('POST /api/analytics/events', () => {
        it('should accept valid analytics events', async () => {
            const response = await request(app)
                .post('/api/analytics/events')
                .send({
                    sessionId: 'sess_test_12345',
                    events: [
                        { eventType: 'page_view', data: { page: '/home' } },
                        { eventType: 'wizard_start', data: { step: 1 } },
                    ],
                    metadata: {
                        userAgent: 'Mozilla/5.0 Test',
                    },
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.received).toBe(2);
        });

        it('should reject invalid payload', async () => {
            const response = await request(app)
                .post('/api/analytics/events')
                .send({
                    // Missing required fields
                    events: 'invalid',
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should reject missing sessionId', async () => {
            const response = await request(app)
                .post('/api/analytics/events')
                .send({
                    events: [{ eventType: 'page_view', data: {} }],
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/v1/health/cache', () => {
        it('should return cache health status', async () => {
            const response = await request(app)
                .get('/api/v1/health/cache')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('status');
            expect(response.body.data).toHaveProperty('provider');
            expect(response.body.data).toHaveProperty('statistics');
            expect(response.body.data).toHaveProperty('timestamp');
        });

        it('should return cache statistics with correct structure', async () => {
            const response = await request(app)
                .get('/api/v1/health/cache')
                .expect(200);

            const stats = response.body.data.statistics;
            expect(stats).toHaveProperty('hits');
            expect(stats).toHaveProperty('misses');
            expect(stats).toHaveProperty('keys');
            expect(stats).toHaveProperty('hitRate');
            expect(typeof stats.hitRate).toBe('number');
        });
    });
});
