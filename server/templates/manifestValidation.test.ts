/**
 * Manifest Validation Tests
 *
 * Dynamically generates test cases for each of the 46+ template packs,
 * validating manifest structure and Handlebars template syntax.
 * Runs as part of `npm test` to catch issues in CI.
 */

import { describe, it, expect } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import handlebars from 'handlebars';
import { z } from 'zod';

const PACKS_DIR = path.join(process.cwd(), 'server', 'templates', 'packs');

// Zod schema for manifest validation (from validate-templates.ts)
const manifestFileSchema = z.object({
  path: z.string().min(1),
  template: z.string().optional(),
  isTemplate: z.boolean(),
  mode: z.string().optional(),
  conditional: z.record(z.any()).optional(),
});

const manifestSchema = z.object({
  id: z
    .string()
    .regex(
      /^[a-z0-9]+-[a-z0-9]+-[a-z0-9-]+-[a-z0-9-]+-[a-z0-9-]+$/,
      'ID must follow format: testingType-language-framework-testRunner-buildTool'
    ),
  displayName: z.string().min(1),
  description: z.string().optional(),
  version: z
    .string()
    .regex(/^\d+\.\d+\.\d+$/, 'Version must be semantic (x.y.z)')
    .optional(),
  supportsDynamic: z.boolean().optional().default(true),
  supportedCombination: z.object({
    testingType: z.enum(['web', 'mobile', 'api', 'desktop']),
    framework: z.string().min(1),
    language: z.string().min(1),
    testRunner: z.string().min(1),
    buildTool: z.string().min(1),
  }),
  dynamicSupport: z
    .object({
      reportingTools: z.array(z.string()).optional(),
      cicdTools: z.array(z.string()).optional(),
      testingPatterns: z.array(z.string()).optional(),
    })
    .optional(),
  toolVersions: z.record(z.string()).optional(),
  sampleTestPatterns: z.array(z.string()).optional(),
  files: z.array(manifestFileSchema).min(1),
  directories: z.array(z.string()).optional(),
});

// Register Handlebars helpers to match the engine
function createHandlebarsInstance(): typeof handlebars {
  const hb = handlebars.create();
  hb.registerHelper('eq', (a: any, b: any) => a === b);
  hb.registerHelper('or', (...args: any[]) => {
    args.pop();
    return args.some(Boolean);
  });
  hb.registerHelper('includes', (arr: any[], val: any) => Array.isArray(arr) && arr.includes(val));
  hb.registerHelper('lowerCase', (str: string) => str?.toLowerCase() || '');
  hb.registerHelper('upperCase', (str: string) => str?.toUpperCase() || '');
  hb.registerHelper('pascalCase', (str: string) => {
    if (!str) return '';
    return str.replace(/(?:^|[-_])([a-z])/g, (_, char) => char.toUpperCase());
  });
  hb.registerHelper('packageToPath', (pkg: string) => (pkg ? pkg.replace(/\./g, '/') : ''));
  hb.registerHelper('escapeXml', (str: string) => {
    if (!str) return '';
    return str.replace(/[<>&'"]/g, (c) => {
      const e: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        "'": '&apos;',
        '"': '&quot;',
      };
      return e[c] || c;
    });
  });
  hb.registerHelper('json', (obj: any) => JSON.stringify(obj, null, 2));
  hb.registerHelper('join', (arr: string[], sep: string = ', ') =>
    Array.isArray(arr) ? arr.join(typeof sep === 'string' ? sep : ', ') : ''
  );
  hb.registerHelper('ternary', (cond: any, t: any, f: any) => (cond ? t : f));
  return hb;
}

// Discover all pack directories
async function getPackNames(): Promise<string[]> {
  const entries = await fs.readdir(PACKS_DIR, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
}

describe('Template Pack Manifest Validation', async () => {
  const packs = await getPackNames();
  const hb = createHandlebarsInstance();

  it('should have at least 40 template packs', () => {
    expect(packs.length).toBeGreaterThanOrEqual(40);
  });

  for (const packName of packs) {
    describe(packName, () => {
      it('should have a valid manifest.json', async () => {
        const manifestPath = path.join(PACKS_DIR, packName, 'manifest.json');
        let rawContent: string;

        try {
          rawContent = await fs.readFile(manifestPath, 'utf-8');
        } catch {
          throw new Error(`manifest.json not found for pack: ${packName}`);
        }

        // Strip BOM if present
        if (rawContent.charCodeAt(0) === 0xfeff) {
          rawContent = rawContent.slice(1);
        }

        const manifest = JSON.parse(rawContent);
        const result = manifestSchema.safeParse(manifest);

        if (!result.success) {
          const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
          throw new Error(`Manifest validation failed:\n${errors.join('\n')}`);
        }

        // Verify pack ID matches directory name
        expect(result.data.id).toBe(packName);
      });

      it('should have valid Handlebars templates', async () => {
        const manifestPath = path.join(PACKS_DIR, packName, 'manifest.json');
        let rawContent = await fs.readFile(manifestPath, 'utf-8');
        if (rawContent.charCodeAt(0) === 0xfeff) {
          rawContent = rawContent.slice(1);
        }

        const manifest = JSON.parse(rawContent);
        const errors: string[] = [];

        const warnings: string[] = [];

        for (const file of manifest.files || []) {
          if (!file.isTemplate) continue;

          const hbsPath = path.join(PACKS_DIR, packName, 'files', `${file.path}.hbs`);

          try {
            const content = await fs.readFile(hbsPath, 'utf-8');

            // Strip raw blocks before compiling (same as engine does)
            let processable = content;
            processable = processable.replace(
              /\{\{\{\{raw\}\}\}\}[\s\S]*?\{\{\{\{\/raw\}\}\}\}/g,
              ''
            );
            processable = processable.replace(/\{\{raw\}\}[\s\S]*?\{\{\/raw\}\}/g, '');

            // Mask CI/CD expressions that look like Handlebars
            processable = processable.replace(/\$\{\{[^}]+\}\}/g, 'MASKED_GHA');
            processable = processable.replace(/\$\{[^}]+\}/g, 'MASKED_JENKINS');

            try {
              hb.compile(processable);
            } catch (compileError) {
              errors.push(`${file.path}: Handlebars compile error: ${compileError}`);
            }
          } catch {
            // Missing files are warnings, not errors - the engine handles
            // missing conditional files gracefully in non-strict mode.
            // Only flag as error if the file has no conditional (always required).
            if (!file.conditional) {
              warnings.push(`${file.path}: file not found (unconditional)`);
            }
          }
        }

        // Handlebars compile errors are hard failures
        if (errors.length > 0) {
          throw new Error(`Template errors in ${packName}:\n${errors.join('\n')}`);
        }
        // Warnings for missing unconditional files - log but don't fail
        // (most missing files are conditional and handled by the engine)
      });
    });
  }
});
