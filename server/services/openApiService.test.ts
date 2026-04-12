/**
 * OpenAPI Service Tests
 *
 * Tests the parsing logic using a minimal Petstore-like spec.
 * URL fetching is tested via the parseOpenApiFromString helper.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { parseOpenApiFromString, clearOpenApiCache } from './openApiService';

const PETSTORE_SPEC = JSON.stringify({
  openapi: '3.0.3',
  info: { title: 'Petstore', version: '1.0.0' },
  paths: {
    '/pets': {
      get: {
        operationId: 'listPets',
        summary: 'List all pets',
        tags: ['pets'],
        parameters: [
          {
            name: 'limit',
            in: 'query',
            required: false,
            schema: { type: 'integer' },
          },
        ],
        responses: {
          '200': { description: 'A list of pets' },
        },
      },
      post: {
        operationId: 'createPet',
        summary: 'Create a pet',
        tags: ['pets'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  tag: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Pet created' },
        },
      },
    },
    '/pets/{petId}': {
      get: {
        operationId: 'showPetById',
        summary: 'Get a pet by ID',
        tags: ['pets'],
        parameters: [
          {
            name: 'petId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': { description: 'A single pet' },
          '404': { description: 'Pet not found' },
        },
      },
      delete: {
        operationId: 'deletePet',
        summary: 'Delete a pet',
        tags: ['pets'],
        parameters: [
          {
            name: 'petId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '204': { description: 'Pet deleted' },
        },
      },
    },
  },
});

describe('OpenApiService', () => {
  beforeEach(() => {
    clearOpenApiCache();
  });

  describe('parseOpenApiFromString', () => {
    it('should parse a valid Petstore spec', async () => {
      const endpoints = await parseOpenApiFromString(PETSTORE_SPEC);
      expect(endpoints).not.toBeNull();
      expect(endpoints!.length).toBe(4);
    });

    it('should extract correct endpoint methods', async () => {
      const endpoints = await parseOpenApiFromString(PETSTORE_SPEC);
      const methods = endpoints!.map((e) => e.method);
      expect(methods).toEqual(['GET', 'POST', 'GET', 'DELETE']);
    });

    it('should extract correct paths', async () => {
      const endpoints = await parseOpenApiFromString(PETSTORE_SPEC);
      const paths = endpoints!.map((e) => e.path);
      expect(paths).toEqual(['/pets', '/pets', '/pets/{petId}', '/pets/{petId}']);
    });

    it('should extract operationIds', async () => {
      const endpoints = await parseOpenApiFromString(PETSTORE_SPEC);
      const ids = endpoints!.map((e) => e.operationId);
      expect(ids).toEqual(['listPets', 'createPet', 'showPetById', 'deletePet']);
    });

    it('should extract query parameters', async () => {
      const endpoints = await parseOpenApiFromString(PETSTORE_SPEC);
      const listPets = endpoints!.find((e) => e.operationId === 'listPets')!;
      expect(listPets.parameters).toHaveLength(1);
      expect(listPets.parameters[0]).toMatchObject({
        name: 'limit',
        in: 'query',
        required: false,
        type: 'integer',
      });
    });

    it('should extract path parameters', async () => {
      const endpoints = await parseOpenApiFromString(PETSTORE_SPEC);
      const showPet = endpoints!.find((e) => e.operationId === 'showPetById')!;
      expect(showPet.parameters).toHaveLength(1);
      expect(showPet.parameters[0]).toMatchObject({
        name: 'petId',
        in: 'path',
        required: true,
        type: 'string',
      });
    });

    it('should extract request body for POST', async () => {
      const endpoints = await parseOpenApiFromString(PETSTORE_SPEC);
      const createPet = endpoints!.find((e) => e.operationId === 'createPet')!;
      expect(createPet.requestBody).not.toBeNull();
      expect(createPet.requestBody!.contentType).toBe('application/json');
      expect(createPet.requestBody!.required).toBe(true);
      expect(createPet.requestBody!.properties).toHaveProperty('name', 'string');
      expect(createPet.requestBody!.properties).toHaveProperty('tag', 'string');
    });

    it('should have null requestBody for GET', async () => {
      const endpoints = await parseOpenApiFromString(PETSTORE_SPEC);
      const listPets = endpoints!.find((e) => e.operationId === 'listPets')!;
      expect(listPets.requestBody).toBeNull();
    });

    it('should extract responses', async () => {
      const endpoints = await parseOpenApiFromString(PETSTORE_SPEC);
      const showPet = endpoints!.find((e) => e.operationId === 'showPetById')!;
      expect(showPet.responses).toHaveLength(2);
      expect(showPet.responses[0]).toMatchObject({ statusCode: '200' });
      expect(showPet.responses[1]).toMatchObject({ statusCode: '404' });
    });

    it('should extract tags', async () => {
      const endpoints = await parseOpenApiFromString(PETSTORE_SPEC);
      const listPets = endpoints!.find((e) => e.operationId === 'listPets')!;
      expect(listPets.tags).toEqual(['pets']);
    });

    it('should return null for invalid JSON', async () => {
      const result = await parseOpenApiFromString('not-json');
      expect(result).toBeNull();
    });

    it('should return null for invalid spec', async () => {
      const result = await parseOpenApiFromString(JSON.stringify({ invalid: true }));
      expect(result).toBeNull();
    });

    it('should handle empty paths gracefully', async () => {
      const spec = JSON.stringify({
        openapi: '3.0.3',
        info: { title: 'Empty', version: '1.0.0' },
        paths: {},
      });
      const endpoints = await parseOpenApiFromString(spec);
      expect(endpoints).not.toBeNull();
      expect(endpoints!.length).toBe(0);
    });

    it('should generate operationId when not provided', async () => {
      const spec = JSON.stringify({
        openapi: '3.0.3',
        info: { title: 'NoOpId', version: '1.0.0' },
        paths: {
          '/users/{userId}/orders': {
            get: {
              summary: 'Get user orders',
              responses: { '200': { description: 'OK' } },
            },
          },
        },
      });
      const endpoints = await parseOpenApiFromString(spec);
      expect(endpoints).not.toBeNull();
      expect(endpoints!.length).toBe(1);
      // Auto-generated operationId should be a camelCase string
      expect(endpoints![0].operationId).toBeTruthy();
      expect(typeof endpoints![0].operationId).toBe('string');
    });
  });
});
