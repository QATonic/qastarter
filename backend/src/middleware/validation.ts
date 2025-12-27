import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { ApiResponse, ValidationError } from '@/types/index.js';

/**
 * Validation schema for project generation request
 */
export const generateProjectSchema = Joi.object({
  testingType: Joi.string().valid('Web', 'API', 'Mobile').required(),
  methodology: Joi.string().valid('TDD', 'BDD', 'Hybrid').required(),
  tool: Joi.string().required(),
  language: Joi.string().required(),
  buildTool: Joi.string().required(),
  testRunner: Joi.string().required(),
  scenarios: Joi.array().items(Joi.string()).min(1).required(),
  config: Joi.object({
    projectName: Joi.string().pattern(/^[a-zA-Z0-9_-]+$/).min(2).max(50).required(),
    groupId: Joi.string().pattern(/^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)*$/).when('$language', {
      is: 'Java',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    artifactId: Joi.string().pattern(/^[a-z][a-z0-9-]*$/).when('$language', {
      is: 'Java',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    packageName: Joi.string().pattern(/^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)*$/).when('$language', {
      is: 'Java',
      then: Joi.required(),
      otherwise: Joi.optional()
    })
  }).required(),
  integrations: Joi.object({
    cicd: Joi.string().optional(),
    reporting: Joi.string().optional(),
    others: Joi.array().items(Joi.string()).default([])
  }).required(),
  dependencies: Joi.array().items(Joi.string()).default([])
}).external((value) => {
  // External validation for context-specific rules
  const { language } = value;
  return { ...value, $language: language };
});

/**
 * Generic validation middleware factory
 */
export function validateRequest(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });

    if (error) {
      const validationErrors: ValidationError[] = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        code: detail.type
      }));

      const response: ApiResponse = {
        success: false,
        message: 'Validation failed',
        errors: validationErrors,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || 'unknown'
      };

      res.status(400).json(response);
      return;
    }

    req.body = value;
    next();
  };
}

/**
 * Validate project configuration specifically
 */
export const validateProjectGeneration = validateRequest(generateProjectSchema);

/**
 * Validate project ID parameter
 */
export function validateProjectId(req: Request, res: Response, next: NextFunction): void {
  const { projectId } = req.params;
  
  if (!projectId || !/^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i.test(projectId)) {
    const response: ApiResponse = {
      success: false,
      message: 'Invalid project ID format',
      errors: [{
        field: 'projectId',
        message: 'Project ID must be a valid UUID',
        code: 'string.guid'
      }],
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || 'unknown'
    };

    res.status(400).json(response);
    return;
  }

  next();
}

/**
 * Sanitize file names and paths
 */
export function sanitizePath(path: string): string {
  return path
    .replace(/[<>:"|?*]/g, '') // Remove invalid characters
    .replace(/\.\./g, '') // Remove path traversal
    .replace(/\/+/g, '/') // Normalize slashes
    .trim();
}

/**
 * Validate file upload
 */
export function validateFileUpload(req: Request, res: Response, next: NextFunction): void {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedMimeTypes = ['application/zip', 'application/x-zip-compressed'];

  if (req.file) {
    if (req.file.size > maxSize) {
      const response: ApiResponse = {
        success: false,
        message: 'File too large',
        errors: [{
          field: 'file',
          message: 'File size must be less than 10MB',
          code: 'file.size'
        }],
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || 'unknown'
      };

      res.status(400).json(response);
      return;
    }

    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      const response: ApiResponse = {
        success: false,
        message: 'Invalid file type',
        errors: [{
          field: 'file',
          message: 'Only ZIP files are allowed',
          code: 'file.type'
        }],
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || 'unknown'
      };

      res.status(400).json(response);
      return;
    }
  }

  next();
} 