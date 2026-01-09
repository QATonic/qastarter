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

// Import route modules
import { healthRoutes, analyticsRoutes, configRoutes, projectRoutes } from './routes/index';

// Rate limiting configuration (using centralized config)
const apiLimiter = rateLimit({
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
  app.use('/api/', apiLimiter);

  // Register route modules
  app.use('/api', healthRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api', configRoutes);
  app.use('/api', projectRoutes);

  const httpServer = createServer(app);
  return httpServer;
}

// Validation is now handled by WizardValidator from the validation matrix
