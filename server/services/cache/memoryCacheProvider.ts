/**
 * In-Memory Cache Provider
 *
 * Uses NodeCache for in-memory caching.
 * Suitable for development and single-instance production deployments.
 */

import NodeCache from 'node-cache';
import { CacheProvider, CacheStatistics, CacheConfig } from './cacheProvider';
import { logger } from '../../utils/logger';

export class MemoryCacheProvider implements CacheProvider {
  private cache: NodeCache;
  private config: CacheConfig;
  private hits: number = 0;
  private misses: number = 0;

  constructor(config: CacheConfig) {
    this.config = config;
    // Bounded cache: without maxKeys, NodeCache grows forever under sustained load
    // (manifests + compiled templates for 49 packs × variants × long TTL). A ceiling
    // of 1000 keeps worst-case memory in the low tens of MB while comfortably covering
    // the full combo matrix. Override via CACHE_MAX_KEYS if a deployment needs more.
    const maxKeys = parseInt(process.env.CACHE_MAX_KEYS || '1000', 10);
    this.cache = new NodeCache({
      stdTTL: config.defaultTTL,
      checkperiod: 120, // Check for expired keys every 2 minutes
      useClones: false, // Better performance
      maxKeys,
    });

    logger.info('Memory cache provider initialized', {
      ttl: config.defaultTTL,
      enabled: config.enabled,
      maxKeys,
    });
  }

  private getFullKey(key: string): string {
    return `${this.config.keyPrefix}${key}`;
  }

  async get<T>(key: string): Promise<T | undefined> {
    if (!this.config.enabled) {
      return undefined;
    }

    const fullKey = this.getFullKey(key);
    const value = this.cache.get<T>(fullKey);

    if (value !== undefined) {
      this.hits++;
      return value;
    }

    this.misses++;
    return undefined;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean> {
    if (!this.config.enabled) {
      return false;
    }

    const fullKey = this.getFullKey(key);
    try {
      return this.cache.set(fullKey, value, ttlSeconds || this.config.defaultTTL);
    } catch (err) {
      // NodeCache throws ECACHEFULL once maxKeys is hit. Fail-soft: log and skip
      // caching for this call so hot paths aren't taken down by a full cache.
      logger.warn('Memory cache set failed (likely capacity)', {
        error: err instanceof Error ? err.message : String(err),
        keys: this.cache.keys().length,
      });
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    const fullKey = this.getFullKey(key);
    return this.cache.del(fullKey) > 0;
  }

  async flush(): Promise<void> {
    this.cache.flushAll();
    this.hits = 0;
    this.misses = 0;
    logger.info('Memory cache flushed');
  }

  async isHealthy(): Promise<boolean> {
    // In-memory cache is always healthy if it exists
    return true;
  }

  async getStats(): Promise<CacheStatistics> {
    const stats = this.cache.getStats();
    return {
      hits: stats.hits,
      misses: stats.misses,
      keys: this.cache.keys().length,
      connected: true,
      provider: 'memory',
    };
  }

  async close(): Promise<void> {
    this.cache.close();
    logger.info('Memory cache provider closed');
  }

  getClient(): any {
    return null;
  }
}
