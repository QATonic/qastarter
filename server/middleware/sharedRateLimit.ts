import rateLimit, { type Options } from 'express-rate-limit';
import type { RequestHandler } from 'express';
import RedisStore from 'rate-limit-redis';
import { initializeCache } from '../services/cache';
import { RedisCacheProvider } from '../services/cache/redisCacheProvider';

/** Reuse the initialized Redis connection, with independent route counters. */
export function sharedRateLimit(
  namespace: 'api' | 'generation' | 'github',
  options: Omit<Partial<Options>, 'store'>
): RequestHandler {
  const ready = (async () => {
    const cache = await initializeCache();
    const store =
      cache instanceof RedisCacheProvider && (await cache.isHealthy())
        ? new RedisStore({
            prefix: `qastarter:rate:${namespace}:`,
            sendCommand: (...args: string[]) => cache.getClient().sendCommand(args),
          })
        : undefined;
    return rateLimit({ ...options, store });
  })();
  return (req, res, next) => {
    void ready.then((limiter) => limiter(req, res, next)).catch(next);
  };
}
