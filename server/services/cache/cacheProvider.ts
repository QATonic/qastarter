/**
 * Cache Provider Interface for QAStarter
 *
 * Abstracts cache operations to support multiple backends:
 * - In-memory (NodeCache) for development and single-instance
 * - Redis for production and distributed deployments
 */

/**
 * Generic cache provider interface
 */
export interface CacheProvider {
  /** Get a value from cache */
  get<T>(key: string): Promise<T | undefined>;

  /** Set a value in cache with optional TTL */
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean>;

  /** Delete a key from cache */
  del(key: string): Promise<boolean>;

  /** Clear all entries in the cache */
  flush(): Promise<void>;

  /** Check if the cache is healthy/connected */
  isHealthy(): Promise<boolean>;

  /** Get cache statistics */
  getStats(): Promise<CacheStatistics>;

  /** Close the cache connection */
  close(): Promise<void>;
}

/**
 * Cache statistics
 */
export interface CacheStatistics {
  hits: number;
  misses: number;
  keys: number;
  connected: boolean;
  provider: 'memory' | 'redis';
}

/**
 * Cache configuration options
 */
export interface CacheConfig {
  /** Redis URL (if using Redis) */
  redisUrl?: string;
  /** Default TTL in seconds */
  defaultTTL: number;
  /** Key prefix for namespacing */
  keyPrefix: string;
  /** Whether caching is enabled */
  enabled: boolean;
}

/**
 * Get default cache configuration from environment
 */
export function getDefaultCacheConfig(): CacheConfig {
  return {
    redisUrl: process.env.REDIS_URL,
    defaultTTL: process.env.NODE_ENV === 'production' ? 3600 : 60,
    keyPrefix: 'qastarter:',
    enabled: process.env.DISABLE_CACHE !== 'true',
  };
}
