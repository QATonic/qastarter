import dotenv from 'dotenv';
import path from 'path';
import { EnvConfig } from '@/types/index.js';

// Load environment variables
dotenv.config();

/**
 * Parse and validate environment configuration
 */
export const config: EnvConfig = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '8000', 10),
  HOST: process.env.HOST || 'localhost',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  TEMP_DIR: path.resolve(process.env.TEMP_DIR || './temp'),
  GENERATED_DIR: path.resolve(process.env.GENERATED_DIR || './generated'),
  TEMPLATES_DIR: path.resolve(process.env.TEMPLATES_DIR || './templates'),
  MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || '100MB',
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_FORMAT: process.env.LOG_FORMAT || 'combined',
  PROJECT_EXPIRY_HOURS: parseInt(process.env.PROJECT_EXPIRY_HOURS || '24', 10),
};

/**
 * Validate required configuration values
 */
export function validateConfig(): void {
  const requiredFields: (keyof EnvConfig)[] = [
    'NODE_ENV',
    'PORT',
    'HOST',
    'CORS_ORIGIN',
    'TEMP_DIR',
    'GENERATED_DIR',
    'TEMPLATES_DIR'
  ];

  const missingFields = requiredFields.filter(field => !config[field]);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required configuration: ${missingFields.join(', ')}`);
  }

  // Validate port range
  if (config.PORT < 1 || config.PORT > 65535) {
    throw new Error('PORT must be between 1 and 65535');
  }

  // Validate rate limiting
  if (config.RATE_LIMIT_WINDOW_MS < 1000) {
    throw new Error('RATE_LIMIT_WINDOW_MS must be at least 1000ms');
  }

  if (config.RATE_LIMIT_MAX_REQUESTS < 1) {
    throw new Error('RATE_LIMIT_MAX_REQUESTS must be at least 1');
  }

  // Validate project expiry
  if (config.PROJECT_EXPIRY_HOURS < 1) {
    throw new Error('PROJECT_EXPIRY_HOURS must be at least 1 hour');
  }
}

/**
 * Check if running in development mode
 */
export const isDevelopment = (): boolean => config.NODE_ENV === 'development';

/**
 * Check if running in production mode
 */
export const isProduction = (): boolean => config.NODE_ENV === 'production';

/**
 * Check if running in test mode
 */
export const isTest = (): boolean => config.NODE_ENV === 'test'; 