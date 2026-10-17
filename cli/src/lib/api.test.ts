import { afterEach, describe, expect, it, vi } from 'vitest';
import { validateConfig, previewProject, getProjectDependencies } from './api';

const options = {
  projectName: 'demo',
  testingType: 'web',
  framework: 'cypress',
  language: 'typescript',
  utilities: ['logger'],
};
afterEach(() => vi.unstubAllGlobals());

describe('API response contracts', () => {
  it.each([
    {
      success: true,
      data: { valid: false, errors: [{ field: 'testRunner', message: 'Unsupported' }] },
    },
    { isValid: false, errors: [{ field: 'testRunner', message: 'Unsupported' }] },
  ])('preserves explicit invalid results from current and legacy servers', async (body) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(body))));
    expect(await validateConfig(options)).toMatchObject({
      valid: false,
      errors: [{ field: 'testRunner' }],
    });
  });

  it('rejects malformed responses rather than defaulting to valid', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}')));
    await expect(validateConfig(options)).rejects.toThrow('Unexpected');
  });

  it('preserves server failure status rather than calling it an invalid config', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('unavailable', { status: 503 })));
    await expect(validateConfig(options)).rejects.toThrow('503');
  });

  it('sends the same minimal request to preview and dependency lookup', async () => {
    const fetch = vi
      .fn()
      .mockImplementation(() =>
        Promise.resolve(new Response(JSON.stringify({ success: true, data: {} })))
      );
    vi.stubGlobal('fetch', fetch);
    await previewProject(options);
    await getProjectDependencies(options);
    for (const [, request] of fetch.mock.calls) expect(JSON.parse(request.body)).toEqual(options);
  });
});
