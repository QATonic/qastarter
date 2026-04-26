/**
 * Shared OpenAPI endpoint types used by both server (template engine)
 * and shared schema validation.
 */

/** A single parameter from the OpenAPI spec (path, query, header, cookie). */
export interface OpenApiParam {
  name: string;
  in: 'path' | 'query' | 'header' | 'cookie';
  required: boolean;
  type: string; // simplified — "string", "integer", "boolean", etc.
  description?: string;
}

/** Simplified request body info. */
export interface OpenApiRequestBody {
  contentType: string; // e.g. "application/json"
  /** Flat key-value of property name → type (best-effort from schema). */
  properties: Record<string, string>;
  required: boolean;
}

/** Simplified response info. */
export interface OpenApiResponseInfo {
  statusCode: string; // "200", "201", "404", etc.
  description: string;
}

/** A parsed endpoint ready for template consumption. */
export interface OpenApiEndpoint {
  /** HTTP method in UPPER CASE: GET, POST, PUT, DELETE, PATCH */
  method: string;
  /** URL path, e.g. /pets/{petId} */
  path: string;
  /** operationId from the spec (or auto-generated) */
  operationId: string;
  /** Human-readable summary (falls back to operationId) */
  summary: string;
  /** Combined path + query + header parameters */
  parameters: OpenApiParam[];
  /** Request body info (null for GET/DELETE) */
  requestBody: OpenApiRequestBody | null;
  /** Response status codes with descriptions */
  responses: OpenApiResponseInfo[];
  /** Tags from the spec (used for grouping tests) */
  tags: string[];
}
