/**
 * Cache Service for QAStarter
 *
 * Provides in-memory caching for template manifests and compiled Handlebars templates
 * to improve performance by reducing disk reads and compilation overhead.
 */

import NodeCache from 'node-cache';

// Configuration
const CACHE_TTL = process.env.NODE_ENV === 'production' ? 3600 : 60; // 1 hour in prod, 1 min in dev
const CHECK_PERIOD = 120; // Check for expired keys every 2 minutes

// Create cache instances
// Note: useClones=true prevents callers from accidentally mutating cached objects
// Trade-off: ~10-20% performance overhead but safer for data integrity
const manifestCache = new NodeCache({
  stdTTL: CACHE_TTL,
  checkperiod: CHECK_PERIOD,
  useClones: true, // Safer - prevents mutation of cached objects
});

const templateCache = new NodeCache({
  stdTTL: CACHE_TTL,
  checkperiod: CHECK_PERIOD,
  useClones: true,
});

const metadataCache = new NodeCache({
  stdTTL: CACHE_TTL * 2, // Metadata can be cached longer
  checkperiod: CHECK_PERIOD,
  useClones: true,
});

// Cache statistics
interface CacheStats {
  manifests: { hits: number; misses: number; keys: number };
  templates: { hits: number; misses: number; keys: number };
  metadata: { hits: number; misses: number; keys: number };
}

/**
 * Get a cached manifest by pack name
 */
export function getCachedManifest<T>(packName: string): T | undefined {
  return manifestCache.get<T>(packName);
}

/**
 * Set a manifest in cache
 */
export function setCachedManifest<T>(packName: string, manifest: T): boolean {
  return manifestCache.set(packName, manifest);
}

/**
 * Get a cached compiled template function
 */
export function getCachedTemplate<T>(templateKey: string): T | undefined {
  return templateCache.get<T>(templateKey);
}

/**
 * Set a compiled template in cache
 */
export function setCachedTemplate<T>(templateKey: string, template: T): boolean {
  return templateCache.set(templateKey, template);
}

/**
 * Get cached metadata (validation matrix, labels, etc.)
 */
export function getCachedMetadata<T>(key: string): T | undefined {
  return metadataCache.get<T>(key);
}

/**
 * Set metadata in cache
 */
export function setCachedMetadata<T>(key: string, data: T): boolean {
  return metadataCache.set(key, data);
}

/**
 * Clear all caches (useful for development hot-reload)
 */
export function clearAllCaches(): void {
  manifestCache.flushAll();
  templateCache.flushAll();
  metadataCache.flushAll();
  console.log('[CacheService] All caches cleared');
}

/**
 * Clear specific cache
 */
export function clearCache(type: 'manifests' | 'templates' | 'metadata'): void {
  switch (type) {
    case 'manifests':
      manifestCache.flushAll();
      break;
    case 'templates':
      templateCache.flushAll();
      break;
    case 'metadata':
      metadataCache.flushAll();
      break;
  }
  console.log(`[CacheService] ${type} cache cleared`);
}

/**
 * Get cache statistics
 */
export function getCacheStats(): CacheStats {
  const manifestStats = manifestCache.getStats();
  const templateStats = templateCache.getStats();
  const metadataStats = metadataCache.getStats();

  return {
    manifests: {
      hits: manifestStats.hits,
      misses: manifestStats.misses,
      keys: manifestCache.keys().length,
    },
    templates: {
      hits: templateStats.hits,
      misses: templateStats.misses,
      keys: templateCache.keys().length,
    },
    metadata: {
      hits: metadataStats.hits,
      misses: metadataStats.misses,
      keys: metadataCache.keys().length,
    },
  };
}

/**
 * Check if cache is enabled (disabled in development for hot-reload)
 */
export function isCacheEnabled(): boolean {
  return process.env.DISABLE_CACHE !== 'true';
}

/**
 * Wrapper function for caching any async operation
 */
export async function withCache<T>(
  cacheType: 'manifests' | 'templates' | 'metadata',
  key: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  if (!isCacheEnabled()) {
    return fetchFn();
  }

  let cached: T | undefined;

  switch (cacheType) {
    case 'manifests':
      cached = getCachedManifest<T>(key);
      break;
    case 'templates':
      cached = getCachedTemplate<T>(key);
      break;
    case 'metadata':
      cached = getCachedMetadata<T>(key);
      break;
  }

  if (cached !== undefined) {
    return cached;
  }

  const data = await fetchFn();

  switch (cacheType) {
    case 'manifests':
      setCachedManifest(key, data);
      break;
    case 'templates':
      setCachedTemplate(key, data);
      break;
    case 'metadata':
      setCachedMetadata(key, data);
      break;
  }

  return data;
}

// Export cache instances for advanced usage
export const caches = {
  manifests: manifestCache,
  templates: templateCache,
  metadata: metadataCache,
};
