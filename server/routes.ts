/**
 * Main Routes Configuration
 *
 * Routes are organized into modular files for better maintainability:
 * - healthRoutes: Health check endpoints
 * - analyticsRoutes: Usage analytics endpoints
 * - configRoutes: Configuration and metadata endpoints
 * - projectRoutes: Project generation endpoints
 */

import type { Express } from 'express';
import { createServer, type Server } from 'http';
import rateLimit from 'express-rate-limit';
import { rateLimitConfig } from './config';
import { ErrorCode } from './errors';
import RedisStore from 'rate-limit-redis';
import { getCache } from './services/cache';
import { RedisCacheProvider } from './services/cache/redisCacheProvider';

// Import route modules
import { healthRoutes, analyticsRoutes, configRoutes, projectRoutes } from './routes/index';

// Rate limiting configuration (using centralized config)
// We use a factory function or delay initialization to ensure cache is ready
// Rate limiting configuration (using centralized config)
// We use a factory function or delay initialization to ensure cache is ready
const createApiLimiter = async () => {
  const cache = getCache();
  let store;

  // Use Redis store if available
  if (cache instanceof RedisCacheProvider && (await cache.isHealthy())) {
    const client = cache.getClient();
    if (client) {
      store = new RedisStore({
        sendCommand: (...args: string[]) => client.sendCommand(args),
      });
    }
  }

  return rateLimit({
    windowMs: rateLimitConfig.api.windowMs,
    max: rateLimitConfig.api.max,
    message: {
      success: false,
      error: {
        code: ErrorCode.RATE_LIMIT_EXCEEDED,
        message: 'Too many requests from this IP, please try again later.',
        timestamp: new Date().toISOString(),
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: store, // Will fall back to memory store if undefined
  });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply rate limiting to all API routes
  // Initialize limiter inside registerRoutes to ensure cache is initialized
  app.use('/api/', await createApiLimiter());

  // Register route modules
  app.use('/api', healthRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api', configRoutes);
  app.use('/api', projectRoutes);

  const httpServer = createServer(app);
  return httpServer;
}

// Validation is now handled by WizardValidator from the validation matrix
