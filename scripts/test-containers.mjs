import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { buildSync } from 'esbuild';

const exec = promisify(execFile);
const name = `qastarter-verify-${randomBytes(5).toString('hex')}`;
const redis = `${name}-redis`;
const apps = [`${name}-a`, `${name}-b`];
const password = randomBytes(24).toString('hex');
const image = process.env.CONTAINER_TEST_IMAGE || 'qastarter:review-fixes';
const created = [];
let networkCreated = false;
// Bound the whole verification, including container startup and readiness.
const deadline = new AbortController();
const deadlineTimer = setTimeout(
  () => deadline.abort(new Error('Container integration exceeded three minutes')),
  180_000
);
async function docker(...args) {
  const { stdout } = await exec('docker', args, { maxBuffer: 4 * 1024 * 1024, timeout: 120_000 });
  return stdout.trim();
}
async function waitFor(fn, label) {
  let lastError;
  for (let attempt = 0; attempt < 60; attempt++) {
    if (deadline.signal.aborted) break;
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      await delay(500);
    }
  }
  throw new Error(`Timed out waiting for ${label}`, { cause: lastError });
}
// Use a client on the test network instead of assuming the Docker daemon
// publishes ports into the machine/network namespace running this script.
const httpProbe = String.raw`
  const { request } = require('node:http');
  const [url, options] = JSON.parse(process.argv[1]);
  const req = request(url, {
    method: options.method || 'GET',
    headers: { ...options.headers, Connection: 'close' },
  });
  const timeout = setTimeout(() => req.destroy(new Error('HTTP request timed out: ' + url)), 15000);
  req.once('close', () => clearTimeout(timeout));
  req.once('error', error => { console.error(error); process.exitCode = 1; });
  req.once('response', res => {
    const chunks = [];
    res.on('data', chunk => chunks.push(chunk));
    res.once('error', error => { console.error(error); process.exitCode = 1; });
    res.once('end', () => console.log(JSON.stringify({ status: res.statusCode, body: Buffer.concat(chunks).toString('base64') })));
  });
  req.end(options.body);
`;
async function request(url, options = {}) {
  deadline.signal.throwIfAborted();
  const result = JSON.parse(
    await docker(
      'exec',
      apps[0],
      'node',
      '--input-type=commonjs',
      '-e',
      httpProbe,
      JSON.stringify([url, options])
    )
  );
  const body = Buffer.from(result.body, 'base64');
  return {
    status: result.status,
    json: async () => JSON.parse(body.toString('utf8')),
    arrayBuffer: async () => body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength),
  };
}

try {
  console.log('Starting isolated Redis integration network');
  await docker('network', 'create', name);
  networkCreated = true;
  await docker(
    'run',
    '-d',
    '--name',
    redis,
    '--network',
    name,
    'redis:7-alpine',
    'redis-server',
    '--requirepass',
    password,
    '--save',
    '',
    '--appendonly',
    'no'
  );
  created.push(redis);
  await waitFor(
    async () =>
      assert.equal(
        await docker('exec', '-e', `REDISCLI_AUTH=${password}`, redis, 'redis-cli', 'ping'),
        'PONG'
      ),
    'Redis'
  );
  const urls = [];
  console.log('Redis is ready; starting two production replicas');
  for (const app of apps) {
    await docker(
      'run',
      '-d',
      '--name',
      app,
      '--network',
      name,
      '-e',
      `REDIS_URL=redis://:${password}@${redis}:6379`,
      '-e',
      'RATE_LIMIT_MAX=1000',
      '-e',
      'RATE_LIMIT_GENERATE_MAX=2',
      '-e',
      'LOG_LEVEL=warn',
      '-e',
      'LOG_CONSOLE=true',
      image
    );
    created.push(app);
    const base = `http://${app}:5000`;
    console.log(`Checking readiness: ${base}`);
    await waitFor(async () => {
      const response = await request(`${base}/api/v1/health/deep`);
      assert.equal(response.status, 200);
      assert.equal(
        (await response.json()).data.probes.find((p) => p.name === 'cache').detail,
        'redis'
      );
    }, app);
    assert.equal(await docker('exec', app, 'id', '-u'), '1001');
    assert.equal((await request(`${base}/`)).status, 200);
    urls.push(base);
    console.log(`Production replica ready: ${app}`);
  }
  const config = {
    projectName: 'container-check',
    testingType: 'web',
    framework: 'playwright',
    language: 'typescript',
  };
  const generate = async (base) =>
    request(`${base}/api/v1/generate-project`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
  for (const base of urls) {
    const zip = await generate(base);
    assert.equal(zip.status, 200);
    const bytes = new Uint8Array(await zip.arrayBuffer());
    assert.deepEqual([...bytes.slice(0, 2)], [80, 75]);
    assert.ok(bytes.length > 1024);
  }
  assert.equal(
    (await generate(urls[0])).status,
    429,
    'generation budget must be shared across replicas'
  );
  assert.equal(
    (await request(`${urls[1]}/api/v1/metadata`)).status,
    200,
    'generation limit must not consume the API budget'
  );
  const github = await request(`${urls[1]}/api/v1/push-to-github`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
  assert.equal(github.status, 400, 'generation limit must not consume the GitHub budget');
  for (const namespace of ['api', 'generation', 'github']) {
    const keys = await docker(
      'exec',
      '-e',
      `REDISCLI_AUTH=${password}`,
      redis,
      'redis-cli',
      '--scan',
      '--pattern',
      `qastarter:rate:${namespace}:*`
    );
    assert.ok(keys.length, `missing Redis ${namespace} counters`);
  }
  console.log('ZIP generation and distributed rate limits passed; checking cache operations');
  // Exercise serialization, expiry and namespaced flush against the actual Redis adapter.
  const probe = `import {RedisCacheProvider} from './server/services/cache/redisCacheProvider.ts';
    import assert from 'node:assert/strict';
    const cache = new RedisCacheProvider({redisUrl:process.env.REDIS_URL,enabled:true,keyPrefix:'verify:',defaultTTL:60});
    await cache.connect();
    try {
      assert.equal(await cache.set('roundtrip',{text:'value',count:2}),true);
      assert.deepEqual(await cache.get('roundtrip'),{text:'value',count:2});
      await cache.set('expiry',true,1);
      await new Promise(r=>setTimeout(r,1200));
      assert.equal(await cache.get('expiry'),undefined);
      assert.equal((await cache.getStats()).keys,1);
      await cache.flush();
      assert.equal((await cache.getStats()).keys,0);
      assert.ok((await cache.getClient().keys('qastarter:rate:*')).length);
    } finally {await cache.close();}`;
  // Compile the probe with the build-stage dependencies, then run with production dependencies.
  // Compile this small probe synchronously before running it in the container.
  const compiled = buildSync({
    stdin: {
      contents: probe,
      resolveDir: process.cwd(),
      sourcefile: 'container-cache-probe.ts',
      loader: 'ts',
    },
    bundle: true,
    platform: 'node',
    format: 'esm',
    packages: 'external',
    write: false,
  });
  await docker('exec', apps[0], 'node', '--input-type=module', '-e', compiled.outputFiles[0].text);
  console.log(
    'Docker/Redis integration passed: non-root production image, two replicas, ZIP generation, shared budgets, isolated counters, cache roundtrip, TTL and scoped flush.'
  );
} catch (error) {
  for (const app of created.filter((n) => n !== redis)) {
    console.error(await docker('logs', '--tail', '40', app).catch(() => '(logs unavailable)'));
  }
  throw error;
} finally {
  for (const container of created.reverse()) await docker('rm', '-f', container).catch(() => {});
  if (networkCreated) await docker('network', 'rm', name).catch(() => {});
  clearTimeout(deadlineTimer);
}
