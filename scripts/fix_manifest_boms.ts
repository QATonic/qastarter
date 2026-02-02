
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PACKS_DIR = path.join(__dirname, '../server/templates/packs');

async function fixBoms() {
    console.log('🔍 Scanning for BOMs in manifests...');

    const entries = await fs.readdir(PACKS_DIR, { withFileTypes: true });
    const packs = entries.filter((e) => e.isDirectory()).map((e) => e.name);

    let fixedCount = 0;

    for (const pack of packs) {
        const manifestPath = path.join(PACKS_DIR, pack, 'manifest.json');
        const content = await fs.readFile(manifestPath, 'utf-8');

        if (content.charCodeAt(0) === 0xFEFF) {
            console.log(`⚠️  Found BOM in ${pack}/manifest.json. Fixing...`);
            const cleanContent = content.slice(1);
            await fs.writeFile(manifestPath, cleanContent, 'utf-8');
            fixedCount++;
        } else {
            // Also check if there are other weird controls
            if (!content.trim().startsWith('{')) {
                console.log(`⚠️  Found suspicious start in ${pack}/manifest.json: "${content.substring(0, 10)}". Fixing by trimming...`);
                const cleanContent = content.trim();
                // Find first curly brace
                const firstBrace = cleanContent.indexOf('{');
                if (firstBrace > 0) {
                    await fs.writeFile(manifestPath, cleanContent.substring(firstBrace), 'utf-8');
                    fixedCount++;
                } else if (firstBrace === 0 && cleanContent !== content) {
                    await fs.writeFile(manifestPath, cleanContent, 'utf-8');
                    fixedCount++;
                }
            }
        }
    }

    console.log(`✅ Scan complete. Fixed ${fixedCount} files.`);
}

fixBoms().catch(console.error);
