#!/usr/bin/env node
/**
 * Universal Manifest Sync Script
 *
 * Scans ALL template packs (web, api, mobile, desktop) and compares
 * manifest.json file entries with actual .hbs files on disk.
 *
 * Usage:
 *   npm run templates:sync          # Report only
 *   npm run templates:sync:fix      # Auto-fix missing entries
 *
 * Replaces the web-only sync-web-manifests.js script.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PACKS_DIR = path.join(__dirname, '..', 'server', 'templates', 'packs');
const FIX_MODE = process.argv.includes('--fix');

interface SyncResult {
  packName: string;
  manifestCount: number;
  missing: string[]; // On disk but not in manifest
  orphaned: string[]; // In manifest but no file on disk
}

function getAllHbsFiles(dir: string, base: string = ''): string[] {
  const files: string[] = [];
  if (!fs.existsSync(dir)) return files;

  for (const item of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, item);
    const relativePath = base ? `${base}/${item}` : item;

    if (fs.statSync(fullPath).isDirectory()) {
      files.push(...getAllHbsFiles(fullPath, relativePath));
    } else if (item.endsWith('.hbs')) {
      files.push(relativePath.replace('.hbs', ''));
    }
  }
  return files;
}

function inferConditional(filePath: string): Record<string, any> | null {
  if (filePath.includes('Jenkinsfile')) return { cicdTool: 'jenkins' };
  if (filePath.includes('.github')) return { cicdTool: 'github-actions' };
  if (filePath.includes('.gitlab-ci')) return { cicdTool: 'gitlab-ci' };
  if (filePath.includes('azure-pipelines')) return { cicdTool: 'azure-devops' };
  if (filePath.includes('.circleci')) return { cicdTool: 'circleci' };
  if (filePath.includes('Dockerfile') && !filePath.includes('docker-compose')) {
    return { 'utilities.includeDocker': true };
  }
  if (filePath.includes('docker-compose')) {
    return { 'utilities.includeDockerCompose': true };
  }
  if (filePath.includes('ExtentManager') || filePath.includes('extent-config')) {
    return { reportingTool: 'extent-reports' };
  }
  if (filePath.includes('AllureManager') || filePath.includes('allure.properties')) {
    return { reportingTool: 'allure' };
  }
  if (
    filePath.includes('.feature') ||
    filePath.includes('Steps') ||
    filePath.includes('Runner') ||
    filePath.includes('Hooks')
  ) {
    return { testingPattern: 'bdd' };
  }
  return null;
}

function syncPack(packPath: string): SyncResult {
  const packName = path.basename(packPath);
  const manifestPath = path.join(packPath, 'manifest.json');
  const filesPath = path.join(packPath, 'files');

  if (!fs.existsSync(manifestPath) || !fs.existsSync(filesPath)) {
    return { packName, manifestCount: 0, missing: [], orphaned: [] };
  }

  let rawContent = fs.readFileSync(manifestPath, 'utf-8');
  // Strip BOM
  if (rawContent.charCodeAt(0) === 0xfeff) rawContent = rawContent.slice(1);

  const manifest = JSON.parse(rawContent);
  const manifestPaths: string[] = manifest.files.map((f: any) => f.path);
  const actualFiles = getAllHbsFiles(filesPath);

  // Also check for non-.hbs files that are in manifest as isTemplate: false
  const staticManifestPaths = manifest.files
    .filter((f: any) => !f.isTemplate)
    .map((f: any) => f.path);

  const missing = actualFiles.filter((f) => !manifestPaths.includes(f));
  const orphanedTemplates = manifestPaths.filter((mp: string) => {
    const isTemplate = manifest.files.find((f: any) => f.path === mp)?.isTemplate;
    if (!isTemplate) return false; // Don't check static files
    return !actualFiles.includes(mp);
  });

  if (FIX_MODE && missing.length > 0) {
    for (const filePath of missing) {
      const isTemplate = true;
      const conditional = inferConditional(filePath);
      const entry: any = { path: filePath, isTemplate };
      if (conditional) entry.conditional = conditional;
      manifest.files.push(entry);
    }
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  }

  return {
    packName,
    manifestCount: manifestPaths.length,
    missing,
    orphaned: orphanedTemplates,
  };
}

// Main
const allPacks = fs
  .readdirSync(PACKS_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => path.join(PACKS_DIR, d.name));

console.log(`Scanning ${allPacks.length} template packs...`);
if (FIX_MODE) console.log('(--fix mode: will auto-add missing files to manifests)\n');
else console.log('(report-only mode: use --fix to auto-add missing files)\n');

let totalMissing = 0;
let totalOrphaned = 0;
let packsWithIssues = 0;

for (const packPath of allPacks) {
  const result = syncPack(packPath);
  const hasIssues = result.missing.length > 0 || result.orphaned.length > 0;

  if (hasIssues) {
    packsWithIssues++;
    console.log(`\n${FIX_MODE ? '[FIXED]' : '[DRIFT]'} ${result.packName}:`);
    if (result.missing.length > 0) {
      console.log(`  Missing from manifest (${result.missing.length}):`);
      result.missing.forEach((f) => console.log(`    + ${f}`));
      totalMissing += result.missing.length;
    }
    if (result.orphaned.length > 0) {
      console.log(`  Orphaned in manifest (${result.orphaned.length}):`);
      result.orphaned.forEach((f) => console.log(`    - ${f}`));
      totalOrphaned += result.orphaned.length;
    }
  }
}

console.log(`\n=== Summary ===`);
console.log(`Total packs:   ${allPacks.length}`);
console.log(`Packs OK:      ${allPacks.length - packsWithIssues}`);
console.log(`Packs w/drift: ${packsWithIssues}`);
console.log(`Missing files: ${totalMissing}`);
console.log(`Orphaned refs: ${totalOrphaned}`);

if (!FIX_MODE && (totalMissing > 0 || totalOrphaned > 0)) {
  console.log('\nRun with --fix to auto-add missing files to manifests.');
  process.exit(1);
}
