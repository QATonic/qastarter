/**
 * Unit Tests for Dependency Registry Service
 *
 * These tests mock the global `fetch` so we never hit Maven Central
 * or the npm registry from CI. We assert the request URLs and the
 * shape of the normalized responses.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  searchMavenCentral,
  searchNpm,
  searchRegistry,
  getRegistryVersions,
  getMavenVersions,
  getNpmVersions,
  __resetDependencyCache,
  getDependencyCacheStats,
} from './dependencyRegistry';

// Helper: build a Response-like object that the service can `await response.json()` on
function jsonResponse(
  body: unknown,
  init: { ok?: boolean; status?: number; statusText?: string } = {}
) {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    statusText: init.statusText ?? 'OK',
    json: async () => body,
  } as Response;
}

const mavenSearchPayload = {
  response: {
    numFound: 2,
    docs: [
      {
        id: 'com.squareup.okhttp3:okhttp',
        g: 'com.squareup.okhttp3',
        a: 'okhttp',
        latestVersion: '4.12.0',
      },
      {
        id: 'com.squareup.okhttp3:logging-interceptor',
        g: 'com.squareup.okhttp3',
        a: 'logging-interceptor',
        latestVersion: '4.12.0',
      },
    ],
  },
};

const mavenVersionsPayload = {
  response: {
    numFound: 3,
    docs: [
      { id: 'a', g: 'g', a: 'a', v: '4.12.0' },
      { id: 'a', g: 'g', a: 'a', v: '4.11.0' },
      { id: 'a', g: 'g', a: 'a', v: '4.10.0' },
    ],
  },
};

const npmSearchPayload = {
  total: 1,
  objects: [
    {
      package: {
        name: 'axios',
        version: '1.6.2',
        description: 'Promise based HTTP client',
        links: {
          homepage: 'https://axios-http.com',
          npm: 'https://www.npmjs.com/package/axios',
        },
      },
      score: { final: 0.95 },
    },
  ],
};

const npmPackagePayload = {
  name: 'axios',
  'dist-tags': { latest: '1.6.2' },
  versions: {
    '1.0.0': {},
    '1.5.0': {},
    '1.6.0': {},
    '1.6.2': {},
  },
};

describe('dependencyRegistry', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    __resetDependencyCache();
    // Default: every fetch returns an empty success — individual tests override.
    fetchSpy = vi.spyOn(globalThis, 'fetch' as any);
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    __resetDependencyCache();
  });

  // ---------- Maven Central ----------

  describe('searchMavenCentral', () => {
    it('returns an empty array for an empty query', async () => {
      const results = await searchMavenCentral('   ');
      expect(results).toEqual([]);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('hits the Maven Central solr search endpoint', async () => {
      fetchSpy.mockResolvedValueOnce(jsonResponse(mavenSearchPayload));

      const results = await searchMavenCentral('okhttp');

      expect(fetchSpy).toHaveBeenCalledOnce();
      const url = fetchSpy.mock.calls[0][0] as string;
      expect(url).toContain('search.maven.org/solrsearch/select');
      // Trailing wildcard artifact search: "okhttp" becomes "a:okhttp*" for broad matching + re-ranking
      expect(url).toMatch(/q=a(%3A|:)okhttp\*/);
      // Over-fetches 3x limit for re-ranking, so rows=30 (3 * default 10)
      expect(url).toContain('rows=30');
      expect(url).toContain('wt=json');

      expect(results).toHaveLength(2);
      expect(results[0]).toMatchObject({
        id: 'com.squareup.okhttp3:okhttp',
        registry: 'maven',
        name: 'okhttp',
        group: 'com.squareup.okhttp3',
        version: '4.12.0',
      });
      expect(results[0].homepage).toContain('search.maven.org/artifact');
    });

    it('clamps limit to the upper bound', async () => {
      fetchSpy.mockResolvedValueOnce(jsonResponse(mavenSearchPayload));
      await searchMavenCentral('okhttp', { limit: 9999 });
      const url = fetchSpy.mock.calls[0][0] as string;
      // Clamped limit=25 (MAX), then 3x over-fetch = 50 (capped at MAX_LIMIT*2)
      expect(url).toContain('rows=50');
    });

    it('throws when the upstream returns a non-OK status', async () => {
      fetchSpy.mockResolvedValueOnce(
        jsonResponse({}, { ok: false, status: 503, statusText: 'Service Unavailable' })
      );
      await expect(searchMavenCentral('okhttp')).rejects.toThrow(/Maven Central search failed/);
    });
  });

  describe('getMavenVersions', () => {
    it('queries the gav core for known versions', async () => {
      fetchSpy.mockResolvedValueOnce(jsonResponse(mavenVersionsPayload));
      const versions = await getMavenVersions('com.squareup.okhttp3', 'okhttp');

      expect(fetchSpy).toHaveBeenCalledOnce();
      const url = fetchSpy.mock.calls[0][0] as string;
      expect(url).toContain('core=gav');
      expect(url).toContain('g%3A%22com.squareup.okhttp3%22');

      expect(versions).toEqual(['4.12.0', '4.11.0', '4.10.0']);
    });

    it('returns [] for empty inputs', async () => {
      const versions = await getMavenVersions('', 'foo');
      expect(versions).toEqual([]);
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  // ---------- npm ----------

  describe('searchNpm', () => {
    it('returns an empty array for an empty query', async () => {
      const results = await searchNpm('  ');
      expect(results).toEqual([]);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('hits the npm registry search endpoint', async () => {
      fetchSpy.mockResolvedValueOnce(jsonResponse(npmSearchPayload));
      const results = await searchNpm('axios');

      const url = fetchSpy.mock.calls[0][0] as string;
      expect(url).toContain('registry.npmjs.org/-/v1/search');
      expect(url).toContain('text=axios');
      expect(url).toContain('size=10');

      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        id: 'axios',
        registry: 'npm',
        name: 'axios',
        version: '1.6.2',
        description: 'Promise based HTTP client',
        homepage: 'https://axios-http.com',
      });
    });

    it('falls back to npm package URL if homepage is missing', async () => {
      fetchSpy.mockResolvedValueOnce(
        jsonResponse({
          objects: [{ package: { name: 'lodash', version: '4.17.21', links: {} } }],
        })
      );
      const results = await searchNpm('lodash');
      expect(results[0].homepage).toBe('https://www.npmjs.com/package/lodash');
    });

    it('throws when upstream errors', async () => {
      fetchSpy.mockResolvedValueOnce(jsonResponse({}, { ok: false, status: 500 }));
      await expect(searchNpm('axios')).rejects.toThrow(/npm search failed/);
    });
  });

  describe('getNpmVersions', () => {
    it('returns versions newest-first', async () => {
      fetchSpy.mockResolvedValueOnce(jsonResponse(npmPackagePayload));
      const versions = await getNpmVersions('axios');
      // npm puts oldest first; service reverses
      expect(versions).toEqual(['1.6.2', '1.6.0', '1.5.0', '1.0.0']);
    });

    it('returns [] for unknown package (404)', async () => {
      fetchSpy.mockResolvedValueOnce(
        jsonResponse({}, { ok: false, status: 404, statusText: 'Not Found' })
      );
      const versions = await getNpmVersions('does-not-exist-zzz');
      expect(versions).toEqual([]);
    });

    it('throws on non-404 errors', async () => {
      fetchSpy.mockResolvedValueOnce(jsonResponse({}, { ok: false, status: 500 }));
      await expect(getNpmVersions('axios')).rejects.toThrow(/npm package lookup failed/);
    });
  });

  // ---------- Cached dispatcher ----------

  describe('searchRegistry (cached)', () => {
    it('caches results across calls with the same key', async () => {
      fetchSpy.mockResolvedValue(jsonResponse(npmSearchPayload));

      const a = await searchRegistry('npm', 'axios');
      const b = await searchRegistry('npm', 'axios');

      expect(a).toEqual(b);
      // Only one upstream call despite two service calls
      expect(fetchSpy).toHaveBeenCalledOnce();

      const stats = getDependencyCacheStats();
      expect(stats.hits).toBeGreaterThanOrEqual(1);
    });

    it('uses different cache keys for different registries', async () => {
      fetchSpy.mockResolvedValueOnce(jsonResponse(mavenSearchPayload));
      fetchSpy.mockResolvedValueOnce(jsonResponse(npmSearchPayload));

      await searchRegistry('maven', 'okhttp');
      await searchRegistry('npm', 'okhttp');

      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    it('returns [] for empty query without hitting upstream', async () => {
      const results = await searchRegistry('npm', '   ');
      expect(results).toEqual([]);
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  describe('getRegistryVersions', () => {
    it('routes maven coordinates correctly', async () => {
      fetchSpy.mockResolvedValueOnce(jsonResponse(mavenVersionsPayload));
      const versions = await getRegistryVersions('maven', 'com.squareup.okhttp3:okhttp');
      expect(versions).toEqual(['4.12.0', '4.11.0', '4.10.0']);
    });

    it('routes npm coordinates correctly', async () => {
      fetchSpy.mockResolvedValueOnce(jsonResponse(npmPackagePayload));
      const versions = await getRegistryVersions('npm', 'axios');
      expect(versions[0]).toBe('1.6.2');
    });

    it('throws on bad maven coordinate', async () => {
      await expect(getRegistryVersions('maven', 'no-colon-here')).rejects.toThrow(/group:artifact/);
    });

    it('caches version lookups', async () => {
      fetchSpy.mockResolvedValue(jsonResponse(npmPackagePayload));
      await getRegistryVersions('npm', 'axios');
      await getRegistryVersions('npm', 'axios');
      expect(fetchSpy).toHaveBeenCalledOnce();
    });
  });

  // ---------- Retry behaviour ----------

  describe('retry on transient failures', () => {
    it('retries once when fetch is aborted, then succeeds', async () => {
      // First attempt: simulate Node fetch abort (transient)
      const abortErr = new Error('The operation was aborted');
      abortErr.name = 'AbortError';
      fetchSpy.mockRejectedValueOnce(abortErr);
      // Second attempt: success
      fetchSpy.mockResolvedValueOnce(jsonResponse(npmSearchPayload));

      const results = await searchNpm('axios');

      expect(fetchSpy).toHaveBeenCalledTimes(2);
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('axios');
    });

    it('retries once on a network failure (fetch failed), then succeeds', async () => {
      fetchSpy.mockRejectedValueOnce(new TypeError('fetch failed'));
      fetchSpy.mockResolvedValueOnce(jsonResponse(mavenSearchPayload));

      const results = await searchMavenCentral('okhttp');

      expect(fetchSpy).toHaveBeenCalledTimes(2);
      expect(results).toHaveLength(2);
    });

    it('does not retry on a permanent error (validation / 4xx)', async () => {
      // 404 from npm versions short-circuits to []
      fetchSpy.mockResolvedValueOnce(
        jsonResponse({}, { ok: false, status: 404, statusText: 'Not Found' })
      );
      const versions = await getNpmVersions('does-not-exist');
      expect(versions).toEqual([]);
      // No retry — 404 is permanent
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('gives up after one retry and surfaces the original error', async () => {
      const abortErr = new Error('The operation was aborted');
      abortErr.name = 'AbortError';
      fetchSpy.mockRejectedValue(abortErr);

      await expect(searchNpm('axios')).rejects.toThrow(/aborted/);
      // Initial attempt + 1 retry = 2 calls
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });
  });
});
