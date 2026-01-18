/**
 * Template Pack Fix Script
 * Fixes common manifest issues before public launch
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packsDir = path.join(__dirname, 'templates', 'packs');

interface FixResult {
    packName: string;
    fixes: string[];
    errors: string[];
}

async function fileExists(filePath: string): Promise<boolean> {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

async function fixManifest(packPath: string): Promise<FixResult> {
    const packName = path.basename(packPath);
    const fixes: string[] = [];
    const errors: string[] = [];

    const manifestPath = path.join(packPath, 'manifest.json');

    try {
        const manifestContent = await fs.readFile(manifestPath, 'utf-8');
        const manifest = JSON.parse(manifestContent);
        let modified = false;

        // Filter out files that don't exist
        const validFiles: any[] = [];

        for (const fileConfig of manifest.files || []) {
            const templateFileName = fileConfig.isTemplate
                ? `${fileConfig.path}.hbs`
                : fileConfig.path;

            const filePath = path.join(packPath, 'files', templateFileName);

            if (await fileExists(filePath)) {
                validFiles.push(fileConfig);
            } else {
                // Check if the .hbs version exists (common issue: missing .hbs extension in manifest)
                const hbsPath = path.join(packPath, 'files', `${fileConfig.path}.hbs`);
                if (!fileConfig.isTemplate && await fileExists(hbsPath)) {
                    // Fix: change isTemplate to true
                    const fixedConfig = { ...fileConfig, isTemplate: true };
                    validFiles.push(fixedConfig);
                    fixes.push(`Fixed ${fileConfig.path}: changed isTemplate to true (found .hbs file)`);
                    modified = true;
                } else {
                    // Remove the missing file reference
                    fixes.push(`Removed ${fileConfig.path}: file not found`);
                    modified = true;
                }
            }
        }

        if (modified) {
            manifest.files = validFiles;
            await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf-8');
        }

    } catch (e: any) {
        errors.push(`Failed to fix manifest: ${e.message}`);
    }

    return { packName, fixes, errors };
}

async function main() {
    console.log('=== QAStarter Template Pack Fix Script ===\n');

    const entries = await fs.readdir(packsDir, { withFileTypes: true });
    const packDirs = entries.filter(e => e.isDirectory()).map(e => e.name);

    console.log(`Found ${packDirs.length} template packs\n`);

    let totalFixes = 0;
    let totalErrors = 0;

    for (const packDir of packDirs) {
        const packPath = path.join(packsDir, packDir);
        const result = await fixManifest(packPath);

        if (result.fixes.length > 0) {
            console.log(`\n📦 ${result.packName}`);
            for (const fix of result.fixes) {
                console.log(`  ✅ ${fix}`);
            }
            totalFixes += result.fixes.length;
        }

        if (result.errors.length > 0) {
            console.log(`\n📦 ${result.packName}`);
            for (const error of result.errors) {
                console.log(`  ❌ ${error}`);
            }
            totalErrors += result.errors.length;
        }
    }

    console.log('\n=== Summary ===');
    console.log(`Total packs processed: ${packDirs.length}`);
    console.log(`Total fixes applied: ${totalFixes}`);
    console.log(`Total errors: ${totalErrors}`);
}

main().catch(console.error);
