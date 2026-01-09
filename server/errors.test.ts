import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  AppError,
  ValidationError,
  TemplateNotFoundError,
  IncompatibleCombinationError,
  ErrorCode,
  generateRequestId,
  logError,
} from './errors';

describe('AppError', () => {
  it('should create error with default message', () => {
    const error = new AppError(ErrorCode.VALIDATION_ERROR);

    expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe('The request contains invalid data');
    expect(error.timestamp).toBeDefined();
  });

  it('should create error with custom message', () => {
    const error = new AppError(ErrorCode.INTERNAL_ERROR, 'Custom error message');

    expect(error.code).toBe(ErrorCode.INTERNAL_ERROR);
    expect(error.statusCode).toBe(500);
    expect(error.message).toBe('Custom error message');
  });

  it('should include details when provided', () => {
    const details = { field: 'projectName', value: 'invalid' };
    const error = new AppError(ErrorCode.VALIDATION_ERROR, 'Invalid field', details);

    expect(error.details).toEqual(details);
  });

  it('should include requestId when provided', () => {
    const error = new AppError(ErrorCode.INTERNAL_ERROR, 'Error', null, 'req-123');

    expect(error.requestId).toBe('req-123');
  });

  it('should convert to JSON correctly', () => {
    const error = new AppError(
      ErrorCode.VALIDATION_ERROR,
      'Test error',
      { field: 'test' },
      'req-456'
    );

    const json = error.toJSON();

    expect(json.success).toBe(false);
    expect(json.error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(json.error.message).toBe('Test error');
    expect(json.error.details).toEqual({ field: 'test' });
    expect(json.error.requestId).toBe('req-456');
    expect(json.error.timestamp).toBeDefined();
  });

  it('should have correct status codes for all error types', () => {
    expect(new AppError(ErrorCode.VALIDATION_ERROR).statusCode).toBe(400);
    expect(new AppError(ErrorCode.INVALID_CONFIG).statusCode).toBe(400);
    expect(new AppError(ErrorCode.INCOMPATIBLE_COMBINATION).statusCode).toBe(400);
    expect(new AppError(ErrorCode.TEMPLATE_NOT_FOUND).statusCode).toBe(404);
    expect(new AppError(ErrorCode.RESOURCE_NOT_FOUND).statusCode).toBe(404);
    expect(new AppError(ErrorCode.RATE_LIMIT_EXCEEDED).statusCode).toBe(429);
    expect(new AppError(ErrorCode.INTERNAL_ERROR).statusCode).toBe(500);
    expect(new AppError(ErrorCode.TEMPLATE_GENERATION_ERROR).statusCode).toBe(500);
    expect(new AppError(ErrorCode.ARCHIVE_ERROR).statusCode).toBe(500);
  });
});

describe('ValidationError', () => {
  it('should create validation error with field errors', () => {
    const errors = [
      { field: 'projectName', message: 'Required' },
      { field: 'framework', message: 'Invalid value' },
    ];

    const error = new ValidationError('Validation failed', errors);

    expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(error.statusCode).toBe(400);
    expect(error.details?.errors).toEqual(errors);
  });

  it('should include requestId', () => {
    const error = new ValidationError('Error', [], 'req-789');

    expect(error.requestId).toBe('req-789');
  });
});

describe('TemplateNotFoundError', () => {
  it('should create template not found error with context', () => {
    const error = new TemplateNotFoundError('web', 'selenium', 'java');

    expect(error.code).toBe(ErrorCode.TEMPLATE_NOT_FOUND);
    expect(error.statusCode).toBe(404);
    expect(error.message).toContain('web');
    expect(error.message).toContain('selenium');
    expect(error.message).toContain('java');
    expect(error.details).toEqual({
      testingType: 'web',
      framework: 'selenium',
      language: 'java',
    });
  });
});

describe('IncompatibleCombinationError', () => {
  it('should create incompatible combination error with hint', () => {
    const error = new IncompatibleCombinationError('web', 'cypress', 'java');

    expect(error.code).toBe(ErrorCode.INCOMPATIBLE_COMBINATION);
    expect(error.statusCode).toBe(400);
    expect(error.details?.hint).toContain('/api/v1/metadata');
  });
});

describe('generateRequestId', () => {
  it('should generate unique request IDs', () => {
    const id1 = generateRequestId();
    const id2 = generateRequestId();

    expect(id1).not.toBe(id2);
  });

  it('should use custom prefix', () => {
    const id = generateRequestId('gen');

    expect(id).toMatch(/^gen-\d+-[a-z0-9]+$/);
  });

  it('should use default prefix', () => {
    const id = generateRequestId();

    expect(id).toMatch(/^req-\d+-[a-z0-9]+$/);
  });
});

describe('logError', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should log client errors with warn', () => {
    const error = new AppError(ErrorCode.VALIDATION_ERROR);

    logError(error);

    expect(console.warn).toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
  });

  it('should log server errors with error', () => {
    const error = new AppError(ErrorCode.INTERNAL_ERROR);

    logError(error);

    expect(console.error).toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('should log unknown errors with error', () => {
    const error = new Error('Unknown error');

    logError(error);

    expect(console.error).toHaveBeenCalled();
  });

  it('should include context in log', () => {
    const error = new AppError(ErrorCode.INTERNAL_ERROR);
    const context = { method: 'POST', path: '/api/test' };

    logError(error, context);

    expect(console.error).toHaveBeenCalledWith(expect.any(String), expect.stringContaining('POST'));
  });
});

describe('Error JSON Response Format', () => {
  it('should have consistent response structure', () => {
    const error = new AppError(ErrorCode.VALIDATION_ERROR, 'Test');
    const json = error.toJSON();

    // Required fields
    expect(json).toHaveProperty('success', false);
    expect(json).toHaveProperty('error');
    expect(json.error).toHaveProperty('code');
    expect(json.error).toHaveProperty('message');
    expect(json.error).toHaveProperty('timestamp');
  });

  it('should omit undefined optional fields', () => {
    const error = new AppError(ErrorCode.VALIDATION_ERROR);
    const json = error.toJSON();

    expect(json.error).not.toHaveProperty('details');
    expect(json.error).not.toHaveProperty('requestId');
  });
});
