import express from 'express';
import helmet from 'helmet';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { secureRequestUpgrade } from './secureRequestUpgrade';

describe('production asset URL upgrades', () => {
  function app() {
    const app = express();
    app.set('trust proxy', 1);
    app.use(helmet({ contentSecurityPolicy: { directives: { upgradeInsecureRequests: null } } }));
    app.use(secureRequestUpgrade);
    app.get('/', (_req, res) => res.send('OK'));
    return app;
  }

  it('does not tell WebKit to load HTTP assets over an unavailable TLS port', async () => {
    const response = await request(app()).get('/');
    expect(response.headers['content-security-policy']).not.toContain('upgrade-insecure-requests');
    expect(response.headers['content-security-policy']).toContain("default-src 'self'");
  });

  it('retains upgrade-insecure-requests behind the trusted HTTPS proxy', async () => {
    const response = await request(app()).get('/').set('X-Forwarded-Proto', 'https');
    expect(response.headers['content-security-policy']).toContain('upgrade-insecure-requests');
  });
});
