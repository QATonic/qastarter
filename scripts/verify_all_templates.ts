
import { ProjectTemplateGenerator } from '../server/templates/index';
import { ProjectConfig } from '@shared/schema';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Adjust path to point to server/templates/packs
const PACKS_DIR = path.join(__dirname, '../server/templates/packs');

interface TemplatePackManifest {
    id: string;
    supportedCombination: {
        testingType: 'web' | 'mobile' | 'api' | 'desktop';
        framework: string;
        language: string;
        testRunner: string;
        buildTool: string;
    };
}

async function verifyAllTemplates() {
    console.log('🚀 Starting Comprehensive Template Verification...');
    console.log(`📂 Packs Directory: ${PACKS_DIR}`);

    const generator = new ProjectTemplateGenerator(PACKS_DIR);
    let packs: string[] = [];

    try {
        const entries = await fs.readdir(PACKS_DIR, { withFileTypes: true });
        packs = entries.filter((e) => e.isDirectory()).map((e) => e.name);
    } catch (err) {
        console.error('❌ Failed to list template packs:', err);
        process.exit(1);
    }

    console.log(`📦 Found ${packs.length} template packs.`);

    let passed = 0;
    let failed = 0;
    const errors: { pack: string; error: any }[] = [];

    for (const pack of packs) {
        console.log(`\nTesting Pack: ${pack}`);
        const manifestPath = path.join(PACKS_DIR, pack, 'manifest.json');

        try {
            // 1. Read Manifest to get valid config
            let manifestRaw = await fs.readFile(manifestPath, 'utf-8');

            // Strip BOM if present
            if (manifestRaw.charCodeAt(0) === 0xFEFF) {
                manifestRaw = manifestRaw.slice(1);
            }

            let manifest: TemplatePackManifest;
            try {
                manifest = JSON.parse(manifestRaw);
            } catch (jsonErr: any) {
                throw new Error(`Invalid JSON in manifest: ${jsonErr.message}. Content start: ${manifestRaw.substring(0, 50)}...`);
            }

            const combo = manifest.supportedCombination;

            // 2. Construct Project Config
            const config: ProjectConfig = {
                projectName: `test-${pack}`,
                ...combo,
                testingPattern: 'page-object-model', // Default
                includeSampleTests: true,
                reportingTool: undefined,
                cicdTool: undefined
            };

            // 3. Attempt Generation
            const files = await generator.generateProject(config);

            // 4. Basic Validation
            if (!files || files.length === 0) {
                throw new Error('Generated 0 files');
            }

            console.log(`   ✅ Success! Generated ${files.length} files.`);
            passed++;

        } catch (err: any) {
            console.error(`   ❌ FAILED: ${err.message}`);
            failed++;
            errors.push({ pack, error: err.message });
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 VERIFICATION SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total Packs: ${packs.length}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);

    if (failed > 0) {
        console.log('\n❌ Failures:');
        errors.forEach((e) => console.log(` - ${e.pack}: ${e.error}`));
        process.exit(1);
    } else {
        console.log('\n✅ ALL TEMPLATES VERIFIED SUCCESSFULLY!');
        process.exit(0);
    }
}

verifyAllTemplates().catch((err) => {
    console.error('Fatal Script Error:', err);
    process.exit(1);
});
