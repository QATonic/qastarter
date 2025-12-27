import { ProjectTemplateGenerator } from './templates/index.js';
import { ProjectConfig } from '@shared/schema';
import { promises as fs } from 'fs';
import path from 'path';

interface TestResult {
  testName: string;
  packKey: string;
  config: ProjectConfig;
  totalFiles: number;
  fileList: string[];
  conditionalFiles: {
    cicd: string[];
    reporting: string[];
    bdd: string[];
    testResources: string[];
  };
  passed: boolean;
  errors: string[];
}

class TemplateEngineTest {
  private generator: ProjectTemplateGenerator;
  private results: TestResult[] = [];

  constructor() {
    this.generator = new ProjectTemplateGenerator();
  }

  /**
   * Test 1: Minimal Configuration (No optional selections)
   */
  async testMinimalConfig(): Promise<void> {
    console.log('\n=== TEST 1: MINIMAL CONFIGURATION ===');
    
    const config: ProjectConfig = {
      testingType: 'web',
      framework: 'selenium',
      language: 'java',
      testRunner: 'testng',
      buildTool: 'maven',
      testingPattern: 'page-object-model',
      projectName: 'minimal-test-project',
      includeSampleTests: true
      // NO cicdTool, NO reportingTool - should generate only core files
    };

    await this.runTest('Minimal Config (No CI/CD, No Reporting)', config, {
      shouldNotInclude: [
        '.github/workflows',
        'Jenkinsfile',
        '.gitlab-ci.yml',
        'azure-pipelines.yml',
        '.circleci/config.yml',
        'ExtentManager',
        'AllureManager',
        'extent-config.xml',
        'allure.properties'
      ],
      shouldInclude: [
        'pom.xml',
        'LoginTest',
        'HomePage',
        'LoginPage',
        'BasePage',
        'DriverManager',
        'testng.xml'
      ]
    });
  }

  /**
   * Test 2: Maximal Configuration (All optional selections)
   */
  async testMaximalConfig(): Promise<void> {
    console.log('\n=== TEST 2: MAXIMAL CONFIGURATION ===');
    
    const config: ProjectConfig = {
      testingType: 'web',
      framework: 'selenium',
      language: 'java',
      testRunner: 'testng',
      buildTool: 'maven',
      testingPattern: 'page-object-model',
      projectName: 'maximal-test-project',
      includeSampleTests: true,
      cicdTool: 'github-actions',
      reportingTool: 'extent-reports',
      groupId: 'com.test',
      artifactId: 'test-project'
    };

    await this.runTest('Maximal Config (GitHub Actions + ExtentReports)', config, {
      shouldInclude: [
        '.github/workflows/tests.yml',
        'ExtentManager',
        'extent-config.xml',
        'pom.xml',
        'LoginTest',
        'HomePage',
        'LoginPage'
      ],
      shouldNotInclude: [
        'Jenkinsfile',
        '.gitlab-ci.yml',
        'AllureManager',
        'allure.properties'
      ]
    });
  }

  /**
   * Test 3: CI/CD Tool Variations
   */
  async testCICDVariations(): Promise<void> {
    console.log('\n=== TEST 3: CI/CD TOOL VARIATIONS ===');
    
    const baseConfig: ProjectConfig = {
      testingType: 'web',
      framework: 'selenium',
      language: 'java',
      testRunner: 'testng',
      buildTool: 'maven',
      testingPattern: 'page-object-model',
      projectName: 'cicd-test-project',
      includeSampleTests: true
    };

    // Test Jenkins
    await this.runTest('Jenkins CI/CD', {
      ...baseConfig,
      cicdTool: 'jenkins'
    }, {
      shouldInclude: ['Jenkinsfile'],
      shouldNotInclude: ['.github/workflows', '.gitlab-ci.yml', 'azure-pipelines.yml', '.circleci/config.yml']
    });

    // Test GitLab CI
    await this.runTest('GitLab CI/CD', {
      ...baseConfig,
      cicdTool: 'gitlab-ci'
    }, {
      shouldInclude: ['.gitlab-ci.yml'],
      shouldNotInclude: ['Jenkinsfile', '.github/workflows', 'azure-pipelines.yml', '.circleci/config.yml']
    });

    // Test Azure DevOps
    await this.runTest('Azure DevOps CI/CD', {
      ...baseConfig,
      cicdTool: 'azure-devops'
    }, {
      shouldInclude: ['azure-pipelines.yml'],
      shouldNotInclude: ['Jenkinsfile', '.github/workflows', '.gitlab-ci.yml', '.circleci/config.yml']
    });

    // Test CircleCI
    await this.runTest('CircleCI CI/CD', {
      ...baseConfig,
      cicdTool: 'circleci'
    }, {
      shouldInclude: ['.circleci/config.yml'],
      shouldNotInclude: ['Jenkinsfile', '.github/workflows', '.gitlab-ci.yml', 'azure-pipelines.yml']
    });
  }

  /**
   * Test 4: Reporting Tool Variations
   */
  async testReportingVariations(): Promise<void> {
    console.log('\n=== TEST 4: REPORTING TOOL VARIATIONS ===');
    
    const baseConfig: ProjectConfig = {
      testingType: 'web',
      framework: 'selenium',
      language: 'java',
      testRunner: 'testng',
      buildTool: 'maven',
      testingPattern: 'page-object-model',
      projectName: 'reporting-test-project',
      includeSampleTests: true
    };

    // Test ExtentReports
    await this.runTest('ExtentReports', {
      ...baseConfig,
      reportingTool: 'extent-reports'
    }, {
      shouldInclude: ['ExtentManager', 'extent-config.xml'],
      shouldNotInclude: ['AllureManager', 'allure.properties']
    });

    // Test Allure
    await this.runTest('Allure Reports', {
      ...baseConfig,
      reportingTool: 'allure'
    }, {
      shouldInclude: ['allure.properties'],
      shouldNotInclude: ['ExtentManager', 'extent-config.xml']
    });

    // Test TestNG Reports (built-in, no extra files)
    await this.runTest('TestNG Reports', {
      ...baseConfig,
      reportingTool: 'testng-reports'
    }, {
      shouldInclude: ['pom.xml'], // Should have testng dependency
      shouldNotInclude: ['ExtentManager', 'AllureManager', 'extent-config.xml', 'allure.properties']
    });
  }

  /**
   * Test 5: Critical Fix - API Pack with ExtentReports
   */
  async testAPIPackExtentReports(): Promise<void> {
    console.log('\n=== TEST 5: API PACK EXTENT-REPORTS FIX ===');
    
    const config: ProjectConfig = {
      testingType: 'api',
      framework: 'restassured',
      language: 'java',
      testRunner: 'testng',
      buildTool: 'maven',
      testingPattern: 'page-object-model',
      projectName: 'api-extent-test',
      includeSampleTests: true,
      reportingTool: 'extent-reports'
    };

    await this.runTest('API Pack - ExtentReports Fix', config, {
      shouldInclude: ['ExtentManager', 'extent-config.xml'],
      shouldNotInclude: ['AllureManager']
    });
  }

  /**
   * Test 6: NEW Playwright Pack with Missing Files
   */
  async testPlaywrightJUnit5Pack(): Promise<void> {
    console.log('\n=== TEST 6: PLAYWRIGHT JUNIT5 PACK (NEW FILES) ===');
    
    const config: ProjectConfig = {
      testingType: 'web',
      framework: 'playwright',
      language: 'java',
      testRunner: 'junit5',
      buildTool: 'maven',
      testingPattern: 'page-object-model',
      projectName: 'playwright-junit5-test',
      includeSampleTests: true
    };

    await this.runTest('Playwright JUnit5 Pack', config, {
      shouldInclude: [
        'junit-platform.properties',
        'testdata/users.csv',
        'testdata/sample.json',
        'PlaywrightFactory',
        'BrowserManager'
      ],
      shouldNotInclude: ['TestNG', 'testng.xml']
    });
  }

  /**
   * Test 7: Python Pack with pytest-html (inline conditional)
   */
  async testPythonPack(): Promise<void> {
    console.log('\n=== TEST 7: PYTHON PACK (INLINE CONDITIONALS) ===');
    
    const config: ProjectConfig = {
      testingType: 'web',
      framework: 'selenium',
      language: 'python',
      testRunner: 'pytest',
      buildTool: 'pip',
      testingPattern: 'page-object-model',
      projectName: 'python-selenium-test',
      includeSampleTests: true,
      reportingTool: 'pytest-html'
    };

    await this.runTest('Python Pack - pytest-html', config, {
      shouldInclude: ['requirements.txt', 'conftest.py', 'home_page.py', 'login_page.py'],
      shouldNotInclude: ['pom.xml', '.java']
    });
  }

  /**
   * Test 8: Desktop Pack (Legacy Cleanup Verification)
   */
  async testDesktopPack(): Promise<void> {
    console.log('\n=== TEST 8: DESKTOP PACK (LEGACY CLEANUP) ===');
    
    const config: ProjectConfig = {
      testingType: 'desktop',
      framework: 'winappdriver',
      language: 'java',
      testRunner: 'testng',
      buildTool: 'maven',
      testingPattern: 'page-object-model',
      projectName: 'desktop-test',
      includeSampleTests: true,
      cicdTool: 'github-actions',
      reportingTool: 'extent-reports'
    };

    await this.runTest('Desktop Pack - Legacy Cleanup', config, {
      shouldInclude: ['pom.xml', '.github/workflows/tests.yml', 'ExtentManager'],
      shouldNotInclude: ['staging.properties', 'TestNG-specific-in-JUnit-pack']
    });
  }

  /**
   * Run a single test
   */
  private async runTest(
    testName: string,
    config: ProjectConfig,
    expectations: { shouldInclude: string[], shouldNotInclude: string[] }
  ): Promise<void> {
    try {
      console.log(`\n--- Running: ${testName} ---`);
      console.log(`Config: ${config.testingType}-${config.language}-${config.framework}-${config.testRunner}-${config.buildTool}`);
      console.log(`CI/CD: ${config.cicdTool || 'NONE'}, Reporting: ${config.reportingTool || 'NONE'}`);

      const files = await this.generator.generateProject(config);
      const fileList = files.map(f => f.path);

      console.log(`✓ Generated ${files.length} files`);

      const errors: string[] = [];

      // Check shouldInclude
      for (const expected of expectations.shouldInclude) {
        const found = fileList.some(f => f.includes(expected));
        if (!found) {
          errors.push(`MISSING: Expected file containing "${expected}"`);
          console.log(`  ✗ MISSING: ${expected}`);
        } else {
          console.log(`  ✓ Found: ${expected}`);
        }
      }

      // Check shouldNotInclude
      for (const unexpected of expectations.shouldNotInclude) {
        const found = fileList.some(f => f.includes(unexpected));
        if (found) {
          errors.push(`UNEXPECTED: File containing "${unexpected}" should not be included`);
          console.log(`  ✗ UNEXPECTED: ${unexpected}`);
        } else {
          console.log(`  ✓ Correctly excluded: ${unexpected}`);
        }
      }

      // Categorize conditional files
      const conditionalFiles = {
        cicd: fileList.filter(f => 
          f.includes('.github/workflows') || 
          f.includes('Jenkinsfile') || 
          f.includes('.gitlab-ci.yml') || 
          f.includes('azure-pipelines.yml') || 
          f.includes('.circleci/config.yml')
        ),
        reporting: fileList.filter(f => 
          f.includes('ExtentManager') || 
          f.includes('AllureManager') || 
          f.includes('extent-config.xml') || 
          f.includes('allure.properties')
        ),
        bdd: fileList.filter(f => 
          f.includes('.feature') || 
          f.includes('StepDefinitions') || 
          f.includes('CucumberRunner')
        ),
        testResources: fileList.filter(f => 
          f.includes('testdata/') || 
          f.includes('junit-platform.properties')
        )
      };

      const result: TestResult = {
        testName,
        packKey: `${config.testingType}-${config.language}-${config.framework}-${config.testRunner}-${config.buildTool}`,
        config,
        totalFiles: files.length,
        fileList,
        conditionalFiles,
        passed: errors.length === 0,
        errors
      };

      this.results.push(result);

      if (errors.length === 0) {
        console.log(`✅ PASSED: ${testName}`);
      } else {
        console.log(`❌ FAILED: ${testName} (${errors.length} errors)`);
      }

    } catch (error) {
      console.error(`❌ ERROR in ${testName}:`, error);
      this.results.push({
        testName,
        packKey: `${config.testingType}-${config.language}-${config.framework}-${config.testRunner}-${config.buildTool}`,
        config,
        totalFiles: 0,
        fileList: [],
        conditionalFiles: { cicd: [], reporting: [], bdd: [], testResources: [] },
        passed: false,
        errors: [error instanceof Error ? error.message : String(error)]
      });
    }
  }

  /**
   * Generate comprehensive test report
   */
  async generateReport(): Promise<void> {
    console.log('\n\n' + '='.repeat(80));
    console.log('PHASE 2: TEMPLATE ENGINE TEST REPORT');
    console.log('='.repeat(80));

    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;

    console.log(`\nTotal Tests: ${this.results.length}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);

    if (failed > 0) {
      console.log('\n--- FAILED TESTS ---');
      this.results.filter(r => !r.passed).forEach(result => {
        console.log(`\n❌ ${result.testName}`);
        console.log(`   Pack: ${result.packKey}`);
        result.errors.forEach(err => console.log(`   - ${err}`));
      });
    }

    console.log('\n--- FILE INCLUSION SUMMARY ---');
    this.results.forEach(result => {
      console.log(`\n${result.testName}:`);
      console.log(`  Total Files: ${result.totalFiles}`);
      console.log(`  CI/CD Files: ${result.conditionalFiles.cicd.length}`);
      console.log(`  Reporting Files: ${result.conditionalFiles.reporting.length}`);
      console.log(`  BDD Files: ${result.conditionalFiles.bdd.length}`);
      console.log(`  Test Resources: ${result.conditionalFiles.testResources.length}`);
    });

    // Save detailed report to file
    const reportPath = path.join(process.cwd(), 'PHASE2_TEST_REPORT.md');
    await this.saveDetailedReport(reportPath);
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  }

  /**
   * Save detailed markdown report
   */
  private async saveDetailedReport(filePath: string): Promise<void> {
    let report = '# Phase 2: Template Engine Test Report\n\n';
    report += `**Date:** ${new Date().toISOString()}\n\n`;
    
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    
    report += '## Summary\n\n';
    report += `- **Total Tests:** ${this.results.length}\n`;
    report += `- **✅ Passed:** ${passed}\n`;
    report += `- **❌ Failed:** ${failed}\n`;
    report += `- **Success Rate:** ${((passed / this.results.length) * 100).toFixed(1)}%\n\n`;

    report += '## Test Results\n\n';
    
    this.results.forEach((result, index) => {
      report += `### Test ${index + 1}: ${result.testName}\n\n`;
      report += `**Status:** ${result.passed ? '✅ PASSED' : '❌ FAILED'}\n\n`;
      report += `**Pack:** \`${result.packKey}\`\n\n`;
      report += `**Configuration:**\n`;
      report += `- Testing Type: ${result.config.testingType}\n`;
      report += `- Framework: ${result.config.framework}\n`;
      report += `- Language: ${result.config.language}\n`;
      report += `- Test Runner: ${result.config.testRunner}\n`;
      report += `- Build Tool: ${result.config.buildTool}\n`;
      report += `- CI/CD Tool: ${result.config.cicdTool || 'NONE'}\n`;
      report += `- Reporting Tool: ${result.config.reportingTool || 'NONE'}\n\n`;
      
      report += `**Files Generated:** ${result.totalFiles}\n\n`;
      
      if (result.conditionalFiles.cicd.length > 0) {
        report += `**CI/CD Files (${result.conditionalFiles.cicd.length}):**\n`;
        result.conditionalFiles.cicd.forEach(f => report += `- ${f}\n`);
        report += '\n';
      }
      
      if (result.conditionalFiles.reporting.length > 0) {
        report += `**Reporting Files (${result.conditionalFiles.reporting.length}):**\n`;
        result.conditionalFiles.reporting.forEach(f => report += `- ${f}\n`);
        report += '\n';
      }
      
      if (result.conditionalFiles.testResources.length > 0) {
        report += `**Test Resources (${result.conditionalFiles.testResources.length}):**\n`;
        result.conditionalFiles.testResources.forEach(f => report += `- ${f}\n`);
        report += '\n';
      }
      
      if (result.errors.length > 0) {
        report += `**❌ Errors:**\n`;
        result.errors.forEach(err => report += `- ${err}\n`);
        report += '\n';
      }
      
      report += '---\n\n';
    });

    await fs.writeFile(filePath, report, 'utf-8');
  }

  /**
   * Run all tests
   */
  async runAllTests(): Promise<boolean> {
    try {
      await this.testMinimalConfig();
      await this.testMaximalConfig();
      await this.testCICDVariations();
      await this.testReportingVariations();
      await this.testAPIPackExtentReports();
      await this.testPlaywrightJUnit5Pack();
      await this.testPythonPack();
      await this.testDesktopPack();
      
      await this.generateReport();
      
      const allPassed = this.results.every(r => r.passed);
      return allPassed;
    } catch (error) {
      console.error('Fatal error during testing:', error);
      return false;
    }
  }
}

// Run tests
async function main() {
  const tester = new TemplateEngineTest();
  const success = await tester.runAllTests();
  process.exit(success ? 0 : 1);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
