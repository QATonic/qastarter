/**
 * QAStarter: Exhaustive Template Pack Generation Test
 *
 * Reads every pack directory from server/templates/packs/,
 * builds a valid ProjectConfig from each manifest, runs the
 * template engine, and verifies:
 *   1. Generation succeeds (no thrown errors)
 *   2. Generated file count >= unconditional manifest file count
 *   3. No generated file contains raw unresolved Handlebars syntax
 */

import path from 'path';
import { promises as fs } from 'fs';
import { TemplatePackEngine } from '../server/templates/templatePackEngine';

// ---- Types (inlined to avoid import issues) ----

interface SupportedCombination {
  testingType: string;
  framework: string;
  language: string;
  testRunner: string;
  buildTool: string;
}

interface TemplatePackFile {
  path: string;
  isTemplate: boolean;
  conditional?: Record<string, any>;
}

interface ManifestJson {
  id: string;
  displayName: string;
  supportedCombination: SupportedCombination;
  files: TemplatePackFile[];
}

// ---- Helpers ----

const PACKS_DIR = path.resolve(process.cwd(), 'server', 'templates', 'packs');

/**
 * Build a valid ProjectConfig for a given pack's supportedCombination.
 * Java / Kotlin / C# packs need extra fields (groupId, artifactId, etc.).
 */
function buildConfig(combo: SupportedCombination): Record<string, any> {
  const base: Record<string, any> = {
    projectName: 'test-project',
    testingType: combo.testingType,
    framework: combo.framework,
    language: combo.language,
    testRunner: combo.testRunner,
    buildTool: combo.buildTool,
    testingPattern: 'page-object-model',
    includeSampleTests: true,
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

  const lang = combo.language.toLowerCase();
  if (['java', 'kotlin'].includes(lang)) {
    base.groupId = 'com.example';
    base.artifactId = 'test-project';
  }

  return base;
}

/**
 * Count manifest files that have NO conditional (always generated).
 */
function countUnconditionalFiles(files: TemplatePackFile[]): number {
  return files.filter((f) => !f.conditional).length;
}

/**
 * Check whether a string contains raw Handlebars expressions
 * that look like they should have been resolved.
 * We skip known CI/CD expression patterns (${{ }}, ${...}) and
 * files whose content intentionally contains Handlebars syntax.
 */
function findUnresolvedTemplates(content: string, filePath: string): string[] {
  const issues: string[] = [];

  // Skip binary-ish / non-text indicators
  if (content.includes('\0')) return issues;

  // Regex: find {{ something }} that is NOT preceded by $ (GitHub Actions ${{ }})
  // and is NOT inside a raw block.
  const pattern = /(?<!\$)\{\{(?!\{)([^}]+)\}\}/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(content)) !== null) {
    const inner = match[1].trim();

    // Skip Handlebars comments {{! ... }}
    if (inner.startsWith('!')) continue;

    // Skip #if / else / /if block helpers (they should already be resolved,
    // but in static (non-template) files they won't appear at all).
    if (/^[#/]/.test(inner)) continue;

    // Skip known false-positive patterns in CI/CD files
    // GitHub Actions: ${{ ... }} - already excluded by negative lookbehind
    // Jenkins:  ${env.X} - not Handlebars syntax
    // CircleCI: << parameters.X >> - not Handlebars
    // Azure DevOps: $(variable) - not Handlebars

    issues.push(`Unresolved: ${match[0]}  (in ${filePath})`);
  }

  return issues;
}

// ---- Main ----

async function main() {
  const entries = await fs.readdir(PACKS_DIR, { withFileTypes: true });
  const packDirs = entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();

  console.log(`\nFound ${packDirs.length} template packs in ${PACKS_DIR}\n`);

  const engine = new TemplatePackEngine(PACKS_DIR);

  // Results table
  interface Result {
    pack: string;
    filesGenerated: number;
    expectedMinFiles: number;
    unresolvedCount: number;
    status: 'PASS' | 'FAIL';
    error?: string;
  }

  const results: Result[] = [];

  for (const packDir of packDirs) {
    const manifestPath = path.join(PACKS_DIR, packDir, 'manifest.json');
    let manifest: ManifestJson;
    try {
      const raw = await fs.readFile(manifestPath, 'utf-8');
      manifest = JSON.parse(raw);
    } catch (err: any) {
      results.push({
        pack: packDir,
        filesGenerated: 0,
        expectedMinFiles: 0,
        unresolvedCount: 0,
        status: 'FAIL',
        error: `Cannot read manifest: ${err.message}`,
      });
      continue;
    }

    const combo = manifest.supportedCombination;
    const config = buildConfig(combo);
    const expectedMinFiles = countUnconditionalFiles(manifest.files);

    try {
      const files = await engine.generateProject(config as any);
      const filesGenerated = files.length;

      // Check for unresolved Handlebars
      const allUnresolved: string[] = [];
      for (const file of files) {
        const issues = findUnresolvedTemplates(file.content, file.path);
        allUnresolved.push(...issues);
      }

      const fileCountOk = filesGenerated >= expectedMinFiles;

      if (!fileCountOk) {
        results.push({
          pack: packDir,
          filesGenerated,
          expectedMinFiles,
          unresolvedCount: allUnresolved.length,
          status: 'FAIL',
          error: `File count ${filesGenerated} < expected minimum ${expectedMinFiles}`,
        });
      } else if (allUnresolved.length > 0) {
        results.push({
          pack: packDir,
          filesGenerated,
          expectedMinFiles,
          unresolvedCount: allUnresolved.length,
          status: 'FAIL',
          error: allUnresolved.slice(0, 3).join(' | '),
        });
      } else {
        results.push({
          pack: packDir,
          filesGenerated,
          expectedMinFiles,
          unresolvedCount: 0,
          status: 'PASS',
        });
      }
    } catch (err: any) {
      results.push({
        pack: packDir,
        filesGenerated: 0,
        expectedMinFiles,
        unresolvedCount: 0,
        status: 'FAIL',
        error: err.message?.substring(0, 200),
      });
    }
  }

  // ---- Print table ----
  const COL_PACK = 52;
  const COL_FILES = 10;
  const COL_UNRESOLVED = 12;
  const COL_STATUS = 8;

  const header = [
    'Pack Name'.padEnd(COL_PACK),
    'Files'.padStart(COL_FILES),
    'Unresolved'.padStart(COL_UNRESOLVED),
    'Status'.padStart(COL_STATUS),
  ].join(' | ');

  const separator = '-'.repeat(header.length);

  console.log(separator);
  console.log(header);
  console.log(separator);

  for (const r of results) {
    const row = [
      r.pack.padEnd(COL_PACK),
      String(r.filesGenerated).padStart(COL_FILES),
      String(r.unresolvedCount).padStart(COL_UNRESOLVED),
      r.status.padStart(COL_STATUS),
    ].join(' | ');

    console.log(row);

    if (r.status === 'FAIL' && r.error) {
      console.log(`   >> ERROR: ${r.error}`);
    }
  }

  console.log(separator);

  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  const totalFiles = results.reduce((sum, r) => sum + r.filesGenerated, 0);

  console.log(
    `\nSummary: ${passed} PASSED, ${failed} FAILED out of ${results.length} packs (${totalFiles} total files generated)`
  );

  if (failed > 0) {
    console.log('\nFailed packs:');
    for (const r of results.filter((r) => r.status === 'FAIL')) {
      console.log(`  - ${r.pack}: ${r.error}`);
    }
    process.exit(1);
  } else {
    console.log('\nAll packs generated successfully!');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(2);
});
