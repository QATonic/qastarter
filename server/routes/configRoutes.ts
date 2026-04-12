/**
 * Configuration Routes
 * Endpoints for wizard configuration and validation
 */

import { Router } from 'express';
import { Octokit } from '@octokit/rest';
import { projectConfigSchema, type ProjectConfig } from '@shared/schema';
import { BOM } from '@shared/bom';
import { WizardValidator, validationMatrix, validationLabels } from '@shared/validationMatrix';
import {
  asyncHandler,
  ValidationError,
  IncompatibleCombinationError,
  generateRequestId,
} from '../errors';
import { storage } from '../storage';

// ── GitHub stars cache (1-hour TTL) ──────────────────────────────────
let githubStarsCache: { stars: number; forks: number; updatedAt: number } | null = null;
const GITHUB_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

const router = Router();

/**
 * Get project generation stats
 */
router.get(
  '/v1/stats',
  asyncHandler(async (req, res) => {
    const stats = await storage.getProjectGenerationStats();
    res.json({
      success: true,
      data: stats,
    });
  })
);

/**
 * GET /v1/stats/github
 * Returns GitHub stars/forks for the QAStarter repo (cached, 1-hour TTL).
 * Uses unauthenticated Octokit — 60 req/hour rate limit is fine with cache.
 */
router.get(
  '/v1/stats/github',
  asyncHandler(async (_req, res) => {
    const now = Date.now();

    // Serve from cache when fresh
    if (githubStarsCache && now - githubStarsCache.updatedAt < GITHUB_CACHE_TTL_MS) {
      return res.json({
        success: true,
        data: { stars: githubStarsCache.stars, forks: githubStarsCache.forks },
      });
    }

    try {
      const octokit = new Octokit();
      const { data } = await octokit.repos.get({
        owner: 'QATonic',
        repo: 'qastarter',
      });

      githubStarsCache = {
        stars: data.stargazers_count,
        forks: data.forks_count,
        updatedAt: now,
      };

      res.json({
        success: true,
        data: { stars: data.stargazers_count, forks: data.forks_count },
      });
    } catch {
      // Return stale cache if available, otherwise zeros
      const fallback = githubStarsCache ?? { stars: 0, forks: 0 };
      res.json({
        success: true,
        data: { stars: fallback.stars, forks: fallback.forks },
      });
    }
  })
);

/**
 * GET /v1/bom
 * Returns the Bill of Materials (library versions) so the CLI
 * `update` command can compare against local project dependencies.
 */
router.get('/v1/bom', (_req, res) => {
  res.json({
    success: true,
    data: BOM,
  });
});

/**
 * Get wizard configuration options
 */
router.get('/v1/config/options', (req, res) => {
  const requestId = generateRequestId('config');
  const options = {
    testingTypes: ['Web', 'API', 'Mobile', 'Desktop'],
    methodologies: ['TDD', 'BDD', 'Hybrid'],
    tools: [
      'Selenium',
      'Playwright',
      'Cypress',
      'WebdriverIO',
      'RestAssured',
      'Requests',
      'Supertest',
      'RestSharp',
      'Appium',
      'XCUITest',
      'Espresso',
      'WinAppDriver',
      'PyAutoGUI',
    ],
    languages: ['Java', 'Python', 'JavaScript', 'TypeScript', 'C#', 'Swift'],
    buildTools: ['Maven', 'Gradle', 'npm', 'pip', 'NuGet', 'SPM'],
    testRunners: ['JUnit 5', 'TestNG', 'Pytest', 'Jest', 'Mocha', 'NUnit', 'XCTest', 'Cypress'],
    cicdOptions: ['Jenkins', 'GitHub Actions', 'GitLab CI', 'Azure DevOps', 'CircleCI'],
    reportingOptions: [
      'Allure Reports',
      'Extent Reports',
      'TestNG Reports',
      'JUnit Reports',
      'Pytest HTML',
      'Mochawesome',
    ],
  };

  res.json({
    success: true,
    data: options,
    timestamp: new Date().toISOString(),
    requestId,
  });
});

/**
 * Validate project configuration
 */
router.post('/v1/validate-config', (req, res) => {
  const validationResult = projectConfigSchema.safeParse(req.body);

  if (!validationResult.success) {
    return res.json({
      isValid: false,
      message: 'Invalid configuration',
      errors: validationResult.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  const config: ProjectConfig = validationResult.data;
  const isValid = WizardValidator.isCompatible(
    config.testingType,
    config.framework,
    config.language
  );

  res.json({
    isValid,
    message: isValid
      ? 'Configuration is valid'
      : 'Invalid combination of testing type, framework, and language',
  });
});

/**
 * Get metadata for project generation options
 */
router.get('/v1/metadata', (req, res) => {
  const metadata = {
    version: '1.0.0',
    testingTypes: validationMatrix.testingTypes.map((type) => ({
      id: type,
      label:
        validationLabels.testingTypes[type as keyof typeof validationLabels.testingTypes] || type,
      frameworks: validationMatrix.frameworks[type] || [],
    })),
    frameworks: Object.entries(validationLabels.frameworks).map(([id, label]) => ({
      id,
      label,
      languages: validationMatrix.languages[id] || [],
      cicdTools: validationMatrix.cicdTools[id] || [],
      reportingTools: validationMatrix.reportingTools[id] || [],
      testingPatterns: validationMatrix.testingPatterns[id] || [],
    })),
    languages: Object.entries(validationLabels.languages).map(([id, label]) => ({
      id,
      label,
      testRunners: validationMatrix.testRunners[id] || [],
      buildTools: validationMatrix.buildTools[id] || [],
    })),
    testRunners: Object.entries(validationLabels.testRunners).map(([id, label]) => ({ id, label })),
    buildTools: Object.entries(validationLabels.buildTools).map(([id, label]) => ({ id, label })),
    cicdTools: Object.entries(validationLabels.cicdTools).map(([id, label]) => ({ id, label })),
    reportingTools: Object.entries(validationLabels.reportingTools).map(([id, label]) => ({
      id,
      label,
    })),
    testingPatterns: Object.entries(validationLabels.testingPatterns).map(([id, label]) => ({
      id,
      label,
    })),
    utilities: [
      {
        id: 'configReader',
        label: 'Config Reader',
        description: 'Configuration file reader utility',
      },
      { id: 'jsonReader', label: 'JSON Reader', description: 'JSON file parsing utility' },
      {
        id: 'screenshotUtility',
        label: 'Screenshot Utility',
        description: 'Screenshot capture on failure',
      },
      { id: 'logger', label: 'Logger', description: 'Structured logging configuration' },
      { id: 'dataProvider', label: 'Data Provider', description: 'Data-driven testing utilities' },
    ],
  };

  res.json({
    success: true,
    data: metadata,
  });
});

export default router;
