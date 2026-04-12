#!/usr/bin/env node
/**
 * Template Pack Parity Checker
 *
 * Enforces the QAStarter template pack contract documented in
 * docs/TEMPLATE_PACK_CONTRACT.md. Designed to catch silent feature
 * drift between sibling packs and manifest/reality mismatches.
 *
 * Checks performed:
 *  1. Every pack must have a `dynamicSupport` block declaring
 *     supported reportingTools, cicdTools, and testingPatterns.
 *  2. Every `conditional` value in `files[]` must be reachable —
 *     i.e. listed in `dynamicSupport` (catches typos like
 *     "schema-validation" that never match user input).
 *  3. Every value declared in `dynamicSupport` must have at least
 *     one corresponding conditional file in `files[]` (catches
 *     packs that advertise BDD support but ship no BDD files).
 *  4. Sibling packs that differ only in build tool (gradle/maven)
 *     should have identical file counts (±2) and identical utility
 *     class names under a shared namespace.
 *  5. Sibling packs that differ only in language (js/ts) should
 *     have matching file counts (±3) and matching conceptual
 *     structure.
 *
 * Usage:
 *   npm run templates:parity              # Report only, exits 1 on violations
 *   npm run templates:parity -- --warn    # Warnings only, exit 0 (used by CI before Phase 3)
 *
 * Exceptions for known acceptable gaps can be added to
 * `scripts/parity-exceptions.json`.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PACKS_DIR = path.join(__dirname, '..', 'server', 'templates', 'packs');
const EXCEPTIONS_PATH = path.join(__dirname, 'parity-exceptions.json');
const WARN_ONLY = process.argv.includes('--warn');

// ---------- Types ----------

interface ManifestFile {
  path: string;
  isTemplate?: boolean;
  conditional?: Record<string, unknown>;
  description?: string;
}

interface DynamicSupport {
  reportingTools?: string[];
  cicdTools?: string[];
  testingPatterns?: string[];
}

interface Manifest {
  id: string;
  files: ManifestFile[];
  dynamicSupport?: DynamicSupport;
  supportedCombination?: {
    testingType?: string;
    framework?: string;
    language?: string;
    testRunner?: string;
    buildTool?: string;
  };
}

interface ParityException {
  /** Pack pair e.g. "web-java-playwright-junit5-gradle|web-java-playwright-junit5-maven" */
  pair: string;
  /** Human-readable reason this gap is acceptable */
  reason: string;
  /** Optional allowlist of file-count delta beyond the default ±2 */
  allowedDelta?: number;
}

interface Violation {
  pack: string;
  rule: string;
  severity: 'error' | 'warn';
  message: string;
}

// ---------- Helpers ----------

function loadManifest(packDir: string): Manifest | null {
  const manifestPath = path.join(packDir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) return null;
  let raw = fs.readFileSync(manifestPath, 'utf-8');
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
  try {
    return JSON.parse(raw) as Manifest;
  } catch (err) {
    console.error(`Failed to parse ${manifestPath}: ${(err as Error).message}`);
    return null;
  }
}

function loadExceptions(): ParityException[] {
  if (!fs.existsSync(EXCEPTIONS_PATH)) return [];
  try {
    return JSON.parse(fs.readFileSync(EXCEPTIONS_PATH, 'utf-8')) as ParityException[];
  } catch {
    return [];
  }
}

/**
 * Flattens a conditional object into an array of "dimension:value" keys.
 * Example: {"testingPattern": "bdd"} -> ["testingPattern:bdd"]
 *          {"utilities.includeDocker": true} -> ["utilities.includeDocker:true"]
 */
function conditionalKeys(cond: Record<string, unknown> | undefined): string[] {
  if (!cond) return [];
  return Object.entries(cond).map(([k, v]) => `${k}:${String(v)}`);
}

/**
 * For a dynamicSupport block, returns the set of "dimension:value" keys
 * that a manifest conditional is allowed to reference.
 */
function supportedKeys(ds: DynamicSupport | undefined): Set<string> {
  const keys = new Set<string>();
  if (!ds) return keys;
  for (const t of ds.reportingTools ?? []) keys.add(`reportingTool:${t}`);
  for (const t of ds.cicdTools ?? []) keys.add(`cicdTool:${t}`);
  for (const t of ds.testingPatterns ?? []) keys.add(`testingPattern:${t}`);
  // Utility flags and build-file conditionals are always supported
  return keys;
}

/**
 * A conditional key is "structural" (always allowed) if it references
 * the utilities block or other non-dynamicSupport dimensions.
 */
function isStructuralConditional(key: string): boolean {
  return (
    key.startsWith('utilities.') ||
    key.startsWith('buildTool:') ||
    key.startsWith('testRunner:') ||
    key.startsWith('language:') ||
    key.startsWith('framework:')
  );
}

// ---------- Checks ----------

function checkDynamicSupportPresent(manifest: Manifest, violations: Violation[]): void {
  if (!manifest.dynamicSupport) {
    violations.push({
      pack: manifest.id,
      rule: 'R1-dynamicSupport-present',
      severity: 'error',
      message: 'manifest.json is missing a `dynamicSupport` block',
    });
  }
}

function checkConditionalsReachable(manifest: Manifest, violations: Violation[]): void {
  const supported = supportedKeys(manifest.dynamicSupport);
  for (const file of manifest.files) {
    for (const key of conditionalKeys(file.conditional)) {
      if (isStructuralConditional(key)) continue;
      if (!supported.has(key)) {
        violations.push({
          pack: manifest.id,
          rule: 'R2-conditional-reachable',
          severity: 'error',
          message: `File "${file.path}" has conditional "${key}" that is NOT declared in dynamicSupport`,
        });
      }
    }
  }
}

/**
 * Scan .hbs files in the pack's files/ directory for inline Handlebars
 * conditionals like {{#if (eq reportingTool 'allure')}} that reference a
 * dynamicSupport value. Returns a set of keys found inline (e.g.
 * "reportingTool:allure").
 */
function scanInlineConditionals(packId: string): Set<string> {
  const found = new Set<string>();
  const packDir = path.join(PACKS_DIR, packId, 'files');
  if (!fs.existsSync(packDir)) return found;

  function walk(dir: string): void {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.name.endsWith('.hbs')) {
        const content = fs.readFileSync(full, 'utf8');
        // Match patterns like: (eq reportingTool 'allure'), (eq cicdTool "jenkins")
        const re = /\(eq\s+(reportingTool|cicdTool|testingPattern)\s+['"]([^'"]+)['"]\)/g;
        let m: RegExpExecArray | null;
        while ((m = re.exec(content)) !== null) {
          found.add(`${m[1]}:${m[2]}`);
        }
      }
    }
  }

  walk(packDir);
  return found;
}

function checkDynamicSupportBacked(manifest: Manifest, violations: Violation[]): void {
  if (!manifest.dynamicSupport) return;
  const declaredKeys = supportedKeys(manifest.dynamicSupport);

  // Collect keys used as manifest-level conditionals on file entries
  const usedKeys = new Set<string>();
  for (const file of manifest.files) {
    for (const key of conditionalKeys(file.conditional)) {
      if (!isStructuralConditional(key)) usedKeys.add(key);
    }
  }

  // Also collect keys referenced via inline Handlebars conditionals inside .hbs content
  const inlineKeys = scanInlineConditionals(manifest.id);
  inlineKeys.forEach((k) => usedKeys.add(k));

  declaredKeys.forEach((decl) => {
    if (!usedKeys.has(decl)) {
      violations.push({
        pack: manifest.id,
        rule: 'R3-dynamicSupport-backed',
        severity: 'warn',
        message: `dynamicSupport declares "${decl}" but NO file in files[] is gated on it`,
      });
    }
  });
}

/**
 * Returns the canonical sibling key for a pack — everything except the
 * buildTool dimension. Two packs with the same key are gradle/maven
 * siblings.
 */
function buildToolSiblingKey(manifest: Manifest): string | null {
  const c = manifest.supportedCombination;
  if (!c?.testingType || !c.framework || !c.language || !c.testRunner) return null;
  return `${c.testingType}|${c.framework}|${c.language}|${c.testRunner}`;
}

/**
 * Returns the canonical sibling key for a pack — everything except the
 * language dimension. Two packs with the same key are js/ts siblings.
 */
function languageSiblingKey(manifest: Manifest): string | null {
  const c = manifest.supportedCombination;
  if (!c?.testingType || !c.framework || !c.testRunner || !c.buildTool) return null;
  // Only useful for js<->ts and python variations — restrict to npm-family
  if (c.buildTool !== 'npm') return null;
  return `${c.testingType}|${c.framework}|${c.testRunner}|${c.buildTool}`;
}

/**
 * Strips a path of language-specific extensions so we can compare
 * "BasePage.java" ↔ "BasePage.kt" ↔ "base_page.py" etc.
 */
function conceptualPath(p: string): string {
  // Drop extension
  let stripped = p.replace(/\.[a-zA-Z]+$/, '');
  // Normalize snake/camel/pascal-case to lowercase
  stripped = stripped.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
  stripped = stripped.replace(/-/g, '_');
  return stripped;
}

function checkSiblingParity(
  manifests: Manifest[],
  exceptions: ParityException[],
  violations: Violation[]
): void {
  // Group by buildTool sibling key
  const byBuildToolSibling = new Map<string, Manifest[]>();
  for (const m of manifests) {
    const key = buildToolSiblingKey(m);
    if (!key) continue;
    const arr = byBuildToolSibling.get(key) ?? [];
    arr.push(m);
    byBuildToolSibling.set(key, arr);
  }

  byBuildToolSibling.forEach((siblings) => {
    if (siblings.length < 2) return;

    // Cross-compare within the sibling group
    for (let i = 0; i < siblings.length; i++) {
      for (let j = i + 1; j < siblings.length; j++) {
        const a = siblings[i];
        const b = siblings[j];
        const pair = [a.id, b.id].sort().join('|');
        const exception = exceptions.find((e) => e.pair === pair);
        const allowedDelta = exception?.allowedDelta ?? 2;

        const countA = a.files.length;
        const countB = b.files.length;
        const delta = Math.abs(countA - countB);
        if (delta > allowedDelta) {
          violations.push({
            pack: pair,
            rule: 'R4-build-sibling-count',
            severity: 'warn',
            message: `Build-tool siblings have file count delta ${delta} (>${allowedDelta}): ${a.id}=${countA}, ${b.id}=${countB}${exception ? ' [exception present]' : ''}`,
          });
        }

        // Compare conceptual paths (ignoring language extensions)
        const conceptsA = new Set<string>(a.files.map((f: ManifestFile) => conceptualPath(f.path)));
        const conceptsB = new Set<string>(b.files.map((f: ManifestFile) => conceptualPath(f.path)));
        const onlyInA = Array.from(conceptsA).filter((c) => !conceptsB.has(c));
        const onlyInB = Array.from(conceptsB).filter((c) => !conceptsA.has(c));
        if (onlyInA.length > allowedDelta || onlyInB.length > allowedDelta) {
          violations.push({
            pack: pair,
            rule: 'R5-build-sibling-shape',
            severity: 'warn',
            message:
              `Build-tool siblings have divergent file shapes. ` +
              `Only in ${a.id}: [${onlyInA.slice(0, 5).join(', ')}${onlyInA.length > 5 ? ', ...' : ''}] ` +
              `Only in ${b.id}: [${onlyInB.slice(0, 5).join(', ')}${onlyInB.length > 5 ? ', ...' : ''}]`,
          });
        }
      }
    }
  });

  // Group by language sibling (js ↔ ts)
  const byLanguageSibling = new Map<string, Manifest[]>();
  for (const m of manifests) {
    const key = languageSiblingKey(m);
    if (!key) continue;
    const arr = byLanguageSibling.get(key) ?? [];
    arr.push(m);
    byLanguageSibling.set(key, arr);
  }

  byLanguageSibling.forEach((siblings) => {
    if (siblings.length < 2) return;
    for (let i = 0; i < siblings.length; i++) {
      for (let j = i + 1; j < siblings.length; j++) {
        const a = siblings[i];
        const b = siblings[j];
        const pair = [a.id, b.id].sort().join('|');
        const exception = exceptions.find((e) => e.pair === pair);
        const allowedDelta = exception?.allowedDelta ?? 3;

        const delta = Math.abs(a.files.length - b.files.length);
        if (delta > allowedDelta) {
          violations.push({
            pack: pair,
            rule: 'R6-language-sibling-count',
            severity: 'warn',
            message: `Language siblings have file count delta ${delta} (>${allowedDelta}): ${a.id}=${a.files.length}, ${b.id}=${b.files.length}${exception ? ' [exception present]' : ''}`,
          });
        }
      }
    }
  });
}

// ---------- Main ----------

function main(): void {
  const packDirs = fs
    .readdirSync(PACKS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => path.join(PACKS_DIR, d.name));

  const manifests: Manifest[] = [];
  for (const dir of packDirs) {
    const m = loadManifest(dir);
    if (m) manifests.push(m);
  }

  const exceptions = loadExceptions();
  const violations: Violation[] = [];

  console.log(`Checking parity across ${manifests.length} template packs...\n`);

  for (const m of manifests) {
    checkDynamicSupportPresent(m, violations);
    checkConditionalsReachable(m, violations);
    checkDynamicSupportBacked(m, violations);
  }

  checkSiblingParity(manifests, exceptions, violations);

  // Report
  const errors = violations.filter((v) => v.severity === 'error');
  const warnings = violations.filter((v) => v.severity === 'warn');

  const byPack = new Map<string, Violation[]>();
  for (const v of violations) {
    const arr = byPack.get(v.pack) ?? [];
    arr.push(v);
    byPack.set(v.pack, arr);
  }

  const sortedPacks = Array.from(byPack.entries()).sort(([a], [b]) => a.localeCompare(b));
  // Track how many real (non-pair) packs had violations so the
  // "Packs clean" count doesn't go negative when sibling-pair rules
  // (R4/R5/R6) write pair-keyed entries.
  const realPackIds = new Set<string>(manifests.map((m) => m.id));
  let dirtyPackCount = 0;
  for (const [pack, vs] of sortedPacks) {
    console.log(`[${pack}]`);
    for (const v of vs) {
      const marker = v.severity === 'error' ? '  ERROR ' : '  warn  ';
      console.log(`${marker}(${v.rule}) ${v.message}`);
    }
    console.log('');
    if (realPackIds.has(pack)) dirtyPackCount++;
  }

  console.log('=== Summary ===');
  console.log(`Packs checked:   ${manifests.length}`);
  console.log(`Errors:          ${errors.length}`);
  console.log(`Warnings:        ${warnings.length}`);
  console.log(`Packs clean:     ${Math.max(0, manifests.length - dirtyPackCount)}`);

  if (errors.length > 0 && !WARN_ONLY) {
    console.log('\nRun with `--warn` to exit 0 (report only).');
    process.exit(1);
  }
}

main();
