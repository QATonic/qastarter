/**
 * Add BrowserStack / Sauce Labs cloud config templates to all web + mobile packs.
 *
 * For each web/mobile pack:
 *   1. Copy browserstack.yml.hbs and saucelabs.yml.hbs to files/config/
 *   2. Add manifest entries with conditionals for cloudDeviceFarm
 */

import fs from 'fs';
import path from 'path';

const PACKS_DIR = path.resolve('server/templates/packs');
const CANONICAL_DIR = path.resolve('server/templates/_canonical/cloud');

function main() {
  const packs = fs.readdirSync(PACKS_DIR).filter((d) => {
    if (d.startsWith('_')) return false;
    const fullPath = path.join(PACKS_DIR, d);
    if (!fs.statSync(fullPath).isDirectory()) return false;
    if (!fs.existsSync(path.join(fullPath, 'manifest.json'))) return false;
    // Only web and mobile packs
    return d.startsWith('web-') || d.startsWith('mobile-');
  });

  let updated = 0;
  let skipped = 0;

  for (const pack of packs) {
    const isMobile = pack.startsWith('mobile-');
    const manifestPath = path.join(PACKS_DIR, pack, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

    // Check if cloud config already exists
    const alreadyHasCloud = manifest.files?.some(
      (f) =>
        f.path?.includes('browserstack') ||
        f.path?.includes('saucelabs')
    );

    if (alreadyHasCloud) {
      console.log(`SKIP (already has cloud config): ${pack}`);
      skipped++;
      continue;
    }

    // 1. Create config/ directory in files/
    const configDir = path.join(PACKS_DIR, pack, 'files', 'config');
    fs.mkdirSync(configDir, { recursive: true });

    // 2. Copy appropriate templates (web vs mobile)
    const bsSrc = isMobile ? 'browserstack-mobile.yml.hbs' : 'browserstack.yml.hbs';
    const slSrc = isMobile ? 'saucelabs-mobile.yml.hbs' : 'saucelabs.yml.hbs';

    fs.copyFileSync(
      path.join(CANONICAL_DIR, bsSrc),
      path.join(configDir, 'browserstack.yml.hbs')
    );
    fs.copyFileSync(
      path.join(CANONICAL_DIR, slSrc),
      path.join(configDir, 'saucelabs.yml.hbs')
    );

    // 3. Add manifest entries
    manifest.files.push(
      {
        path: 'config/browserstack.yml',
        isTemplate: true,
        conditional: { cloudDeviceFarm: 'browserstack' },
      },
      {
        path: 'config/saucelabs.yml',
        isTemplate: true,
        conditional: { cloudDeviceFarm: 'saucelabs' },
      }
    );

    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

    console.log(`UPDATED: ${pack} (${isMobile ? 'mobile' : 'web'})`);
    updated++;
  }

  console.log(`\n✓ Updated: ${updated} packs`);
  console.log(`○ Skipped: ${skipped} packs`);
}

main();
