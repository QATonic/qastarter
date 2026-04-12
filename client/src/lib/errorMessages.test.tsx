/**
 * Unit Tests for Error Messages utility
 */

import { describe, it, expect } from 'vitest';
import { ErrorMessages, ErrorTitles, getErrorMessage, getErrorTitle } from './errorMessages';

describe('ErrorMessages constants', () => {
  it('should have all expected message keys', () => {
    const expectedKeys = [
      'NETWORK_ERROR',
      'TIMEOUT_ERROR',
      'SERVER_ERROR',
      'GENERATION_FAILED',
      'GENERATION_TIMEOUT',
      'DOWNLOAD_FAILED',
      'INVALID_CONFIG',
      'MISSING_REQUIRED',
      'INCOMPATIBLE_OPTIONS',
      'DEPENDENCIES_LOAD_FAILED',
      'DEPENDENCIES_INVALID',
      'STORAGE_FULL',
      'STORAGE_UNAVAILABLE',
      'TEMPLATE_NOT_FOUND',
      'TEMPLATE_INVALID',
      'VALIDATION_FAILED',
      'STEP_INCOMPLETE',
    ];

    expectedKeys.forEach((key) => {
      expect(ErrorMessages).toHaveProperty(key);
      expect(typeof (ErrorMessages as any)[key]).toBe('string');
      expect((ErrorMessages as any)[key].length).toBeGreaterThan(0);
    });
  });
});

describe('ErrorTitles constants', () => {
  it('should have all expected title keys', () => {
    const expectedKeys = [
      'NETWORK',
      'SERVER',
      'GENERATION',
      'CONFIG',
      'DEPENDENCIES',
      'STORAGE',
      'TEMPLATE',
      'VALIDATION',
    ];

    expectedKeys.forEach((key) => {
      expect(ErrorTitles).toHaveProperty(key);
      expect(typeof (ErrorTitles as any)[key]).toBe('string');
      expect((ErrorTitles as any)[key].length).toBeGreaterThan(0);
    });
  });
});

describe('getErrorMessage', () => {
  it('should return network error message for network errors', () => {
    const error = new Error('network error occurred');
    expect(getErrorMessage(error)).toBe(ErrorMessages.NETWORK_ERROR);
  });

  it('should return network error message for fetch errors', () => {
    const error = new Error('fetch failed');
    expect(getErrorMessage(error)).toBe(ErrorMessages.NETWORK_ERROR);
  });

  it('should return timeout error message for timeout errors', () => {
    const error = new Error('request timeout');
    expect(getErrorMessage(error)).toBe(ErrorMessages.TIMEOUT_ERROR);
  });

  it('should return the error message if user-friendly (short and no undefined)', () => {
    const error = new Error('Something went wrong');
    expect(getErrorMessage(error)).toBe('Something went wrong');
  });

  it('should return server error for long messages', () => {
    const error = new Error('A'.repeat(201));
    expect(getErrorMessage(error)).toBe(ErrorMessages.SERVER_ERROR);
  });

  it('should return server error for messages containing undefined', () => {
    const error = new Error('Cannot read property of undefined');
    expect(getErrorMessage(error)).toBe(ErrorMessages.SERVER_ERROR);
  });

  it('should return server error for non-Error objects', () => {
    expect(getErrorMessage('string error')).toBe(ErrorMessages.SERVER_ERROR);
    expect(getErrorMessage(42)).toBe(ErrorMessages.SERVER_ERROR);
    expect(getErrorMessage(null)).toBe(ErrorMessages.SERVER_ERROR);
    expect(getErrorMessage(undefined)).toBe(ErrorMessages.SERVER_ERROR);
  });
});

describe('getErrorTitle', () => {
  it('should return Network title for network errors', () => {
    const error = new Error('network issue');
    expect(getErrorTitle(error)).toBe(ErrorTitles.NETWORK);
  });

  it('should return Network title for fetch errors', () => {
    const error = new Error('fetch failed');
    expect(getErrorTitle(error)).toBe(ErrorTitles.NETWORK);
  });

  it('should return Generation title for generation errors', () => {
    const error = new Error('generation failed');
    expect(getErrorTitle(error)).toBe(ErrorTitles.GENERATION);
  });

  it('should return Generation title for generate errors', () => {
    const error = new Error('failed to generate project');
    expect(getErrorTitle(error)).toBe(ErrorTitles.GENERATION);
  });

  it('should return Validation title for validation errors', () => {
    const error = new Error('validation failed');
    expect(getErrorTitle(error)).toBe(ErrorTitles.VALIDATION);
  });

  it('should return Validation title for invalid errors', () => {
    const error = new Error('invalid configuration');
    expect(getErrorTitle(error)).toBe(ErrorTitles.VALIDATION);
  });

  it('should return Server title as default', () => {
    const error = new Error('something else');
    expect(getErrorTitle(error)).toBe(ErrorTitles.SERVER);
  });

  it('should return Server title for non-Error objects', () => {
    expect(getErrorTitle('string')).toBe(ErrorTitles.SERVER);
    expect(getErrorTitle(null)).toBe(ErrorTitles.SERVER);
  });
});
