#!/usr/bin/env node
/**
 * BOM Staleness Detector
 *
 * Compares manifest toolVersions against shared/bom.ts
 * to detect outdated version references in template packs.
 *
 * Usage:
 *   npm run templates:check-versions       # Report only
 *   npm run templates:check-versions:fix   # Auto-update manifests
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { BOM } from '../shared/bom';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PACKS_DIR = path.join(__dirname, '..', 'server', 'templates', 'packs');
const FIX_MODE = process.argv.includes('--fix');

// Build a flat map of tool -> version from BOM
function buildBOMMap(): Record<string, string> {
  const map: Record<string, string> = {};

  for (const [lang, tools] of Object.entries(BOM)) {
    for (const [tool, version] of Object.entries(tools as Record<string, string>)) {
      // Use language-prefixed key for language version (e.g., "java" -> "11")
      if (tool === 'version' || tool === 'node' || tool === 'dotnet' || tool === 'swift') {
        map[lang] = version;
      } else {
        // Tool versions are stored by tool name
        map[tool] = version;
      }
    }
  }

  return map;
}

interface StaleEntry {
  tool: string;
  manifestVersion: string;
  bomVersion: string;
}

interface PackResult {
  packName: string;
  stale: StaleEntry[];
  upToDate: number;
}

const bomMap = buildBOMMap();

const allPacks = fs
  .readdirSync(PACKS_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

console.log(`Checking ${allPacks.length} packs against BOM versions...`);
if (FIX_MODE) console.log('(--fix mode: will update manifest toolVersions to match BOM)\n');
else console.log('(report-only mode: use --fix to auto-update)\n');

let totalStale = 0;
let packsWithStale = 0;

for (const packName of allPacks) {
  const manifestPath = path.join(PACKS_DIR, packName, 'manifest.json');

  if (!fs.existsSync(manifestPath)) continue;

  let rawContent = fs.readFileSync(manifestPath, 'utf-8');
  if (rawContent.charCodeAt(0) === 0xfeff) rawContent = rawContent.slice(1);

  const manifest = JSON.parse(rawContent);
  const toolVersions: Record<string, string> = manifest.toolVersions || {};

  const stale: StaleEntry[] = [];
  let upToDate = 0;

  for (const [tool, manifestVersion] of Object.entries(toolVersions)) {
    const bomVersion = bomMap[tool.toLowerCase()];

    if (bomVersion && bomVersion !== manifestVersion && bomVersion !== 'latest') {
      stale.push({ tool, manifestVersion, bomVersion });
    } else {
      upToDate++;
    }
  }

  if (stale.length > 0) {
    packsWithStale++;
    totalStale += stale.length;
    console.log(`[STALE] ${packName}:`);
    for (const s of stale) {
      console.log(`  ${s.tool}: ${s.manifestVersion} -> ${s.bomVersion} (BOM)`);
    }

    if (FIX_MODE) {
      for (const s of stale) {
        toolVersions[s.tool] = s.bomVersion;
      }
      manifest.toolVersions = toolVersions;
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
      console.log(`  [FIXED]`);
    }
  }
}

console.log(`\n=== Summary ===`);
console.log(`Total packs:       ${allPacks.length}`);
console.log(`Packs up-to-date:  ${allPacks.length - packsWithStale}`);
console.log(`Packs stale:       ${packsWithStale}`);
console.log(`Stale versions:    ${totalStale}`);

if (!FIX_MODE && totalStale > 0) {
  console.log('\nRun with --fix to auto-update manifest toolVersions to match BOM.');
}
