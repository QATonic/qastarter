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
import { rateLimitConfig } from './config';
import { ErrorCode } from './errors';
import { initializeCache } from './services/cache';
import { sharedRateLimit } from './middleware/sharedRateLimit';

// Import route modules
import {
  healthRoutes,
  analyticsRoutes,
  configRoutes,
  projectRoutes,
  dependencyRoutes,
  githubRoutes,
} from './routes/index';
import { apiVersionRedirect } from './middleware/apiVersionRedirect';

// Initialized once at startup; each route group has its own counter namespace.
const createApiLimiter = () =>
  sharedRateLimit('api', {
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
  });

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply rate limiting to all API routes
  // Initialize limiter inside registerRoutes to ensure cache is initialized
  await initializeCache();
  app.use('/api/', createApiLimiter());

  // Backward compatibility: rewrite deprecated unversioned paths to /v1/
  app.use('/api', apiVersionRedirect);

  // Register route modules (all routes now use /v1/ prefix)
  app.use('/api', healthRoutes);
  app.use('/api', analyticsRoutes);
  app.use('/api', configRoutes);
  app.use('/api', projectRoutes);
  app.use('/api', dependencyRoutes);
  app.use('/api', githubRoutes);

  const httpServer = createServer(app);
  return httpServer;
}

// Validation is now handled by WizardValidator from the validation matrix
