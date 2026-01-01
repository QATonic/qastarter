import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { errorHandler, notFoundHandler } from "./errors";

const app = express();

// Detect development mode - check multiple conditions
const isDevelopment = process.env.NODE_ENV !== 'production';

// process.env.NODE_ENV !== 'production';
import fs from 'fs';
import path from 'path';

// DEBUG: Check template files existence on startup
try {
  const checkPath = path.join(__dirname, 'templates/packs/web-java-selenium-testng-maven/files');
  console.log(`[Startup Debug] Checking templates at: ${checkPath}`);
  if (fs.existsSync(checkPath)) {
    const files = fs.readdirSync(checkPath, { recursive: true });
    console.log(`[Startup Debug] Found ${files.length} files/dirs in template pack:`, files);
  } else {
    console.error(`[Startup Debug] Template pack path does not exist: ${checkPath}`);
  }
} catch (e) {
  console.error(`[Startup Debug] Error checking templates:`, e);
}

// In development, disable helmet CSP entirely to avoid issues with Vite HMR
if (isDevelopment) {
  // Minimal security headers for development
  app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP in development for Vite HMR
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
  }));
} else {
  // Full security headers for production
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://replit.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"], // Some Radix UI components need inline styles
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://replit.com"],
        fontSrc: ["'self'", "data:", "https://fonts.gstatic.com", "https://fonts.googleapis.com"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }));
}

// CORS Configuration - permissive in development
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }

    // In development, allow all origins
    if (isDevelopment) {
      return callback(null, true);
    }

    // Production: Check against allowed origins
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
    const allowedPatterns = [
      /^https:\/\/.*\.easypanel\.host$/,
      /^https:\/\/.*\.qatonic\.com$/
    ];

    // Check if origin matches any pattern
    const isAllowed = allowedOrigins.includes(origin) ||
      allowedPatterns.some(pattern => pattern.test(origin));

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Request Timeout Middleware - Prevents slow loris attacks
// Different timeouts for different operations
const REQUEST_TIMEOUT_MS = 30000; // 30 seconds for regular API
const GENERATION_TIMEOUT_MS = 60000; // 60 seconds for project generation

app.use((req, res, next) => {
  // Skip timeout for streaming responses and project generation
  if (req.path === '/api/generate-project') {
    req.setTimeout(GENERATION_TIMEOUT_MS);
    res.setTimeout(GENERATION_TIMEOUT_MS);
  } else {
    req.setTimeout(REQUEST_TIMEOUT_MS);
    res.setTimeout(REQUEST_TIMEOUT_MS);
  }

  // Handle timeout
  req.on('timeout', () => {
    if (!res.headersSent) {
      res.status(408).json({
        success: false,
        error: {
          code: 'REQUEST_TIMEOUT',
          message: 'Request timeout - the operation took too long',
          timestamp: new Date().toISOString()
        }
      });
    }
  });

  next();
});

// Response Compression (gzip/deflate with optimized settings)
// Level 9 provides maximum compression for smaller payloads
app.use(compression({
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
  level: 9, // Maximum compression for smallest payload size
  threshold: 512, // Compress responses larger than 512 bytes
  memLevel: 8, // Use more memory for better compression
}));

// Request body parsing with size limits
app.use(express.json({ limit: '10mb' })); // Limit JSON payload size
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

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
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();
