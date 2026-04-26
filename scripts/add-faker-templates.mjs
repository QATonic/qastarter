/**
 * Bulk-add Faker/TestDataFactory templates to all eligible template packs.
 *
 * For each pack:
 *   1. Copy the canonical template file into the pack's files/ directory
 *   2. Add a manifest entry with conditional: { "utilities.faker": true }
 *
 * Build-file dependency additions are handled separately (manual).
 */

import fs from 'fs';
import path from 'path';

const PACKS_DIR = path.resolve('server/templates/packs');
const CANONICAL_DIR = path.resolve('server/templates/packs/_canonical');

// ── Language → template path mapping ────────────────────────────────
// For each language, define:
//   srcFile: canonical template relative to _canonical/<lang>/
//   destPath: where it goes inside files/ (used in manifest "path" too)
const LANG_CONFIG = {
  java: {
    srcFile: 'TestDataFactory.java.hbs',
    // Java uses {{packagePath}} directory convention
    destDir: 'src/main/java/{{packagePath}}/utils',
    destFile: 'TestDataFactory.java.hbs',
    manifestPath: 'src/main/java/{{packagePath}}/utils/TestDataFactory.java',
  },
  python: {
    srcFile: 'test_data_factory.py.hbs',
    destDir: 'utils',
    destFile: 'test_data_factory.py.hbs',
    manifestPath: 'utils/test_data_factory.py',
  },
  javascript: {
    srcFile: 'testDataFactory.js.hbs',
    destDir: 'utils',
    destFile: 'testDataFactory.js.hbs',
    manifestPath: 'utils/testDataFactory.js',
  },
  typescript: {
    srcFile: 'testDataFactory.ts.hbs',
    destDir: 'utils',
    destFile: 'testDataFactory.ts.hbs',
    manifestPath: 'utils/testDataFactory.ts',
  },
  csharp: {
    srcFile: 'TestDataFactory.cs.hbs',
    destDir: 'Utils',
    destFile: 'TestDataFactory.cs.hbs',
    manifestPath: 'Utils/TestDataFactory.cs',
  },
  go: {
    srcFile: 'test_data_factory.go.hbs',
    destDir: 'utils',
    destFile: 'test_data_factory.go.hbs',
    manifestPath: 'utils/test_data_factory.go',
  },
};

// ── Skip list (no Faker support) ───────────────────────────────────
const SKIP_LANGUAGES = new Set(['kotlin', 'swift', 'dart']);

function detectLanguage(packName) {
  // Pack names follow: type-lang-framework-runner-build
  // or type-framework-lang-runner-build
  const parts = packName.split('-');
  for (const part of parts) {
    if (LANG_CONFIG[part]) return part;
    if (SKIP_LANGUAGES.has(part)) return part;
  }
  return null;
}

function main() {
  const packs = fs.readdirSync(PACKS_DIR).filter((d) => {
    return (
      !d.startsWith('_') &&
      fs.statSync(path.join(PACKS_DIR, d)).isDirectory() &&
      fs.existsSync(path.join(PACKS_DIR, d, 'manifest.json'))
    );
  });

  let updated = 0;
  let skipped = 0;

  for (const pack of packs) {
    const lang = detectLanguage(pack);

    if (!lang || SKIP_LANGUAGES.has(lang)) {
      console.log(`SKIP (${lang || 'unknown lang'}): ${pack}`);
      skipped++;
      continue;
    }

    const langConfig = LANG_CONFIG[lang];
    if (!langConfig) {
      console.log(`SKIP (no config): ${pack}`);
      skipped++;
      continue;
    }

    const manifestPath = path.join(PACKS_DIR, pack, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

    // Check if faker entry already exists
    const alreadyHasFaker = manifest.files?.some(
      (f) =>
        f.path === langConfig.manifestPath ||
        f.path?.includes('TestDataFactory') ||
        f.path?.includes('test_data_factory') ||
        f.path?.includes('testDataFactory')
    );

    if (alreadyHasFaker) {
      console.log(`SKIP (already has faker): ${pack}`);
      skipped++;
      continue;
    }

    // 1. Copy canonical template to files/ directory
    const destDir = path.join(PACKS_DIR, pack, 'files', langConfig.destDir);
    fs.mkdirSync(destDir, { recursive: true });

    const srcPath = path.join(CANONICAL_DIR, lang, langConfig.srcFile);
    const destPath = path.join(destDir, langConfig.destFile);
    fs.copyFileSync(srcPath, destPath);

    // 2. Add manifest entry
    const fakerEntry = {
      path: langConfig.manifestPath,
      isTemplate: true,
      conditional: { 'utilities.faker': true },
    };

    // Insert before the last file entry (or at end)
    manifest.files.push(fakerEntry);

    // Write updated manifest (preserve formatting)
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

    console.log(`UPDATED: ${pack} (${lang})`);
    updated++;
  }

  console.log(`\n✓ Updated: ${updated} packs`);
  console.log(`○ Skipped: ${skipped} packs`);
}

main();
