/**
 * Cache Factory and Manager
 *
 * Provides a singleton cache provider instance based on configuration.
 * Automatically selects Redis in production (if REDIS_URL is set)
 * or falls back to in-memory caching.
 */

import { CacheProvider, CacheConfig, getDefaultCacheConfig } from './cacheProvider';
import { MemoryCacheProvider } from './memoryCacheProvider';
import { RedisCacheProvider } from './redisCacheProvider';
import { logger } from '../../utils/logger';

let cacheProvider: CacheProvider | null = null;
let initPromise: Promise<CacheProvider> | null = null;

/**
 * Initialize and get the cache provider
 * Uses Redis in production if REDIS_URL is set, otherwise uses memory cache
 */
export async function initializeCache(config?: Partial<CacheConfig>): Promise<CacheProvider> {
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    const fullConfig: CacheConfig = {
      ...getDefaultCacheConfig(),
      ...config,
    };

    // Use Redis if URL is provided and we're in production
    if (fullConfig.redisUrl && process.env.NODE_ENV === 'production') {
      logger.info('Initializing Redis cache provider');
      const redis = new RedisCacheProvider(fullConfig);

      try {
        await redis.connect();
        cacheProvider = redis;
        logger.info('Redis cache provider ready');
      } catch (error) {
        logger.warn('Redis initialization failed, falling back to memory cache', {
          error: error instanceof Error ? error.message : String(error),
        });
        // Fallback to memory cache on Redis failure
        cacheProvider = new MemoryCacheProvider(fullConfig);
      }
    } else {
      logger.info('Initializing in-memory cache provider');
      cacheProvider = new MemoryCacheProvider(fullConfig);
    }

    return cacheProvider;
  })();

  return initPromise;
}

/**
 * Get the current cache provider (must call initializeCache first)
 */
export function getCache(): CacheProvider {
  if (!cacheProvider) {
    // Lazy initialization with defaults if not explicitly initialized
    cacheProvider = new MemoryCacheProvider(getDefaultCacheConfig());
  }
  return cacheProvider;
}

/**
 * Clear all caches
 */
export async function clearAllCaches(): Promise<void> {
  const cache = getCache();
  await cache.flush();
}

/**
 * Get cache health status
 */
export async function getCacheHealth(): Promise<{
  healthy: boolean;
  provider: 'memory' | 'redis';
  stats: {
    hits: number;
    misses: number;
    keys: number;
    hitRate: number;
  };
}> {
  const cache = getCache();
  const [healthy, stats] = await Promise.all([cache.isHealthy(), cache.getStats()]);

  const total = stats.hits + stats.misses;
  const hitRate = total > 0 ? (stats.hits / total) * 100 : 0;

  return {
    healthy,
    provider: stats.provider,
    stats: {
      hits: stats.hits,
      misses: stats.misses,
      keys: stats.keys,
      hitRate: Math.round(hitRate * 100) / 100,
    },
  };
}

/**
 * Cache wrapper for async functions
 * Simplifies caching patterns with automatic key generation
 */
export async function withCache<T>(
  cacheType: 'manifests' | 'templates' | 'metadata',
  key: string,
  fetchFn: () => Promise<T>,
  ttlSeconds?: number
): Promise<T> {
  const cache = getCache();
  const fullKey = `${cacheType}:${key}`;

  // Try to get from cache
  const cached = await cache.get<T>(fullKey);
  if (cached !== undefined) {
    return cached;
  }

  // Fetch fresh data
  const data = await fetchFn();

  // Store in cache
  await cache.set(fullKey, data, ttlSeconds);

  return data;
}

/**
 * Graceful shutdown - close cache connections
 */
export async function shutdownCache(): Promise<void> {
  if (cacheProvider) {
    await cacheProvider.close();
    cacheProvider = null;
    initPromise = null;
    logger.info('Cache provider shut down');
  }
}

// Re-export types
export type { CacheProvider, CacheConfig, CacheStatistics } from './cacheProvider';
