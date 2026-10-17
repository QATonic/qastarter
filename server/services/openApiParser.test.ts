import { describe, expect, it } from 'vitest';
import { validateOpenApiContent } from './openApiParser';

const spec = (ref: string) =>
  JSON.stringify({
    openapi: '3.0.3',
    info: { title: 'References', version: '1.0.0' },
    paths: {
      '/pets': {
        post: {
          requestBody: { content: { 'application/json': { schema: { $ref: ref } } } },
          responses: { '200': { description: 'OK' } },
        },
      },
    },
    components: { schemas: { Pet: { type: 'object', properties: { name: { type: 'string' } } } } },
  });

describe('isolated OpenAPI parsing', () => {
  it.each([
    'file:///tmp/private.json',
    'http://127.0.0.1/schema',
    'https://example.com/schema',
    './schema.json',
  ])('rejects external references: %s', async (ref) => {
    await expect(validateOpenApiContent(spec(ref))).rejects.toThrow('External OpenAPI references');
  });

  it('continues resolving references within the document', async () => {
    const api = await validateOpenApiContent(spec('#/components/schemas/Pet'));
    expect(
      (api as import('openapi-types').OpenAPIV3.Document).paths?.['/pets']?.post?.requestBody
    ).toMatchObject({
      content: { 'application/json': { schema: { properties: { name: { type: 'string' } } } } },
    });
  });

  it('parses YAML as data instead of a filename', async () => {
    await expect(
      validateOpenApiContent('openapi: 3.0.3\ninfo: {title: Test, version: 1.0.0}\npaths: {}')
    ).resolves.toMatchObject({ openapi: '3.0.3', paths: {} });
  });

  it('terminates parser work at its deadline', async () => {
    await expect(validateOpenApiContent(spec('#/components/schemas/Pet'), 0)).rejects.toThrow(
      'timed out'
    );
  });
});
