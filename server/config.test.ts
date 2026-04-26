/**
 * Unit Tests for Server Configuration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Store original env
const originalEnv = { ...process.env };

describe('Server Configuration', () => {
  afterEach(() => {
    // Restore original env
    process.env = { ...originalEnv };
    // Reset module cache so config re-reads env vars
    vi.resetModules();
  });

  async function loadConfig() {
    return await import('./config');
  }

  describe('rateLimitConfig', () => {
    it('should use default API rate limit values', async () => {
      delete process.env.RATE_LIMIT_WINDOW_MS;
      delete process.env.RATE_LIMIT_MAX;
      const { rateLimitConfig } = await loadConfig();

      expect(rateLimitConfig.api.windowMs).toBe(900000); // 15 minutes
      expect(rateLimitConfig.api.max).toBe(100);
    });

    it('should override API rate limit from env vars', async () => {
      process.env.RATE_LIMIT_WINDOW_MS = '60000';
      process.env.RATE_LIMIT_MAX = '50';
      const { rateLimitConfig } = await loadConfig();

      expect(rateLimitConfig.api.windowMs).toBe(60000);
      expect(rateLimitConfig.api.max).toBe(50);
    });

    it('should use default generation rate limit values', async () => {
      delete process.env.RATE_LIMIT_GENERATE_MAX;
      const { rateLimitConfig } = await loadConfig();

      expect(rateLimitConfig.generation.max).toBe(10);
    });

    it('should override generation rate limit from env vars', async () => {
      process.env.RATE_LIMIT_GENERATE_MAX = '5';
      const { rateLimitConfig } = await loadConfig();

      expect(rateLimitConfig.generation.max).toBe(5);
    });
  });

  describe('serverConfig', () => {
    it('should use default port 5000', async () => {
      delete process.env.PORT;
      const { serverConfig } = await loadConfig();

      expect(serverConfig.port).toBe(5000);
    });

    it('should override port from env var', async () => {
      process.env.PORT = '3000';
      const { serverConfig } = await loadConfig();

      expect(serverConfig.port).toBe(3000);
    });

    it('should default to development environment', async () => {
      delete process.env.NODE_ENV;
      const { serverConfig } = await loadConfig();

      expect(serverConfig.env).toBe('development');
      expect(serverConfig.isProduction).toBe(false);
      expect(serverConfig.isDevelopment).toBe(true);
    });

    it('should detect production environment', async () => {
      process.env.NODE_ENV = 'production';
      const { serverConfig } = await loadConfig();

      expect(serverConfig.isProduction).toBe(true);
      expect(serverConfig.isDevelopment).toBe(false);
    });
  });

  describe('cacheConfig', () => {
    it('should be enabled by default', async () => {
      delete process.env.DISABLE_CACHE;
      const { cacheConfig } = await loadConfig();

      expect(cacheConfig.enabled).toBe(true);
    });

    it('should be disabled when DISABLE_CACHE=true', async () => {
      process.env.DISABLE_CACHE = 'true';
      const { cacheConfig } = await loadConfig();

      expect(cacheConfig.enabled).toBe(false);
    });

    it('should have default TTL values', async () => {
      const { cacheConfig } = await loadConfig();

      expect(cacheConfig.ttl.manifests).toBe(3600);
      expect(cacheConfig.ttl.templates).toBe(3600);
      expect(cacheConfig.ttl.metadata).toBe(7200);
    });
  });

  describe('logConfig', () => {
    it('should use debug level in development', async () => {
      delete process.env.NODE_ENV;
      delete process.env.LOG_LEVEL;
      const { logConfig } = await loadConfig();

      expect(logConfig.level).toBe('debug');
    });

    it('should use info level in production', async () => {
      process.env.NODE_ENV = 'production';
      delete process.env.LOG_LEVEL;
      const { logConfig } = await loadConfig();

      expect(logConfig.level).toBe('info');
    });

    it('should override log level from env var', async () => {
      process.env.LOG_LEVEL = 'warn';
      const { logConfig } = await loadConfig();

      expect(logConfig.level).toBe('warn');
    });

    it('should enable console logging in development', async () => {
      delete process.env.NODE_ENV;
      delete process.env.LOG_CONSOLE;
      const { logConfig } = await loadConfig();

      expect(logConfig.console).toBe(true);
    });

    it('should enable file logging in production', async () => {
      process.env.NODE_ENV = 'production';
      delete process.env.LOG_FILE;
      const { logConfig } = await loadConfig();

      expect(logConfig.file).toBe(true);
    });
  });

  describe('generationConfig', () => {
    it('should have sensible defaults', async () => {
      const { generationConfig } = await loadConfig();

      expect(generationConfig.maxProjectNameLength).toBe(100);
      expect(generationConfig.defaultProjectName).toBe('my-qa-project');
      expect(generationConfig.compressionLevel).toBe(9);
      expect(generationConfig.maxFileSizeKB).toBe(10240);
    });
  });

  describe('timeoutConfig', () => {
    it('should have default timeout values', async () => {
      delete process.env.REQUEST_TIMEOUT_MS;
      delete process.env.GENERATION_TIMEOUT_MS;
      const { timeoutConfig } = await loadConfig();

      expect(timeoutConfig.api).toBe(30000);
      expect(timeoutConfig.generation).toBe(60000);
    });

    it('should override from env vars', async () => {
      process.env.REQUEST_TIMEOUT_MS = '10000';
      process.env.GENERATION_TIMEOUT_MS = '120000';
      const { timeoutConfig } = await loadConfig();

      expect(timeoutConfig.api).toBe(10000);
      expect(timeoutConfig.generation).toBe(120000);
    });
  });

  describe('apiConfig', () => {
    it('should have correct paths', async () => {
      const { apiConfig } = await loadConfig();

      expect(apiConfig.version).toBe('1.0.0');
      expect(apiConfig.basePath).toBe('/api');
      expect(apiConfig.v1BasePath).toBe('/api/v1');
    });
  });
});
