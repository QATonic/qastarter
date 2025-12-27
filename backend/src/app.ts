import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';
import { config } from '@/utils/config.js';
import { logger, morganStream } from '@/utils/logger.js';
import { errorHandler, notFoundHandler } from '@/middleware/errorHandler.js';
import { ApiResponse } from '@/types/index.js';

/**
 * Create Express application
 */
export async function createApp(): Promise<express.Application> {
  const app = express();

  // Trust proxy if configured
  if (config.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  // Security middleware
  app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }));

  // CORS configuration
  app.use(cors({
    origin: config.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    max: config.RATE_LIMIT_MAX_REQUESTS,
    message: {
      success: false,
      message: 'Too many requests, please try again later',
      timestamp: new Date().toISOString(),
      requestId: 'unknown'
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request ID middleware
  app.use((req, res, next) => {
    req.headers['x-request-id'] = req.headers['x-request-id'] || uuidv4();
    res.setHeader('X-Request-ID', req.headers['x-request-id']);
    next();
  });

  // Logging middleware
  if (config.NODE_ENV === 'development') {
    try {
      const morgan = await import('morgan');
      app.use(morgan.default('combined', { stream: morganStream }));
    } catch (error) {
      logger.warn('Morgan not available, skipping HTTP logging');
    }
  }

  // Health check endpoint
  app.get('/health', (req, res) => {
    const response: ApiResponse = {
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.NODE_ENV,
        version: process.env.npm_package_version || '1.0.0'
      },
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string
    };
    res.json(response);
  });

  // API routes
  app.use('/api/v1/config', async (req, res, next): Promise<void> => {
    try {
      // Placeholder for config routes
      const { wizardOptions, filterRules } = await import('@/data/wizardOptions.js');
      
      if (req.path === '/options' && req.method === 'GET') {
        const response: ApiResponse = {
          success: true,
          data: wizardOptions,
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string
        };
        res.json(response);
        return;
      }
      
      if (req.path === '/filters' && req.method === 'GET') {
        const response: ApiResponse = {
          success: true,
          data: filterRules,
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string
        };
        res.json(response);
        return;
      }
      
      next();
    } catch (error) {
      next(error);
    }
  });

  // Project routes
  const { projectController } = await import('@/controllers/projectController.js');
  const { validateProjectGeneration } = await import('@/middleware/validation.js');
  
  app.post('/api/v1/projects/generate', validateProjectGeneration, projectController.generateProject.bind(projectController));
  app.get('/api/v1/projects/:projectId/status', projectController.getProjectStatus.bind(projectController));
  app.get('/api/v1/projects/:projectId/download', projectController.downloadProject.bind(projectController));
  app.get('/api/v1/projects/:projectId/files', projectController.getProjectFiles.bind(projectController));
  app.delete('/api/v1/projects/:projectId', projectController.deleteProject.bind(projectController));
  app.get('/api/v1/projects', projectController.getAllProjects.bind(projectController));

  // 404 handler
  app.use(notFoundHandler);

  // Error handling middleware (must be last)
  app.use(errorHandler);

  return app;
}

/**
 * Start the server
 */
export async function startServer(): Promise<void> {
  try {
    const app = await createApp();
    
    const server = app.listen(config.PORT, config.HOST, () => {
      logger.info(`Server started on ${config.HOST}:${config.PORT}`, {
        environment: config.NODE_ENV,
        pid: process.pid
      });
    });

    // Graceful shutdown
    const gracefulShutdown = (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully`);
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server', { error: (error as Error).message });
    process.exit(1);
  }
} 