import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '@/types/index.js';
import { logError } from '@/utils/logger.js';

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Create common API errors
 */
export class BadRequestError extends ApiError {
  constructor(message: string = 'Bad Request') {
    super(message, 400);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = 'Not Found') {
    super(message, 404);
  }
}

export class ConflictError extends ApiError {
  constructor(message: string = 'Conflict') {
    super(message, 409);
  }
}

export class TooManyRequestsError extends ApiError {
  constructor(message: string = 'Too Many Requests') {
    super(message, 429);
  }
}

export class InternalServerError extends ApiError {
  constructor(message: string = 'Internal Server Error') {
    super(message, 500);
  }
}

/**
 * Error handling middleware
 */
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const requestId = req.headers['x-request-id'] as string || 'unknown';
  
  // Log the error
  logError(error, {
    requestId,
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent'],
    ip: req.ip
  });

  // Handle known API errors
  if (error instanceof ApiError) {
    const response: ApiResponse = {
      success: false,
      message: error.message,
      timestamp: new Date().toISOString(),
      requestId
    };

    res.status(error.statusCode).json(response);
    return;
  }

  // Handle Joi validation errors
  if (error.name === 'ValidationError') {
    const response: ApiResponse = {
      success: false,
      message: 'Validation failed',
      errors: [{
        field: 'validation',
        message: error.message,
        code: 'validation.failed'
      }],
      timestamp: new Date().toISOString(),
      requestId
    };

    res.status(400).json(response);
    return;
  }

  // Handle multer errors
  if (error.name === 'MulterError') {
    let message = 'File upload error';
    let statusCode = 400;

    switch ((error as any).code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File too large';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field';
        break;
      default:
        message = error.message;
    }

    const response: ApiResponse = {
      success: false,
      message,
      timestamp: new Date().toISOString(),
      requestId
    };

    res.status(statusCode).json(response);
    return;
  }

  // Handle JSON parsing errors
  if (error instanceof SyntaxError && 'body' in error) {
    const response: ApiResponse = {
      success: false,
      message: 'Invalid JSON in request body',
      timestamp: new Date().toISOString(),
      requestId
    };

    res.status(400).json(response);
    return;
  }

  // Default error response
  const response: ApiResponse = {
    success: false,
    message: 'Internal Server Error',
    timestamp: new Date().toISOString(),
    requestId
  };

  res.status(500).json(response);
}

/**
 * Handle 404 errors
 */
export function notFoundHandler(req: Request, res: Response): void {
  const requestId = req.headers['x-request-id'] as string || 'unknown';
  
  const response: ApiResponse = {
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString(),
    requestId
  };

  res.status(404).json(response);
}

/**
 * Async error wrapper
 */
export function asyncHandler<T extends Request, U extends Response>(
  fn: (req: T, res: U, next: NextFunction) => Promise<any>
) {
  return (req: T, res: U, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Create error from message and status code
 */
export function createError(message: string, statusCode: number = 500): ApiError {
  return new ApiError(message, statusCode);
} 