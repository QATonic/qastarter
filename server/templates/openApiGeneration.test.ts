import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProjectTemplateGenerator } from './index';
import { parseOpenApiFromUrl } from '../services/openApiService';
import type { ProjectConfig } from '@shared/schema';

vi.mock('../services/openApiService', () => ({ parseOpenApiFromUrl: vi.fn() }));

describe('OpenAPI generation across delivery channels', () => {
  const config: ProjectConfig = {
    projectName: 'api-demo',
    testingType: 'api',
    framework: 'requests',
    language: 'python',
    testRunner: 'pytest',
    buildTool: 'pip',
    testingPattern: 'fluent',
    includeSampleTests: true,
    cloudDeviceFarm: 'none',
    openApiSpecUrl: 'https://api.example.com/spec.yaml',
  };
  const generator = new ProjectTemplateGenerator();
  beforeEach(() => vi.resetAllMocks());

  it('includes schema-driven tests in both streaming and collected generation', async () => {
    vi.mocked(parseOpenApiFromUrl).mockResolvedValue([
      {
        method: 'GET',
        path: '/review-marker',
        operationId: 'getReviewMarker',
        summary: 'Review endpoint',
        parameters: [],
        requestBody: null,
        responses: [{ statusCode: '200', description: 'OK' }],
        tags: [],
      },
    ]);
    const collected = await generator.generateProject(config);
    const streamed = [];
    for await (const file of generator.generateProjectStream(config)) streamed.push(file);
    for (const files of [collected, streamed]) {
      expect(files.find((file) => file.path === 'tests/test_openapi.py')?.content).toContain(
        '/review-marker'
      );
    }
  });

  it('fails visibly instead of substituting static tests for a rejected spec', async () => {
    vi.mocked(parseOpenApiFromUrl).mockResolvedValue(null);
    await expect(generator.generateProject(config)).rejects.toMatchObject({ statusCode: 400 });
  });
});
