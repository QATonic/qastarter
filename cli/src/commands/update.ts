/**
 * `qastarter update` command
 *
 * Scans the current project's build file (pom.xml, package.json,
 * requirements.txt, build.gradle, *.csproj, go.mod), compares dependency
 * versions against the QAStarter BOM, and offers to update them.
 */

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { fetchBom } from '../lib/api.js';

/**
 * Resolve a build-file path and refuse it if it — or any parent inside cwd —
 * is a symlink. `update.ts` rewrites version strings in-place, so a malicious
 * checkout could plant `pom.xml -> /tmp/attacker.xml` and trick the updater
 * into editing arbitrary files outside the project.
 *
 * Returns the canonical path on success, or `null` if the file doesn't exist.
 * Throws with a clear message if a symlink is detected.
 */
function safeBuildFilePath(filePath: string, cwd: string): string | null {
  if (!fs.existsSync(filePath)) return null;
  const stat = fs.lstatSync(filePath);
  if (stat.isSymbolicLink()) {
    throw new Error(
      `Refusing to follow symlink "${filePath}" — qastarter update will not edit the real target for safety.`
    );
  }
  // Ensure the realpath still lives under cwd (catches parent-dir symlinks).
  const real = fs.realpathSync(filePath);
  const realCwd = fs.realpathSync(cwd);
  const prefix = realCwd.endsWith(path.sep) ? realCwd : realCwd + path.sep;
  if (!real.startsWith(prefix) && real !== realCwd) {
    throw new Error(
      `Refusing to edit "${filePath}" — its realpath escapes the project directory.`
    );
  }
  return real;
}

// ── Bundled BOM fallback (hardcoded subset for offline use) ─────────
function getBundledBom(): Record<string, Record<string, string>> {
  // Minimal fallback so the CLI can work without a server connection.
  // For the full BOM, the online endpoint is preferred.
  return {
    java: { selenium: '4.16.0', testng: '7.8.0', junit5: '5.10.1', allure: '2.25.0', cucumber: '7.15.0', appium: '9.0.0', restAssured: '5.3.0', datafaker: '2.1.0' },
    python: { selenium: '4.16.0', pytest: '8.0.0', requests: '2.31.0', appium: '3.1.0', faker: '22.0.0' },
    javascript: { selenium: '4.16.0', jest: '29.7.0', mocha: '10.2.0', cypress: '13.6.0', playwright: '1.40.0', webdriverio: '8.24.0', supertest: '6.3.3', fakerJs: '8.4.0' },
    csharp: { selenium: '4.16.0', nunit: '3.14.0', restsharp: '110.2.0', appium: '5.0.0', bogus: '35.4.0' },
    go: { playwrightGo: '0.4101.1', resty: '2.11.0', testify: '1.8.4', gofakeit: '6.28.0' },
  };
}

// ── Types ───────────────────────────────────────────────────────────

interface DependencyInfo {
  name: string;
  currentVersion: string;
  latestVersion: string | null;
  status: 'up-to-date' | 'outdated' | 'unknown';
}

interface BuildFileParser {
  detect(cwd: string): string | null;
  parse(filePath: string): DependencyInfo[];
  update(filePath: string, updates: DependencyInfo[]): void;
  language: string;
}

// ── BOM Lookup ──────────────────────────────────────────────────────

function lookupBomVersion(
  bom: Record<string, Record<string, string>>,
  language: string,
  depName: string
): string | null {
  const langBom = bom[language];
  if (!langBom) return null;

  // Exact match first
  if (langBom[depName]) return langBom[depName];

  // Lowercase match
  const lower = depName.toLowerCase();
  for (const [key, ver] of Object.entries(langBom)) {
    if (key.toLowerCase() === lower) return ver;
  }

  return null;
}

function compareVersions(current: string, latest: string): 'up-to-date' | 'outdated' {
  // Strip leading qualifiers (^, ~, >=, etc.) and pre-release suffixes (-beta.1, -rc.2)
  const strip = (v: string) => v.replace(/^[^\d]*/, '').replace(/-.*$/, '');
  const a = strip(current);
  const b = strip(latest);
  if (a === b) return 'up-to-date';
  // Simple semver compare: split by dots and compare numerically
  const ap = a.split('.').map(Number);
  const bp = b.split('.').map(Number);
  for (let i = 0; i < Math.max(ap.length, bp.length); i++) {
    const ai = isNaN(ap[i]) ? 0 : (ap[i] ?? 0);
    const bi = isNaN(bp[i]) ? 0 : (bp[i] ?? 0);
    if (ai < bi) return 'outdated';
    if (ai > bi) return 'up-to-date'; // local is newer (user override)
  }
  return 'up-to-date';
}

// ── Parsers ─────────────────────────────────────────────────────────

const pomParser: BuildFileParser = {
  language: 'java',
  detect(cwd) {
    const p = path.join(cwd, 'pom.xml');
    return safeBuildFilePath(p, cwd);
  },
  parse(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const deps: DependencyInfo[] = [];
    // Process each <dependency>…</dependency> block in isolation. Splitting
    // on the closing tag caps regex work at O(total-characters) instead of
    // letting the scanner backtrack across the whole file when a single
    // block is malformed. Also tolerates attributes like <dependency scope="test">.
    const blocks = content.split(/<\/dependency>/);
    const tagRe = (tag: string) =>
      new RegExp(`<${tag}\\s*(?:[^>]*)>([^<]+)</${tag}>`, 's');
    for (const block of blocks) {
      if (!block.includes('<dependency')) continue;
      const artifactId = block.match(tagRe('artifactId'))?.[1]?.trim();
      const version = block.match(tagRe('version'))?.[1]?.trim();
      if (artifactId && version) {
        deps.push({ name: artifactId, currentVersion: version, latestVersion: null, status: 'unknown' });
      }
    }
    return deps;
  },
  update(filePath, updates) {
    let content = fs.readFileSync(filePath, 'utf-8');
    for (const dep of updates) {
      if (!dep.latestVersion || dep.status !== 'outdated') continue;
      // Replace version in <dependency> block for this artifactId
      const regex = new RegExp(
        `(<artifactId>${escapeRegex(dep.name)}<\\/artifactId>\\s*<version>)[^<]+(</version>)`,
        'g'
      );
      content = content.replace(regex, `$1${dep.latestVersion}$2`);
    }
    fs.writeFileSync(filePath, content);
  },
};

const gradleParser: BuildFileParser = {
  language: 'java',
  detect(cwd) {
    const p = path.join(cwd, 'build.gradle');
    return safeBuildFilePath(p, cwd);
  },
  parse(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const deps: DependencyInfo[] = [];
    // Match patterns: implementation 'group:name:version'
    const depRegex = /(?:implementation|testImplementation|api)\s+['"]([^:'"]+):([^:'"]+):([^'"]+)['"]/g;
    let m;
    while ((m = depRegex.exec(content)) !== null) {
      deps.push({ name: m[2], currentVersion: m[3], latestVersion: null, status: 'unknown' });
    }
    return deps;
  },
  update(filePath, updates) {
    let content = fs.readFileSync(filePath, 'utf-8');
    for (const dep of updates) {
      if (!dep.latestVersion || dep.status !== 'outdated') continue;
      // Match group:artifactId:version — use the full artifact name context
      const regex = new RegExp(
        `(['":]${escapeRegex(dep.name)}:)[^'"]+`,
        'g'
      );
      content = content.replace(regex, `$1${dep.latestVersion}`);
    }
    fs.writeFileSync(filePath, content);
  },
};

const packageJsonParser: BuildFileParser = {
  language: 'javascript',
  detect(cwd) {
    const p = path.join(cwd, 'package.json');
    return safeBuildFilePath(p, cwd);
  },
  parse(filePath) {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const deps: DependencyInfo[] = [];
    const allDeps = {
      ...(content.dependencies || {}),
      ...(content.devDependencies || {}),
    };
    for (const [name, version] of Object.entries(allDeps)) {
      if (typeof version === 'string') {
        deps.push({ name, currentVersion: version, latestVersion: null, status: 'unknown' });
      }
    }
    return deps;
  },
  update(filePath, updates) {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    for (const dep of updates) {
      if (!dep.latestVersion || dep.status !== 'outdated') continue;
      const prefix = dep.currentVersion.match(/^[^\d]*/)?.[0] || '^';
      const newVersion = `${prefix}${dep.latestVersion}`;
      if (content.dependencies?.[dep.name]) {
        content.dependencies[dep.name] = newVersion;
      }
      if (content.devDependencies?.[dep.name]) {
        content.devDependencies[dep.name] = newVersion;
      }
    }
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n');
  },
};

const requirementsParser: BuildFileParser = {
  language: 'python',
  detect(cwd) {
    const p = path.join(cwd, 'requirements.txt');
    return safeBuildFilePath(p, cwd);
  },
  parse(filePath) {
    const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
    const deps: DependencyInfo[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      // Match: package>=version or package==version
      const m = trimmed.match(/^([a-zA-Z0-9_-]+)\s*([><=!~]+)\s*(.+)$/);
      if (m) {
        deps.push({ name: m[1], currentVersion: m[3].trim(), latestVersion: null, status: 'unknown' });
      }
    }
    return deps;
  },
  update(filePath, updates) {
    let content = fs.readFileSync(filePath, 'utf-8');
    for (const dep of updates) {
      if (!dep.latestVersion || dep.status !== 'outdated') continue;
      const regex = new RegExp(
        `(${escapeRegex(dep.name)}\\s*[><=!~]+\\s*)\\S+`,
        'g'
      );
      content = content.replace(regex, `$1${dep.latestVersion}`);
    }
    fs.writeFileSync(filePath, content);
  },
};

const csprojParser: BuildFileParser = {
  language: 'csharp',
  detect(cwd) {
    const files = fs.readdirSync(cwd).filter((f) => f.endsWith('.csproj'));
    if (files.length === 0) return null;
    // Same symlink guard applies — .csproj could be a link to anywhere.
    return safeBuildFilePath(path.join(cwd, files[0]), cwd);
  },
  parse(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const deps: DependencyInfo[] = [];
    const regex = /<PackageReference\s+Include="([^"]+)"\s+Version="([^"]+)"/g;
    let m;
    while ((m = regex.exec(content)) !== null) {
      deps.push({ name: m[1], currentVersion: m[2], latestVersion: null, status: 'unknown' });
    }
    return deps;
  },
  update(filePath, updates) {
    let content = fs.readFileSync(filePath, 'utf-8');
    for (const dep of updates) {
      if (!dep.latestVersion || dep.status !== 'outdated') continue;
      const regex = new RegExp(
        `(<PackageReference\\s+Include="${escapeRegex(dep.name)}"\\s+Version=")[^"]+`,
        'g'
      );
      content = content.replace(regex, `$1${dep.latestVersion}`);
    }
    fs.writeFileSync(filePath, content);
  },
};

const goModParser: BuildFileParser = {
  language: 'go',
  detect(cwd) {
    const p = path.join(cwd, 'go.mod');
    return safeBuildFilePath(p, cwd);
  },
  parse(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const deps: DependencyInfo[] = [];
    // Match: module/path vX.Y.Z
    const regex = /^\s+(\S+)\s+(v[\d.]+)/gm;
    let m;
    while ((m = regex.exec(content)) !== null) {
      const parts = m[1].split('/');
      // Skip version suffixes like "v2", "v6" at the end of Go module paths
      let shortName = parts[parts.length - 1];
      if (/^v\d+$/.test(shortName) && parts.length > 1) {
        shortName = parts[parts.length - 2];
      }
      deps.push({ name: shortName, currentVersion: m[2].replace(/^v/, ''), latestVersion: null, status: 'unknown' });
    }
    return deps;
  },
  update(filePath, updates) {
    let content = fs.readFileSync(filePath, 'utf-8');
    for (const dep of updates) {
      if (!dep.latestVersion || dep.status !== 'outdated') continue;
      // Replace version in require block. Handle optional /vN suffix in module path
      // e.g., github.com/go-resty/resty/v2 v2.11.0 → ...resty/v2 v2.12.0
      const regex = new RegExp(
        `(${escapeRegex(dep.name)}(?:/v\\d+)?\\s+v)[\\d.]+`,
        'g'
      );
      content = content.replace(regex, `$1${dep.latestVersion}`);
    }
    fs.writeFileSync(filePath, content);
  },
};

const ALL_PARSERS: BuildFileParser[] = [
  pomParser,
  gradleParser,
  packageJsonParser,
  requirementsParser,
  csprojParser,
  goModParser,
];

// ── Utilities ───────────────────────────────────────────────────────

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ── Main Command ────────────────────────────────────────────────────

export async function runUpdate(options: { dryRun: boolean }): Promise<void> {
  const cwd = process.cwd();

  console.log(chalk.cyan('\n  QAStarter Update\n'));

  // 1. Detect build file
  let parser: BuildFileParser | null = null;
  let buildFilePath: string | null = null;

  for (const p of ALL_PARSERS) {
    const detected = p.detect(cwd);
    if (detected) {
      parser = p;
      buildFilePath = detected;
      break;
    }
  }

  if (!parser || !buildFilePath) {
    console.log(
      chalk.yellow(
        '  No supported build file found in current directory.\n' +
          '  Supported: pom.xml, build.gradle, package.json, requirements.txt, *.csproj, go.mod\n'
      )
    );
    process.exit(1);
  }

  console.log(
    chalk.white(`  Build file: ${chalk.green(path.relative(cwd, buildFilePath))}`)
  );
  console.log(
    chalk.white(`  Language:   ${chalk.green(parser.language)}\n`)
  );

  // 2. Parse current dependencies
  const deps = parser.parse(buildFilePath);
  if (deps.length === 0) {
    console.log(chalk.yellow('  No dependencies found in build file.\n'));
    return;
  }

  // 3. Fetch BOM (online first, fallback to bundled)
  const spinner = ora('Fetching latest dependency versions...').start();

  let bom = await fetchBom();
  if (!bom) {
    bom = getBundledBom();
    spinner.info('Using bundled BOM (server unreachable)');
  } else {
    spinner.succeed('Latest versions fetched');
  }

  // 4. Compare versions
  let outdatedCount = 0;
  for (const dep of deps) {
    const bomVersion = lookupBomVersion(bom, parser.language, dep.name);
    if (bomVersion) {
      dep.latestVersion = bomVersion;
      dep.status = compareVersions(dep.currentVersion, bomVersion);
      if (dep.status === 'outdated') outdatedCount++;
    }
  }

  // 5. Display diff table
  console.log();
  console.log(
    chalk.white.bold(
      `  ${'Dependency'.padEnd(35)} ${'Current'.padEnd(15)} ${'Latest'.padEnd(15)} Status`
    )
  );
  console.log(chalk.gray(`  ${'─'.repeat(35)} ${'─'.repeat(15)} ${'─'.repeat(15)} ${'─'.repeat(12)}`));

  for (const dep of deps) {
    const statusColor =
      dep.status === 'outdated'
        ? chalk.yellow
        : dep.status === 'up-to-date'
          ? chalk.green
          : chalk.gray;

    const statusIcon =
      dep.status === 'outdated' ? '↑' : dep.status === 'up-to-date' ? '✓' : '?';

    console.log(
      `  ${chalk.white(dep.name.padEnd(35))} ${chalk.gray(dep.currentVersion.padEnd(15))} ${statusColor((dep.latestVersion || '-').padEnd(15))} ${statusColor(`${statusIcon} ${dep.status}`)}`
    );
  }

  console.log();

  if (outdatedCount === 0) {
    console.log(chalk.green('  All dependencies are up to date!\n'));
    return;
  }

  console.log(
    chalk.yellow(`  ${outdatedCount} dependency${outdatedCount > 1 ? 'ies' : ''} can be updated.\n`)
  );

  // 6. Apply updates (or dry-run)
  if (options.dryRun) {
    console.log(chalk.gray('  Dry run — no changes made.\n'));
    return;
  }

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Apply updates to build file?',
      default: true,
    },
  ]);

  if (!confirm) {
    console.log(chalk.gray('  Cancelled.\n'));
    return;
  }

  parser.update(buildFilePath, deps);
  console.log(
    chalk.green(`\n  ✓ Updated ${outdatedCount} dependencies in ${path.basename(buildFilePath)}\n`)
  );
}
