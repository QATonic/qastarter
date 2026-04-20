import express, { type Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import { execFile } from 'child_process';
import { registerRoutes } from './routes';
import { setupVite, serveStatic, log } from './vite';
import { errorHandler, notFoundHandler } from './errors';
import { correlationMiddleware } from './middleware/correlationMiddleware';
import { setupSwagger } from './swagger';
import { logger } from './utils/logger';

const app = express();

// Trust the N upstream proxies we sit behind (load balancer / CDN / reverse proxy).
// With this set, `req.ip` and the rate-limiter use the real client IP from the
// rightmost trusted X-Forwarded-For hop instead of whatever the last proxy's IP is.
// Default `1` is the common case (one proxy in front). For multi-hop (e.g. CDN -> LB -> app)
// bump via env. Never set to `true` / `unlimited` — that lets any caller spoof their IP.
const trustProxyHops = parseInt(process.env.TRUST_PROXY_HOPS || '1', 10);
app.set('trust proxy', trustProxyHops);

// Detect development mode - check multiple conditions
const isDevelopment = process.env.NODE_ENV !== 'production';

// process.env.NODE_ENV !== 'production';

// In development, disable helmet CSP entirely to avoid issues with Vite HMR
if (isDevelopment) {
  // Minimal security headers for development
  app.use(
    helmet({
      contentSecurityPolicy: false, // Disable CSP in development for Vite HMR
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: false,
    })
  );
} else {
  // Full security headers for production
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", 'https://replit.com'],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'], // Some Radix UI components need inline styles
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", 'https://replit.com'],
          fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com', 'https://fonts.googleapis.com'],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'self'", 'https://www.youtube.com', 'https://www.youtube-nocookie.com'],
          frameAncestors: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );
}

// CORS Configuration - permissive in development, strict in production.
//
// The null-origin case (mobile apps, Postman, server-to-server calls) is only
// allowed in development. In production, combined with `credentials: true`,
// permitting null-origin would let any site drive CSRF-like requests that carry
// our session cookie. Set CORS_ALLOW_NO_ORIGIN=true to re-enable for legitimate
// machine-to-machine integrations that can't send an Origin header.
//
// IMPORTANT: CORS is scoped to `/api` only. Top-level browser navigations to
// the SPA (`GET /`, `/mcp`, `/docs`, `/assets/*.js`, `/favicon.ico`, etc.) do
// NOT carry an Origin header and must not be blocked by CORS — doing so breaks
// every bookmark / direct address-bar visit. CORS is a cross-origin API
// concern, not a static-file concern.
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowNoOrigin =
      isDevelopment || process.env.CORS_ALLOW_NO_ORIGIN === 'true';
    if (!origin) {
      if (allowNoOrigin) return callback(null, true);
      return callback(new Error('Origin header is required in production'));
    }

    // In development, allow all origins
    if (isDevelopment) {
      return callback(null, true);
    }

    // Production: Check against allowed origins
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
    const allowedPatterns = [/^https:\/\/.*\.easypanel\.host$/, /^https:\/\/.*\.qatonic\.com$/];

    // Check if origin matches any pattern
    const isAllowed =
      allowedOrigins.includes(origin) || allowedPatterns.some((pattern) => pattern.test(origin));

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use('/api', cors(corsOptions));

// Correlation ID middleware - adds request/correlation IDs for tracing
// Must be early in the middleware chain for all subsequent logs to include IDs
app.use(correlationMiddleware);

// Request Timeout Middleware - Prevents slow loris attacks
// Different timeouts for different operations
const REQUEST_TIMEOUT_MS = 30000; // 30 seconds for regular API
const GENERATION_TIMEOUT_MS = 60000; // 60 seconds for project generation

app.use((req, res, next) => {
  // Skip timeout for streaming responses and project generation
  if (req.path.includes('generate-project')) {
    req.setTimeout(GENERATION_TIMEOUT_MS);
    res.setTimeout(GENERATION_TIMEOUT_MS);
  } else {
    req.setTimeout(REQUEST_TIMEOUT_MS);
    res.setTimeout(REQUEST_TIMEOUT_MS);
  }

  // Handle timeout - including streaming responses
  req.on('timeout', () => {
    log(`Request timeout on ${req.method} ${req.path}`);
    if (!res.headersSent) {
      res.status(408).json({
        success: false,
        error: {
          code: 'REQUEST_TIMEOUT',
          message: 'Request timeout - the operation took too long',
          timestamp: new Date().toISOString(),
        },
      });
    } else if (!res.writableEnded) {
      // If streaming, destroy the response to signal client
      log(`Destroying streaming response due to timeout on ${req.path}`);
      res.destroy(new Error('Request timeout during streaming'));
    }
  });

  next();
});

// Response Compression (gzip/deflate with optimized settings)
// Level 6 provides the optimal compression/CPU tradeoff
app.use(
  compression({
    filter: (req, res) => {
      // Don't compress if client doesn't want it
      if (req.headers['x-no-compression']) {
        return false;
      }
      // Don't compress streaming responses
      if (req.path === '/api/generate-project') {
        return false; // ZIP files are already compressed
      }
      return compression.filter(req, res);
    },
    level: 6, // Optimal compression/CPU tradeoff
    threshold: 512, // Compress responses larger than 512 bytes
  })
);

// Request body parsing with size limits
app.use(express.json({ limit: '10mb' })); // Limit JSON payload size
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Verify template packs integrity on startup
if (process.env.NODE_ENV !== 'production') {
  execFile(
    'npx', ['tsx', 'server/scripts/verify-packs.ts'],
    (error: Error | null, stdout: string, stderr: string) => {
      if (error) {
        logger.warn('Template Pack Verification failed', { error: error.message });
        return;
      }
      logger.info('Template Pack Verification complete', { output: stdout.trim() });
    }
  );
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on('finish', () => {
    const duration = Date.now() - start;
    if (path.startsWith('/api')) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + '…';
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Setup Swagger API documentation
  setupSwagger(app);

  // API 404 handler - must be before Vite/static serving
  app.use('/api/*', notFoundHandler);

  // Centralized error handler
  app.use(errorHandler);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (isDevelopment) {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen(port, '0.0.0.0', () => {
    log(`serving on port ${port}`);
  });

  // Graceful shutdown — close the HTTP server so the process exits cleanly on SIGTERM
  const shutdown = (signal: string) => {
    log(`${signal} received, shutting down...`);
    server.close(() => {
      log('HTTP server closed');
      process.exit(0);
    });
    // Force exit after 10s if connections don't drain
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
})();
