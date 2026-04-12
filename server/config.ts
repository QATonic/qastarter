/**
 * Server Configuration
 *
 * Centralized configuration for all server settings.
 * Values can be overridden via environment variables.
 */

// Rate Limiting Configuration
export const rateLimitConfig = {
  // General API rate limiting
  api: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10), // Max requests per window
  },
  // Project generation rate limiting (stricter)
  generation: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_GENERATE_MAX || '10', 10), // Max generations per window
  },
};

// Server Configuration
export const serverConfig = {
  port: parseInt(process.env.PORT || '5000', 10),
  env: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV !== 'production',
};

// Cache Configuration
export const cacheConfig = {
  enabled: process.env.DISABLE_CACHE !== 'true',
  ttl: {
    manifests: parseInt(process.env.CACHE_TTL_MANIFESTS || '3600', 10), // 1 hour
    templates: parseInt(process.env.CACHE_TTL_TEMPLATES || '3600', 10), // 1 hour
    metadata: parseInt(process.env.CACHE_TTL_METADATA || '7200', 10), // 2 hours
  },
};

// Logging Configuration
export const logConfig = {
  level: process.env.LOG_LEVEL || (serverConfig.isProduction ? 'info' : 'debug'),
  console: process.env.LOG_CONSOLE === 'true' || serverConfig.isDevelopment,
  file: process.env.LOG_FILE === 'true' || serverConfig.isProduction,
};

// Project Generation Configuration
export const generationConfig = {
  /** Maximum characters allowed in project name (filesystem limit consideration) */
  maxProjectNameLength: 100,
  /** Default project name when none is specified */
  defaultProjectName: 'my-qa-project',
  /** ZIP compression level (0=none, 9=max). Higher = smaller files but slower generation */
  compressionLevel: 9,
  /** Maximum generated project size in KB. Prevents abuse/DoS attacks */
  maxFileSizeKB: 10240, // 10MB
};

// Request Timeout Configuration
export const timeoutConfig = {
  api: parseInt(process.env.REQUEST_TIMEOUT_MS || '30000', 10), // 30 seconds
  generation: parseInt(process.env.GENERATION_TIMEOUT_MS || '60000', 10), // 60 seconds
};

// API Configuration
export const apiConfig = {
  version: '1.0.0',
  basePath: '/api',
  v1BasePath: '/api/v1',
};

// Export all configs
export default {
  rateLimit: rateLimitConfig,
  server: serverConfig,
  cache: cacheConfig,
  log: logConfig,
  generation: generationConfig,
  timeout: timeoutConfig,
  api: apiConfig,
};
