/**
 * Dependency Registry Service
 *
 * Provides real-time package search against public registries:
 *  - Maven Central (for Java/Kotlin/Scala projects using Maven or Gradle)
 *  - npm registry    (for JavaScript/TypeScript projects)
 *
 * All responses are normalized to a single {@link NormalizedDependency}
 * shape so the client and template engine can consume them uniformly.
 *
 * Results are cached in-memory with an LRU-style TTL (via node-cache)
 * to keep the UX snappy and to avoid hammering upstream registries.
 */

import NodeCache from 'node-cache';

// ---------- Types ----------

export type RegistryId = 'maven' | 'npm';

/**
 * Unified dependency shape returned to the client and used by
 * template generation. Fields are intentionally optional where
 * upstream registries may not provide them.
 */
export interface NormalizedDependency {
  /** Unique identifier within a registry (e.g. "com.squareup.okhttp3:okhttp", "axios") */
  id: string;
  /** Registry the dependency came from */
  registry: RegistryId;
  /** Human-readable name (usually the same as id for npm; artifactId for Maven) */
  name: string;
  /** Group / organization (Maven only) */
  group?: string;
  /** Suggested version (latest stable at time of query) */
  version: string;
  /** Short description if provided by registry */
  description?: string;
  /** Monthly downloads (npm) or usage count — may be undefined */
  downloads?: number;
  /** SPDX license identifier if known */
  license?: string;
  /** Project / homepage URL */
  homepage?: string;
}

export interface SearchOptions {
  /** Max results to return. Clamped to a safe upper bound. */
  limit?: number;
  /** AbortSignal for cancelling upstream requests */
  signal?: AbortSignal;
}

// ---------- Cache ----------

const CACHE_TTL = Number(process.env.DEPENDENCY_CACHE_TTL_SECONDS ?? 300); // 5 minutes default
const CACHE_CHECK_PERIOD = 60; // clean up every minute

const registryCache = new NodeCache({
  stdTTL: CACHE_TTL,
  checkperiod: CACHE_CHECK_PERIOD,
  // False = return reference. Registry results are read-only; avoids
  // clone cost on every hit.
  useClones: false,
  // Hard cap to keep memory bounded even if users search a LOT.
  maxKeys: 500,
});

/**
 * Primarily for tests — reset cache state deterministically.
 * @internal
 */
export function __resetDependencyCache(): void {
  registryCache.flushAll();
}

/**
 * Cache statistics for the `/api/v1/health/cache` style endpoints.
 */
export function getDependencyCacheStats() {
  const stats = registryCache.getStats();
  return {
    hits: stats.hits,
    misses: stats.misses,
    keys: registryCache.keys().length,
  };
}

// ---------- Constants / Limits ----------

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 25;
// Maven Central in particular is known to be intermittently slow / flaky.
// 15s gives upstream a fair chance without making the UI feel hung.
const UPSTREAM_TIMEOUT_MS = Number(process.env.DEPENDENCY_UPSTREAM_TIMEOUT_MS ?? 15_000);
// One automatic retry on aborts / 5xx — covers Maven Central's transient 502s.
const UPSTREAM_RETRY_COUNT = 1;
const UPSTREAM_RETRY_DELAY_MS = 400;

const MAVEN_SEARCH_URL = 'https://search.maven.org/solrsearch/select';
const NPM_SEARCH_URL = 'https://registry.npmjs.org/-/v1/search';
const NPM_PACKAGE_URL = 'https://registry.npmjs.org';
const MAVEN_VERSIONS_URL = 'https://search.maven.org/solrsearch/select';

// ---------- Helpers ----------

function clampLimit(limit?: number): number {
  if (!limit || Number.isNaN(limit) || limit < 1) return DEFAULT_LIMIT;
  return Math.min(Math.floor(limit), MAX_LIMIT);
}

function cacheKey(kind: string, ...parts: string[]): string {
  return `${kind}:${parts.map((p) => p.trim().toLowerCase()).join(':')}`;
}

/**
 * Sentinel error thrown when our internal timeout fires. Lets callers
 * distinguish a true upstream timeout from a caller-initiated abort
 * (e.g. the HTTP client closing the connection mid-flight).
 */
class UpstreamTimeoutError extends Error {
  readonly upstreamTimeoutMs: number;
  constructor(url: string, ms: number) {
    super(`Upstream did not respond within ${ms}ms: ${url}`);
    this.name = 'UpstreamTimeoutError';
    this.upstreamTimeoutMs = ms;
  }
}

async function fetchWithTimeout(
  url: string,
  options: { signal?: AbortSignal } = {}
): Promise<Response> {
  const controller = new AbortController();
  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, UPSTREAM_TIMEOUT_MS);

  // Chain external signal into our controller so both sources can cancel
  if (options.signal) {
    if (options.signal.aborted) {
      controller.abort();
    } else {
      options.signal.addEventListener('abort', () => controller.abort(), {
        once: true,
      });
    }
  }

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'QAStarter/1.0 (+https://github.com/qastarter)',
      },
    });
    return response;
  } catch (err) {
    if (timedOut) {
      throw new UpstreamTimeoutError(url, UPSTREAM_TIMEOUT_MS);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Treat a thrown value as transient (worth retrying) if it's an upstream
 * timeout, a Node fetch network error, or a 5xx Response.
 */
function isTransientFailure(err: unknown): boolean {
  if (err instanceof UpstreamTimeoutError) return true;
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    return (
      msg.includes('aborted') ||
      msg.includes('econnreset') ||
      msg.includes('enotfound') ||
      msg.includes('etimedout') ||
      msg.includes('socket hang up') ||
      msg.includes('fetch failed')
    );
  }
  return false;
}

/**
 * Wraps an async upstream call with a single retry for transient
 * failures. Maven Central in particular returns 502s and hangs
 * intermittently — one quick retry materially improves reliability.
 */
async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= UPSTREAM_RETRY_COUNT; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt === UPSTREAM_RETRY_COUNT || !isTransientFailure(err)) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, UPSTREAM_RETRY_DELAY_MS));
    }
  }
  throw lastError;
}

// ---------- Maven Central adapter ----------

interface MavenSearchResponse {
  response?: {
    numFound?: number;
    docs?: MavenDoc[];
  };
}

interface MavenDoc {
  id: string;
  g: string; // groupId
  a: string; // artifactId
  v?: string; // version (core search only)
  latestVersion?: string;
  p?: string; // packaging
  timestamp?: number;
  versionCount?: number;
}

/**
 * Search Maven Central for a package.
 *
 * Uses the public Solr-backed search API. Returns the "latest stable"
 * version per groupId:artifactId (Maven Central's default behaviour).
 */
/**
 * Score a Maven doc for relevance to the user's query.
 * Higher score = more relevant.
 */
function scoreMavenDoc(doc: MavenDoc, queryLower: string): number {
  let score = 0;
  const artifact = (doc.a ?? '').toLowerCase();
  const group = (doc.g ?? '').toLowerCase();

  // Exact artifact match (highest value — "selenium" → a:"selenium")
  if (artifact === queryLower) score += 100;
  // Artifact starts with query ("selenium" → "selenium-java")
  else if (artifact.startsWith(queryLower)) score += 80;
  // Artifact contains query ("selenium" found in artifact)
  else if (artifact.includes(queryLower)) score += 40;

  // Group contains query word ("selenium" in "org.seleniumhq.selenium")
  if (group.includes(queryLower)) score += 50;

  // Popularity proxy: versionCount indicates an established, maintained package
  const vc = doc.versionCount ?? 0;
  if (vc > 100) score += 30;
  else if (vc > 50) score += 20;
  else if (vc > 10) score += 10;
  else if (vc > 3) score += 5;

  // Boost well-known ecosystems (org.apache, com.google, org.springframework, etc.)
  if (
    /^(org\.(apache|seleniumhq|springframework|junit|testng|mockito)|com\.(google|fasterxml|squareup|github)|io\.(github|netty))/.test(
      group
    )
  ) {
    score += 15;
  }

  return score;
}

export async function searchMavenCentral(
  query: string,
  options: SearchOptions = {}
): Promise<NormalizedDependency[]> {
  const limit = clampLimit(options.limit);
  const trimmed = query.trim();
  if (!trimmed) return [];

  const queryLower = trimmed.toLowerCase();

  // Build a smarter Solr query:
  // - "group:artifact" → exact field match
  // - "com.google.guava" → group lookup
  // - "selenium" → wildcard artifact search to catch selenium, selenium-java, etc.
  //   Fetch 3x the limit so we have enough candidates for re-ranking.
  let solrQuery: string;
  let fetchRows = limit;

  if (trimmed.includes(':')) {
    const [g, a] = trimmed.split(':', 2);
    solrQuery = `g:"${g.trim()}"${a?.trim() ? ` AND a:"${a.trim()}"` : ''}`;
  } else if (trimmed.includes('.')) {
    solrQuery = `g:"${trimmed}"`;
  } else {
    // Trailing wildcard on artifact name to catch related packages
    // e.g. "selenium" → selenium, selenium-java, selenium-api, selenium-support, etc.
    // Note: Maven Central Solr does NOT support leading wildcards (a:*foo*),
    // so we use trailing wildcard only (a:foo*) which is well-supported.
    solrQuery = `a:${trimmed}*`;
    fetchRows = Math.min(limit * 3, MAX_LIMIT * 2); // Over-fetch for re-ranking
  }

  const url = new URL(MAVEN_SEARCH_URL);
  url.searchParams.set('q', solrQuery);
  url.searchParams.set('rows', String(fetchRows));
  url.searchParams.set('wt', 'json');

  const data = await withRetry(async () => {
    const response = await fetchWithTimeout(url.toString(), { signal: options.signal });
    if (!response.ok) {
      throw new Error(`Maven Central search failed: ${response.status} ${response.statusText}`);
    }
    return (await response.json()) as MavenSearchResponse;
  });

  const docs = data.response?.docs ?? [];

  // Re-rank by relevance: score each result and sort descending
  const scored = docs
    .map((doc) => ({ doc, score: scoreMavenDoc(doc, queryLower) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map<NormalizedDependency>(({ doc }) => ({
    id: `${doc.g}:${doc.a}`,
    registry: 'maven',
    name: doc.a,
    group: doc.g,
    version: doc.latestVersion ?? doc.v ?? 'LATEST',
    homepage: `https://search.maven.org/artifact/${encodeURIComponent(doc.g)}/${encodeURIComponent(doc.a)}`,
  }));
}

/**
 * Look up all known versions for a given Maven artifact.
 * Returns newest-first.
 */
export async function getMavenVersions(
  group: string,
  artifact: string,
  options: SearchOptions = {}
): Promise<string[]> {
  const g = group.trim();
  const a = artifact.trim();
  if (!g || !a) return [];

  const url = new URL(MAVEN_VERSIONS_URL);
  url.searchParams.set('q', `g:"${g}" AND a:"${a}"`);
  url.searchParams.set('core', 'gav');
  url.searchParams.set('rows', '20');
  url.searchParams.set('wt', 'json');

  const data = await withRetry(async () => {
    const response = await fetchWithTimeout(url.toString(), { signal: options.signal });
    if (!response.ok) {
      throw new Error(`Maven Central version lookup failed: ${response.status}`);
    }
    return (await response.json()) as MavenSearchResponse;
  });

  const docs = data.response?.docs ?? [];
  return docs.map((d) => d.v ?? '').filter(Boolean);
}

// ---------- npm registry adapter ----------

interface NpmSearchResponse {
  objects?: Array<{
    package: {
      name: string;
      version: string;
      description?: string;
      keywords?: string[];
      publisher?: { username?: string };
      links?: {
        npm?: string;
        homepage?: string;
        repository?: string;
      };
    };
    score?: {
      final?: number;
      detail?: {
        quality?: number;
        popularity?: number;
        maintenance?: number;
      };
    };
    searchScore?: number;
  }>;
  total?: number;
}

interface NpmPackageResponse {
  name: string;
  'dist-tags'?: { latest?: string };
  versions?: Record<string, unknown>;
  license?: string | { type?: string };
  homepage?: string;
  description?: string;
}

/**
 * Search the npm registry for a package.
 */
export async function searchNpm(
  query: string,
  options: SearchOptions = {}
): Promise<NormalizedDependency[]> {
  const limit = clampLimit(options.limit);
  const trimmed = query.trim();
  if (!trimmed) return [];

  const url = new URL(NPM_SEARCH_URL);
  url.searchParams.set('text', trimmed);
  url.searchParams.set('size', String(limit));

  const data = await withRetry(async () => {
    const response = await fetchWithTimeout(url.toString(), { signal: options.signal });
    if (!response.ok) {
      throw new Error(`npm search failed: ${response.status} ${response.statusText}`);
    }
    return (await response.json()) as NpmSearchResponse;
  });

  const objects = data.objects ?? [];

  return objects.map<NormalizedDependency>((obj) => {
    const pkg = obj.package;
    return {
      id: pkg.name,
      registry: 'npm',
      name: pkg.name,
      version: pkg.version,
      description: pkg.description,
      homepage:
        pkg.links?.homepage ?? pkg.links?.npm ?? `https://www.npmjs.com/package/${pkg.name}`,
    };
  });
}

/**
 * Get all published versions for an npm package, newest-first.
 */
export async function getNpmVersions(name: string, options: SearchOptions = {}): Promise<string[]> {
  const trimmed = name.trim();
  if (!trimmed) return [];

  const url = `${NPM_PACKAGE_URL}/${encodeURIComponent(trimmed)}`;
  const result = await withRetry(async () => {
    const response = await fetchWithTimeout(url, { signal: options.signal });
    if (!response.ok) {
      if (response.status === 404) {
        // 404 is permanent, not transient — short-circuit to a sentinel
        // so withRetry doesn't retry it.
        return null;
      }
      throw new Error(`npm package lookup failed: ${response.status}`);
    }
    return (await response.json()) as NpmPackageResponse;
  });

  if (!result) return [];
  const versions = Object.keys(result.versions ?? {});
  // npm returns oldest-first; reverse so newest is first
  return versions.reverse();
}

// ---------- Public dispatcher ----------

/**
 * Cached, registry-aware search. This is the main entry point used
 * by the HTTP route layer.
 */
export async function searchRegistry(
  registry: RegistryId,
  query: string,
  options: SearchOptions = {}
): Promise<NormalizedDependency[]> {
  const limit = clampLimit(options.limit);
  const trimmed = query.trim();
  if (!trimmed) return [];

  const key = cacheKey('search', registry, String(limit), trimmed);
  const cached = registryCache.get<NormalizedDependency[]>(key);
  if (cached) return cached;

  const results =
    registry === 'maven'
      ? await searchMavenCentral(trimmed, { ...options, limit })
      : await searchNpm(trimmed, { ...options, limit });

  registryCache.set(key, results);
  return results;
}

/**
 * Cached, registry-aware version lookup.
 *
 * @param coordinate For Maven: `group:artifact`. For npm: the package name.
 */
export async function getRegistryVersions(
  registry: RegistryId,
  coordinate: string,
  options: SearchOptions = {}
): Promise<string[]> {
  const trimmed = coordinate.trim();
  if (!trimmed) return [];

  const key = cacheKey('versions', registry, trimmed);
  const cached = registryCache.get<string[]>(key);
  if (cached) return cached;

  let versions: string[] = [];
  if (registry === 'maven') {
    const [group, artifact] = trimmed.split(':');
    if (!group || !artifact) {
      throw new Error(`Maven coordinate must be "group:artifact", received "${trimmed}"`);
    }
    versions = await getMavenVersions(group, artifact, options);
  } else {
    versions = await getNpmVersions(trimmed, options);
  }

  registryCache.set(key, versions);
  return versions;
}
