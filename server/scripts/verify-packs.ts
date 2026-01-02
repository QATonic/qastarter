
import fs from 'fs';
import path from 'path';
import { validationMatrix } from '../../shared/validationMatrix';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packsDir = path.join(__dirname, '../templates/packs');

function getAvailablePacks(): Set<string> {
    const packs = new Set<string>();
    if (fs.existsSync(packsDir)) {
        const entries = fs.readdirSync(packsDir, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.isDirectory()) {
                // Check if manifest exists
                if (fs.existsSync(path.join(packsDir, entry.name, 'manifest.json'))) {
                    packs.add(entry.name);
                }
            }
        }
    }
    return packs;
}

function verifyPacks() {
    console.log('🔍 Verifying Template Packs against Validation Matrix...');

    const availablePacks = getAvailablePacks();
    console.log(`📂 Found ${availablePacks.size} physical template packs.`);

    const missingPacks: string[] = [];
    const validConfigs: string[] = [];

    // Iterate over frameworks and languages to build expected pack keys
    // Key format: testingType-language-framework-testRunner-buildTool
    // This is complex because the matrix is dense. 
    // Simplified check: Check 'frameworkLanguageTestRunners' usage

    // Let's iterate through the matrix to find all valid combinations
    // We'll focus on the 'frameworkLanguageTestRunners' and 'frameworkLanguageBuildTools' 
    // as they define the precise valid combinations.

    for (const [key, testRunners] of Object.entries(validationMatrix.frameworkLanguageTestRunners)) {
        // key is 'framework-language' e.g. 'selenium-java'
        const [framework, language] = key.split('-');

        const buildTools = validationMatrix.frameworkLanguageBuildTools[key] || [];

        // Find testing type for this framework
        let testingType = '';
        for (const [type, frameworks] of Object.entries(validationMatrix.frameworks)) {
            if (frameworks.includes(framework)) {
                testingType = type;
                break;
            }
        }

        if (!testingType) {
            console.warn(`⚠️ Warning: Framework '${framework}' not found in testing types mapping.`);
            continue;
        }

        for (const testRunner of testRunners) {
            for (const buildTool of buildTools) {
                const packKey = `${testingType}-${language}-${framework}-${testRunner}-${buildTool}`;
                validConfigs.push(packKey);

                // Check if pack exists
                // Note: We currently have hardcoded fallbacks that don't have packs.
                // So getting a "missing pack" here is EXPECTED for legacy templates.
                if (!availablePacks.has(packKey)) {
                    missingPacks.push(packKey);
                }
            }
        }
    }

    console.log(`✅ Total Valid Configurations in Matrix: ${validConfigs.length}`);
    console.log(`📦 Physical Packs Present: ${availablePacks.size}`);
    console.log(`❌ Missing Packs (handled by fallback or unimplemented): ${missingPacks.length}`);

    if (missingPacks.length > 0) {
        console.log('\nMissing Packs List (Candidates for Field Validation):');
        missingPacks.forEach(p => console.log(` - ${p}`));
    }

    // Double check: Are there packs that are NOT in the matrix? (Orphaned packs)
    const orphanedPacks = [...availablePacks].filter(p => !validConfigs.includes(p));
    if (orphanedPacks.length > 0) {
        console.log(`\n⚠️ Orphaned Packs (Files exist but not reachable via current Matrix logic):`);
        orphanedPacks.forEach(p => console.log(` - ${p}`));
    }
}

verifyPacks();
