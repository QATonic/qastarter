/**
 * Script to sync manifest.json files with actual template files
 * Run with: node scripts/sync-web-manifests.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PACKS_DIR = path.join(__dirname, '..', 'server', 'templates', 'packs');

// Get all web template packs
const webPacks = fs.readdirSync(PACKS_DIR)
  .filter(dir => dir.startsWith('web-'))
  .map(dir => path.join(PACKS_DIR, dir));

console.log(`Found ${webPacks.length} web packs\n`);

let totalFixed = 0;
let totalFilesAdded = 0;

webPacks.forEach(packPath => {
  const packName = path.basename(packPath);
  const manifestPath = path.join(packPath, 'manifest.json');
  const filesPath = path.join(packPath, 'files');

  if (!fs.existsSync(manifestPath) || !fs.existsSync(filesPath)) {
    console.log(`⚠️ ${packName}: Missing manifest or files folder`);
    return;
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const manifestPaths = manifest.files.map(f => f.path);

  // Get all .hbs files
  const getAllHbsFiles = (dir, base = '') => {
    const files = [];
    fs.readdirSync(dir).forEach(item => {
      const fullPath = path.join(dir, item);
      const relativePath = base ? `${base}/${item}` : item;
      if (fs.statSync(fullPath).isDirectory()) {
        files.push(...getAllHbsFiles(fullPath, relativePath));
      } else if (item.endsWith('.hbs')) {
        files.push(relativePath.replace('.hbs', ''));
      }
    });
    return files;
  };

  const actualFiles = getAllHbsFiles(filesPath);
  const missing = actualFiles.filter(f => !manifestPaths.includes(f));

  if (missing.length === 0) {
    console.log(`✅ ${packName}: OK (${manifestPaths.length} files)`);
    return;
  }

  console.log(`🔧 ${packName}: Adding ${missing.length} missing files...`);

  // Add missing files to manifest
  missing.forEach(filePath => {
    let isTemplate = true;
    let conditional = null;

    // Determine if static file
    if (filePath.includes('.gitignore') || filePath.includes('__init__.py') ||
      filePath.includes('gradlew') || filePath.endsWith('.properties') && !filePath.includes('gradle-wrapper')) {
      isTemplate = false;
    }

    // Determine conditional
    if (filePath.includes('Jenkinsfile')) conditional = { cicdTool: 'jenkins' };
    else if (filePath.includes('.github')) conditional = { cicdTool: 'github-actions' };
    else if (filePath.includes('.gitlab-ci')) conditional = { cicdTool: 'gitlab-ci' };
    else if (filePath.includes('azure-pipelines')) conditional = { cicdTool: 'azure-devops' };
    else if (filePath.includes('.circleci')) conditional = { cicdTool: 'circleci' };
    else if (filePath.includes('Dockerfile') && !filePath.includes('docker-compose')) {
      conditional = { 'utilities.includeDocker': true };
    }
    else if (filePath.includes('docker-compose')) {
      conditional = { 'utilities.includeDockerCompose': true };
    }
    else if (filePath.includes('ExtentManager') || filePath.includes('extent-config')) {
      conditional = { reportingTool: 'extent-reports' };
    }
    else if (filePath.includes('AllureManager') || filePath.includes('allure.properties')) {
      conditional = { reportingTool: 'allure' };
    }
    else if (filePath.includes('feature') || filePath.includes('step') ||
      filePath.includes('Runner') || filePath.includes('Hooks')) {
      conditional = { testingPattern: 'bdd' };
    }

    const entry = { path: filePath, isTemplate };
    if (conditional) entry.conditional = conditional;

    manifest.files.push(entry);
  });

  // Write updated manifest
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`   ✅ Added: ${missing.join(', ')}`);

  totalFixed++;
  totalFilesAdded += missing.length;
});

console.log(`\n=== Summary ===`);
console.log(`Packs fixed: ${totalFixed}`);
console.log(`Files added: ${totalFilesAdded}`);
