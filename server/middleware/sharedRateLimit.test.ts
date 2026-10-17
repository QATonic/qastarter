import type { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sharedRateLimit } from './sharedRateLimit';
import { initializeCache } from '../services/cache';
import { RedisCacheProvider } from '../services/cache/redisCacheProvider';

const { limiterOptions, redisOptions } = vi.hoisted(() => ({
  limiterOptions: [] as Array<Record<string, unknown>>,
  redisOptions: [] as Array<{ prefix: string; sendCommand: (...args: string[]) => unknown }>,
}));
vi.mock('../services/cache', () => ({ initializeCache: vi.fn() }));
vi.mock('express-rate-limit', () => ({
  default: vi.fn((options) => {
    limiterOptions.push(options);
    return (_req: Request, _res: Response, next: () => void) => next();
  }),
}));
vi.mock('rate-limit-redis', () => ({
  default: class {
    constructor(options: (typeof redisOptions)[number]) {
      redisOptions.push(options);
    }
  },
}));

const invoke = (middleware: ReturnType<typeof sharedRateLimit>) =>
  new Promise<void>((resolve, reject) => {
    middleware({} as Request, {} as Response, (error) => (error ? reject(error) : resolve()));
  });

describe('shared rate-limit initialization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    limiterOptions.length = 0;
    redisOptions.length = 0;
  });

  it('uses the initialized Redis client with separate route namespaces', async () => {
    const sendCommand = vi.fn().mockResolvedValue('OK');
    const cache = Object.assign(Object.create(RedisCacheProvider.prototype), {
      isHealthy: vi.fn().mockResolvedValue(true),
      getClient: () => ({ sendCommand }),
    });
    vi.mocked(initializeCache).mockResolvedValue(cache);
    const middleware = ['api', 'generation', 'github'].map((namespace) =>
      sharedRateLimit(namespace as 'api' | 'generation' | 'github', { windowMs: 1000, limit: 10 })
    );
    await Promise.all(middleware.map(invoke));
    expect(redisOptions.map((options) => options.prefix)).toEqual([
      'qastarter:rate:api:',
      'qastarter:rate:generation:',
      'qastarter:rate:github:',
    ]);
    await redisOptions[0].sendCommand('PING');
    expect(sendCommand).toHaveBeenCalledWith(['PING']);
    await invoke(middleware[0]);
    expect(redisOptions).toHaveLength(3);
  });

  it('uses independent memory stores when Redis is unavailable', async () => {
    vi.mocked(initializeCache).mockResolvedValue({} as Awaited<ReturnType<typeof initializeCache>>);
    await invoke(sharedRateLimit('api', { limit: 10 }));
    expect(redisOptions).toHaveLength(0);
    expect(limiterOptions[0].store).toBeUndefined();
  });
});
