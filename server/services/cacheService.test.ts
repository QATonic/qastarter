/**
 * Unit Tests for Cache Service
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getCachedManifest,
  setCachedManifest,
  getCachedTemplate,
  setCachedTemplate,
  getCachedMetadata,
  setCachedMetadata,
  clearAllCaches,
  clearCache,
  getCacheStats,
  isCacheEnabled,
  withCache,
  caches,
} from './cacheService';

describe('CacheService', () => {
  // Clear all caches before each test
  beforeEach(() => {
    clearAllCaches();
    // Reset environment
    delete process.env.DISABLE_CACHE;
  });

  afterEach(() => {
    clearAllCaches();
  });

  describe('Manifest Cache', () => {
    it('should store and retrieve a manifest', () => {
      const manifest = { name: 'test-manifest', version: '1.0.0' };

      setCachedManifest('test-pack', manifest);
      const retrieved = getCachedManifest<typeof manifest>('test-pack');

      expect(retrieved).toEqual(manifest);
    });

    it('should return undefined for non-existent keys', () => {
      const result = getCachedManifest('non-existent');
      expect(result).toBeUndefined();
    });

    it('should overwrite existing values', () => {
      const manifest1 = { version: '1.0' };
      const manifest2 = { version: '2.0' };

      setCachedManifest('key', manifest1);
      setCachedManifest('key', manifest2);

      expect(getCachedManifest('key')).toEqual(manifest2);
    });
  });

  describe('Template Cache', () => {
    it('should store and retrieve a template', () => {
      const template = { compiled: true, content: 'test content' };

      setCachedTemplate('template-key', template);
      const retrieved = getCachedTemplate<typeof template>('template-key');

      expect(retrieved).toEqual(template);
    });

    it('should return undefined for non-existent templates', () => {
      const result = getCachedTemplate('missing-template');
      expect(result).toBeUndefined();
    });
  });

  describe('Metadata Cache', () => {
    it('should store and retrieve metadata', () => {
      const metadata = { labels: { web: 'Web Testing' } };

      setCachedMetadata('labels', metadata);
      const retrieved = getCachedMetadata<typeof metadata>('labels');

      expect(retrieved).toEqual(metadata);
    });

    it('should handle complex nested objects', () => {
      const complexData = {
        level1: {
          level2: {
            level3: ['a', 'b', 'c'],
          },
        },
      };

      setCachedMetadata('complex', complexData);
      expect(getCachedMetadata('complex')).toEqual(complexData);
    });
  });

  describe('clearCache', () => {
    it('should clear only manifests cache', () => {
      setCachedManifest('m1', { data: 'manifest' });
      setCachedTemplate('t1', { data: 'template' });
      setCachedMetadata('md1', { data: 'metadata' });

      clearCache('manifests');

      expect(getCachedManifest('m1')).toBeUndefined();
      expect(getCachedTemplate('t1')).toBeDefined();
      expect(getCachedMetadata('md1')).toBeDefined();
    });

    it('should clear only templates cache', () => {
      setCachedManifest('m1', { data: 'manifest' });
      setCachedTemplate('t1', { data: 'template' });
      setCachedMetadata('md1', { data: 'metadata' });

      clearCache('templates');

      expect(getCachedManifest('m1')).toBeDefined();
      expect(getCachedTemplate('t1')).toBeUndefined();
      expect(getCachedMetadata('md1')).toBeDefined();
    });

    it('should clear only metadata cache', () => {
      setCachedManifest('m1', { data: 'manifest' });
      setCachedTemplate('t1', { data: 'template' });
      setCachedMetadata('md1', { data: 'metadata' });

      clearCache('metadata');

      expect(getCachedManifest('m1')).toBeDefined();
      expect(getCachedTemplate('t1')).toBeDefined();
      expect(getCachedMetadata('md1')).toBeUndefined();
    });
  });

  describe('clearAllCaches', () => {
    it('should clear all caches', () => {
      setCachedManifest('m1', { data: 'manifest' });
      setCachedTemplate('t1', { data: 'template' });
      setCachedMetadata('md1', { data: 'metadata' });

      clearAllCaches();

      expect(getCachedManifest('m1')).toBeUndefined();
      expect(getCachedTemplate('t1')).toBeUndefined();
      expect(getCachedMetadata('md1')).toBeUndefined();
    });
  });

  describe('getCacheStats', () => {
    it('should return statistics for all caches', () => {
      setCachedManifest('m1', {});
      setCachedManifest('m2', {});
      setCachedTemplate('t1', {});

      const stats = getCacheStats();

      expect(stats).toHaveProperty('manifests');
      expect(stats).toHaveProperty('templates');
      expect(stats).toHaveProperty('metadata');
      expect(stats.manifests.keys).toBe(2);
      expect(stats.templates.keys).toBe(1);
      expect(stats.metadata.keys).toBe(0);
    });

    it('should track hits and misses', () => {
      setCachedManifest('test', { data: true });

      // Hit
      getCachedManifest('test');
      // Miss
      getCachedManifest('non-existent');

      const stats = getCacheStats();
      expect(stats.manifests.hits).toBeGreaterThanOrEqual(1);
      expect(stats.manifests.misses).toBeGreaterThanOrEqual(1);
    });
  });

  describe('isCacheEnabled', () => {
    it('should return true when DISABLE_CACHE is not set', () => {
      delete process.env.DISABLE_CACHE;
      expect(isCacheEnabled()).toBe(true);
    });

    it('should return false when DISABLE_CACHE is true', () => {
      process.env.DISABLE_CACHE = 'true';
      expect(isCacheEnabled()).toBe(false);
    });

    it('should return true when DISABLE_CACHE is any other value', () => {
      process.env.DISABLE_CACHE = 'false';
      expect(isCacheEnabled()).toBe(true);
    });
  });

  describe('withCache', () => {
    it('should return cached value when available', async () => {
      const fetchFn = vi.fn().mockResolvedValue({ fresh: true });
      setCachedManifest('test-key', { cached: true });

      const result = await withCache('manifests', 'test-key', fetchFn);

      expect(result).toEqual({ cached: true });
      expect(fetchFn).not.toHaveBeenCalled();
    });

    it('should call fetchFn when value is not cached', async () => {
      const fetchFn = vi.fn().mockResolvedValue({ fresh: true });

      const result = await withCache('manifests', 'new-key', fetchFn);

      expect(result).toEqual({ fresh: true });
      expect(fetchFn).toHaveBeenCalledOnce();
    });

    it('should cache the result after fetching', async () => {
      const fetchFn = vi.fn().mockResolvedValue({ data: 'fetched' });

      await withCache('templates', 'cache-test', fetchFn);

      expect(getCachedTemplate('cache-test')).toEqual({ data: 'fetched' });
    });

    it('should bypass cache when disabled', async () => {
      process.env.DISABLE_CACHE = 'true';
      const fetchFn = vi.fn().mockResolvedValue({ fresh: true });
      setCachedManifest('test-key', { cached: true });

      const result = await withCache('manifests', 'test-key', fetchFn);

      expect(result).toEqual({ fresh: true });
      expect(fetchFn).toHaveBeenCalledOnce();
    });

    it('should work with metadata cache type', async () => {
      const fetchFn = vi.fn().mockResolvedValue({ labels: {} });

      await withCache('metadata', 'labels', fetchFn);

      expect(getCachedMetadata('labels')).toEqual({ labels: {} });
    });
  });

  describe('caches export', () => {
    it('should expose cache instances', () => {
      expect(caches).toHaveProperty('manifests');
      expect(caches).toHaveProperty('templates');
      expect(caches).toHaveProperty('metadata');
    });

    it('should allow direct cache manipulation', () => {
      caches.manifests.set('direct-key', { direct: true });
      expect(getCachedManifest('direct-key')).toEqual({ direct: true });
    });
  });
});
