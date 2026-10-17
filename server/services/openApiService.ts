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

import { fetchOpenApiSpec, isOpenApiUrlSafe } from './openApiFetch';
import { validateOpenApiContent } from './openApiParser';
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

// ── Schema Helpers ──────────────────────────────────────────────────

function resolveSchemaType(
  schema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject | undefined
): string {
  if (!schema) return 'any';
  if ('$ref' in schema) return 'object';
  if (schema.type) return schema.type as string;
  if (schema.oneOf || schema.anyOf) return 'object';
  if (schema.allOf) return 'object';
  return 'any';
}

function extractProperties(
  schema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject | undefined
): Record<string, string> {
  const props: Record<string, string> = {};
  if (!schema || '$ref' in schema || !schema.properties) return props;

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
    .map((p, i) =>
      i === 0 ? p.toLowerCase() : p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()
    )
    .join('');
  return `${method.toLowerCase()}${joined.charAt(0).toUpperCase()}${joined.slice(1)}`;
}

// ── Main Parser ─────────────────────────────────────────────────────

function parseOpenApiSpec(api: OpenAPI.Document): OpenApiEndpoint[] {
  const endpoints: OpenApiEndpoint[] = [];
  const spec = api as OpenAPIV3.Document;

  if (!spec.paths) return endpoints;

  const methods = ['get', 'post', 'put', 'delete', 'patch'] as const;

  for (const [pathStr, pathItem] of Object.entries(spec.paths)) {
    if (!pathItem) continue;

    for (const method of methods) {
      const operation = pathItem[method] as OpenAPIV3.OperationObject | undefined;
      if (!operation) continue;

      if (endpoints.length >= MAX_ENDPOINTS) {
        logger.warn(`Truncated OpenAPI endpoints at ${MAX_ENDPOINTS}`, { path: pathStr });
        return endpoints;
      }

      // Parameters
      const params: OpenApiParam[] = [];
      const allParams = [...(pathItem.parameters || []), ...(operation.parameters || [])];
      for (const p of allParams) {
        const param = p as OpenAPIV3.ParameterObject;
        params.push({
          name: param.name,
          in: param.in as OpenApiParam['in'],
          required: param.required ?? false,
          type: resolveSchemaType(param.schema),
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
              properties: extractProperties(body.content?.[firstType]?.schema),
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
 * Returns null if parsing fails; generation rejects the requested specification.
 */
export async function parseOpenApiFromUrl(specUrl: string): Promise<OpenApiEndpoint[] | null> {
  // Validate URL safety
  if (!isOpenApiUrlSafe(specUrl)) {
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
    const text = await fetchOpenApiSpec(specUrl);
    const api = await validateOpenApiContent(text);

    const endpoints = parseOpenApiSpec(api);

    // Cache result
    specCache.forEach((entry, key) => {
      if (Date.now() >= entry.expiresAt) specCache.delete(key);
    });
    if (specCache.size >= 100) specCache.delete(specCache.keys().next().value!);
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
    const api = await validateOpenApiContent(specContent);
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
