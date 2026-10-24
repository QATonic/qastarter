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

  it.each([
    ['playwright', 'csharp', 'nunit', 'extent-reports'],
    ['playwright', 'java', 'junit5', 'testng-reports'],
    ['selenium', 'java', 'junit5', 'testng-reports'],
    ['cypress', 'javascript', 'cypress', 'jest-html-reporter'],
    ['cypress', 'typescript', 'cypress', 'jest-html-reporter'],
    ['selenium', 'javascript', 'jest', 'jest-html-reporter'],
    ['selenium', 'typescript', 'jest', 'mochawesome'],
    ['webdriverio', 'javascript', 'mocha', 'mochawesome'],
    ['webdriverio', 'typescript', 'mocha', 'jest-html-reporter'],
  ])(
    'rejects an unimplemented reporter for %s/%s/%s: %s',
    async (framework, language, testRunner, reportingTool) => {
      await expect(
        parseProjectConfiguration({
          projectName: 'demo',
          testingType: 'web',
          framework,
          language,
          testRunner,
          reportingTool,
        })
      ).rejects.toMatchObject({ statusCode: 400 });
    }
  );

  it('keeps native TestNG reporting available to TestNG web projects', async () => {
    await expect(
      parseProjectConfiguration({
        projectName: 'demo',
        testingType: 'web',
        framework: 'selenium',
        language: 'java',
        testRunner: 'testng',
        reportingTool: 'testng-reports',
      })
    ).resolves.toMatchObject({ reportingTool: 'testng-reports' });
  });

  it('does not advertise a Jest formatter for a Cucumber runner', async () => {
    await expect(
      parseProjectConfiguration({
        projectName: 'demo',
        testingType: 'web',
        framework: 'playwright',
        language: 'typescript',
        testingPattern: 'bdd',
        reportingTool: 'jest-html',
      })
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});
