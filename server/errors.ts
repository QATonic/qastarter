/**
 * Centralized Error Handling for QAStarter API
 * Provides consistent error responses and logging
 */

import type { Request, Response, NextFunction } from 'express';

/**
 * Error codes for API responses
 */
export enum ErrorCode {
  // Validation errors (400)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_CONFIG = 'INVALID_CONFIG',
  INCOMPATIBLE_COMBINATION = 'INCOMPATIBLE_COMBINATION',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_PROJECT_NAME = 'INVALID_PROJECT_NAME',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  DEPENDENCY_RESOLUTION_ERROR = 'DEPENDENCY_RESOLUTION_ERROR',

  // Not found errors (404)
  TEMPLATE_NOT_FOUND = 'TEMPLATE_NOT_FOUND',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',

  // Timeout errors (408/504)
  REQUEST_TIMEOUT = 'REQUEST_TIMEOUT',
  GENERATION_TIMEOUT = 'GENERATION_TIMEOUT',

  // Rate limiting (429)
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Server errors (500)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  TEMPLATE_GENERATION_ERROR = 'TEMPLATE_GENERATION_ERROR',
  ARCHIVE_ERROR = 'ARCHIVE_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',

  // External service errors (502/503)
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  CACHE_ERROR = 'CACHE_ERROR',

  // Unknown
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * HTTP status codes mapping
 */
const errorStatusCodes: Record<ErrorCode, number> = {
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.INVALID_CONFIG]: 400,
  [ErrorCode.INCOMPATIBLE_COMBINATION]: 400,
  [ErrorCode.MISSING_REQUIRED_FIELD]: 400,
  [ErrorCode.INVALID_PROJECT_NAME]: 400,
  [ErrorCode.CONFIGURATION_ERROR]: 400,
  [ErrorCode.DEPENDENCY_RESOLUTION_ERROR]: 400,
  [ErrorCode.TEMPLATE_NOT_FOUND]: 404,
  [ErrorCode.RESOURCE_NOT_FOUND]: 404,
  [ErrorCode.REQUEST_TIMEOUT]: 408,
  [ErrorCode.GENERATION_TIMEOUT]: 504,
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 429,
  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.TEMPLATE_GENERATION_ERROR]: 500,
  [ErrorCode.ARCHIVE_ERROR]: 500,
  [ErrorCode.STORAGE_ERROR]: 500,
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 502,
  [ErrorCode.SERVICE_UNAVAILABLE]: 503,
  [ErrorCode.CACHE_ERROR]: 500,
  [ErrorCode.UNKNOWN_ERROR]: 500
};

/**
 * User-friendly error messages
 */
const errorMessages: Record<ErrorCode, string> = {
  [ErrorCode.VALIDATION_ERROR]: 'The request contains invalid data',
  [ErrorCode.INVALID_CONFIG]: 'Invalid project configuration',
  [ErrorCode.INCOMPATIBLE_COMBINATION]: 'Invalid combination of testing type, framework, and language',
  [ErrorCode.MISSING_REQUIRED_FIELD]: 'Required field is missing',
  [ErrorCode.INVALID_PROJECT_NAME]: 'Project name contains invalid characters',
  [ErrorCode.CONFIGURATION_ERROR]: 'Invalid configuration provided',
  [ErrorCode.DEPENDENCY_RESOLUTION_ERROR]: 'Failed to resolve project dependencies',
  [ErrorCode.TEMPLATE_NOT_FOUND]: 'Template not found for the specified configuration',
  [ErrorCode.RESOURCE_NOT_FOUND]: 'The requested resource was not found',
  [ErrorCode.REQUEST_TIMEOUT]: 'Request timed out',
  [ErrorCode.GENERATION_TIMEOUT]: 'Project generation timed out',
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please try again later',
  [ErrorCode.INTERNAL_ERROR]: 'An internal server error occurred',
  [ErrorCode.TEMPLATE_GENERATION_ERROR]: 'Error generating project template',
  [ErrorCode.ARCHIVE_ERROR]: 'Error creating project archive',
  [ErrorCode.STORAGE_ERROR]: 'Error accessing storage',
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 'External service error',
  [ErrorCode.SERVICE_UNAVAILABLE]: 'Service temporarily unavailable',
  [ErrorCode.CACHE_ERROR]: 'Cache operation failed',
  [ErrorCode.UNKNOWN_ERROR]: 'An unexpected error occurred'
};
/**
 * Request metadata for enhanced error context
 */
export interface RequestContext {
  path?: string;
  method?: string;
  userAgent?: string;
  ip?: string;
}

/**
 * Custom application error class with cause chaining
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: any;
  public readonly requestId?: string;
  public readonly timestamp: string;
  public readonly cause?: Error;
  public readonly retryAfter?: number;
  public readonly requestContext?: RequestContext;

  constructor(
    code: ErrorCode,
    message?: string,
    details?: any,
    requestId?: string,
    options?: {
      cause?: Error;
      retryAfter?: number;
      requestContext?: RequestContext;
    }
  ) {
    super(message || errorMessages[code]);
    this.code = code;
    this.statusCode = errorStatusCodes[code];
    this.details = details;
    this.requestId = requestId;
    this.timestamp = new Date().toISOString();
    this.cause = options?.cause;
    this.retryAfter = options?.retryAfter;
    this.requestContext = options?.requestContext;

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert error to JSON response format
   */
  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        ...(this.details && { details: this.details }),
        ...(this.requestId && { requestId: this.requestId }),
        ...(this.retryAfter && { retryAfter: this.retryAfter }),
        timestamp: this.timestamp
      }
    };
  }

  /**
   * Get full error chain for debugging
   */
  getErrorChain(): string[] {
    const chain: string[] = [`${this.code}: ${this.message}`];
    let current: Error | undefined = this.cause;
    while (current) {
      chain.push(`Caused by: ${current.message}`);
      current = (current as AppError).cause;
    }
    return chain;
  }
}

/**
 * Validation error with field-level details
 */
export class ValidationError extends AppError {
  constructor(
    message: string,
    errors: Array<{ field: string; message: string }>,
    requestId?: string
  ) {
    super(ErrorCode.VALIDATION_ERROR, message, { errors }, requestId);
  }
}

/**
 * Template not found error
 */
export class TemplateNotFoundError extends AppError {
  constructor(
    testingType: string,
    framework: string,
    language: string,
    requestId?: string
  ) {
    super(
      ErrorCode.TEMPLATE_NOT_FOUND,
      `No template found for ${testingType} + ${framework} + ${language}`,
      { testingType, framework, language },
      requestId
    );
  }
}

/**
 * Incompatible combination error
 */
export class IncompatibleCombinationError extends AppError {
  constructor(
    testingType: string,
    framework: string,
    language: string,
    requestId?: string
  ) {
    super(
      ErrorCode.INCOMPATIBLE_COMBINATION,
      `Invalid combination: ${testingType} + ${framework} + ${language}`,
      { testingType, framework, language, hint: 'Use GET /api/v1/metadata to see compatible options' },
      requestId
    );
  }
}

/**
 * Configuration error with field-level suggestions
 */
export class ConfigurationError extends AppError {
  constructor(
    message: string,
    invalidFields: Array<{ field: string; value: any; suggestion?: string }>,
    requestId?: string,
    cause?: Error
  ) {
    super(
      ErrorCode.CONFIGURATION_ERROR,
      message,
      { invalidFields },
      requestId,
      { cause }
    );
  }
}

/**
 * Timeout error with retry hints
 */
export class TimeoutError extends AppError {
  constructor(
    operation: string,
    timeoutMs: number,
    requestId?: string,
    options?: {
      retryAfter?: number;
      cause?: Error;
    }
  ) {
    super(
      ErrorCode.GENERATION_TIMEOUT,
      `Operation '${operation}' timed out after ${timeoutMs}ms`,
      { operation, timeoutMs },
      requestId,
      {
        retryAfter: options?.retryAfter,
        cause: options?.cause
      }
    );
  }
}

/**
 * Dependency resolution error with alternatives
 */
export class DependencyError extends AppError {
  constructor(
    dependency: string,
    reason: string,
    requestId?: string,
    options?: {
      alternatives?: string[];
      cause?: Error;
    }
  ) {
    super(
      ErrorCode.DEPENDENCY_RESOLUTION_ERROR,
      `Failed to resolve dependency '${dependency}': ${reason}`,
      {
        dependency,
        reason,
        ...(options?.alternatives && { alternatives: options.alternatives })
      },
      requestId,
      { cause: options?.cause }
    );
  }
}

/**
 * Cache operation error
 */
export class CacheError extends AppError {
  constructor(
    operation: string,
    message: string,
    requestId?: string,
    cause?: Error
  ) {
    super(
      ErrorCode.CACHE_ERROR,
      `Cache ${operation} failed: ${message}`,
      { operation },
      requestId,
      { cause }
    );
  }
}

/**
 * External service error
 */
export class ExternalServiceError extends AppError {
  constructor(
    service: string,
    message: string,
    requestId?: string,
    options?: {
      retryAfter?: number;
      cause?: Error;
    }
  ) {
    super(
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      `External service '${service}' error: ${message}`,
      { service },
      requestId,
      {
        retryAfter: options?.retryAfter,
        cause: options?.cause
      }
    );
  }
}

/**
 * Generate a unique request ID
 */
export function generateRequestId(prefix: string = 'req'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Log error with context
 */
export function logError(error: Error | AppError, context?: Record<string, any>): void {
  const isAppError = error instanceof AppError;
  const appError = isAppError ? (error as AppError) : null;

  const logData = {
    timestamp: new Date().toISOString(),
    type: isAppError ? 'AppError' : 'Error',
    code: appError?.code || 'UNKNOWN',
    message: error.message,
    ...(appError?.requestId && { requestId: appError.requestId }),
    ...(appError?.details && { details: appError.details }),
    ...(appError?.retryAfter && { retryAfter: appError.retryAfter }),
    ...(appError?.requestContext && { requestContext: appError.requestContext }),
    ...(appError?.cause && { errorChain: appError.getErrorChain() }),
    ...(context && { context }),
    stack: error.stack
  };

  // Use appropriate log level based on error type
  if (appError && appError.statusCode < 500) {
    console.warn('⚠️ Client Error:', JSON.stringify(logData, null, 2));
  } else {
    console.error('❌ Server Error:', JSON.stringify(logData, null, 2));
  }
}

/**
 * Express error handler middleware
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Don't send response if headers already sent
  if (res.headersSent) {
    return;
  }

  // Handle AppError instances
  if (err instanceof AppError) {
    logError(err, {
      method: req.method,
      path: req.path,
      ip: req.ip
    });

    res.status(err.statusCode).json(err.toJSON());
    return;
  }

  // Handle Zod validation errors
  if (err.name === 'ZodError') {
    const zodError = err as any;
    const validationError = new ValidationError(
      'Validation failed',
      zodError.errors?.map((e: any) => ({
        field: e.path?.join('.') || 'unknown',
        message: e.message
      })) || []
    );

    logError(validationError, {
      method: req.method,
      path: req.path
    });

    res.status(validationError.statusCode).json(validationError.toJSON());
    return;
  }

  // Handle unknown errors
  const unknownError = new AppError(
    ErrorCode.UNKNOWN_ERROR,
    process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : err.message
  );

  logError(err, {
    method: req.method,
    path: req.path,
    originalError: err.message
  });

  res.status(500).json(unknownError.toJSON());
}

/**
 * Async route handler wrapper to catch errors
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Not found handler for undefined routes
 */
export function notFoundHandler(req: Request, res: Response): void {
  const error = new AppError(
    ErrorCode.RESOURCE_NOT_FOUND,
    `Route ${req.method} ${req.path} not found`
  );
  res.status(404).json(error.toJSON());
}
