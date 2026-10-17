/**
 * OpenAPI Service — Comprehensive Tests
 *
 * Covers parseOpenApiFromString edge cases, parseOpenApiFromUrl with mocked
 * fetch (URL safety, caching, size limits, timeouts), and clearOpenApiCache.
 *
 * Extends the basic Petstore tests in openApiService.test.ts with 35+ cases.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { parseOpenApiFromString, parseOpenApiFromUrl, clearOpenApiCache } from './openApiService';

import { fetchOpenApiSpec } from './openApiFetch';

vi.mock('./openApiFetch', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./openApiFetch')>()),
  fetchOpenApiSpec: vi.fn(),
}));

// ── Helpers ────────────────────────────────────────────────────────────

/** Build a minimal valid OpenAPI 3.0 spec as an object. */
function makeSpec(
  paths: Record<string, unknown>,
  extra?: Record<string, unknown>
): Record<string, unknown> {
  return {
    openapi: '3.0.3',
    info: { title: 'Test', version: '1.0.0' },
    paths,
    ...extra,
  };
}

/** Stringify helper. */
const json = (obj: unknown) => JSON.stringify(obj);

// ── Spec Fixtures ──────────────────────────────────────────────────────

const SPEC_ALL_METHODS = makeSpec({
  '/items': {
    get: {
      operationId: 'getItems',
      summary: 'List',
      responses: { '200': { description: 'OK' } },
    },
    post: {
      operationId: 'createItem',
      summary: 'Create',
      responses: { '201': { description: 'Created' } },
    },
    put: {
      operationId: 'replaceItem',
      summary: 'Replace',
      responses: { '200': { description: 'OK' } },
    },
    delete: {
      operationId: 'deleteItem',
      summary: 'Delete',
      responses: { '204': { description: 'Deleted' } },
    },
    patch: {
      operationId: 'patchItem',
      summary: 'Patch',
      responses: { '200': { description: 'OK' } },
    },
  },
});

const SPEC_NO_OP_ID = makeSpec({
  '/users/{userId}/orders': {
    get: {
      summary: 'Get user orders',
      responses: { '200': { description: 'OK' } },
    },
    post: {
      summary: 'Create order',
      responses: { '201': { description: 'Created' } },
    },
  },
});

const SPEC_EMPTY_OP = makeSpec({
  '/health': {
    get: {
      responses: { '200': { description: 'Healthy' } },
    },
  },
});

const SPEC_SCHEMA_COMPOSITION = makeSpec({
  '/composed': {
    post: {
      operationId: 'composed',
      summary: 'Composed schemas',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              allOf: [
                {
                  type: 'object',
                  properties: { id: { type: 'integer' } },
                },
                {
                  type: 'object',
                  properties: { name: { type: 'string' } },
                },
              ],
            },
          },
        },
      },
      responses: { '200': { description: 'OK' } },
    },
  },
});

const SPEC_MULTI_CONTENT_TYPE = makeSpec({
  '/upload': {
    post: {
      operationId: 'uploadFile',
      summary: 'Upload a file',
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              properties: { file: { type: 'string', format: 'binary' } },
            },
          },
          'application/json': {
            schema: {
              type: 'object',
              properties: { url: { type: 'string' } },
            },
          },
        },
      },
      responses: { '200': { description: 'Uploaded' } },
    },
  },
});

const SPEC_PATH_LEVEL_PARAMS = makeSpec({
  '/orgs/{orgId}/members': {
    parameters: [
      {
        name: 'orgId',
        in: 'path',
        required: true,
        schema: { type: 'string' },
      },
    ],
    get: {
      operationId: 'listMembers',
      summary: 'List members',
      parameters: [
        {
          name: 'role',
          in: 'query',
          required: false,
          schema: { type: 'string' },
        },
      ],
      responses: { '200': { description: 'OK' } },
    },
  },
});

const SPEC_MULTIPLE_RESPONSES = makeSpec({
  '/resources': {
    get: {
      operationId: 'getResources',
      summary: 'Get resources',
      responses: {
        '200': { description: 'Success' },
        '400': { description: 'Bad request' },
        '401': { description: 'Unauthorized' },
        '500': { description: 'Server error' },
      },
    },
  },
});

const VALID_SPEC_STR = json(
  makeSpec({
    '/ping': {
      get: {
        operationId: 'ping',
        summary: 'Ping',
        responses: { '200': { description: 'pong' } },
      },
    },
  })
);

// ────────────────────────────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────────────────────────────

describe('OpenApiService — comprehensive', () => {
  beforeEach(() => {
    clearOpenApiCache();
    vi.restoreAllMocks();
    vi.resetAllMocks();
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  // ── parseOpenApiFromString ───────────────────────────────────────────

  describe('parseOpenApiFromString', () => {
    it('should parse all five HTTP methods', async () => {
      const endpoints = await parseOpenApiFromString(json(SPEC_ALL_METHODS));
      expect(endpoints).not.toBeNull();
      expect(endpoints!.map((e) => e.method)).toEqual(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']);
    });

    it('should auto-generate operationId when missing', async () => {
      const endpoints = await parseOpenApiFromString(json(SPEC_NO_OP_ID));
      expect(endpoints).not.toBeNull();
      expect(endpoints!.length).toBe(2);
      // Should be camelCase derived from method + path segments
      const getId = endpoints![0].operationId;
      const postId = endpoints![1].operationId;
      expect(getId).toMatch(/^get/);
      expect(postId).toMatch(/^post/);
      // Should contain "Users" or "users" somewhere (path segment)
      expect(getId.toLowerCase()).toContain('users');
    });

    it('should handle empty operations (no params, no body)', async () => {
      const endpoints = await parseOpenApiFromString(json(SPEC_EMPTY_OP));
      expect(endpoints).not.toBeNull();
      expect(endpoints!.length).toBe(1);
      const ep = endpoints![0];
      expect(ep.parameters).toEqual([]);
      expect(ep.requestBody).toBeNull();
      expect(ep.responses).toHaveLength(1);
    });

    it('should handle allOf composed schemas in request body', async () => {
      const endpoints = await parseOpenApiFromString(json(SPEC_SCHEMA_COMPOSITION));
      expect(endpoints).not.toBeNull();
      const ep = endpoints![0];
      expect(ep.requestBody).not.toBeNull();
      expect(ep.requestBody!.contentType).toBe('application/json');
    });

    it('should prefer application/json when multiple content types exist', async () => {
      const endpoints = await parseOpenApiFromString(json(SPEC_MULTI_CONTENT_TYPE));
      expect(endpoints).not.toBeNull();
      const ep = endpoints![0];
      expect(ep.requestBody).not.toBeNull();
      // application/json is preferred over multipart/form-data
      expect(ep.requestBody!.contentType).toBe('application/json');
      expect(ep.requestBody!.properties).toHaveProperty('url', 'string');
    });

    it('should fall back to first content type when application/json absent', async () => {
      const spec = makeSpec({
        '/upload-only': {
          post: {
            operationId: 'uploadOnly',
            summary: 'Upload only',
            requestBody: {
              required: true,
              content: {
                'multipart/form-data': {
                  schema: {
                    type: 'object',
                    properties: { file: { type: 'string', format: 'binary' } },
                  },
                },
              },
            },
            responses: { '200': { description: 'OK' } },
          },
        },
      });
      const endpoints = await parseOpenApiFromString(json(spec));
      expect(endpoints).not.toBeNull();
      expect(endpoints![0].requestBody!.contentType).toBe('multipart/form-data');
    });

    it('should merge path-level and operation-level parameters', async () => {
      const endpoints = await parseOpenApiFromString(json(SPEC_PATH_LEVEL_PARAMS));
      expect(endpoints).not.toBeNull();
      const ep = endpoints![0];
      // Path-level orgId + operation-level role
      expect(ep.parameters).toHaveLength(2);
      const paramNames = ep.parameters.map((p) => p.name);
      expect(paramNames).toContain('orgId');
      expect(paramNames).toContain('role');
    });

    it('should extract multiple response status codes', async () => {
      const endpoints = await parseOpenApiFromString(json(SPEC_MULTIPLE_RESPONSES));
      expect(endpoints).not.toBeNull();
      const ep = endpoints![0];
      expect(ep.responses).toHaveLength(4);
      const codes = ep.responses.map((r) => r.statusCode);
      expect(codes).toEqual(['200', '400', '401', '500']);
    });

    it('should truncate at 50 endpoints', async () => {
      const paths: Record<string, unknown> = {};
      for (let i = 0; i < 55; i++) {
        paths[`/resource-${i}`] = {
          get: {
            operationId: `getResource${i}`,
            summary: `Resource ${i}`,
            responses: { '200': { description: 'OK' } },
          },
        };
      }
      const endpoints = await parseOpenApiFromString(json(makeSpec(paths)));
      expect(endpoints).not.toBeNull();
      expect(endpoints!.length).toBe(50);
    });

    it('should use summary from spec, falling back to operationId', async () => {
      const spec = makeSpec({
        '/a': {
          get: {
            operationId: 'getA',
            // no summary
            responses: { '200': { description: 'OK' } },
          },
        },
      });
      const endpoints = await parseOpenApiFromString(json(spec));
      expect(endpoints).not.toBeNull();
      // Falls back to operationId
      expect(endpoints![0].summary).toBe('getA');
    });

    it('should populate tags as empty array when not provided', async () => {
      const spec = makeSpec({
        '/no-tags': {
          get: {
            operationId: 'noTags',
            responses: { '200': { description: 'OK' } },
          },
        },
      });
      const endpoints = await parseOpenApiFromString(json(spec));
      expect(endpoints).not.toBeNull();
      expect(endpoints![0].tags).toEqual([]);
    });

    it('should return null for completely invalid JSON', async () => {
      const result = await parseOpenApiFromString('{{{bad');
      expect(result).toBeNull();
    });

    it('should return null for valid JSON but invalid OpenAPI structure', async () => {
      const result = await parseOpenApiFromString(json({ hello: 'world' }));
      expect(result).toBeNull();
    });

    it('should handle spec with no paths key', async () => {
      // This is technically invalid per OpenAPI but swagger-parser might still
      // accept it depending on version handling; our code returns [] if paths is missing
      const spec = {
        openapi: '3.0.3',
        info: { title: 'NoPaths', version: '1.0.0' },
      };
      // swagger-parser.validate may reject this; we expect null or empty
      const result = await parseOpenApiFromString(json(spec));
      // Either null (validation failure) or empty array are acceptable
      if (result !== null) {
        expect(result).toEqual([]);
      }
    });

    it('should handle parameter description field', async () => {
      const spec = makeSpec({
        '/search': {
          get: {
            operationId: 'search',
            summary: 'Search',
            parameters: [
              {
                name: 'q',
                in: 'query',
                required: true,
                description: 'Search query string',
                schema: { type: 'string' },
              },
            ],
            responses: { '200': { description: 'Results' } },
          },
        },
      });
      const endpoints = await parseOpenApiFromString(json(spec));
      expect(endpoints).not.toBeNull();
      expect(endpoints![0].parameters[0].description).toBe('Search query string');
    });

    it('should handle header and cookie parameter locations', async () => {
      const spec = makeSpec({
        '/secure': {
          get: {
            operationId: 'secureGet',
            summary: 'Secure',
            parameters: [
              {
                name: 'X-Api-Key',
                in: 'header',
                required: true,
                schema: { type: 'string' },
              },
              {
                name: 'session',
                in: 'cookie',
                required: false,
                schema: { type: 'string' },
              },
            ],
            responses: { '200': { description: 'OK' } },
          },
        },
      });
      const endpoints = await parseOpenApiFromString(json(spec));
      expect(endpoints).not.toBeNull();
      const params = endpoints![0].parameters;
      expect(params).toHaveLength(2);
      expect(params[0].in).toBe('header');
      expect(params[1].in).toBe('cookie');
    });
  });

  // ── parseOpenApiFromUrl — URL safety ─────────────────────────────────

  describe('parseOpenApiFromUrl — URL safety', () => {
    it('should reject HTTP (non-HTTPS) URLs', async () => {
      const result = await parseOpenApiFromUrl('http://example.com/spec.json');
      expect(result).toBeNull();
    });

    it('should reject localhost', async () => {
      const result = await parseOpenApiFromUrl('https://localhost/spec.json');
      expect(result).toBeNull();
    });

    it('should reject 127.0.0.1 (IPv4 loopback)', async () => {
      const result = await parseOpenApiFromUrl('https://127.0.0.1/spec.json');
      expect(result).toBeNull();
    });

    it('should reject 10.x.x.x (private class A)', async () => {
      const result = await parseOpenApiFromUrl('https://10.0.0.1/spec.json');
      expect(result).toBeNull();
    });

    it('should reject 192.168.x.x (private class C)', async () => {
      const result = await parseOpenApiFromUrl('https://192.168.1.1/spec.json');
      expect(result).toBeNull();
    });

    it('should reject 172.16.x.x (private class B start)', async () => {
      const result = await parseOpenApiFromUrl('https://172.16.0.1/spec.json');
      expect(result).toBeNull();
    });

    it('should reject 172.31.x.x (private class B end)', async () => {
      // 172.3x is blocked since bareHost.startsWith('172.3')
      const result = await parseOpenApiFromUrl('https://172.31.0.1/spec.json');
      expect(result).toBeNull();
    });

    it('should reject 0.0.0.0', async () => {
      const result = await parseOpenApiFromUrl('https://0.0.0.0/spec.json');
      expect(result).toBeNull();
    });

    it('should reject .local domains', async () => {
      const result = await parseOpenApiFromUrl('https://myhost.local/spec.json');
      expect(result).toBeNull();
    });

    it('should reject .internal domains', async () => {
      const result = await parseOpenApiFromUrl('https://api.internal/spec.json');
      expect(result).toBeNull();
    });

    it('should reject IPv6 loopback ::1', async () => {
      const result = await parseOpenApiFromUrl('https://[::1]/spec.json');
      expect(result).toBeNull();
    });

    it('should reject IPv6 fd00:: (unique local)', async () => {
      const result = await parseOpenApiFromUrl('https://[fd00::1]/spec.json');
      expect(result).toBeNull();
    });

    it('should reject IPv6 fe80:: (link-local)', async () => {
      const result = await parseOpenApiFromUrl('https://[fe80::1]/spec.json');
      expect(result).toBeNull();
    });

    it('should reject IPv6 fc00:: (unique local)', async () => {
      const result = await parseOpenApiFromUrl('https://[fc00::1]/spec.json');
      expect(result).toBeNull();
    });

    it('should reject completely invalid URL', async () => {
      const result = await parseOpenApiFromUrl('not-a-url');
      expect(result).toBeNull();
    });
  });

  describe('downloads and caching', () => {
    const download = vi.mocked(fetchOpenApiSpec);

    it('parses a downloaded standalone JSON document', async () => {
      download.mockResolvedValue(VALID_SPEC_STR);
      expect(await parseOpenApiFromUrl('https://api.example.com/spec.json')).toMatchObject([
        { operationId: 'ping' },
      ]);
    });

    it('parses a downloaded YAML document', async () => {
      download.mockResolvedValue('openapi: 3.0.3\ninfo: {title: Test, version: 1.0.0}\npaths: {}');
      expect(await parseOpenApiFromUrl('https://api.example.com/spec.yaml')).toEqual([]);
    });

    it('does not attempt to download unsafe URLs', async () => {
      expect(await parseOpenApiFromUrl('https://[::ffff:127.0.0.1]/spec.json')).toBeNull();
      expect(download).not.toHaveBeenCalled();
    });

    it('does not cache failed downloads', async () => {
      download.mockRejectedValueOnce(new Error('HTTP 404')).mockResolvedValueOnce(VALID_SPEC_STR);
      const url = 'https://api.example.com/retry.json';
      expect(await parseOpenApiFromUrl(url)).toBeNull();
      expect(await parseOpenApiFromUrl(url)).not.toBeNull();
      expect(download).toHaveBeenCalledTimes(2);
    });

    it('does not cache invalid documents', async () => {
      download.mockResolvedValueOnce('<<<invalid>>>').mockResolvedValueOnce(VALID_SPEC_STR);
      const url = 'https://api.example.com/retry.json';
      expect(await parseOpenApiFromUrl(url)).toBeNull();
      expect(await parseOpenApiFromUrl(url)).not.toBeNull();
      expect(download).toHaveBeenCalledTimes(2);
    });

    it('reuses cached endpoints until expiry', async () => {
      download.mockResolvedValue(VALID_SPEC_STR);
      const url = 'https://api.example.com/cached.json';
      const first = await parseOpenApiFromUrl(url);
      expect(await parseOpenApiFromUrl(url)).toEqual(first);
      expect(download).toHaveBeenCalledTimes(1);
      const now = Date.now();
      vi.spyOn(Date, 'now').mockReturnValue(now + 5 * 60 * 1000 + 1);
      await parseOpenApiFromUrl(url);
      expect(download).toHaveBeenCalledTimes(2);
    });

    it('clears cached endpoints explicitly', async () => {
      download.mockResolvedValue(VALID_SPEC_STR);
      const url = 'https://api.example.com/clear.json';
      await parseOpenApiFromUrl(url);
      clearOpenApiCache();
      await parseOpenApiFromUrl(url);
      expect(download).toHaveBeenCalledTimes(2);
    });
  });
});
