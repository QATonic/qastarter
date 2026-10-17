import { describe, expect, it } from 'vitest';
import { parseProjectConfiguration } from './configurationService';

describe('configuration validation', () => {
  const minimal = {
    projectName: 'demo',
    testingType: 'web',
    framework: 'cypress',
    language: 'typescript',
  };

  it('accepts the minimal MCP request and resolves a real pack', async () => {
    await expect(
      parseProjectConfiguration({ ...minimal, utilities: ['logger'] })
    ).resolves.toMatchObject({
      testRunner: 'cypress',
      buildTool: 'npm',
      utilities: { logger: true },
    });
  });

  it('rejects invalid runner/build-tool combinations before rendering', async () => {
    await expect(
      parseProjectConfiguration({ ...minimal, testRunner: 'jest' })
    ).rejects.toMatchObject({ statusCode: 400 });
    await expect(
      parseProjectConfiguration({ ...minimal, buildTool: 'maven' })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('rejects incompatible frameworks and patterns', async () => {
    await expect(
      parseProjectConfiguration({ ...minimal, testingType: 'mobile' })
    ).rejects.toMatchObject({ statusCode: 400 });
    await expect(
      parseProjectConfiguration({ ...minimal, testingPattern: 'not-a-pattern' })
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});
