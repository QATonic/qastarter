/**
 * Script to add id and displayName to all manifest files
 * Run with: node scripts/update-manifests.mjs
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const packsDir = join(__dirname, '..', 'server', 'templates', 'packs');

// Get all pack directories
const packs = readdirSync(packsDir).filter(name => {
    const fullPath = join(packsDir, name);
    return statSync(fullPath).isDirectory();
});

console.log(`Found ${packs.length} template packs to update`);

for (const packName of packs) {
    const manifestPath = join(packsDir, packName, 'manifest.json');

    try {
        // Read existing manifest
        const content = readFileSync(manifestPath, 'utf-8');
        const manifest = JSON.parse(content);

        let modified = false;

        // Add id if missing
        if (!manifest.id) {
            // Insert id at the beginning of the object
            const newManifest = { id: packName, ...manifest };
            Object.assign(manifest, {}, newManifest);
            manifest.id = packName;
            modified = true;
        }

        // Add displayName if missing
        if (!manifest.displayName) {
            // Use existing name as displayName, or generate from packName
            manifest.displayName = manifest.name || packName
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            modified = true;
        }

        if (modified) {
            // Reorder keys: id, displayName, name, then rest
            const ordered = {};
            if (manifest.id) ordered.id = manifest.id;
            if (manifest.displayName) ordered.displayName = manifest.displayName;

            for (const [key, value] of Object.entries(manifest)) {
                if (key !== 'id' && key !== 'displayName') {
                    ordered[key] = value;
                }
            }

            // Write back with 2-space indentation
            writeFileSync(manifestPath, JSON.stringify(ordered, null, 2) + '\n', 'utf-8');
            console.log(`Updated: ${packName}`);
        } else {
            console.log(`Skipped: ${packName} (already has id and displayName)`);
        }
    } catch (error) {
        console.error(`Error processing ${packName}:`, error.message);
    }
}

console.log('Done!');
