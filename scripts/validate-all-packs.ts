#!/usr/bin/env node
/**
 * Comprehensive Template Pack Validator
 *
 * Reads ALL template pack directories, generates a project for each pack,
 * and validates the generated output for quality issues including:
 *   - Unrendered Handlebars expressions
 *   - Empty files
 *   - Broken XML/JSON
 *   - Missing build files, README, and test files
 *
 * Usage:
 *   npx tsx scripts/validate-all-packs.ts
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { TemplatePackEngine } from '../server/templates/templatePackEngine';
import type { TemplateFile } from '../server/templates/types';
import type { ProjectConfig } from '@shared/schema';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PACKS_DIR = path.join(__dirname, '..', 'server', 'templates', 'packs');

// Build file patterns recognized across ecosystems
const BUILD_FILE_PATTERNS = [
  'pom.xml',
  'build.gradle',
  'build.gradle.kts',
  'package.json',
  'requirements.txt',
  'go.mod',
  'pubspec.yaml',
  'Gemfile',
  'Package.swift',
];
const BUILD_FILE_EXTENSIONS = ['.csproj', '.sln', '.fsproj'];

// Files that are legitimately empty by design
const ALLOWED_EMPTY_FILES = [
  '__init__.py', // Python package markers
  'go.sum', // Populated by `go mod tidy`
  '.gitkeep', // Git directory placeholder
];

// Test directory prefixes (normalized to forward slashes)
const TEST_DIR_PREFIXES = [
  'src/test',
  'tests/',
  'test/',
  'specs/',
  'spec/',
  'e2e/',
  'integration_tests/',
  'test_driver/',
];

// ── Types ────────────────────────────────────────────────────────────

interface ManifestDynamicSupport {
  reportingTools?: string[];
  cicdTools?: string[];
  testingPatterns?: string[];
}

interface ManifestSupportedCombination {
  testingType: 'web' | 'mobile' | 'api' | 'desktop';
  framework: string;
  language: string;
  testRunner: string;
  buildTool: string;
}

interface PackManifest {
  id: string;
  supportedCombination: ManifestSupportedCombination;
  dynamicSupport?: ManifestDynamicSupport;
  files: { path: string; isTemplate: boolean; conditional?: Record<string, any> }[];
  toolVersions?: Record<string, string>;
}

interface HandlebarsIssue {
  file: string;
  line: number;
  match: string;
}

interface PackReport {
  pack: string;
  totalFiles: number;
  unrenderedHandlebars: HandlebarsIssue[];
  emptyFiles: string[];
  invalidXmlJson: { file: string; reason: string }[];
  missingBuildFile: boolean;
  missingReadme: boolean;
  missingTestFiles: boolean;
  generationError: string | null;
}

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Build a ProjectConfig from the manifest's supportedCombination and
 * reasonable defaults.
 */
function buildConfig(manifest: PackManifest): ProjectConfig {
  const combo = manifest.supportedCombination;
  const dynamic = manifest.dynamicSupport;

  // Pick the first supported testing pattern, preferring page-object-model
  let testingPattern = 'page-object-model';
  if (dynamic?.testingPatterns && dynamic.testingPatterns.length > 0) {
    if (dynamic.testingPatterns.includes('page-object-model')) {
      testingPattern = 'page-object-model';
    } else {
      testingPattern = dynamic.testingPatterns[0];
    }
  }

  // Pick reporting tool: prefer allure if supported, else first available
  let reportingTool: string | undefined;
  if (dynamic?.reportingTools && dynamic.reportingTools.length > 0) {
    if (dynamic.reportingTools.includes('allure')) {
      reportingTool = 'allure';
    } else {
      reportingTool = dynamic.reportingTools[0];
    }
  }

  // Pick CI/CD tool: prefer github-actions if supported, else first available
  let cicdTool: string | undefined;
  if (dynamic?.cicdTools && dynamic.cicdTools.length > 0) {
    if (dynamic.cicdTools.includes('github-actions')) {
      cicdTool = 'github-actions';
    } else {
      cicdTool = dynamic.cicdTools[0];
    }
  }

  return {
    projectName: 'test-project',
    testingType: combo.testingType,
    framework: combo.framework,
    language: combo.language,
    testRunner: combo.testRunner,
    buildTool: combo.buildTool,
    testingPattern,
    includeSampleTests: true,
    reportingTool,
    cicdTool,
    groupId: 'com.example',
    artifactId: 'test-project',
    utilities: {
      configReader: true,
      jsonReader: false,
      screenshotUtility: true,
      logger: true,
      dataProvider: false,
      includeDocker: false,
      includeDockerCompose: false,
    },
  };
}

/**
 * Detect unrendered Handlebars expressions in file content.
 *
 * Rules:
 *   - Match `{{...}}` that is NOT preceded by `$` (GitHub Actions `${{ }}`)
 *   - Skip README.md files (they may document template syntax on purpose)
 */
function findUnrenderedHandlebars(filePath: string, content: string): HandlebarsIssue[] {
  // Skip README files entirely -- they often document Handlebars syntax
  const normalizedPath = filePath.replace(/\\/g, '/');
  if (normalizedPath.toLowerCase().endsWith('readme.md')) {
    return [];
  }

  const issues: HandlebarsIssue[] = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Regex: match `{{` that is NOT preceded by `$` and NOT a triple-brace
    // We look for `{{` followed by content that looks like a Handlebars expression:
    //   - `{{variableName}}`
    //   - `{{#if ...}}`
    //   - `{{/if}}`
    //   - `{{> partial}}`
    //   - `{{else}}`
    // But NOT `${{` (GitHub Actions) and NOT `{{{` (Handlebars unescaped, rare in output)
    const regex = /(?<!\$)\{\{(?!\{)([^}]*)\}\}/g;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(line)) !== null) {
      const full = match[0];
      const inner = match[1].trim();

      // Skip empty inner content
      if (!inner) continue;

      // Skip things that are clearly not Handlebars template expressions:
      // - JSON-like content (double-brace in Jinja/Ansible is unlikely here)
      // We specifically look for Handlebars patterns
      const isHandlebars =
        /^[a-zA-Z_#/>]/.test(inner) || // starts with letter, #, /, >
        inner.startsWith('else') ||
        inner.startsWith('raw') ||
        inner.startsWith('lookup');

      if (isHandlebars) {
        issues.push({
          file: filePath,
          line: i + 1,
          match: full,
        });
      }
    }
  }

  return issues;
}

/**
 * Check if file content is empty or whitespace-only.
 */
function isEmptyFile(content: string): boolean {
  return content.trim().length === 0;
}

/**
 * Validate XML files: must start with `<?xml` or `<`.
 */
function validateXml(filePath: string, content: string): string | null {
  const trimmed = content.trim();
  if (trimmed.length === 0) {
    return 'File is empty';
  }
  if (!trimmed.startsWith('<?xml') && !trimmed.startsWith('<')) {
    return `Does not start with valid XML (starts with: "${trimmed.substring(0, 30)}...")`;
  }
  return null;
}

/**
 * Validate JSON files: must be parseable.
 */
function validateJson(filePath: string, content: string): string | null {
  const trimmed = content.trim();
  if (trimmed.length === 0) {
    return 'File is empty';
  }
  try {
    JSON.parse(trimmed);
    return null;
  } catch (e: any) {
    return `Invalid JSON: ${e.message}`;
  }
}

/**
 * Check whether ANY generated file matches a build file pattern.
 */
function hasBuildFile(files: TemplateFile[]): boolean {
  return files.some((f) => {
    const basename = path.basename(f.path);
    const normalized = f.path.replace(/\\/g, '/');

    if (BUILD_FILE_PATTERNS.includes(basename)) return true;

    return BUILD_FILE_EXTENSIONS.some((ext) => normalized.endsWith(ext));
  });
}

/**
 * Check if README.md exists among generated files.
 */
function hasReadme(files: TemplateFile[]): boolean {
  return files.some((f) => {
    const basename = path.basename(f.path).toLowerCase();
    return basename === 'readme.md';
  });
}

/**
 * Check if any file lives inside a test directory.
 */
function hasTestFiles(files: TemplateFile[]): boolean {
  return files.some((f) => {
    const normalized = f.path.replace(/\\/g, '/').toLowerCase();
    return TEST_DIR_PREFIXES.some((prefix) => normalized.includes(prefix));
  });
}

// ── Main validation loop ─────────────────────────────────────────────

async function validateAllPacks() {
  console.log('=== Template Pack Comprehensive Validator ===\n');
  console.log(`Packs directory: ${PACKS_DIR}\n`);

  // Discover all pack directories
  let packDirs: string[];
  try {
    const entries = await fs.readdir(PACKS_DIR, { withFileTypes: true });
    packDirs = entries
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort();
  } catch (err) {
    console.error(`FATAL: Could not read packs directory: ${err}`);
    process.exit(1);
  }

  console.log(`Found ${packDirs.length} template packs.\n`);

  const engine = new TemplatePackEngine(PACKS_DIR);
  const reports: PackReport[] = [];

  for (const packDir of packDirs) {
    const report: PackReport = {
      pack: packDir,
      totalFiles: 0,
      unrenderedHandlebars: [],
      emptyFiles: [],
      invalidXmlJson: [],
      missingBuildFile: false,
      missingReadme: false,
      missingTestFiles: false,
      generationError: null,
    };

    console.log(`--- Validating: ${packDir} ---`);

    // 1. Read manifest
    const manifestPath = path.join(PACKS_DIR, packDir, 'manifest.json');
    let manifest: PackManifest;
    try {
      let raw = await fs.readFile(manifestPath, 'utf-8');
      // Strip BOM if present
      if (raw.charCodeAt(0) === 0xfeff) {
        raw = raw.slice(1);
      }
      manifest = JSON.parse(raw);
    } catch (err: any) {
      report.generationError = `Failed to read/parse manifest: ${err.message}`;
      console.log(`  ERROR: ${report.generationError}\n`);
      reports.push(report);
      continue;
    }

    // 2. Build config from manifest
    const config = buildConfig(manifest);

    // 3. Generate project files
    let files: TemplateFile[];
    try {
      files = [];
      for await (const file of engine.generateProjectStream(config, { strict: false })) {
        files.push(file);
      }
    } catch (err: any) {
      report.generationError = `Generation failed: ${err.message}`;
      console.log(`  ERROR: ${report.generationError}\n`);
      reports.push(report);
      continue;
    }

    report.totalFiles = files.length;

    if (files.length === 0) {
      report.generationError = 'Generated 0 files';
      console.log(`  ERROR: ${report.generationError}\n`);
      reports.push(report);
      continue;
    }

    // 4. Validate each file
    for (const file of files) {
      const ext = path.extname(file.path).toLowerCase();

      // 4a. Unrendered Handlebars
      const hbIssues = findUnrenderedHandlebars(file.path, file.content);
      report.unrenderedHandlebars.push(...hbIssues);

      // 4b. Empty files (skip legitimately empty files)
      const basename = path.basename(file.path);
      if (isEmptyFile(file.content) && !ALLOWED_EMPTY_FILES.includes(basename)) {
        report.emptyFiles.push(file.path);
      }

      // 4c. Broken XML
      if (ext === '.xml') {
        const xmlError = validateXml(file.path, file.content);
        if (xmlError) {
          report.invalidXmlJson.push({ file: file.path, reason: xmlError });
        }
      }

      // 4d. Broken JSON
      if (ext === '.json') {
        const jsonError = validateJson(file.path, file.content);
        if (jsonError) {
          report.invalidXmlJson.push({ file: file.path, reason: jsonError });
        }
      }
    }

    // 4e. Missing essentials
    report.missingBuildFile = !hasBuildFile(files);
    report.missingReadme = !hasReadme(files);
    report.missingTestFiles = !hasTestFiles(files);

    // 5. Print per-pack report
    const issueCount =
      report.unrenderedHandlebars.length +
      report.emptyFiles.length +
      report.invalidXmlJson.length +
      (report.missingBuildFile ? 1 : 0) +
      (report.missingReadme ? 1 : 0) +
      (report.missingTestFiles ? 1 : 0);

    console.log(`  Files generated: ${report.totalFiles}`);

    if (issueCount === 0) {
      console.log('  Status: CLEAN');
    } else {
      console.log(`  Status: ${issueCount} issue(s) found`);

      if (report.unrenderedHandlebars.length > 0) {
        console.log(`  Unrendered Handlebars (${report.unrenderedHandlebars.length}):`);
        for (const issue of report.unrenderedHandlebars) {
          console.log(`    - ${issue.file}:${issue.line}  ${issue.match}`);
        }
      }

      if (report.emptyFiles.length > 0) {
        console.log(`  Empty files (${report.emptyFiles.length}):`);
        for (const f of report.emptyFiles) {
          console.log(`    - ${f}`);
        }
      }

      if (report.invalidXmlJson.length > 0) {
        console.log(`  Invalid XML/JSON (${report.invalidXmlJson.length}):`);
        for (const item of report.invalidXmlJson) {
          console.log(`    - ${item.file}: ${item.reason}`);
        }
      }

      if (report.missingBuildFile) {
        console.log('  Missing build file (pom.xml, build.gradle, package.json, etc.)');
      }
      if (report.missingReadme) {
        console.log('  Missing README.md');
      }
      if (report.missingTestFiles) {
        console.log('  Missing test files (no files in src/test, tests/, test/, specs/)');
      }
    }

    console.log('');
    reports.push(report);
  }

  // ── Final summary ────────────────────────────────────────────────

  console.log('='.repeat(60));
  console.log('VALIDATION SUMMARY');
  console.log('='.repeat(60));

  const totalPacks = reports.length;
  const failedGeneration = reports.filter((r) => r.generationError !== null).length;
  const packsWithIssues = reports.filter((r) => {
    if (r.generationError) return true;
    return (
      r.unrenderedHandlebars.length > 0 ||
      r.emptyFiles.length > 0 ||
      r.invalidXmlJson.length > 0 ||
      r.missingBuildFile ||
      r.missingReadme ||
      r.missingTestFiles
    );
  }).length;
  const cleanPacks = totalPacks - packsWithIssues;

  console.log(`Total packs checked : ${totalPacks}`);
  console.log(`Generation failures : ${failedGeneration}`);
  console.log(`Packs with issues   : ${packsWithIssues}`);
  console.log(`Packs clean         : ${cleanPacks}`);

  if (packsWithIssues > 0) {
    console.log('\nPacks with issues:');
    for (const r of reports) {
      const hasIssue =
        r.generationError !== null ||
        r.unrenderedHandlebars.length > 0 ||
        r.emptyFiles.length > 0 ||
        r.invalidXmlJson.length > 0 ||
        r.missingBuildFile ||
        r.missingReadme ||
        r.missingTestFiles;

      if (hasIssue) {
        const reasons: string[] = [];
        if (r.generationError) reasons.push(`generation error`);
        if (r.unrenderedHandlebars.length > 0)
          reasons.push(`${r.unrenderedHandlebars.length} unrendered handlebars`);
        if (r.emptyFiles.length > 0) reasons.push(`${r.emptyFiles.length} empty files`);
        if (r.invalidXmlJson.length > 0)
          reasons.push(`${r.invalidXmlJson.length} invalid xml/json`);
        if (r.missingBuildFile) reasons.push('missing build file');
        if (r.missingReadme) reasons.push('missing README');
        if (r.missingTestFiles) reasons.push('missing test files');
        console.log(`  - ${r.pack}: ${reasons.join(', ')}`);
      }
    }
  }

  console.log('');

  // Exit with error code if any issues found
  if (packsWithIssues > 0) {
    process.exit(1);
  } else {
    console.log('ALL PACKS CLEAN -- no issues detected.');
    process.exit(0);
  }
}

validateAllPacks().catch((err) => {
  console.error('Fatal script error:', err);
  process.exit(1);
});
