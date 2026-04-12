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
    this.cache = new NodeCache({
      stdTTL: config.defaultTTL,
      checkperiod: 120, // Check for expired keys every 2 minutes
      useClones: false, // Better performance
    });

    logger.info('Memory cache provider initialized', {
      ttl: config.defaultTTL,
      enabled: config.enabled,
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
    return this.cache.set(fullKey, value, ttlSeconds || this.config.defaultTTL);
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
