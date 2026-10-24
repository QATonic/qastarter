import { describe, expect, it } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import ts from 'typescript';
import { ProjectTemplateGenerator } from './index';
import type { ProjectConfig } from '@shared/schema';

const generator = new ProjectTemplateGenerator();
const packsRoot = path.join(process.cwd(), 'server/templates/packs');
const packs = (await fs.readdir(packsRoot)).filter((name) => name.startsWith('web-'));

async function generate(pack: string, overrides: Partial<ProjectConfig> = {}) {
  const manifest = JSON.parse(
    await fs.readFile(path.join(packsRoot, pack, 'manifest.json'), 'utf8')
  );
  const config: ProjectConfig = {
    ...manifest.supportedCombination,
    projectName: 'company-web-tests',
    groupId: 'com.company.quality',
    testingPattern: 'page-object-model',
    cloudDeviceFarm: 'none',
    includeSampleTests: true,
    baseUrl: 'https://www.saucedemo.com',
    testUsername: 'standard_user',
    testPassword: 'secret_sauce',
    utilities: { dataProvider: true, faker: true },
    ...overrides,
  };
  const files = await generator.generateProject(config);
  return new Map(files.map((file) => [file.path, String(file.content)]));
}

describe('Web ZIP runtime regressions', () => {
  it.each(packs)('%s includes the Dockerfile required by Compose alone', async (pack) => {
    const files = await generate(pack, {
      utilities: { includeDocker: false, includeDockerCompose: true },
    });
    if (files.has('docker-compose.yml')) expect(files.has('Dockerfile')).toBe(true);
  });

  it.each(packs.filter((pack) => /-(javascript|typescript)-/.test(pack)))(
    '%s includes its own lint configuration and dependencies',
    async (pack) => {
      const files = await generate(pack);
      const pkg = JSON.parse(files.get('package.json')!);
      expect(files.has('eslint.config.mjs')).toBe(true);
      expect(pkg.devDependencies.eslint).toBeTruthy();
      expect(pkg.devDependencies['@eslint/js']).toBeTruthy();
      expect(pkg.scripts.lint).toBe('eslint .');
    }
  );

  it.each(['javascript', 'typescript'])(
    'Cypress %s fixture matches the sample test array contract',
    async (language) => {
      const files = await generate(`web-${language}-cypress-cypress-npm`);
      const users = JSON.parse(files.get('cypress/fixtures/users.json')!);
      expect(Array.isArray(users)).toBe(true);
      expect(users[0]).toEqual({
        username: 'standard_user',
        password: 'secret_sauce',
        expected: 'success',
      });
      expect(
        users.every((user: Record<string, string>) => ['success', 'error'].includes(user.expected))
      ).toBe(true);
    }
  );

  it.each(['playwright', 'selenium'])(
    'C# %s preserves test data and valid SpecFlow generated names',
    async (framework) => {
      const files = await generate(`web-csharp-${framework}-nunit-nuget`, {
        testingPattern: 'bdd',
      });
      const csproj = files.get('company-web-tests.csproj')!;
      expect(csproj).toContain('<RootNamespace>CompanyWebTests</RootNamespace>');
      expect(csproj).toContain('<AssemblyName>CompanyWebTests</AssemblyName>');
      expect(csproj).toContain('Update="Data/**/*"');
      expect(files.get('Config/ConfigReader.cs')).toContain(
        'GetEnvironmentVariable("TEST_USERNAME")'
      );
    }
  );

  it.each(['junit5', 'testng'])(
    'Playwright Gradle %s preserves CircleCI checksum expressions',
    async (runner) => {
      const files = await generate(`web-java-playwright-${runner}-gradle`, {
        cicdTool: 'circleci',
      });
      const ci = files.get('.circleci/config.yml')!;
      expect(ci).toContain('{{ checksum "build.gradle" }}');
      expect(yaml.load(ci)).toHaveProperty('jobs.test');
    }
  );

  it('Go includes a usable CircleCI job when selected', async () => {
    const files = await generate('web-go-playwright-testify-mod', { cicdTool: 'circleci' });
    expect(yaml.load(files.get('.circleci/config.yml')!)).toHaveProperty('jobs.test');
  });

  it('the optional Selenium Jest Allure reporter is valid JavaScript', async () => {
    const files = await generate('web-javascript-selenium-jest-npm', { reportingTool: 'allure' });
    const source = ts.createSourceFile(
      'jest.config.js',
      files.get('jest.config.js')!,
      ts.ScriptTarget.Latest,
      true
    );
    expect(source.parseDiagnostics).toEqual([]);
  });
});
