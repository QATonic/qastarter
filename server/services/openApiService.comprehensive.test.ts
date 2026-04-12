/**
 * OpenAPI Service — Comprehensive Tests
 *
 * Covers parseOpenApiFromString edge cases, parseOpenApiFromUrl with mocked
 * fetch (URL safety, caching, size limits, timeouts), and clearOpenApiCache.
 *
 * Extends the basic Petstore tests in openApiService.test.ts with 35+ cases.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  parseOpenApiFromString,
  parseOpenApiFromUrl,
  clearOpenApiCache,
} from './openApiService';

// ── Helpers ────────────────────────────────────────────────────────────

/** Build a minimal valid OpenAPI 3.0 spec as an object. */
function makeSpec(
  paths: Record<string, any>,
  extra?: Record<string, any>,
): Record<string, any> {
  return {
    openapi: '3.0.3',
    info: { title: 'Test', version: '1.0.0' },
    paths,
    ...extra,
  };
}

/** Stringify helper. */
const json = (obj: any) => JSON.stringify(obj);

/** Create a mock Response. */
function mockResponse(
  body: string,
  opts?: { status?: number; headers?: Record<string, string> },
): Response {
  const status = opts?.status ?? 200;
  const headers = new Headers(opts?.headers ?? {});
  return {
    ok: status >= 200 && status < 300,
    status,
    headers,
    text: () => Promise.resolve(body),
  } as unknown as Response;
}

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

const VALID_SPEC_STR = json(makeSpec({
  '/ping': {
    get: {
      operationId: 'ping',
      summary: 'Ping',
      responses: { '200': { description: 'pong' } },
    },
  },
}));

// ────────────────────────────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────────────────────────────

describe('OpenApiService — comprehensive', () => {
  beforeEach(() => {
    clearOpenApiCache();
    vi.restoreAllMocks();
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
      expect(endpoints!.map((e) => e.method)).toEqual([
        'GET',
        'POST',
        'PUT',
        'DELETE',
        'PATCH',
      ]);
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
      const paths: Record<string, any> = {};
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

  // ── parseOpenApiFromUrl — fetch behaviour ────────────────────────────

  describe('parseOpenApiFromUrl — fetch behaviour', () => {
    let mockFetch: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      clearOpenApiCache();
      mockFetch = vi.fn();
      vi.stubGlobal('fetch', mockFetch);
    });

    it('should parse a successfully fetched JSON spec', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(VALID_SPEC_STR));
      const result = await parseOpenApiFromUrl('https://api.example.com/openapi.json');
      expect(result).not.toBeNull();
      expect(result!.length).toBe(1);
      expect(result![0].operationId).toBe('ping');
    });

    it('should send Accept header including yaml', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(VALID_SPEC_STR));
      await parseOpenApiFromUrl('https://api.example.com/openapi.json');
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const callArgs = mockFetch.mock.calls[0];
      const headers = callArgs[1]?.headers;
      expect(headers?.Accept).toContain('yaml');
    });

    it('should return null when response is not OK (404)', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse('Not Found', { status: 404 }));
      const result = await parseOpenApiFromUrl('https://api.example.com/spec.json');
      expect(result).toBeNull();
    });

    it('should return null when response is not OK (500)', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse('Internal Server Error', { status: 500 }),
      );
      const result = await parseOpenApiFromUrl('https://api.example.com/spec.json');
      expect(result).toBeNull();
    });

    it('should return null when Content-Length exceeds 5 MB', async () => {
      const sixMB = (6 * 1024 * 1024).toString();
      mockFetch.mockResolvedValueOnce(
        mockResponse('{}', { headers: { 'content-length': sixMB } }),
      );
      const result = await parseOpenApiFromUrl('https://api.example.com/spec.json');
      expect(result).toBeNull();
    });

    it('should return null when response body exceeds 5 MB', async () => {
      // No content-length header but body is huge
      const hugeBody = 'x'.repeat(5 * 1024 * 1024 + 1);
      mockFetch.mockResolvedValueOnce(mockResponse(hugeBody));
      const result = await parseOpenApiFromUrl('https://api.example.com/spec.json');
      expect(result).toBeNull();
    });

    it('should return null when response body is invalid JSON/YAML', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse('<<<not valid>>>'));
      const result = await parseOpenApiFromUrl('https://api.example.com/spec.json');
      expect(result).toBeNull();
    });

    it('should return null on network/fetch error', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('fetch failed'));
      const result = await parseOpenApiFromUrl('https://api.example.com/spec.json');
      expect(result).toBeNull();
    });

    it('should return null on abort (timeout simulation)', async () => {
      const abortError = new DOMException('The operation was aborted', 'AbortError');
      // Replace the name property since DOMException constructor sets it
      mockFetch.mockRejectedValueOnce(abortError);
      const result = await parseOpenApiFromUrl('https://api.example.com/spec.json');
      expect(result).toBeNull();
    });

    it('should pass an AbortSignal to fetch', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(VALID_SPEC_STR));
      await parseOpenApiFromUrl('https://api.example.com/openapi.json');
      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[1]).toHaveProperty('signal');
      expect(callArgs[1].signal).toBeInstanceOf(AbortSignal);
    });
  });

  // ── Caching ──────────────────────────────────────────────────────────

  describe('parseOpenApiFromUrl — caching', () => {
    let mockFetch: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      clearOpenApiCache();
      mockFetch = vi.fn();
      vi.stubGlobal('fetch', mockFetch);
    });

    it('should return cached result on second call (no re-fetch)', async () => {
      mockFetch.mockResolvedValue(mockResponse(VALID_SPEC_STR));

      const url = 'https://api.example.com/cached-spec.json';
      const first = await parseOpenApiFromUrl(url);
      const second = await parseOpenApiFromUrl(url);

      expect(first).toEqual(second);
      // fetch should only have been called once
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should re-fetch after cache expiry', async () => {
      vi.useFakeTimers();
      mockFetch.mockResolvedValue(mockResponse(VALID_SPEC_STR));

      const url = 'https://api.example.com/expiring-spec.json';
      await parseOpenApiFromUrl(url);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Advance past the 5-minute TTL
      vi.advanceTimersByTime(5 * 60 * 1000 + 1);

      await parseOpenApiFromUrl(url);
      expect(mockFetch).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });

    it('should not cache failed requests', async () => {
      mockFetch
        .mockResolvedValueOnce(mockResponse('Not Found', { status: 404 }))
        .mockResolvedValueOnce(mockResponse(VALID_SPEC_STR));

      const url = 'https://api.example.com/retry-spec.json';
      const first = await parseOpenApiFromUrl(url);
      expect(first).toBeNull();

      const second = await parseOpenApiFromUrl(url);
      expect(second).not.toBeNull();
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  // ── clearOpenApiCache ────────────────────────────────────────────────

  describe('clearOpenApiCache', () => {
    let mockFetch: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      clearOpenApiCache();
      mockFetch = vi.fn();
      vi.stubGlobal('fetch', mockFetch);
    });

    it('should force re-fetch after cache is cleared', async () => {
      mockFetch.mockResolvedValue(mockResponse(VALID_SPEC_STR));

      const url = 'https://api.example.com/cleared-spec.json';
      await parseOpenApiFromUrl(url);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      clearOpenApiCache();

      await parseOpenApiFromUrl(url);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});
