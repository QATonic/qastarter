/**
 * OpenAPI Service
 *
 * Fetches, validates, and parses OpenAPI/Swagger specifications into a
 * simplified endpoint list that templates can iterate over.
 *
 * Safety constraints:
 *   - HTTPS only (blocks http:// URLs)
 *   - Blocks private IP ranges (127.x, 10.x, 192.168.x, etc.)
 *   - 10-second fetch timeout
 *   - 5 MB max spec size
 *   - Max 50 endpoints (truncated with warning)
 *   - 5-minute in-memory cache
 */

import SwaggerParser from '@apidevtools/swagger-parser';

/**
 * Wall-clock cap on SwaggerParser parsing. A crafted spec with deeply nested $refs
 * can burn CPU unboundedly even when the payload is under MAX_SPEC_SIZE.
 * 15 s is generous for legitimate specs; configurable via env.
 */
const PARSE_TIMEOUT_MS = parseInt(process.env.OPENAPI_PARSE_TIMEOUT_MS || '15000', 10);

function validateWithTimeout(input: unknown): Promise<any> {
  return Promise.race([
    // `circular: false` refuses circular $refs outright — cheaper than letting the
    // resolver chase them. Legitimate public APIs don't circularly self-reference.
    SwaggerParser.validate(input as any, { dereference: { circular: false } }),
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`OpenAPI parse timed out after ${PARSE_TIMEOUT_MS} ms`)),
        PARSE_TIMEOUT_MS
      )
    ),
  ]);
}
import type { OpenAPI, OpenAPIV3 } from 'openapi-types';
import type {
  OpenApiEndpoint,
  OpenApiParam,
  OpenApiRequestBody,
  OpenApiResponseInfo,
} from '@shared/openApiTypes';
import { logger } from '../utils/logger';

// ── Cache ───────────────────────────────────────────────────────────
const specCache = new Map<string, { endpoints: OpenApiEndpoint[]; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ENDPOINTS = 50;
const MAX_SPEC_SIZE = 5 * 1024 * 1024; // 5 MB

// ── URL Safety ──────────────────────────────────────────────────────

function isUrlSafe(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;

    const hostname = parsed.hostname;
    // Strip IPv6 brackets for analysis
    const bareHost = hostname.replace(/^\[|\]$/g, '');

    // Block private/reserved IPv4 ranges
    if (
      bareHost === 'localhost' ||
      bareHost.startsWith('127.') ||
      bareHost.startsWith('10.') ||
      bareHost.startsWith('192.168.') ||
      bareHost.startsWith('172.16.') ||
      bareHost.startsWith('172.17.') ||
      bareHost.startsWith('172.18.') ||
      bareHost.startsWith('172.19.') ||
      bareHost.startsWith('172.2') ||
      bareHost.startsWith('172.3') ||
      bareHost === '0.0.0.0' ||
      bareHost.endsWith('.local') ||
      bareHost.endsWith('.internal')
    ) {
      return false;
    }

    // Block private/reserved IPv6 ranges — regex-driven so IPv4-mapped notation
    // (::ffff:a.b.c.d) and AWS IMDS (::ffff:169.254.169.254) can't slip past naive startsWith.
    const lowerHost = bareHost.toLowerCase();
    const ipv6Blocked = [
      /^::1$/,                                             // loopback
      /^::$/,                                              // unspecified
      /^fc[0-9a-f]{2}:/,                                   // fc00::/7 unique local
      /^fd[0-9a-f]{2}:/,                                   // fd00::/8 unique local
      /^fe[89ab][0-9a-f]:/,                                // fe80::/10 link-local
      /^ff[0-9a-f]{2}:/,                                   // ff00::/8 multicast
      // IPv4-mapped IPv6: ::ffff:<private-ipv4>
      /^::ffff:127\./,                                     // loopback
      /^::ffff:10\./,                                      // 10/8
      /^::ffff:169\.254\./,                                // link-local / cloud metadata (AWS IMDS)
      /^::ffff:192\.168\./,                                // 192.168/16
      /^::ffff:172\.(1[6-9]|2\d|3[01])\./,                 // 172.16/12
      /^::ffff:0\.0\.0\.0$/,                               // unspecified mapped
    ];
    if (ipv6Blocked.some((re) => re.test(lowerHost))) {
      return false;
    }

    // Block IMDS + link-local IPv4 ranges missed above.
    if (bareHost.startsWith('169.254.')) {                 // AWS IMDS, GCP, Azure metadata
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

// ── Schema Helpers ──────────────────────────────────────────────────

function resolveSchemaType(schema: any): string {
  if (!schema) return 'any';
  if (schema.type) return schema.type as string;
  if (schema.oneOf || schema.anyOf) return 'object';
  if (schema.allOf) return 'object';
  if (schema.$ref) return 'object';
  return 'any';
}

function extractProperties(schema: any): Record<string, string> {
  const props: Record<string, string> = {};
  if (!schema?.properties) return props;

  for (const [name, propSchema] of Object.entries(schema.properties)) {
    props[name] = resolveSchemaType(propSchema);
  }
  return props;
}

function toOperationId(method: string, path: string): string {
  // Generate a camelCase operationId from method + path
  const parts = path
    .replace(/[{}]/g, '')
    .split(/[/\-_.]/)
    .filter(Boolean);
  const joined = parts
    .map((p, i) => (i === 0 ? p.toLowerCase() : p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()))
    .join('');
  return `${method.toLowerCase()}${joined.charAt(0).toUpperCase()}${joined.slice(1)}`;
}

// ── Main Parser ─────────────────────────────────────────────────────

function parseOpenApiSpec(api: OpenAPI.Document): OpenApiEndpoint[] {
  const endpoints: OpenApiEndpoint[] = [];
  const spec = api as OpenAPIV3.Document;

  if (!spec.paths) return endpoints;

  const methods: (keyof OpenAPIV3.PathItemObject)[] = [
    'get',
    'post',
    'put',
    'delete',
    'patch',
  ];

  for (const [pathStr, pathItem] of Object.entries(spec.paths)) {
    if (!pathItem) continue;

    for (const method of methods) {
      const operation = (pathItem as any)[method] as OpenAPIV3.OperationObject | undefined;
      if (!operation) continue;

      if (endpoints.length >= MAX_ENDPOINTS) {
        logger.warn(`Truncated OpenAPI endpoints at ${MAX_ENDPOINTS}`, { path: pathStr });
        return endpoints;
      }

      // Parameters
      const params: OpenApiParam[] = [];
      const allParams = [
        ...((pathItem as any).parameters || []),
        ...(operation.parameters || []),
      ];
      for (const p of allParams) {
        const param = p as OpenAPIV3.ParameterObject;
        params.push({
          name: param.name,
          in: param.in as OpenApiParam['in'],
          required: param.required ?? false,
          type: resolveSchemaType((param as any).schema),
          description: param.description,
        });
      }

      // Request body
      let requestBody: OpenApiRequestBody | null = null;
      if (operation.requestBody) {
        const body = operation.requestBody as OpenAPIV3.RequestBodyObject;
        const jsonContent = body.content?.['application/json'];
        if (jsonContent?.schema) {
          requestBody = {
            contentType: 'application/json',
            properties: extractProperties(jsonContent.schema),
            required: body.required ?? false,
          };
        } else {
          // Take first content type
          const firstType = Object.keys(body.content || {})[0];
          if (firstType) {
            requestBody = {
              contentType: firstType,
              properties: extractProperties((body.content as any)?.[firstType]?.schema),
              required: body.required ?? false,
            };
          }
        }
      }

      // Responses
      const responses: OpenApiResponseInfo[] = [];
      if (operation.responses) {
        for (const [statusCode, resp] of Object.entries(operation.responses)) {
          const response = resp as OpenAPIV3.ResponseObject;
          responses.push({
            statusCode,
            description: response.description || '',
          });
        }
      }

      endpoints.push({
        method: method.toUpperCase(),
        path: pathStr,
        operationId: operation.operationId || toOperationId(method, pathStr),
        summary: operation.summary || operation.operationId || `${method.toUpperCase()} ${pathStr}`,
        parameters: params,
        requestBody,
        responses,
        tags: operation.tags || [],
      });
    }
  }

  return endpoints;
}

// ── Public API ──────────────────────────────────────────────────────

/**
 * Fetch and parse an OpenAPI/Swagger spec from a URL.
 * Returns an array of simplified endpoints for template generation.
 *
 * Returns null if parsing fails (caller should fall back to default stubs).
 */
export async function parseOpenApiFromUrl(
  specUrl: string
): Promise<OpenApiEndpoint[] | null> {
  // Validate URL safety
  if (!isUrlSafe(specUrl)) {
    logger.warn('Rejected unsafe OpenAPI URL', { url: specUrl });
    return null;
  }

  // Check cache
  const cached = specCache.get(specUrl);
  if (cached && Date.now() < cached.expiresAt) {
    logger.debug('OpenAPI cache hit', { url: specUrl });
    return cached.endpoints;
  }

  try {
    // Fetch with size limit and timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(specUrl, {
      signal: controller.signal,
      headers: { Accept: 'application/json, application/yaml, text/yaml' },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      logger.warn('Failed to fetch OpenAPI spec', { url: specUrl, status: response.status });
      return null;
    }

    // Check content length
    const contentLength = Number(response.headers.get('content-length') || 0);
    if (contentLength > MAX_SPEC_SIZE) {
      logger.warn('OpenAPI spec too large', { url: specUrl, size: contentLength });
      return null;
    }

    const text = await response.text();
    if (text.length > MAX_SPEC_SIZE) {
      logger.warn('OpenAPI spec body too large', { url: specUrl, size: text.length });
      return null;
    }

    // Parse and validate with swagger-parser (handles $ref resolution).
    // SwaggerParser.validate() accepts both JSON objects and raw YAML strings,
    // so we try JSON.parse first, then fall back to passing the raw text for YAML.
    let specInput: any;
    try {
      specInput = JSON.parse(text);
    } catch {
      // Not valid JSON — pass raw text (YAML) to swagger-parser
      specInput = text;
    }

    const api = await validateWithTimeout(specInput);

    const endpoints = parseOpenApiSpec(api);

    // Cache result
    specCache.set(specUrl, {
      endpoints,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    logger.info('Parsed OpenAPI spec', { url: specUrl, endpointCount: endpoints.length });
    return endpoints;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorType =
      error instanceof TypeError || (error instanceof Error && error.name === 'AbortError')
        ? 'network'
        : 'parse';
    logger.warn(`Failed to ${errorType === 'network' ? 'fetch' : 'parse'} OpenAPI spec`, {
      url: specUrl,
      errorType,
      error: errorMessage,
    });
    return null;
  }
}

/**
 * Parse an OpenAPI spec from a raw JSON/YAML string (for testing).
 */
export async function parseOpenApiFromString(
  specContent: string
): Promise<OpenApiEndpoint[] | null> {
  try {
    const parsed = JSON.parse(specContent);
    const api = await validateWithTimeout(parsed);
    return parseOpenApiSpec(api);
  } catch (error) {
    logger.warn('Failed to parse OpenAPI string', {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Clear the spec cache (for testing).
 */
export function clearOpenApiCache(): void {
  specCache.clear();
}
