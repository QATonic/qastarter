/**
 * Redis Cache Provider
 *
 * Uses Redis for distributed caching.
 * Suitable for production deployments with multiple instances.
 */

import { createClient, RedisClientType } from 'redis';
import { CacheProvider, CacheStatistics, CacheConfig } from './cacheProvider';
import { logger } from '../../utils/logger';

export class RedisCacheProvider implements CacheProvider {
  private client: RedisClientType;
  private config: CacheConfig;
  private connected: boolean = false;
  private hits: number = 0;
  private misses: number = 0;
  private connectionPromise: Promise<void> | null = null;

  constructor(config: CacheConfig) {
    this.config = config;

    this.client = createClient({
      url: config.redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Redis: Max reconnection attempts reached');
            return new Error('Max reconnection attempts reached');
          }
          // Exponential backoff: 100ms, 200ms, 400ms, etc.
          const delay = Math.min(retries * 100, 3000);
          logger.warn(`Redis: Reconnecting in ${delay}ms (attempt ${retries})`);
          return delay;
        },
      },
    });

    // Event handlers
    this.client.on('error', (err) => {
      logger.error('Redis error', { error: err.message });
      this.connected = false;
    });

    this.client.on('connect', () => {
      logger.info('Redis connected');
      this.connected = true;
    });

    this.client.on('disconnect', () => {
      logger.warn('Redis disconnected');
      this.connected = false;
    });

    this.client.on('reconnecting', () => {
      logger.info('Redis reconnecting...');
    });
  }

  /**
   * Connect to Redis
   */
  async connect(): Promise<void> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = this.client
      .connect()
      .then(() => {
        logger.info('Redis cache provider initialized', {
          url: this.config.redisUrl?.replace(/\/\/[^:]+:[^@]+@/, '//*****:*****@'), // Redact credentials
        });
      })
      .catch((err) => {
        logger.error('Redis connection failed', { error: err.message });
        throw err;
      });

    return this.connectionPromise;
  }

  private getFullKey(key: string): string {
    return `${this.config.keyPrefix}${key}`;
  }

  async get<T>(key: string): Promise<T | undefined> {
    if (!this.config.enabled || !this.connected) {
      return undefined;
    }

    try {
      const fullKey = this.getFullKey(key);
      const value = await this.client.get(fullKey);

      if (value !== null) {
        this.hits++;
        return JSON.parse(value) as T;
      }

      this.misses++;
      return undefined;
    } catch (error) {
      logger.error('Redis get error', {
        key,
        error: error instanceof Error ? error.message : String(error),
      });
      return undefined;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean> {
    if (!this.config.enabled || !this.connected) {
      return false;
    }

    try {
      const fullKey = this.getFullKey(key);
      const ttl = ttlSeconds || this.config.defaultTTL;

      await this.client.setEx(fullKey, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error('Redis set error', {
        key,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.connected) {
      return false;
    }

    try {
      const fullKey = this.getFullKey(key);
      const result = await this.client.del(fullKey);
      return result > 0;
    } catch (error) {
      logger.error('Redis del error', {
        key,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  async flush(): Promise<void> {
    if (!this.connected) {
      return;
    }

    try {
      // Only flush keys with our prefix
      const keys = await this.client.keys(`${this.config.keyPrefix}*`);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      this.hits = 0;
      this.misses = 0;
      logger.info('Redis cache flushed', { keysDeleted: keys.length });
    } catch (error) {
      logger.error('Redis flush error', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async isHealthy(): Promise<boolean> {
    if (!this.connected) {
      return false;
    }

    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }

  async getStats(): Promise<CacheStatistics> {
    let keys = 0;

    if (this.connected) {
      try {
        const allKeys = await this.client.keys(`${this.config.keyPrefix}*`);
        keys = allKeys.length;
      } catch {
        // Ignore errors in stats collection
      }
    }

    return {
      hits: this.hits,
      misses: this.misses,
      keys,
      connected: this.connected,
      provider: 'redis',
    };
  }

  async close(): Promise<void> {
    if (this.connected) {
      await this.client.quit();
      this.connected = false;
      logger.info('Redis cache provider closed');
    }
  }
}
