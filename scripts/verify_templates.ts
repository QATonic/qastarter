
import { validationMatrix } from '../shared/validationMatrix';
import { TemplatePackEngine } from '../server/templates/templatePackEngine';
import { ProjectConfig } from '../shared/schema';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Fix __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Engine
// Note: We point to the server/templates/packs directory relative to this script
const packsDir = path.join(__dirname, '../server/templates/packs');
const engine = new TemplatePackEngine(packsDir);

async function verifyTemplates() {
  console.log('🔍 Starting Comprehensive Template Verification...\n');
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    failures: [] as { config: string; error: any }[]
  };

  const combinations = new Set<string>();

  // 1. Generate all valid combinations
  for (const type of validationMatrix.testingTypes) {
    const validFrameworks = validationMatrix.frameworks[type] || [];
    
    for (const framework of validFrameworks) {
      const validLanguages = validationMatrix.languages[framework] || [];
      
      for (const language of validLanguages) {
        
        // Determine Test Runners
        let runners = validationMatrix.testRunners[language] || [];
        const specificRunnersKey = `${framework}-${language}`;
        if (validationMatrix.frameworkLanguageTestRunners && validationMatrix.frameworkLanguageTestRunners[specificRunnersKey]) {
          runners = validationMatrix.frameworkLanguageTestRunners[specificRunnersKey];
        }

        // Determine Build Tools
        let buildTools = validationMatrix.buildTools[language] || [];
        if (validationMatrix.frameworkLanguageBuildTools && validationMatrix.frameworkLanguageBuildTools[specificRunnersKey]) {
            buildTools = validationMatrix.frameworkLanguageBuildTools[specificRunnersKey];
        }

        for (const runner of runners) {
          for (const buildTool of buildTools) {
            
             // Construct Config Key (unique ID for the pack)
             // Schema: type-language-framework-runner-build
             // Note: The engine uses getTemplatePackKey: `${testingType}-${language}-${framework}-${testRunner}-${buildTool}`
             const packKey = `${type}-${language}-${framework}-${runner}-${buildTool}`;
             
             // Check if this combination has ever been checked (avoid duplicates if matrix has overlapping logic)
             if (combinations.has(packKey)) continue;
             combinations.add(packKey);

             // Create Project Config
             const config: ProjectConfig = {
               projectName: 'verify-project',
               testingType: type,
               framework: framework,
               language: language,
               testingPattern: 'pom', // Default to POM
               testRunner: runner,
               buildTool: buildTool,
               cicdTool: 'github-actions', // Default
               reportingTool: 'allure', // Default
               utilities: {
                 configReader: true,
                 jsonReader: true,
                 screenshotUtility: true,
                 logger: true,
                 dataProvider: true
               },
               dependencies: []
             };

             // Run Verification
             results.total++;
             process.stdout.write(`Checking ${packKey}... `);

             try {
                // First check if pack exists physically
                const exists = await engine.hasTemplatePack(config);
                if (!exists) {
                    process.stdout.write('⚠️  SKIPPED (Pack not found)\n');
                    results.skipped++;
                    continue;
                }

                // Attempt Generation (Dry Run - In Memory)
                await engine.generateProject(config);
                process.stdout.write('✅ PASS\n');
                results.passed++;

             } catch (error: any) {
                process.stdout.write('❌ FAIL\n');
                console.error(`  Error: ${error.message}`);
                results.failed++;
                results.failures.push({ config: packKey, error: error.message });
             }
          }
        }
      }
    }
  }

  console.log('\n----------------------------------------');
  console.log('📊 Verification Summary');
  console.log('----------------------------------------');
  console.log(`Total Combinations: ${results.total}`);
  console.log(`✅ Passed:          ${results.passed}`);
  console.log(`❌ Failed:          ${results.failed}`);
  console.log(`⚠️  Skipped:         ${results.skipped}`);
  console.log('----------------------------------------');

  if (results.failures.length > 0) {
    console.log('\n🛑 Failures Details:');
    results.failures.forEach(f => {
      console.log(`- [${f.config}]: ${f.error}`);
    });
    process.exit(1);
  } else {
    console.log('\n✨ All existing templates verified successfully!');
    process.exit(0);
  }
}

verifyTemplates().catch(err => {
  console.error('Fatal Script Error:', err);
  process.exit(1);
});
