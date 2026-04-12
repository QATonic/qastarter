/**
 * API Version Redirect Middleware
 *
 * Provides backward compatibility by rewriting unversioned /api/* paths
 * to their /api/v1/* equivalents. Uses URL rewriting (not HTTP redirects)
 * to transparently handle POST bodies and all HTTP methods.
 *
 * Adds X-API-Deprecated-Path header to signal clients should migrate.
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Map of deprecated paths to their v1 equivalents.
 * Keys are the old unversioned paths (relative to /api mount).
 * Values are the new v1 paths (relative to /api mount).
 */
const DEPRECATED_ROUTES: Record<string, string> = {
  '/health': '/v1/health',
  '/stats': '/v1/stats',
  '/validate-config': '/v1/validate-config',
  '/analytics/events': '/v1/analytics/events',
  '/analytics/stats': '/v1/analytics/stats',
  '/analytics/session': '/v1/analytics/session',
  '/generate-project': '/v1/generate-project',
  '/project-dependencies': '/v1/project-dependencies',
  '/project-preview': '/v1/project-preview',
  '/config/options': '/v1/config/options',
  '/metadata': '/v1/metadata',
};

/**
 * Middleware that intercepts requests to deprecated unversioned API paths
 * and internally rewrites them to their v1 equivalents.
 */
export function apiVersionRedirect(req: Request, res: Response, next: NextFunction): void {
  const newPath = DEPRECATED_ROUTES[req.path];

  if (newPath) {
    // Add deprecation header so clients know to migrate
    res.setHeader('X-API-Deprecated-Path', req.path);
    res.setHeader('X-API-Migration-Note', `This path is deprecated. Use /api${newPath} instead.`);

    logger.debug(`API redirect: ${req.method} /api${req.path} -> /api${newPath}`);

    // Rewrite the URL internally (no HTTP redirect, preserves POST body)
    req.url = newPath;
  }

  next();
}

export default apiVersionRedirect;
