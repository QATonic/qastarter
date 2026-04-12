/**
 * Tests for the `qastarter update` command.
 *
 * Since internal helpers (compareVersions, parsers, etc.) are not exported,
 * every behavior is exercised end-to-end through `runUpdate`.  We create real
 * temporary build files, point `process.cwd()` at them, and assert on both
 * console output and file-system side-effects.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';

// ── Mocks (must be declared before the module-under-test is imported) ──

// Mock fetchBom so we never hit the network.  Individual tests override this.
vi.mock('../lib/api.js', () => ({
  fetchBom: vi.fn(),
}));

// Mock inquirer – default to confirming updates.
vi.mock('inquirer', () => ({
  default: {
    prompt: vi.fn().mockResolvedValue({ confirm: true }),
  },
}));

// Provide a lightweight ora stub that is synchronous and records messages.
// We create the spinner inside the factory function so each call to ora()
// returns a fresh object that survives vi.restoreAllMocks().
vi.mock('ora', () => {
  return {
    default: vi.fn(() => {
      const spinner: Record<string, any> = {};
      for (const method of ['start', 'succeed', 'fail', 'info', 'stop', 'warn']) {
        spinner[method] = vi.fn(() => spinner);
      }
      return spinner;
    }),
  };
});

// ── Imports (resolved *after* vi.mock calls) ───────────────────────────

import { runUpdate } from './update.js';
import { fetchBom } from '../lib/api.js';
import inquirer from 'inquirer';

// ── Helpers ────────────────────────────────────────────────────────────

const mockedFetchBom = fetchBom as ReturnType<typeof vi.fn>;

let tmpDir: string;
let originalCwd: PropertyDescriptor | undefined;
let consoleLogSpy: ReturnType<typeof vi.spyOn>;
let processExitSpy: ReturnType<typeof vi.spyOn>;

function pointCwdAt(dir: string) {
  vi.spyOn(process, 'cwd').mockReturnValue(dir);
}

function writeTmpFile(name: string, content: string) {
  const fp = path.join(tmpDir, name);
  fs.writeFileSync(fp, content, 'utf-8');
  return fp;
}

function readTmpFile(name: string): string {
  return fs.readFileSync(path.join(tmpDir, name), 'utf-8');
}

// BOM that covers every language so parsers can match dependencies.
function fullBom(): Record<string, Record<string, string>> {
  return {
    java: {
      selenium: '4.18.0',
      testng: '7.9.0',
      junit5: '5.10.2',
      allure: '2.25.0',
      cucumber: '7.15.0',
      appium: '9.1.0',
      restAssured: '5.4.0',
      datafaker: '2.1.0',
    },
    python: {
      selenium: '4.18.0',
      pytest: '8.1.0',
      requests: '2.31.0',
      appium: '3.2.0',
      faker: '22.5.0',
    },
    javascript: {
      selenium: '4.18.0',
      jest: '29.7.0',
      mocha: '10.3.0',
      cypress: '13.7.0',
      playwright: '1.42.0',
      webdriverio: '8.30.0',
      supertest: '6.3.4',
      fakerJs: '8.4.1',
    },
    csharp: {
      selenium: '4.18.0',
      nunit: '3.14.0',
      restsharp: '111.0.0',
      appium: '5.1.0',
      bogus: '35.5.0',
    },
    go: {
      playwrightGo: '0.4201.0',
      resty: '2.12.0',
      testify: '1.9.0',
      gofakeit: '6.29.0',
    },
  };
}

// ── Setup / Teardown ───────────────────────────────────────────────────

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qastarter-update-test-'));
  pointCwdAt(tmpDir);

  // Default: fetchBom returns null (use bundled BOM)
  mockedFetchBom.mockResolvedValue(null);

  consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

  // Mock process.exit to throw so we can assert on it without terminating.
  processExitSpy = vi
    .spyOn(process, 'exit')
    .mockImplementation((code?: string | number | null | undefined) => {
      throw new Error(`process.exit(${code})`);
    });

  // Reset inquirer to confirm by default
  (inquirer.prompt as ReturnType<typeof vi.fn>).mockResolvedValue({ confirm: true });
});

afterEach(() => {
  // Restore only the spies we manually created (console.log, process.exit, process.cwd).
  // We must NOT use vi.restoreAllMocks() because it would restore the vi.fn()
  // instances inside our vi.mock() factories (ora, inquirer, fetchBom),
  // stripping their implementations and breaking subsequent tests.
  consoleLogSpy.mockRestore();
  processExitSpy.mockRestore();

  // Clean up temp directory
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// ── Tests ──────────────────────────────────────────────────────────────

// =====================================================================
// 1. No build file found
// =====================================================================

describe('no build file found', () => {
  it('exits with code 1 and prints an error when no supported build file exists', async () => {
    await expect(runUpdate({ dryRun: false })).rejects.toThrow('process.exit(1)');

    const output = consoleLogSpy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(output).toContain('No supported build file found');
  });
});

// =====================================================================
// 2. pom.xml parser
// =====================================================================

describe('pom.xml parser', () => {
  const POM_CONTENT = `<?xml version="1.0"?>
<project>
  <dependencies>
    <dependency>
      <groupId>org.seleniumhq.selenium</groupId>
      <artifactId>selenium</artifactId>
      <version>4.16.0</version>
    </dependency>
    <dependency>
      <groupId>org.testng</groupId>
      <artifactId>testng</artifactId>
      <version>7.8.0</version>
    </dependency>
  </dependencies>
</project>`;

  it('detects outdated dependencies and updates them', async () => {
    writeTmpFile('pom.xml', POM_CONTENT);
    mockedFetchBom.mockResolvedValue(fullBom());

    await runUpdate({ dryRun: false });

    const updated = readTmpFile('pom.xml');
    expect(updated).toContain('<version>4.18.0</version>');
    expect(updated).toContain('<version>7.9.0</version>');
  });

  it('reports up-to-date when versions match BOM', async () => {
    const upToDate = POM_CONTENT.replace('4.16.0', '4.18.0').replace('7.8.0', '7.9.0');
    writeTmpFile('pom.xml', upToDate);
    mockedFetchBom.mockResolvedValue(fullBom());

    await runUpdate({ dryRun: false });

    const output = consoleLogSpy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(output).toContain('up to date');
  });
});

// =====================================================================
// 3. package.json parser — preserves ^ and ~ prefixes
// =====================================================================

describe('package.json parser', () => {
  it('updates outdated dependencies and preserves ^ prefix', async () => {
    const pkg = {
      name: 'test-project',
      dependencies: {
        selenium: '^4.16.0',
        jest: '^29.7.0',
      },
      devDependencies: {
        cypress: '^13.6.0',
      },
    };
    writeTmpFile('package.json', JSON.stringify(pkg, null, 2));
    mockedFetchBom.mockResolvedValue(fullBom());

    await runUpdate({ dryRun: false });

    const updated = JSON.parse(readTmpFile('package.json'));
    // selenium outdated: 4.16.0 → 4.18.0, prefix preserved
    expect(updated.dependencies.selenium).toBe('^4.18.0');
    // jest is already at BOM version
    expect(updated.dependencies.jest).toBe('^29.7.0');
    // cypress outdated: 13.6.0 → 13.7.0
    expect(updated.devDependencies.cypress).toBe('^13.7.0');
  });

  it('preserves ~ prefix during update', async () => {
    const pkg = {
      name: 'tilde-project',
      dependencies: {
        selenium: '~4.16.0',
      },
    };
    writeTmpFile('package.json', JSON.stringify(pkg, null, 2));
    mockedFetchBom.mockResolvedValue(fullBom());

    await runUpdate({ dryRun: false });

    const updated = JSON.parse(readTmpFile('package.json'));
    expect(updated.dependencies.selenium).toBe('~4.18.0');
  });

  it('preserves bare version (no prefix) during update', async () => {
    const pkg = {
      name: 'bare-project',
      dependencies: {
        selenium: '4.16.0',
      },
    };
    writeTmpFile('package.json', JSON.stringify(pkg, null, 2));
    mockedFetchBom.mockResolvedValue(fullBom());

    await runUpdate({ dryRun: false });

    const updated = JSON.parse(readTmpFile('package.json'));
    // The source code uses `dep.currentVersion.match(/^[^\d]*/)?.[0] || '^'`
    // For a bare version like "4.16.0", the non-digit prefix is empty string "",
    // which is falsy, so it falls back to "^".
    expect(updated.dependencies.selenium).toBe('^4.18.0');
  });
});

// =====================================================================
// 4. requirements.txt parser
// =====================================================================

describe('requirements.txt parser', () => {
  it('parses == and >= constraints and updates outdated deps', async () => {
    const content = [
      '# Python test deps',
      'selenium==4.16.0',
      'pytest>=8.0.0',
      'requests==2.31.0',
      '',
    ].join('\n');
    writeTmpFile('requirements.txt', content);
    mockedFetchBom.mockResolvedValue(fullBom());

    await runUpdate({ dryRun: false });

    const updated = readTmpFile('requirements.txt');
    expect(updated).toContain('selenium==4.18.0');
    expect(updated).toContain('pytest>=8.1.0');
    // requests is the same in BOM → unchanged
    expect(updated).toContain('requests==2.31.0');
  });

  it('skips comment lines and blanks', async () => {
    const content = [
      '# A comment',
      '',
      'pytest==8.0.0',
    ].join('\n');
    writeTmpFile('requirements.txt', content);
    mockedFetchBom.mockResolvedValue(fullBom());

    await runUpdate({ dryRun: false });

    const updated = readTmpFile('requirements.txt');
    // Comment and blank line preserved
    expect(updated).toContain('# A comment');
    expect(updated).toContain('pytest==8.1.0');
  });
});

// =====================================================================
// 5. build.gradle parser
// =====================================================================

describe('build.gradle parser', () => {
  it('parses implementation and testImplementation dependencies', async () => {
    const content = `
plugins {
    id 'java'
}

dependencies {
    implementation 'org.seleniumhq.selenium:selenium:4.16.0'
    testImplementation 'org.testng:testng:7.8.0'
    api 'io.restassured:restAssured:5.3.0'
}`;
    writeTmpFile('build.gradle', content);
    mockedFetchBom.mockResolvedValue(fullBom());

    await runUpdate({ dryRun: false });

    const updated = readTmpFile('build.gradle');
    expect(updated).toContain('selenium:4.18.0');
    expect(updated).toContain('testng:7.9.0');
    expect(updated).toContain('restAssured:5.4.0');
  });
});

// =====================================================================
// 6. *.csproj parser
// =====================================================================

describe('*.csproj parser', () => {
  it('parses PackageReference entries and updates versions', async () => {
    const content = `<Project Sdk="Microsoft.NET.Sdk">
  <ItemGroup>
    <PackageReference Include="selenium" Version="4.16.0" />
    <PackageReference Include="nunit" Version="3.14.0" />
    <PackageReference Include="restsharp" Version="110.2.0" />
  </ItemGroup>
</Project>`;
    writeTmpFile('TestProject.csproj', content);
    mockedFetchBom.mockResolvedValue(fullBom());

    await runUpdate({ dryRun: false });

    const updated = readTmpFile('TestProject.csproj');
    expect(updated).toContain('Version="4.18.0"');
    expect(updated).toContain('Version="3.14.0"'); // same as BOM → unchanged
    expect(updated).toContain('Version="111.0.0"');
  });
});

// =====================================================================
// 7. go.mod parser — including v2/v6 suffix bug fix
// =====================================================================

describe('go.mod parser', () => {
  it('parses Go module dependencies and updates outdated ones', async () => {
    const content = `module myproject

go 1.21

require (
\tgithub.com/stretchr/testify v1.8.4
\tgithub.com/brianvoe/gofakeit v6.28.0
)`;
    writeTmpFile('go.mod', content);
    mockedFetchBom.mockResolvedValue(fullBom());

    await runUpdate({ dryRun: false });

    const updated = readTmpFile('go.mod');
    expect(updated).toContain('testify v1.9.0');
    expect(updated).toContain('gofakeit v6.29.0');
  });

  it('extracts correct name from modules with v2 suffix (e.g. resty/v2)', async () => {
    // This verifies the parse-side fix: github.com/go-resty/resty/v2
    // should extract "resty" as the dependency name, not "v2".
    const content = `module myproject

go 1.21

require (
\tgithub.com/go-resty/resty/v2 v2.11.0
)`;
    writeTmpFile('go.mod', content);
    mockedFetchBom.mockResolvedValue(fullBom());

    await runUpdate({ dryRun: true });

    // The name "resty" (not "v2") should have been matched against the BOM,
    // and since 2.11.0 < 2.12.0 it is flagged as outdated.
    const output = consoleLogSpy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(output).toContain('resty');
    expect(output).toContain('outdated');
  });

  it('updates deps in modules with v2 suffix correctly', async () => {
    // The goModParser.update() regex handles optional /vN suffix in module paths,
    // so `resty/v2 v2.11.0` is correctly rewritten.
    const content = `module myproject

go 1.21

require (
\tgithub.com/go-resty/resty/v2 v2.11.0
)`;
    writeTmpFile('go.mod', content);
    mockedFetchBom.mockResolvedValue(fullBom());

    await runUpdate({ dryRun: false });

    const updated = readTmpFile('go.mod');
    // The fix handles /v2 suffix — version should be updated
    expect(updated).toContain('v2.12.0');
  });

  it('handles modules with v6 suffix — correctly extracts name, not suffix', async () => {
    // Verifies the parse-side fix: /v6 suffix is skipped, "gofakeit" is used.
    const content = `module myproject

go 1.21

require (
\tgithub.com/brianvoe/gofakeit/v6 v6.28.0
)`;
    writeTmpFile('go.mod', content);
    mockedFetchBom.mockResolvedValue(fullBom());

    await runUpdate({ dryRun: true });

    const output = consoleLogSpy.mock.calls.map((c) => c.join(' ')).join('\n');
    // Name should be "gofakeit", not "v6"
    expect(output).toContain('gofakeit');
    expect(output).toContain('outdated');
  });
});

// =====================================================================
// 8. Version comparison behavior (tested through runUpdate)
// =====================================================================

describe('version comparison', () => {
  it('reports "up-to-date" when current equals BOM version', async () => {
    const pkg = {
      name: 'exact-match',
      dependencies: { jest: '29.7.0' },
    };
    writeTmpFile('package.json', JSON.stringify(pkg, null, 2));
    mockedFetchBom.mockResolvedValue(fullBom());

    await runUpdate({ dryRun: true });

    const output = consoleLogSpy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(output).toContain('up to date');
    // No file changes in dry-run
  });

  it('reports "up-to-date" when user has a NEWER version (user override)', async () => {
    const pkg = {
      name: 'user-override',
      dependencies: { jest: '30.0.0' }, // newer than BOM 29.7.0
    };
    writeTmpFile('package.json', JSON.stringify(pkg, null, 2));
    mockedFetchBom.mockResolvedValue(fullBom());

    await runUpdate({ dryRun: true });

    const output = consoleLogSpy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(output).toContain('up to date');
  });

  it('reports "outdated" when current is older than BOM', async () => {
    const pkg = {
      name: 'old-dep',
      dependencies: { selenium: '4.10.0' },
    };
    writeTmpFile('package.json', JSON.stringify(pkg, null, 2));
    mockedFetchBom.mockResolvedValue(fullBom());

    await runUpdate({ dryRun: true });

    const output = consoleLogSpy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(output).toContain('outdated');
  });

  it('handles pre-release versions like 1.0.0-beta.1 without producing NaN', async () => {
    // The strip function removes -beta.1, so "1.0.0-beta.1" becomes "1.0.0".
    // We set BOM to 1.42.0 (playwright), current to "1.40.0-beta.1" → outdated.
    const pkg = {
      name: 'prerelease-test',
      dependencies: { playwright: '1.40.0-beta.1' },
    };
    writeTmpFile('package.json', JSON.stringify(pkg, null, 2));
    mockedFetchBom.mockResolvedValue(fullBom());

    await runUpdate({ dryRun: true });

    const output = consoleLogSpy.mock.calls.map((c) => c.join(' ')).join('\n');
    // Should report outdated (1.40.0 < 1.42.0), not NaN
    expect(output).toContain('outdated');
    expect(output).not.toContain('NaN');
  });

  it('handles versions with ^ prefix correctly in comparison', async () => {
    const pkg = {
      name: 'caret-version',
      dependencies: { selenium: '^4.16.0' },
    };
    writeTmpFile('package.json', JSON.stringify(pkg, null, 2));
    mockedFetchBom.mockResolvedValue(fullBom());

    await runUpdate({ dryRun: true });

    const output = consoleLogSpy.mock.calls.map((c) => c.join(' ')).join('\n');
    // 4.16.0 < 4.18.0 → outdated
    expect(output).toContain('outdated');
  });

  it('handles versions with ~ prefix correctly in comparison', async () => {
    const pkg = {
      name: 'tilde-version',
      dependencies: { selenium: '~4.16.0' },
    };
    writeTmpFile('package.json', JSON.stringify(pkg, null, 2));
    mockedFetchBom.mockResolvedValue(fullBom());

    await runUpdate({ dryRun: true });

    const output = consoleLogSpy.mock.calls.map((c) => c.join(' ')).join('\n');
    // 4.16.0 < 4.18.0 → outdated
    expect(output).toContain('outdated');
  });
});

// =====================================================================
// 9. BOM fallback to bundled when online fetch fails
// =====================================================================

describe('BOM fallback', () => {
  it('uses bundled BOM when fetchBom returns null', async () => {
    mockedFetchBom.mockResolvedValue(null);

    // Use a dep that exists in the hardcoded bundled BOM:
    // bundled java.selenium = 4.16.0
    const pomContent = `<?xml version="1.0"?>
<project>
  <dependencies>
    <dependency>
      <groupId>org.seleniumhq.selenium</groupId>
      <artifactId>selenium</artifactId>
      <version>4.10.0</version>
    </dependency>
  </dependencies>
</project>`;
    writeTmpFile('pom.xml', pomContent);

    await runUpdate({ dryRun: false });

    const updated = readTmpFile('pom.xml');
    // Bundled BOM selenium = 4.16.0
    expect(updated).toContain('<version>4.16.0</version>');
  });

  it('uses online BOM when fetchBom succeeds', async () => {
    mockedFetchBom.mockResolvedValue(fullBom());

    const pomContent = `<?xml version="1.0"?>
<project>
  <dependencies>
    <dependency>
      <groupId>org.seleniumhq.selenium</groupId>
      <artifactId>selenium</artifactId>
      <version>4.10.0</version>
    </dependency>
  </dependencies>
</project>`;
    writeTmpFile('pom.xml', pomContent);

    await runUpdate({ dryRun: false });

    const updated = readTmpFile('pom.xml');
    // Online BOM selenium = 4.18.0 (not bundled 4.16.0)
    expect(updated).toContain('<version>4.18.0</version>');
  });
});

// =====================================================================
// 10. Dry run mode
// =====================================================================

describe('dry run mode', () => {
  it('shows diff output but does NOT modify the build file', async () => {
    const originalContent = JSON.stringify(
      {
        name: 'dry-run-test',
        dependencies: { selenium: '^4.16.0' },
      },
      null,
      2,
    );
    writeTmpFile('package.json', originalContent);
    mockedFetchBom.mockResolvedValue(fullBom());

    await runUpdate({ dryRun: true });

    // File must remain unchanged
    const afterContent = readTmpFile('package.json');
    expect(afterContent).toBe(originalContent);

    // Output should mention dry run
    const output = consoleLogSpy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(output).toMatch(/[Dd]ry run/);
  });
});

// =====================================================================
// 11. User declines update prompt
// =====================================================================

describe('user cancels update', () => {
  it('does not modify files when user answers "no" to confirm prompt', async () => {
    (inquirer.prompt as ReturnType<typeof vi.fn>).mockResolvedValue({ confirm: false });

    const originalContent = JSON.stringify(
      {
        name: 'cancel-test',
        dependencies: { selenium: '^4.16.0' },
      },
      null,
      2,
    );
    writeTmpFile('package.json', originalContent);
    mockedFetchBom.mockResolvedValue(fullBom());

    await runUpdate({ dryRun: false });

    const afterContent = readTmpFile('package.json');
    expect(afterContent).toBe(originalContent);

    const output = consoleLogSpy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(output).toContain('Cancelled');
  });
});

// =====================================================================
// 12. No dependencies found in build file
// =====================================================================

describe('empty build file', () => {
  it('prints a message when no dependencies are found', async () => {
    const emptyPom = `<?xml version="1.0"?>
<project>
  <dependencies>
  </dependencies>
</project>`;
    writeTmpFile('pom.xml', emptyPom);
    mockedFetchBom.mockResolvedValue(fullBom());

    await runUpdate({ dryRun: false });

    const output = consoleLogSpy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(output).toContain('No dependencies found');
  });
});

// =====================================================================
// 13. Build file detection priority (pom.xml wins over package.json)
// =====================================================================

describe('build file detection priority', () => {
  it('picks pom.xml when both pom.xml and package.json exist', async () => {
    writeTmpFile(
      'pom.xml',
      `<?xml version="1.0"?>
<project>
  <dependencies>
    <dependency>
      <groupId>x</groupId>
      <artifactId>selenium</artifactId>
      <version>4.16.0</version>
    </dependency>
  </dependencies>
</project>`,
    );
    writeTmpFile(
      'package.json',
      JSON.stringify({ name: 'dual', dependencies: { selenium: '1.0.0' } }),
    );
    mockedFetchBom.mockResolvedValue(fullBom());

    await runUpdate({ dryRun: false });

    // pom.xml should be the one updated (java BOM)
    const updatedPom = readTmpFile('pom.xml');
    expect(updatedPom).toContain('<version>4.18.0</version>');

    // package.json should be untouched
    const pkg = JSON.parse(readTmpFile('package.json'));
    expect(pkg.dependencies.selenium).toBe('1.0.0');
  });
});

// =====================================================================
// 14. BOM lookup is case-insensitive for dependency names
// =====================================================================

describe('case-insensitive BOM lookup', () => {
  it('matches dependency names case-insensitively against the BOM', async () => {
    // In the csproj, "Selenium" (capital S) should match BOM key "selenium"
    const content = `<Project Sdk="Microsoft.NET.Sdk">
  <ItemGroup>
    <PackageReference Include="Selenium" Version="4.16.0" />
  </ItemGroup>
</Project>`;
    writeTmpFile('MyApp.csproj', content);
    mockedFetchBom.mockResolvedValue(fullBom());

    await runUpdate({ dryRun: true });

    const output = consoleLogSpy.mock.calls.map((c) => c.join(' ')).join('\n');
    // Should recognize it as outdated via case-insensitive lookup
    expect(output).toContain('outdated');
  });
});

// =====================================================================
// 15. Unknown dependency (not in BOM)
// =====================================================================

describe('unknown dependency', () => {
  it('marks dependencies not found in BOM as unknown', async () => {
    const pkg = {
      name: 'unknown-dep-test',
      dependencies: {
        'some-obscure-package': '^1.0.0',
      },
    };
    writeTmpFile('package.json', JSON.stringify(pkg, null, 2));
    mockedFetchBom.mockResolvedValue(fullBom());

    await runUpdate({ dryRun: true });

    const output = consoleLogSpy.mock.calls.map((c) => c.join(' ')).join('\n');
    // Should show unknown status indicator (?) and "up to date" message
    // (since no outdated deps were found)
    expect(output).toContain('unknown');
    expect(output).toContain('up to date');
  });
});
