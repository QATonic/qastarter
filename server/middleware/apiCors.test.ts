import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApiCors } from './apiCors';

function app() {
  const app = express();
  app.use(
    '/api',
    createApiCors({ isDevelopment: false, allowedOrigins: ['https://allowed.example'] })
  );
  app.get('/api/v1/metadata', (_req, res) => res.json({ success: true }));
  return app;
}

describe('production API CORS', () => {
  it('allows readiness probes and same-origin requests without Origin', async () => {
    const response = await request(app()).get('/api/v1/metadata');
    expect(response.status).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('reflects an explicitly allowed browser origin', async () => {
    const response = await request(app())
      .get('/api/v1/metadata')
      .set('Origin', 'https://allowed.example');
    expect(response.headers['access-control-allow-origin']).toBe('https://allowed.example');
  });

  it('does not grant browser access to an unknown origin', async () => {
    const response = await request(app())
      .options('/api/v1/metadata')
      .set('Origin', 'https://untrusted.example')
      .set('Access-Control-Request-Method', 'GET');
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
    expect(response.status).not.toBe(500);
  });
});
