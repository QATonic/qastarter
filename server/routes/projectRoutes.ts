/**
 * Project Generation Routes
 * Endpoints for generating, previewing, and managing projects
 */

import { Router, Request } from 'express';
import rateLimit from 'express-rate-limit';
import { projectConfigSchema, type ProjectConfig } from '@shared/schema';
import { projectService } from '../services/projectService';
import { WizardValidator } from '@shared/validationMatrix';
import { sanitizeProjectName, sanitizeGroupId, sanitizeArtifactId } from '@shared/sanitize';
import {
  ValidationError,
  IncompatibleCombinationError,
  ErrorCode,
  generateRequestId,
  asyncHandler,
} from '../errors';
import { createRequestLogger } from '../utils/logger';
import { rateLimitConfig } from '../config';

const router = Router();

/**
 * Reusable validation helper to reduce code duplication (DRY)
 * Validates request body against projectConfigSchema
 */
function validateProjectConfigBody(body: unknown, requestId: string): ProjectConfig {
  const validationResult = projectConfigSchema.safeParse(body);

  if (!validationResult.success) {
    const errors = validationResult.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    throw new ValidationError('Invalid project configuration', errors, requestId);
  }

  return validationResult.data;
}

// Project generation rate limiter
const generateProjectLimiter = rateLimit({
  windowMs: rateLimitConfig.generation.windowMs,
  max: rateLimitConfig.generation.max,
  message: {
    success: false,
    error: {
      code: ErrorCode.RATE_LIMIT_EXCEEDED,
      message: 'Too many project generation requests. Please try again in 15 minutes.',
      timestamp: new Date().toISOString(),
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

/**
 * Generate and download project
 */
router.post(
  '/generate-project',
  generateProjectLimiter,
  asyncHandler(async (req, res) => {
    const requestId = generateRequestId('gen');

    const validationResult = projectConfigSchema.safeParse(req.body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      throw new ValidationError('Invalid project configuration', errors, requestId);
    }

    const config: ProjectConfig = validationResult.data;

    // Sanitize user inputs
    config.projectName = sanitizeProjectName(config.projectName);
    if (config.groupId) {
      config.groupId = sanitizeGroupId(config.groupId);
    }
    if (config.artifactId) {
      config.artifactId = sanitizeArtifactId(config.artifactId);
    }

    const reqLogger = createRequestLogger(requestId);

    // Validate compatibility
    if (!WizardValidator.isCompatible(config.testingType, config.framework, config.language)) {
      throw new IncompatibleCombinationError(
        config.testingType,
        config.framework,
        config.language,
        requestId
      );
    }

    await projectService.generateAndStreamProject(config, res, requestId, reqLogger);
  })
);

/**
 * Get project dependencies
 */
router.post(
  '/project-dependencies',
  asyncHandler(async (req, res) => {
    const requestId = generateRequestId('deps');

    const validationResult = projectConfigSchema.safeParse(req.body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      throw new ValidationError('Invalid project configuration', errors, requestId);
    }

    const config: ProjectConfig = validationResult.data;

    if (!WizardValidator.isCompatible(config.testingType, config.framework, config.language)) {
      throw new IncompatibleCombinationError(
        config.testingType,
        config.framework,
        config.language,
        requestId
      );
    }

    const dependencies = await projectService.getDependencies(config);

    res.json({
      success: true,
      data: {
        dependencies,
        buildTool: config.buildTool,
        language: config.language,
      },
    });
  })
);

/**
 * Get project preview (structure and sample files)
 */
router.post(
  '/project-preview',
  asyncHandler(async (req, res) => {
    const requestId = generateRequestId('preview');

    const validationResult = projectConfigSchema.safeParse(req.body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      throw new ValidationError('Invalid project configuration', errors, requestId);
    }

    const config: ProjectConfig = validationResult.data;

    if (!WizardValidator.isCompatible(config.testingType, config.framework, config.language)) {
      throw new IncompatibleCombinationError(
        config.testingType,
        config.framework,
        config.language,
        requestId
      );
    }

    const files = await projectService.generatePreview(config);

    // Build file tree structure
    interface PreviewFile {
      name: string;
      type: 'file' | 'folder';
      content?: string;
      children?: PreviewFile[];
    }

    const buildFileTree = (files: any[]): PreviewFile[] => {
      const tree: { [key: string]: any } = {};

      const sortedFiles = files.sort((a, b) => {
        const aDepth = a.path.split('/').length;
        const bDepth = b.path.split('/').length;
        return aDepth - bDepth;
      });

      sortedFiles.forEach((file) => {
        const pathParts = file.path.split('/');
        let currentLevel = tree;

        pathParts.forEach((part: string, index: number) => {
          if (index === pathParts.length - 1) {
            currentLevel[part] = {
              name: part,
              type: 'file',
              content: file.content,
            };
          } else {
            if (!currentLevel[part]) {
              currentLevel[part] = {
                name: part,
                type: 'folder',
                children: {},
              };
            }
            currentLevel = currentLevel[part].children;
          }
        });
      });

      const convertToArray = (obj: any): PreviewFile[] => {
        return Object.values(obj).map((item: any) => {
          if (item.type === 'folder' && item.children) {
            return {
              ...item,
              children: convertToArray(item.children),
            };
          }
          return item;
        });
      };

      return [
        {
          name: config.projectName,
          type: 'folder' as const,
          children: convertToArray(tree),
        },
      ];
    };

    const projectStructure = buildFileTree(files);

    const sampleFiles = files
      .filter((file) => {
        const fileName = file.path.split('/').pop()?.toLowerCase() || '';
        return (
          fileName.includes('pom.xml') ||
          fileName.includes('readme') ||
          fileName.includes('test') ||
          fileName.includes('base') ||
          fileName.includes('page') ||
          fileName.includes('config')
        );
      })
      .slice(0, 8)
      .map((file) => ({
        path: file.path,
        content:
          file.content.substring(0, 2000) +
          (file.content.length > 2000 ? '\n\n... (content truncated for preview)' : ''),
      }));

    const estimatedSize = files.reduce((total, file) => {
      return total + (file.content?.length || 0);
    }, 0);

    const keyFiles = files
      .filter((file) => {
        const fileName = file.path.split('/').pop()?.toLowerCase() || '';
        const path = file.path.toLowerCase();
        return (
          path.includes('test') ||
          fileName.includes('readme') ||
          fileName.includes('pom.xml') ||
          fileName.includes('build.gradle') ||
          fileName.includes('package.json') ||
          fileName.includes('requirements.txt') ||
          fileName.includes('config') ||
          fileName.includes('.csproj') ||
          fileName.includes('jenkinsfile') ||
          fileName.includes('.yml') ||
          fileName.includes('.yaml')
        );
      })
      .map((file) => ({
        path: file.path,
        type: file.path.toLowerCase().includes('test')
          ? 'test'
          : file.path.toLowerCase().includes('readme')
            ? 'documentation'
            : 'configuration',
      }));

    const dependencies = await projectService.getDependencies(config);
    const dependencyCount = Object.keys(dependencies).length;

    res.json({
      success: true,
      data: {
        projectStructure,
        sampleFiles,
        totalFiles: files.length,
        estimatedSize: Math.ceil(estimatedSize / 1024),
        keyFiles,
        dependencyCount,
        projectConfig: config,
      },
    });
  })
);

/**
 * Public API v1 - Generate project with query parameters
 */
router.get(
  '/v1/generate',
  generateProjectLimiter,
  asyncHandler(async (req, res) => {
    const requestId = generateRequestId('api-gen');

    const {
      projectName = 'my-qa-project',
      testingType: testingTypeParam = 'web',
      framework = 'selenium',
      language = 'java',
      testRunner,
      buildTool,
      testingPattern = 'page-object-model',
      cicdTool,
      reportingTool,
      includeSampleTests = 'true',
      utilities: utilitiesParam,
    } = req.query as Record<string, string>;

    const validTestingTypes = ['web', 'mobile', 'api', 'desktop'] as const;
    const testingType = validTestingTypes.includes(testingTypeParam as any)
      ? (testingTypeParam as 'web' | 'mobile' | 'api' | 'desktop')
      : 'web';

    const utilitiesArray = utilitiesParam
      ? utilitiesParam.split(',').map((u) => u.trim()).filter(Boolean)
      : [];
    const utilities = {
      configReader: utilitiesArray.includes('configReader'),
      jsonReader: utilitiesArray.includes('jsonReader'),
      screenshotUtility:
        utilitiesArray.includes('screenshotUtility') || utilitiesArray.includes('screenshot'),
      logger: utilitiesArray.includes('logger') || utilitiesArray.includes('logging'),
      dataProvider:
        utilitiesArray.includes('dataProvider') || utilitiesArray.includes('dataDriver'),
    };

    const availableTestRunners = WizardValidator.getAvailableTestRunners(language);
    const availableBuildTools = WizardValidator.getAvailableBuildTools(language);

    const finalTestRunner = testRunner || availableTestRunners[0] || 'testng';
    const finalBuildTool = buildTool || availableBuildTools[0] || 'maven';

    const config: ProjectConfig = {
      projectName: sanitizeProjectName(projectName),
      testingType,
      framework,
      language,
      testRunner: finalTestRunner,
      buildTool: finalBuildTool,
      testingPattern,
      cicdTool: cicdTool || undefined,
      reportingTool: reportingTool || undefined,
      utilities,
      includeSampleTests: includeSampleTests !== 'false',
    };

    const validationResult = projectConfigSchema.safeParse(config);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      throw new ValidationError('Invalid configuration', errors, requestId);
    }

    if (!WizardValidator.isCompatible(config.testingType, config.framework, config.language)) {
      throw new IncompatibleCombinationError(
        config.testingType,
        config.framework,
        config.language,
        requestId
      );
    }

    const reqLogger = createRequestLogger(requestId);
    await projectService.generateAndStreamProject(config, res, requestId, reqLogger);
  })
);

export default router;
