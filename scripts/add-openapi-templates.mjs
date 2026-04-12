/**
 * Add OpenAPI-driven test templates to all API packs.
 *
 * For each API pack:
 *   1. Copy the canonical OpenAPI test template to files/
 *   2. Add manifest entry with conditional: { hasOpenApiEndpoints: true }
 *      (this is a computed TemplateContext boolean, always true when spec is provided)
 */

import fs from 'fs';
import path from 'path';

const PACKS_DIR = path.resolve('server/templates/packs');
const CANONICAL_DIR = path.resolve('server/templates/_canonical/openapi');

// Map pack name → { language, srcFile, destPath (in files/), manifestPath }
const PACK_MAP = {
  'api-java-restassured-testng-maven': {
    lang: 'java',
    srcFile: 'OpenApiTests.java.hbs',
    destDir: 'src/test/java/{{packagePath}}/tests',
    manifestPath: 'src/test/java/{{packagePath}}/tests/OpenApiTests.java',
  },
  'api-java-restassured-testng-gradle': {
    lang: 'java',
    srcFile: 'OpenApiTests.java.hbs',
    destDir: 'src/test/java/{{packagePath}}/tests',
    manifestPath: 'src/test/java/{{packagePath}}/tests/OpenApiTests.java',
  },
  'api-python-requests-pytest-pip': {
    lang: 'python',
    srcFile: 'test_openapi.py.hbs',
    destDir: 'tests',
    manifestPath: 'tests/test_openapi.py',
  },
  'api-javascript-supertest-jest-npm': {
    lang: 'javascript',
    srcFile: 'openapi.test.js.hbs',
    destDir: 'tests',
    manifestPath: 'tests/openapi.test.js',
  },
  'api-typescript-supertest-jest-npm': {
    lang: 'typescript',
    srcFile: 'openapi.test.ts.hbs',
    destDir: 'tests',
    manifestPath: 'tests/openapi.test.ts',
  },
  'api-typescript-graphql-jest-npm': {
    lang: 'typescript',
    srcFile: 'openapi.test.ts.hbs',
    destDir: 'tests',
    manifestPath: 'tests/openapi.test.ts',
  },
  'api-typescript-grpc-jest-npm': {
    lang: 'typescript',
    srcFile: 'openapi.test.ts.hbs',
    destDir: 'tests',
    manifestPath: 'tests/openapi.test.ts',
  },
  'api-csharp-restsharp-nunit-nuget': {
    lang: 'csharp',
    srcFile: 'OpenApiTests.cs.hbs',
    destDir: 'Tests',
    manifestPath: 'Tests/OpenApiTests.cs',
  },
  'api-go-resty-testify-mod': {
    lang: 'go',
    srcFile: 'openapi_test.go.hbs',
    destDir: 'tests',
    manifestPath: 'tests/openapi_test.go',
  },
};

function main() {
  let updated = 0;

  for (const [packName, cfg] of Object.entries(PACK_MAP)) {
    const packDir = path.join(PACKS_DIR, packName);
    if (!fs.existsSync(packDir)) {
      console.log(`SKIP (not found): ${packName}`);
      continue;
    }

    const manifestPath = path.join(packDir, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

    // Check if already has OpenAPI template
    const alreadyHas = manifest.files?.some(
      (f) => f.path?.includes('OpenApi') || f.path?.includes('openapi')
    );
    if (alreadyHas) {
      console.log(`SKIP (already has openapi): ${packName}`);
      continue;
    }

    // 1. Copy template file
    const destDir = path.join(packDir, 'files', cfg.destDir);
    fs.mkdirSync(destDir, { recursive: true });

    const srcPath = path.join(CANONICAL_DIR, cfg.lang, cfg.srcFile);
    const destPath = path.join(destDir, cfg.srcFile);
    fs.copyFileSync(srcPath, destPath);

    // 2. Add manifest entry
    manifest.files.push({
      path: cfg.manifestPath,
      isTemplate: true,
      conditional: { hasOpenApiEndpoints: true },
    });

    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

    console.log(`UPDATED: ${packName} (${cfg.lang})`);
    updated++;
  }

  console.log(`\n✓ Updated: ${updated} packs`);
}

main();
