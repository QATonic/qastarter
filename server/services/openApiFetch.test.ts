import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchOpenApiSpec,
  isOpenApiUrlSafe,
  isPublicAddress,
  MAX_SPEC_BYTES,
  publicLookup,
} from './openApiFetch';

const { request, lookup } = vi.hoisted(() => ({ request: vi.fn(), lookup: vi.fn() }));
vi.mock('node:https', () => ({ request }));
vi.mock('node:dns', () => ({ lookup }));

describe('OpenAPI network boundary', () => {
  let response: PassThrough & { statusCode: number; headers: Record<string, string> };
  let req: EventEmitter & { end: ReturnType<typeof vi.fn>; destroy: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.resetAllMocks();
    response = Object.assign(new PassThrough(), { statusCode: 200, headers: {} });
    req = Object.assign(new EventEmitter(), { end: vi.fn(), destroy: vi.fn() });
    request.mockImplementation((_url, _options, callback) => {
      req.end.mockImplementation(() => queueMicrotask(() => callback(response)));
      return req;
    });
  });
  afterEach(() => vi.useRealTimers());

  it.each([
    'https://[::ffff:127.0.0.1]/spec',
    'https://[::ffff:7f00:1]/spec',
    'https://2130706433/spec',
    'https://0x7f000001/spec',
    'https://0177.0.0.1/spec',
    'https://169.254.169.254/spec',
    'https://localhost./spec',
    'https://api.local/spec',
    'https://api.internal/spec',
    'http://example.com/spec',
    'file:///tmp/spec.json',
    'https://user:password@example.com/spec',
    'https://[2001:db8::1]/spec',
  ])('rejects unsafe URL %s before connecting', async (url) => {
    await expect(fetchOpenApiSpec(url)).rejects.toThrow('Unsafe');
    expect(request).not.toHaveBeenCalled();
  });

  it('permits public IPs without overblocking 172.32/16', () => {
    expect(isPublicAddress('8.8.8.8')).toBe(true);
    expect(isPublicAddress('172.32.0.1')).toBe(true);
    expect(isPublicAddress('2606:4700:4700::1111')).toBe(true);
    expect(isOpenApiUrlSafe('https://api.example.com/spec')).toBe(true);
  });

  it('rejects DNS answers containing a private destination', () => {
    lookup.mockImplementation((_host, _options, callback) =>
      callback(null, [
        { address: '93.184.216.34', family: 4 },
        { address: '10.0.0.1', family: 4 },
      ])
    );
    const callback = vi.fn();
    publicLookup('attacker.example', { all: true }, callback);
    expect(callback.mock.calls[0][0]).toBeInstanceOf(Error);
  });

  it('pins socket lookup to the addresses that passed validation', () => {
    const addresses = [{ address: '93.184.216.34', family: 4 }];
    lookup.mockImplementation((_host, _options, callback) => callback(null, addresses));
    const callback = vi.fn();
    publicLookup('api.example.com', { all: true }, callback);
    expect(callback).toHaveBeenCalledWith(null, addresses);
  });

  it('downloads a bounded response using the protected lookup', async () => {
    const pending = fetchOpenApiSpec('https://api.example.com/spec');
    await Promise.resolve();
    response.end('spec text');
    await expect(pending).resolves.toBe('spec text');
    expect(request.mock.calls[0][1].lookup).toBe(publicLookup);
    expect(request.mock.calls[0][1].headers.Accept).toContain('yaml');
  });

  it('refuses redirects instead of following them to an unchecked host', async () => {
    response.statusCode = 302;
    response.headers = { location: 'https://127.0.0.1/private' };
    await expect(fetchOpenApiSpec('https://api.example.com/spec')).rejects.toThrow('302');
    expect(request).toHaveBeenCalledTimes(1);
    expect(response.destroyed).toBe(true);
  });

  it('rejects an oversized declared body without buffering it', async () => {
    response.headers = { 'content-length': String(MAX_SPEC_BYTES + 1) };
    await expect(fetchOpenApiSpec('https://api.example.com/spec')).rejects.toThrow('5 MB');
    expect(response.destroyed).toBe(true);
  });

  it('stops a chunked response as soon as the byte limit is exceeded', async () => {
    const pending = fetchOpenApiSpec('https://api.example.com/spec');
    const assertion = expect(pending).rejects.toThrow('5 MB');
    await Promise.resolve();
    response.write(Buffer.alloc(MAX_SPEC_BYTES));
    response.write(Buffer.from('x'));
    await assertion;
    expect(response.destroyed).toBe(true);
    expect(req.destroy).toHaveBeenCalled();
  });

  it('keeps the deadline active after headers while the body stalls', async () => {
    vi.useFakeTimers();
    const pending = fetchOpenApiSpec('https://api.example.com/spec', 100);
    const assertion = expect(pending).rejects.toThrow('timed out');
    await vi.advanceTimersByTimeAsync(100);
    await assertion;
    expect(req.destroy).toHaveBeenCalled();
  });
});
