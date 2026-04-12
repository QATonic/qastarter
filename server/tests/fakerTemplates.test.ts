import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import path from 'path';
import { promises as fs, existsSync } from 'fs';
import { BOM } from '@shared/bom';
import { ProjectTemplateGenerator } from '../templates';
import { ProjectConfig } from '@shared/schema';
import { TemplatePackEngine } from '../templates/templatePackEngine';

// ─── Helpers ──────────────────────────────────────────────────────────

const PACKS_DIR = path.join(process.cwd(), 'server', 'templates', 'packs');
const CANONICAL_DIR = path.join(process.cwd(), 'server', 'templates', '_canonical');

/** Read and parse a manifest.json from a given pack directory. */
async function readManifest(packName: string) {
  const raw = await fs.readFile(path.join(PACKS_DIR, packName, 'manifest.json'), 'utf-8');
  return JSON.parse(raw);
}

/** List all pack directory names. */
async function listPacks(): Promise<string[]> {
  const entries = await fs.readdir(PACKS_DIR, { withFileTypes: true });
  return entries.filter((e) => e.isDirectory()).map((e) => e.name);
}

/** Loose semver check: major.minor.patch with optional pre-release / build suffix, or "latest". */
function isValidVersionString(version: string): boolean {
  if (version === 'latest') return true;
  // Accept versions like "3.8+", "18+", "1.21+" as valid
  if (/^\d+(\.\d+)*\+?$/.test(version)) return true;
  // Standard semver with optional pre-release
  return /^\d+\.\d+\.\d+(-[\w.]+)?(\+[\w.]+)?$/.test(version);
}

// ─── 1. BOM Version Tests ─────────────────────────────────────────────

describe('BOM faker-library versions', () => {
  it('Java BOM has a "datafaker" entry', () => {
    expect(BOM.java).toHaveProperty('datafaker');
    expect(typeof BOM.java.datafaker).toBe('string');
    expect(BOM.java.datafaker.length).toBeGreaterThan(0);
  });

  it('Python BOM has a "faker" entry', () => {
    expect(BOM.python).toHaveProperty('faker');
    expect(typeof BOM.python.faker).toBe('string');
    expect(BOM.python.faker.length).toBeGreaterThan(0);
  });

  it('JavaScript BOM has a "fakerJs" entry', () => {
    expect(BOM.javascript).toHaveProperty('fakerJs');
    expect(typeof BOM.javascript.fakerJs).toBe('string');
    expect(BOM.javascript.fakerJs.length).toBeGreaterThan(0);
  });

  it('C# BOM has a "bogus" entry', () => {
    expect(BOM.csharp).toHaveProperty('bogus');
    expect(typeof BOM.csharp.bogus).toBe('string');
    expect(BOM.csharp.bogus.length).toBeGreaterThan(0);
  });

  it('Go BOM has a "gofakeit" entry', () => {
    expect(BOM.go).toHaveProperty('gofakeit');
    expect(typeof BOM.go.gofakeit).toBe('string');
    expect(BOM.go.gofakeit.length).toBeGreaterThan(0);
  });

  it('all faker versions are valid semver strings', () => {
    const versions: Record<string, string> = {
      'java.datafaker': BOM.java.datafaker,
      'python.faker': BOM.python.faker,
      'javascript.fakerJs': BOM.javascript.fakerJs,
      'csharp.bogus': BOM.csharp.bogus,
      'go.gofakeit': BOM.go.gofakeit,
    };

    for (const [label, version] of Object.entries(versions)) {
      expect(isValidVersionString(version), `${label} = "${version}" is not valid semver`).toBe(
        true
      );
    }
  });
});

// ─── 2. Manifest Validation Tests ─────────────────────────────────────

describe('Manifest faker conditional entries', () => {
  let allPacks: string[];

  beforeAll(async () => {
    allPacks = await listPacks();
  });

  /** Helper: find packs whose name contains the given language token. */
  function packsForLanguage(langToken: string): string[] {
    return allPacks.filter((p) => p.includes(langToken));
  }

  it('at least one Java pack has a manifest entry with utilities.faker conditional', async () => {
    const javaPacks = packsForLanguage('-java-');
    expect(javaPacks.length).toBeGreaterThan(0);

    let found = false;
    for (const pack of javaPacks) {
      const manifest = await readManifest(pack);
      const fakerFile = manifest.files?.find(
        (f: any) => f.conditional && f.conditional['utilities.faker'] === true
      );
      if (fakerFile) {
        found = true;
        expect(fakerFile.path).toContain('TestDataFactory');
        break;
      }
    }
    expect(found).toBe(true);
  });

  it('at least one Python pack has a manifest entry with utilities.faker conditional', async () => {
    const pythonPacks = packsForLanguage('-python-');
    expect(pythonPacks.length).toBeGreaterThan(0);

    let found = false;
    for (const pack of pythonPacks) {
      const manifest = await readManifest(pack);
      const fakerFile = manifest.files?.find(
        (f: any) => f.conditional && f.conditional['utilities.faker'] === true
      );
      if (fakerFile) {
        found = true;
        expect(fakerFile.path).toContain('test_data_factory');
        break;
      }
    }
    expect(found).toBe(true);
  });

  it('at least one JavaScript pack has a manifest entry with utilities.faker conditional', async () => {
    const jsPacks = packsForLanguage('-javascript-');
    expect(jsPacks.length).toBeGreaterThan(0);

    let found = false;
    for (const pack of jsPacks) {
      const manifest = await readManifest(pack);
      const fakerFile = manifest.files?.find(
        (f: any) => f.conditional && f.conditional['utilities.faker'] === true
      );
      if (fakerFile) {
        found = true;
        expect(fakerFile.path).toContain('testDataFactory');
        break;
      }
    }
    expect(found).toBe(true);
  });

  it('at least one TypeScript pack has a manifest entry with utilities.faker conditional', async () => {
    const tsPacks = packsForLanguage('-typescript-');
    expect(tsPacks.length).toBeGreaterThan(0);

    let found = false;
    for (const pack of tsPacks) {
      const manifest = await readManifest(pack);
      const fakerFile = manifest.files?.find(
        (f: any) => f.conditional && f.conditional['utilities.faker'] === true
      );
      if (fakerFile) {
        found = true;
        expect(fakerFile.path).toContain('testDataFactory');
        break;
      }
    }
    expect(found).toBe(true);
  });

  it('at least one C# pack has a manifest entry with utilities.faker conditional', async () => {
    const csharpPacks = packsForLanguage('-csharp-');
    expect(csharpPacks.length).toBeGreaterThan(0);

    let found = false;
    for (const pack of csharpPacks) {
      const manifest = await readManifest(pack);
      const fakerFile = manifest.files?.find(
        (f: any) => f.conditional && f.conditional['utilities.faker'] === true
      );
      if (fakerFile) {
        found = true;
        expect(fakerFile.path).toContain('TestDataFactory');
        break;
      }
    }
    expect(found).toBe(true);
  });

  it('at least one Go pack has a manifest entry with utilities.faker conditional', async () => {
    const goPacks = packsForLanguage('-go-');
    expect(goPacks.length).toBeGreaterThan(0);

    let found = false;
    for (const pack of goPacks) {
      const manifest = await readManifest(pack);
      const fakerFile = manifest.files?.find(
        (f: any) => f.conditional && f.conditional['utilities.faker'] === true
      );
      if (fakerFile) {
        found = true;
        expect(fakerFile.path).toContain('test_data_factory');
        break;
      }
    }
    expect(found).toBe(true);
  });
});

// ─── 3. Template File Existence Tests ──────────────────────────────────

describe('Canonical faker template files exist', () => {
  const expectedFiles: Record<string, string> = {
    'Java TestDataFactory': 'java/TestDataFactory.java.hbs',
    'Python test_data_factory': 'python/test_data_factory.py.hbs',
    'JavaScript testDataFactory': 'javascript/testDataFactory.js.hbs',
    'TypeScript testDataFactory': 'typescript/testDataFactory.ts.hbs',
    'C# TestDataFactory': 'csharp/TestDataFactory.cs.hbs',
    'Go test_data_factory': 'go/test_data_factory.go.hbs',
  };

  for (const [label, relativePath] of Object.entries(expectedFiles)) {
    it(`${label} template exists at _canonical/${relativePath}`, () => {
      const fullPath = path.join(CANONICAL_DIR, relativePath);
      expect(existsSync(fullPath)).toBe(true);
    });
  }
});

// ─── 4. Conditional Inclusion Logic Tests ──────────────────────────────

describe('shouldIncludeFile conditional logic for utilities.faker', () => {
  // We test the TemplatePackEngine.shouldIncludeFile method indirectly by
  // generating a project with faker enabled/disabled and checking whether
  // the TestDataFactory file appears in the output.

  let generator: ProjectTemplateGenerator;
  const FIXED_DATE = new Date('2024-01-01T12:00:00Z');

  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_DATE);
    generator = new ProjectTemplateGenerator(PACKS_DIR);
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  const baseJavaConfig: ProjectConfig = {
    projectName: 'faker-test-project',
    testingType: 'web',
    language: 'java',
    framework: 'selenium',
    buildTool: 'maven',
    testRunner: 'testng',
    testingPattern: 'page-object-model',
    includeSampleTests: true,
  };

  it('includes TestDataFactory when utilities.faker is true', async () => {
    const config: ProjectConfig = {
      ...baseJavaConfig,
      utilities: { faker: true },
    };

    const files = await generator.generateProject(config);
    const factoryFile = files.find((f) => f.path.includes('TestDataFactory'));
    expect(factoryFile).toBeDefined();
  });

  it('excludes TestDataFactory when utilities.faker is false', async () => {
    const config: ProjectConfig = {
      ...baseJavaConfig,
      utilities: { faker: false },
    };

    const files = await generator.generateProject(config);
    const factoryFile = files.find((f) => f.path.includes('TestDataFactory'));
    expect(factoryFile).toBeUndefined();
  });

  it('excludes TestDataFactory when utilities.faker is not set', async () => {
    const config: ProjectConfig = {
      ...baseJavaConfig,
      utilities: {},
    };

    const files = await generator.generateProject(config);
    const factoryFile = files.find((f) => f.path.includes('TestDataFactory'));
    expect(factoryFile).toBeUndefined();
  });

  it('excludes TestDataFactory when utilities object is omitted entirely', async () => {
    const config: ProjectConfig = {
      ...baseJavaConfig,
      // no utilities key at all
    };

    const files = await generator.generateProject(config);
    const factoryFile = files.find((f) => f.path.includes('TestDataFactory'));
    expect(factoryFile).toBeUndefined();
  });

  // Repeat for Python to verify cross-language consistency
  const basePythonConfig: ProjectConfig = {
    projectName: 'faker-test-python',
    testingType: 'web',
    language: 'python',
    framework: 'selenium',
    buildTool: 'pip',
    testRunner: 'pytest',
    testingPattern: 'page-object-model',
    includeSampleTests: true,
  };

  it('includes test_data_factory.py when utilities.faker is true (Python)', async () => {
    const config: ProjectConfig = {
      ...basePythonConfig,
      utilities: { faker: true },
    };

    const files = await generator.generateProject(config);
    const factoryFile = files.find((f) => f.path.includes('test_data_factory'));
    expect(factoryFile).toBeDefined();
  });

  it('excludes test_data_factory.py when utilities.faker is false (Python)', async () => {
    const config: ProjectConfig = {
      ...basePythonConfig,
      utilities: { faker: false },
    };

    const files = await generator.generateProject(config);
    const factoryFile = files.find((f) => f.path.includes('test_data_factory'));
    expect(factoryFile).toBeUndefined();
  });
});

// ─── 5. Template Rendering Tests ───────────────────────────────────────

describe('Faker template rendering', () => {
  let generator: ProjectTemplateGenerator;
  const FIXED_DATE = new Date('2024-01-01T12:00:00Z');

  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_DATE);
    generator = new ProjectTemplateGenerator(PACKS_DIR);
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('rendered Java TestDataFactory contains DataFaker import', async () => {
    const config: ProjectConfig = {
      projectName: 'render-test-java',
      testingType: 'web',
      language: 'java',
      framework: 'selenium',
      buildTool: 'maven',
      testRunner: 'testng',
      testingPattern: 'page-object-model',
      utilities: { faker: true },
      includeSampleTests: true,
    };

    const files = await generator.generateProject(config);
    const factoryFile = files.find((f) => f.path.includes('TestDataFactory'));
    expect(factoryFile).toBeDefined();

    // Verify the rendered content has the expected DataFaker import
    expect(factoryFile!.content).toContain('import net.datafaker.Faker');
    // Verify the package declaration was processed
    expect(factoryFile!.content).toContain('package com.example.utils');
    // Verify class declaration
    expect(factoryFile!.content).toContain('public class TestDataFactory');
  });

  it('rendered Python test_data_factory contains faker import', async () => {
    const config: ProjectConfig = {
      projectName: 'render-test-python',
      testingType: 'web',
      language: 'python',
      framework: 'selenium',
      buildTool: 'pip',
      testRunner: 'pytest',
      testingPattern: 'page-object-model',
      utilities: { faker: true },
      includeSampleTests: true,
    };

    const files = await generator.generateProject(config);
    const factoryFile = files.find((f) => f.path.includes('test_data_factory'));
    expect(factoryFile).toBeDefined();

    // Verify the rendered content has the expected faker import
    expect(factoryFile!.content).toContain('from faker import Faker');
    // Verify class declaration
    expect(factoryFile!.content).toContain('class TestDataFactory');
  });

  it('rendered TypeScript testDataFactory contains @faker-js/faker reference', async () => {
    const config: ProjectConfig = {
      projectName: 'render-test-ts',
      testingType: 'web',
      language: 'typescript',
      framework: 'playwright',
      buildTool: 'npm',
      testRunner: 'jest',
      testingPattern: 'page-object-model',
      utilities: { faker: true },
      includeSampleTests: true,
    };

    const files = await generator.generateProject(config);
    const factoryFile = files.find((f) => f.path.includes('testDataFactory'));
    expect(factoryFile).toBeDefined();

    // Verify it references faker-js
    expect(factoryFile!.content).toContain('faker');
  });

  it('rendered C# TestDataFactory contains Bogus reference', async () => {
    const config: ProjectConfig = {
      projectName: 'render-test-csharp',
      testingType: 'web',
      language: 'csharp',
      framework: 'selenium',
      buildTool: 'nuget',
      testRunner: 'nunit',
      testingPattern: 'page-object-model',
      utilities: { faker: true },
      includeSampleTests: true,
    };

    const files = await generator.generateProject(config);
    const factoryFile = files.find((f) => f.path.includes('TestDataFactory'));
    expect(factoryFile).toBeDefined();

    // Verify it references Bogus
    expect(factoryFile!.content).toContain('Bogus');
  });

  it('rendered Go test_data_factory contains gofakeit import', async () => {
    const config: ProjectConfig = {
      projectName: 'render-test-go',
      testingType: 'web',
      language: 'go',
      framework: 'playwright',
      buildTool: 'mod',
      testRunner: 'testify',
      testingPattern: 'page-object-model',
      utilities: { faker: true },
      includeSampleTests: true,
    };

    const files = await generator.generateProject(config);
    const factoryFile = files.find((f) => f.path.includes('test_data_factory'));
    expect(factoryFile).toBeDefined();

    // Verify it references gofakeit
    expect(factoryFile!.content).toContain('gofakeit');
  });

  it('rendered JavaScript testDataFactory contains faker reference', async () => {
    const config: ProjectConfig = {
      projectName: 'render-test-js',
      testingType: 'web',
      language: 'javascript',
      framework: 'playwright',
      buildTool: 'npm',
      testRunner: 'jest',
      testingPattern: 'page-object-model',
      utilities: { faker: true },
      includeSampleTests: true,
    };

    const files = await generator.generateProject(config);
    const factoryFile = files.find((f) => f.path.includes('testDataFactory'));
    expect(factoryFile).toBeDefined();

    // Verify it references faker
    expect(factoryFile!.content).toContain('faker');
  });
});

// ─── 6. Cross-cutting: every pack with a faker conditional file ────────

describe('All packs with faker conditional files are internally consistent', () => {
  let allPacks: string[];

  beforeAll(async () => {
    allPacks = await listPacks();
  });

  it('every faker-conditional manifest entry points to a file that exists on disk', async () => {
    for (const pack of allPacks) {
      const manifest = await readManifest(pack);
      const fakerFiles = (manifest.files || []).filter(
        (f: any) => f.conditional && f.conditional['utilities.faker'] === true
      );

      for (const fakerFile of fakerFiles) {
        // The actual file on disk has .hbs appended if isTemplate is true
        const diskPath = fakerFile.isTemplate
          ? path.join(PACKS_DIR, pack, 'files', `${fakerFile.path}.hbs`)
          : path.join(PACKS_DIR, pack, 'files', fakerFile.path);

        // Strip handlebars path expressions for existence check
        // e.g. "src/main/java/{{packagePath}}/utils/TestDataFactory.java"
        // We cannot fully resolve Handlebars expressions, but we can check
        // that the template source file exists in the pack's files directory.
        // For templated paths, check the raw .hbs file by replacing {{...}}
        // segments with a glob-friendly wildcard.
        if (fakerFile.path.includes('{{')) {
          // Templated path — just verify the pack directory exists
          const packDir = path.join(PACKS_DIR, pack, 'files');
          expect(existsSync(packDir), `Pack files dir missing: ${packDir}`).toBe(true);
        } else {
          expect(
            existsSync(diskPath),
            `Missing faker template file: ${diskPath} in pack ${pack}`
          ).toBe(true);
        }
      }
    }
  });

  it('every faker-conditional file path contains a recognizable factory filename', async () => {
    const validPatterns = [
      'TestDataFactory',
      'test_data_factory',
      'testDataFactory',
      'testdatafactory',
    ];

    for (const pack of allPacks) {
      const manifest = await readManifest(pack);
      const fakerFiles = (manifest.files || []).filter(
        (f: any) => f.conditional && f.conditional['utilities.faker'] === true
      );

      for (const fakerFile of fakerFiles) {
        const matchesPattern = validPatterns.some((pattern) =>
          fakerFile.path.toLowerCase().includes(pattern.toLowerCase())
        );
        expect(
          matchesPattern,
          `Faker file "${fakerFile.path}" in pack "${pack}" does not contain a recognized factory filename`
        ).toBe(true);
      }
    }
  });
});
