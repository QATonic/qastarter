import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const port = process.env.E2E_PORT || '53421';
const baseURL = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['dist/index.js'], {
  windowsHide: true,
  env: {
    ...process.env, NODE_ENV: 'production', PORT: port,
    LOG_FILE: 'false', LOG_CONSOLE: 'true',
    DATABASE_URL: '', REDIS_URL: '',
    RATE_LIMIT_MAX: '10000', RATE_LIMIT_GENERATE_MAX: '10000',
    ALLOWED_ORIGINS: baseURL,
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let serverLogs = '';
server.stdout.on('data', chunk => { serverLogs = (serverLogs + chunk).slice(-50_000); });
server.stderr.on('data', chunk => { serverLogs = (serverLogs + chunk).slice(-50_000); });

try {
  const deadline = Date.now() + 30_000;
  for (;;) {
    if (server.exitCode !== null) throw new Error(`Production server exited (${server.exitCode})`);
    try {
      // This intentionally has no Origin/client header: it also verifies the
      // production readiness-probe regression.
      const response = await fetch(`${baseURL}/api/v1/metadata`, { signal: AbortSignal.timeout(1000) });
      if (response.ok) break;
    } catch { /* retry during startup */ }
    if (Date.now() >= deadline) throw new Error('Production server did not become ready');
    await delay(250);
  }
  console.log(`Production readiness probe passed at ${baseURL}`);
  const tests = spawn(process.execPath, ['node_modules/@playwright/test/cli.js', 'test', ...process.argv.slice(2)], {
    windowsHide: true, stdio: 'inherit',
    env: { ...process.env, PLAYWRIGHT_BASE_URL: baseURL },
  });
  const code = await new Promise((resolve, reject) => {
    tests.once('error', reject);
    tests.once('exit', (code, signal) => resolve(code ?? (signal ? 1 : 0)));
  });
  if (code !== 0) console.error(serverLogs);
  process.exitCode = code;
} catch (error) {
  console.error(error, serverLogs);
  process.exitCode = 1;
} finally {
  server.kill();
}
