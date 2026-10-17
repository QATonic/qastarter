import { describe, expect, it } from 'vitest';
import { runInNewContext } from 'node:vm';
import fs from 'node:fs/promises';
import path from 'node:path';
import handlebars from 'handlebars';
import { TemplatePackEngine } from './templatePackEngine';
import { registerSerializationHelpers, stringContents } from './serialization';
import type { ProjectConfig } from '@shared/schema';

const password = '  p&"\'\\secret\n\t${value}{braces}  ';
const baseUrl = 'https://example.test/?a=1&b=2';

describe('generated value serialization', () => {
  it.each(['double', 'single', 'template'])('round-trips a %s quoted JavaScript string', (kind) => {
    const quote = kind === 'double' ? '"' : kind === 'single' ? "'" : '`';
    const text = password + '`';
    expect(runInNewContext(quote + stringContents(text, kind, 'js') + quote)).toBe(text);
  });

  it('round-trips JSON without applying HTML escaping', () => {
    expect(JSON.parse('"' + stringContents(password) + '"')).toBe(password);
  });

  it('quotes CSV fields and preserves property values', () => {
    const hb = handlebars.create();
    registerSerializationHelpers(hb);
    expect(hb.compile('{{csv value}}')({ value: 'a,"b"' })).toBe('"a,""b"""');
    expect(hb.compile('{{properties value}}')({ value: ' C:\\Apps\\test.exe\nnext' })).toBe(
      '\\ C:\\\\Apps\\\\test.exe\\nnext'
    );
    expect(hb.compile('{{properties value}}')({ value: '雪' })).toBe('\\u96ea');
    expect(JSON.parse(hb.compile('{{ini value}}')({ value: password }))).toBe(password);
    expect(
      JSON.parse(
        hb.compile('{{{compose prefix value}}}')({ prefix: 'BASE_URL=', value: '$' + '{TOKEN}' })
      )
    ).toBe('BASE_URL=$' + '$' + '{TOKEN}');
  });

  it('renders every pack with special characters and valid JSON output', async () => {
    const root = path.resolve('server/templates/packs');
    const engine = new TemplatePackEngine(root);
    let checked = 0;
    for (const directory of await fs.readdir(root, { withFileTypes: true })) {
      if (!directory.isDirectory()) continue;
      const manifest = JSON.parse(
        await fs.readFile(path.join(root, directory.name, 'manifest.json'), 'utf8')
      );
      const config: ProjectConfig = {
        ...manifest.supportedCombination,
        projectName: 'serialization-check',
        testingPattern: manifest.dynamicSupport?.testingPatterns?.[0] || 'page-object-model',
        baseUrl,
        testUsername: `O'Connor & Co`,
        testPassword: password,
        appPath: 'C:\\Apps\\test.exe',
        deviceName: 'device "quoted"',
        platformVersion: '13.0',
        apiAuthToken: password,
        includeSampleTests: true,
        cloudDeviceFarm: 'none',
        utilities: { configReader: true, jsonReader: true, logger: true, dataProvider: true },
      };
      const files = await engine.generateProject(config);
      for (const file of files) {
        if (!file.path.endsWith('.json') || typeof file.content !== 'string') continue;
        expect(
          () => JSON.parse(file.content as string),
          `${directory.name}/${file.path}`
        ).not.toThrow();
        expect(file.content).not.toContain('p&amp;');
        expect(file.content).not.toContain('?a&#x3D;');
        if (
          directory.name === 'web-typescript-playwright-jest-npm' &&
          file.path === 'config/dev.json'
        ) {
          const values = JSON.parse(file.content);
          expect(values.BASE_URL).toBe(baseUrl);
          expect(values.PASSWORD).toBe(password);
        }
        if (
          directory.name === 'desktop-csharp-winappdriver-nunit-nuget' &&
          file.path === 'appsettings.json'
        ) {
          expect(JSON.parse(file.content).AppPath).toBe('C:\\Apps\\test.exe');
        }
      }
      const wrapper = files.find((file) => file.path === 'gradle/wrapper/gradle-wrapper.jar');
      if (wrapper) {
        expect(Buffer.isBuffer(wrapper.content)).toBe(true);
        expect(wrapper.content.length).toBeGreaterThan(1000);
        expect((wrapper.content as Buffer).subarray(0, 2).toString()).toBe('PK');
      }
      checked++;
    }
    expect(checked).toBe(49);
  }, 30_000);
});
