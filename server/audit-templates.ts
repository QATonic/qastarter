/**
 * Template Pack Audit Script
 * Checks all template packs for common issues before public launch
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packsDir = path.join(__dirname, 'templates', 'packs');

interface AuditResult {
    packName: string;
    errors: string[];
    warnings: string[];
}

// Known template context variables
const KNOWN_VARIABLES = [
    'projectName', 'testingType', 'framework', 'language', 'testingPattern',
    'testRunner', 'buildTool', 'groupId', 'artifactId', 'cicdTool',
    'reportingTool', 'utilities', 'dependencies', 'includeSampleTests',
    // Computed variables
    'javaPackage', 'packageName', 'packagePath', 'safeArtifactId', 'safeGroupId',
    'envs', 'toolVersions', 'timestamp',
    // Common sub-properties
    'utilities.logger', 'utilities.screenshot', 'utilities.video',
];

async function auditPack(packPath: string): Promise<AuditResult> {
    const packName = path.basename(packPath);
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
        // Load manifest
        const manifestPath = path.join(packPath, 'manifest.json');
        const manifestContent = await fs.readFile(manifestPath, 'utf-8');
        const manifest = JSON.parse(manifestContent);

        // Check each file in manifest
        for (const fileConfig of manifest.files || []) {
            const templateFileName = fileConfig.isTemplate
                ? `${fileConfig.path}.hbs`
                : fileConfig.path;

            const filePath = path.join(packPath, 'files', templateFileName);

            try {
                await fs.access(filePath);

                // Check template content for unknown variables
                if (fileConfig.isTemplate) {
                    const content = await fs.readFile(filePath, 'utf-8');

                    // Find all Handlebars variables (simple ones like {{varName}})
                    const variableMatches = content.match(/\{\{([a-zA-Z_][a-zA-Z0-9_.]*)\}\}/g) || [];

                    for (const match of variableMatches) {
                        const varName = match.replace(/\{\{|\}\}/g, '').trim();

                        // Skip helpers and block expressions
                        if (varName.startsWith('#') || varName.startsWith('/') ||
                            varName === 'else' || varName === 'this' ||
                            varName.startsWith('eq ') || varName.startsWith('or ') ||
                            varName.startsWith('includes ') || varName.startsWith('if ') ||
                            varName.startsWith('unless ')) {
                            continue;
                        }

                        // Check if variable is known
                        const baseVar = varName.split('.')[0];
                        if (!KNOWN_VARIABLES.includes(baseVar) && !KNOWN_VARIABLES.includes(varName)) {
                            // Check for common typos
                            if (varName === 'package' || varName === 'pkg') {
                                errors.push(`${fileConfig.path}: Uses undefined variable '${varName}' - should be 'packageName' or 'javaPackage'`);
                            } else {
                                warnings.push(`${fileConfig.path}: Uses variable '${varName}' - verify it exists in context`);
                            }
                        }
                    }

                    // Check for duplicate imports (Java files)
                    if (filePath.endsWith('.java.hbs')) {
                        const importLines = content.match(/^import\s+.+;$/gm) || [];
                        const seen = new Set<string>();
                        for (const imp of importLines) {
                            const normalized = imp.replace(/\s+/g, ' ').trim();
                            if (seen.has(normalized)) {
                                warnings.push(`${fileConfig.path}: Duplicate import found`);
                            }
                            seen.add(normalized);
                        }
                    }
                }
            } catch (e) {
                errors.push(`${fileConfig.path}: File not found (referenced in manifest but doesn't exist)`);
            }
        }

        // Check for orphan files (files that exist but aren't in manifest)
        const filesDir = path.join(packPath, 'files');
        try {
            const allFiles = await getAllFiles(filesDir);
            const manifestPaths = new Set(
                manifest.files?.map((f: any) =>
                    f.isTemplate ? `${f.path}.hbs` : f.path
                ) || []
            );

            for (const file of allFiles) {
                const relativePath = path.relative(filesDir, file).replace(/\\/g, '/');
                if (!manifestPaths.has(relativePath)) {
                    warnings.push(`Orphan file: ${relativePath} (exists but not in manifest)`);
                }
            }
        } catch (e) {
            // files directory might not exist
        }

    } catch (e: any) {
        errors.push(`Failed to audit pack: ${e.message}`);
    }

    return { packName, errors, warnings };
}

async function getAllFiles(dir: string): Promise<string[]> {
    const files: string[] = [];

    try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                files.push(...await getAllFiles(fullPath));
            } else {
                files.push(fullPath);
            }
        }
    } catch (e) {
        // Directory doesn't exist
    }

    return files;
}

async function main() {
    console.log('=== QAStarter Template Pack Audit ===\n');

    const entries = await fs.readdir(packsDir, { withFileTypes: true });
    const packDirs = entries.filter(e => e.isDirectory()).map(e => e.name);

    console.log(`Found ${packDirs.length} template packs\n`);

    let totalErrors = 0;
    let totalWarnings = 0;
    const problemPacks: AuditResult[] = [];

    for (const packDir of packDirs) {
        const packPath = path.join(packsDir, packDir);
        const result = await auditPack(packPath);

        if (result.errors.length > 0 || result.warnings.length > 0) {
            problemPacks.push(result);
            totalErrors += result.errors.length;
            totalWarnings += result.warnings.length;
        }
    }

    // Output results
    if (problemPacks.length === 0) {
        console.log('✅ All template packs passed audit!\n');
    } else {
        console.log(`\n❌ Found issues in ${problemPacks.length} packs:\n`);

        for (const pack of problemPacks) {
            console.log(`\n📦 ${pack.packName}`);

            if (pack.errors.length > 0) {
                console.log('  ERRORS:');
                for (const error of pack.errors) {
                    console.log(`    ❌ ${error}`);
                }
            }

            if (pack.warnings.length > 0) {
                console.log('  WARNINGS:');
                for (const warning of pack.warnings) {
                    console.log(`    ⚠️  ${warning}`);
                }
            }
        }
    }

    console.log('\n=== Summary ===');
    console.log(`Total packs: ${packDirs.length}`);
    console.log(`Packs with issues: ${problemPacks.length}`);
    console.log(`Total errors: ${totalErrors}`);
    console.log(`Total warnings: ${totalWarnings}`);
}

main().catch(console.error);
