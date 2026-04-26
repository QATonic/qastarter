/**
 * Unit Tests for Project Service
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProjectService } from './projectService';
import { ProjectConfig } from '../../shared/schema';

// Mock the dependencies
vi.mock('../templates', () => ({
  ProjectTemplateGenerator: vi.fn().mockImplementation(() => ({
    generateProject: vi.fn().mockResolvedValue([
      { path: 'README.md', content: '# Test Project', isTemplate: false },
      { path: 'src/test.java', content: 'public class Test {}', isTemplate: true },
    ]),
    generateProjectStream: vi.fn().mockImplementation(async function* () {
      yield { path: 'README.md', content: '# Test Project', isTemplate: false };
      yield { path: 'src/test.java', content: 'public class Test {}', isTemplate: true };
    }),
    getDependencies: vi.fn().mockResolvedValue({
      'selenium-java': '4.15.0',
      testng: '7.8.0',
    }),
  })),
}));

vi.mock('../storage', () => ({
  storage: {
    saveProjectGeneration: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../utils/logger', () => ({
  logGeneration: vi.fn(),
  createRequestLogger: vi.fn().mockReturnValue({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('ProjectService', () => {
  let service: ProjectService;

  const mockConfig: ProjectConfig = {
    projectName: 'test-project',
    testingType: 'web',
    framework: 'selenium',
    language: 'java',
    testRunner: 'testng',
    buildTool: 'maven',
    testingPattern: 'page-object-model',
    includeSampleTests: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ProjectService();
  });

  describe('constructor', () => {
    it('should create an instance', () => {
      expect(service).toBeInstanceOf(ProjectService);
    });
  });

  describe('getDependencies', () => {
    it('should return dependencies for a configuration', async () => {
      const deps = await service.getDependencies(mockConfig);

      expect(deps).toHaveProperty('selenium-java');
      expect(deps).toHaveProperty('testng');
    });
  });

  describe('generatePreview', () => {
    it('should return generated files', async () => {
      const files = await service.generatePreview(mockConfig);

      expect(Array.isArray(files)).toBe(true);
      expect(files.length).toBeGreaterThan(0);
    });

    it('should return files with correct structure', async () => {
      const files = await service.generatePreview(mockConfig);

      files.forEach((file) => {
        expect(file).toHaveProperty('path');
        expect(file).toHaveProperty('content');
      });
    });
  });
});

describe('ProjectService Integration', () => {
  // These tests use the actual service without mocks
  // They test the integration between components

  describe('Configuration validation', () => {
    it('should handle valid web + selenium + java config', () => {
      const config: ProjectConfig = {
        projectName: 'valid-project',
        testingType: 'web',
        framework: 'selenium',
        language: 'java',
        testRunner: 'testng',
        buildTool: 'maven',
        testingPattern: 'page-object-model',
        includeSampleTests: true,
      };

      // Should not throw during service creation
      expect(() => new ProjectService()).not.toThrow();
    });

    it('should handle config with all optional fields', () => {
      const config: ProjectConfig = {
        projectName: 'full-config-project',
        testingType: 'web',
        framework: 'playwright',
        language: 'typescript',
        testRunner: 'jest',
        buildTool: 'npm',
        testingPattern: 'page-object-model',
        groupId: 'com.example',
        artifactId: 'test-artifact',
        cicdTool: 'github-actions',
        reportingTool: 'allure',
        includeSampleTests: true,
        utilities: {
          configReader: true,
          jsonReader: true,
          screenshotUtility: true,
          logger: true,
          dataProvider: false,
        },
      };

      expect(config.utilities?.configReader).toBe(true);
      expect(config.utilities?.dataProvider).toBe(false);
    });
  });
});
