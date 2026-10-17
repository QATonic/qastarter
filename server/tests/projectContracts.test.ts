import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import configRoutes from '../routes/configRoutes';
import projectRoutes from '../routes/projectRoutes';
import { errorHandler } from '../errors';

const app = express();
app.use(express.json());
app.use('/api', configRoutes, projectRoutes);
app.use(errorHandler);
const minimal = {
  projectName: 'contract-demo',
  testingType: 'web',
  framework: 'cypress',
  language: 'typescript',
  utilities: ['logger'],
};

describe('API/CLI/MCP project contracts', () => {
  it('reports a rejected combination explicitly in the shared response envelope', async () => {
    const response = await request(app)
      .post('/api/v1/validate-config')
      .send({ ...minimal, testRunner: 'jest' });
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      isValid: false,
      data: { valid: false, errors: [{ field: 'testRunner' }] },
    });
  });

  it('normalizes the same minimal options for validation, preview and dependencies', async () => {
    const validation = await request(app).post('/api/v1/validate-config').send(minimal);
    expect(validation.body.data).toEqual({ valid: true });
    const preview = await request(app).post('/api/v1/project-preview').send(minimal);
    expect(preview.status).toBe(200);
    expect(preview.body.data.projectConfig).toMatchObject({
      testRunner: 'cypress',
      buildTool: 'npm',
      utilities: { logger: true },
    });
    const dependencies = await request(app).post('/api/v1/project-dependencies').send(minimal);
    expect(dependencies.status).toBe(200);
    expect(dependencies.body.data.dependencies).toHaveProperty('cypress');
  });

  it('uses the Cypress runner by default for GET downloads', async () => {
    const response = await request(app).get('/api/v1/generate').query({
      projectName: 'contract-demo',
      testingType: 'web',
      framework: 'cypress',
      language: 'typescript',
    });
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/zip');
  });

  it('surfaces unsafe OpenAPI input as a validation error before streaming a ZIP', async () => {
    const response = await request(app).post('/api/v1/generate-project').send({
      projectName: 'api-demo',
      testingType: 'api',
      framework: 'requests',
      language: 'python',
      openApiSpecUrl: 'https://127.0.0.1/spec.json',
    });
    expect(response.status).toBe(400);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.headers['content-disposition']).toBeUndefined();
  });
});
