/**
 * GitHub Integration Routes
 * Endpoints for pushing generated projects to GitHub repositories
 */

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { projectConfigSchema, type ProjectConfig } from '@shared/schema';
import { WizardValidator } from '@shared/validationMatrix';
import { sanitizeProjectName, sanitizeGroupId, sanitizeArtifactId } from '@shared/sanitize';
import {
  ValidationError,
  IncompatibleCombinationError,
  AppError,
  ErrorCode,
  generateRequestId,
  asyncHandler,
} from '../errors';
import { pushProjectToGitHub, GitHubServiceError } from '../services/githubService';
import { createRequestLogger } from '../utils/logger';

const router = Router();

// Validation schema for the push-to-github request
const githubPushSchema = z.object({
  githubToken: z.string().min(1, 'GitHub token is required'),
  repoName: z
    .string()
    .min(1, 'Repository name is required')
    .max(100, 'Repository name too long')
    .regex(
      /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/,
      'Repository name must start with a letter or number and can contain hyphens, underscores, and dots'
    ),
  isPrivate: z.boolean().optional().default(false),
  description: z.string().max(500).optional(),
  projectConfig: projectConfigSchema,
});

// Rate limiter for GitHub push (stricter than generation)
const githubPushLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 pushes per 15 minutes
  message: () => ({
    success: false,
    error: {
      code: ErrorCode.RATE_LIMIT_EXCEEDED,
      message: 'Too many GitHub push requests. Please try again in 15 minutes.',
      timestamp: new Date().toISOString(),
    },
  }),
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * POST /v1/push-to-github
 * Generates a project and pushes it to a new GitHub repository
 */
router.post(
  '/v1/push-to-github',
  githubPushLimiter,
  asyncHandler(async (req, res) => {
    const requestId = generateRequestId('gh');
    const reqLogger = createRequestLogger(requestId);

    // 1. Validate the full request body
    const bodyResult = githubPushSchema.safeParse(req.body);
    if (!bodyResult.success) {
      const errors = bodyResult.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      throw new ValidationError('Invalid push-to-GitHub request', errors, requestId);
    }

    const { githubToken, repoName, isPrivate, description, projectConfig } = bodyResult.data;

    // 2. Sanitize project config
    projectConfig.projectName = sanitizeProjectName(projectConfig.projectName);
    if (projectConfig.groupId) {
      projectConfig.groupId = sanitizeGroupId(projectConfig.groupId);
    }
    if (projectConfig.artifactId) {
      projectConfig.artifactId = sanitizeArtifactId(projectConfig.artifactId);
    }

    // 3. Validate compatibility
    if (
      !WizardValidator.isCompatible(
        projectConfig.testingType,
        projectConfig.framework,
        projectConfig.language
      )
    ) {
      throw new IncompatibleCombinationError(
        projectConfig.testingType,
        projectConfig.framework,
        projectConfig.language,
        requestId
      );
    }

    reqLogger.info('Push to GitHub requested', {
      repoName,
      isPrivate,
      projectName: projectConfig.projectName,
    });

    try {
      // 4. Generate and push
      const result = await pushProjectToGitHub({
        token: githubToken,
        repoName,
        isPrivate,
        description,
        projectConfig,
      });

      reqLogger.info('GitHub push successful', {
        repoUrl: result.repoUrl,
        filesCount: result.filesCount,
      });

      res.json({
        success: true,
        data: {
          repoUrl: result.repoUrl,
          cloneUrl: result.cloneUrl,
          fullName: result.fullName,
          filesCount: result.filesCount,
          defaultBranch: result.defaultBranch,
        },
      });
    } catch (error) {
      if (error instanceof GitHubServiceError) {
        reqLogger.warn('GitHub push failed', {
          errorCode: error.errorCode,
          message: error.message,
        });

        // Map GitHub service errors to appropriate HTTP codes
        const statusMap: Record<string, number> = {
          AUTH_FAILED: 401,
          INSUFFICIENT_SCOPE: 403,
          REPO_EXISTS: 409,
          INVALID_REPO_NAME: 422,
          REPO_CREATE_FAILED: 502,
          PUSH_FAILED: 502,
          NO_FILES_GENERATED: 500,
        };

        const status = statusMap[error.errorCode] || 500;

        res.status(status).json({
          success: false,
          error: {
            code: error.errorCode,
            message: error.message,
            requestId,
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      // Re-throw AppErrors for the global handler
      if (error instanceof AppError) {
        throw error;
      }

      // Unknown errors
      throw new AppError(
        ErrorCode.EXTERNAL_SERVICE_ERROR,
        'GitHub push failed due to an unexpected error',
        undefined,
        requestId,
        { cause: error instanceof Error ? error : undefined }
      );
    }
  })
);

export default router;
