import { createRequire } from 'node:module';
import { Worker } from 'node:worker_threads';
import type { OpenAPI } from 'openapi-types';
import { MAX_SPEC_BYTES } from './openApiFetch';

const require = createRequire(import.meta.url);

// Keep parsing and dereferencing off the HTTP event loop. The worker has no
// external resolvers, bounded heap/stack, and is terminated on its deadline.
const parserSource = `
const { parentPort, workerData } = require('node:worker_threads');
(async () => {
  const yaml = require(workerData.yamlPath);
  const Parser = require(workerData.parserPath);
  const document = yaml.load(workerData.content, { schema: yaml.JSON_SCHEMA });
  if (!document || typeof document !== 'object' || Array.isArray(document)) {
    throw new Error('OpenAPI specification must be an object');
  }
  const visited = new WeakSet();
  const pending = [{ value: document, depth: 0 }];
  let nodes = 0;
  while (pending.length) {
    const { value, depth } = pending.pop();
    if (!value || typeof value !== 'object' || visited.has(value)) continue;
    if (++nodes > 100000 || depth > 100) throw new Error('OpenAPI spec is too complex');
    visited.add(value);
    if ('$ref' in value && (typeof value.$ref !== 'string' || !value.$ref.startsWith('#'))) {
      throw new Error('External OpenAPI references are not supported; bundle the spec first');
    }
    for (const child of Object.values(value)) pending.push({ value: child, depth: depth + 1 });
  }
  const api = await Parser.validate(document, {
    resolve: { external: false, file: false, http: false },
    dereference: { circular: false },
  });
  parentPort.postMessage({ api });
})().catch(error => parentPort.postMessage({ error: error.message }));
`;

export function validateOpenApiContent(
  content: string,
  timeoutMs?: number
): Promise<OpenAPI.Document> {
  if (Buffer.byteLength(content, 'utf8') > MAX_SPEC_BYTES) {
    return Promise.reject(new Error('OpenAPI spec exceeds 5 MB'));
  }
  const configuredTimeout = Number(process.env.OPENAPI_PARSE_TIMEOUT_MS || 15_000);
  const deadlineMs =
    timeoutMs ??
    (Number.isFinite(configuredTimeout) && configuredTimeout > 0 ? configuredTimeout : 15_000);
  return new Promise((resolve, reject) => {
    const worker = new Worker(parserSource, {
      eval: true,
      workerData: {
        content,
        parserPath: require.resolve('@apidevtools/swagger-parser'),
        yamlPath: require.resolve('js-yaml'),
      },
      resourceLimits: { maxOldGenerationSizeMb: 128, stackSizeMb: 4 },
    });
    let settled = false;
    const finish = (error?: Error, api?: OpenAPI.Document) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      void worker.terminate();
      if (error) reject(error);
      else resolve(api!);
    };
    const timer = setTimeout(
      () => finish(new Error(`OpenAPI parse timed out after ${deadlineMs} ms`)),
      deadlineMs
    );
    worker.once('message', (result: { error?: string; api?: OpenAPI.Document }) => {
      finish(result.error ? new Error(result.error) : undefined, result.api);
    });
    worker.once('error', (error) => finish(error));
    worker.once('exit', (code) => {
      if (!settled) finish(new Error(`OpenAPI parser exited before completion (${code})`));
    });
  });
}
