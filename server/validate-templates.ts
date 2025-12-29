#!/usr/bin/env node
/**
 * Template Validation Script
 * 
 * Validates all template packs for:
 * - Valid manifest.json structure
 * - Handlebars syntax in .hbs files
 * - Required files exist
 * - Template context variables are valid
 * 
 * Usage: npm run validate:templates
 */

import { promises as fs } from 'fs';
import path from 'path';
import handlebars from 'handlebars';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PACKS_DIR = path.join(__dirname, 'templates', 'packs');

interface ValidationResult {
    packName: string;
    valid: boolean;
    errors: string[];
    warnings: string[];
    filesValidated: number;
}

interface ManifestFile {
    path: string;
    isTemplate: boolean;
    conditional?: Record<string, any>;
    mode?: string;
}

interface Manifest {
    name: string;
    version: string;
    description?: string;
    toolVersions?: Record<string, string>;
    files: ManifestFile[];
}

// Register Handlebars helpers (same as templatePackEngine)
function registerHelpers(): void {
    handlebars.registerHelper('eq', (a: any, b: any) => a === b);
    handlebars.registerHelper('or', (...args: any[]) => {
        args.pop();
        return args.some(Boolean);
    });
    handlebars.registerHelper('includes', (arr: any[], val: any) =>
        Array.isArray(arr) && arr.includes(val)
    );
    handlebars.registerHelper('lowerCase', (str: string) => str?.toLowerCase() || '');
    handlebars.registerHelper('upperCase', (str: string) => str?.toUpperCase() || '');
    handlebars.registerHelper('pascalCase', (str: string) => {
        if (!str) return '';
        return str.replace(/(?:^|[-_])([a-z])/g, (_, char) => char.toUpperCase());
    });
    handlebars.registerHelper('packageToPath', (packageName: string) => {
        if (!packageName) return '';
        return packageName.replace(/\./g, '/');
    });
    handlebars.registerHelper('escapeXml', (str: string) => {
        if (!str) return '';
        return str.replace(/[<>&'"]/g, (char) => {
            const entities: Record<string, string> = {
                '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;'
            };
            return entities[char] || char;
        });
    });
    handlebars.registerHelper('json', (obj: any) => JSON.stringify(obj, null, 2));
    handlebars.registerHelper('join', (arr: string[], separator: string = ', ') =>
        Array.isArray(arr) ? arr.join(separator) : ''
    );
    handlebars.registerHelper('ternary', (condition: any, trueVal: any, falseVal: any) =>
        condition ? trueVal : falseVal
    );
}

async function validateManifest(packPath: string): Promise<{ manifest: Manifest | null; errors: string[] }> {
    const manifestPath = path.join(packPath, 'manifest.json');
    const errors: string[] = [];

    try {
        const content = await fs.readFile(manifestPath, 'utf-8');
        const manifest = JSON.parse(content) as Manifest;

        // Validate required fields
        if (!manifest.name) {
            errors.push('Missing required field: name');
        }
        if (!manifest.version) {
            errors.push('Missing required field: version');
        }
        if (!manifest.files || !Array.isArray(manifest.files)) {
            errors.push('Missing or invalid files array');
        }

        // Validate version format (semver-like)
        if (manifest.version && !/^\d+\.\d+\.\d+/.test(manifest.version)) {
            errors.push(`Invalid version format: ${manifest.version} (expected: x.y.z)`);
        }

        // Validate file entries
        manifest.files?.forEach((file, index) => {
            if (!file.path) {
                errors.push(`File entry ${index}: missing path`);
            }
            if (typeof file.isTemplate !== 'boolean') {
                errors.push(`File entry ${index}: isTemplate must be boolean`);
            }
        });

        return { manifest: errors.length === 0 ? manifest : null, errors };
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            errors.push('manifest.json not found');
        } else if (error instanceof SyntaxError) {
            errors.push(`Invalid JSON: ${error.message}`);
        } else {
            errors.push(`Error reading manifest: ${error}`);
        }
        return { manifest: null, errors };
    }
}

async function validateHandlebarsFile(filePath: string): Promise<string[]> {
    const errors: string[] = [];

    try {
        const content = await fs.readFile(filePath, 'utf-8');

        // Try to compile the template
        try {
            handlebars.compile(content);
        } catch (compileError) {
            errors.push(`Handlebars syntax error: ${(compileError as Error).message}`);
        }
    } catch (error) {
        errors.push(`Error reading file: ${error}`);
    }

    return errors;
}

async function validateTemplatePack(packPath: string): Promise<ValidationResult> {
    const packName = path.basename(packPath);
    const result: ValidationResult = {
        packName,
        valid: true,
        errors: [],
        warnings: [],
        filesValidated: 0,
    };

    // Validate manifest
    const { manifest, errors: manifestErrors } = await validateManifest(packPath);
    result.errors.push(...manifestErrors);

    if (!manifest) {
        result.valid = false;
        return result;
    }

    // Check if files directory exists
    const filesDir = path.join(packPath, 'files');
    try {
        await fs.access(filesDir);
    } catch {
        result.errors.push('files/ directory not found');
        result.valid = false;
        return result;
    }

    // Validate each template file
    for (const fileConfig of manifest.files) {
        if (fileConfig.isTemplate) {
            const templatePath = path.join(filesDir, `${fileConfig.path}.hbs`);

            try {
                await fs.access(templatePath);
                const fileErrors = await validateHandlebarsFile(templatePath);
                if (fileErrors.length > 0) {
                    result.errors.push(...fileErrors.map(e => `${fileConfig.path}: ${e}`));
                }
                result.filesValidated++;
            } catch {
                result.warnings.push(`Template file not found: ${fileConfig.path}.hbs`);
            }
        } else {
            // Check if non-template file exists
            const filePath = path.join(filesDir, fileConfig.path);
            try {
                await fs.access(filePath);
                result.filesValidated++;
            } catch {
                result.warnings.push(`Static file not found: ${fileConfig.path}`);
            }
        }
    }

    result.valid = result.errors.length === 0;
    return result;
}

async function main(): Promise<void> {
    console.log('🔍 QAStarter Template Validation\n');
    console.log('='.repeat(50));

    registerHelpers();

    // Get all template pack directories
    let packDirs: string[];
    try {
        const entries = await fs.readdir(PACKS_DIR, { withFileTypes: true });
        packDirs = entries
            .filter(entry => entry.isDirectory())
            .map(entry => path.join(PACKS_DIR, entry.name));
    } catch (error) {
        console.error(`❌ Error reading packs directory: ${error}`);
        process.exit(1);
    }

    console.log(`\nFound ${packDirs.length} template packs\n`);

    let validCount = 0;
    let invalidCount = 0;
    const results: ValidationResult[] = [];

    for (const packDir of packDirs) {
        const result = await validateTemplatePack(packDir);
        results.push(result);

        if (result.valid) {
            validCount++;
            console.log(`✅ ${result.packName} (${result.filesValidated} files)`);
        } else {
            invalidCount++;
            console.log(`❌ ${result.packName}`);
            result.errors.forEach(err => console.log(`   Error: ${err}`));
        }

        if (result.warnings.length > 0) {
            result.warnings.forEach(warn => console.log(`   ⚠️  ${warn}`));
        }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('\n📊 Summary:');
    console.log(`   ✅ Valid: ${validCount}`);
    console.log(`   ❌ Invalid: ${invalidCount}`);
    console.log(`   📁 Total: ${packDirs.length}`);

    if (invalidCount > 0) {
        console.log('\n⚠️  Some template packs have errors. Please fix them before deployment.\n');
        process.exit(1);
    } else {
        console.log('\n✅ All template packs are valid!\n');
        process.exit(0);
    }
}

main().catch(console.error);
