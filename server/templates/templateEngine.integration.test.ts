/**
 * Integration tests for the template engine (Phase 1B of the QAStarter
 * improvements plan).
 *
 * These tests hit the real template packs on disk through
 * `ProjectTemplateGenerator.generateProject()` — no filesystem or cache
 * mocks. They are the Vitest successor to the legacy standalone
 * `server/test-template-engine.ts` script (which was run manually via
 * `tsx`). Each legacy suite is converted into a Vitest `describe` +
 * `it` pair so `npm test` covers the same ground automatically.
 *
 * For each configuration we assert:
 *   - `generateProject()` returns a non-empty file list
 *   - every path in `shouldInclude` shows up as a substring of some
 *     generated file path (conditional `shouldIncludeFile` evaluates
 *     correctly)
 *   - no path in `shouldNotInclude` shows up (conditional exclusion
 *     also works)
 *
 * This guards against regressions in the conditional include logic,
 * the CI/CD + reporting cascades, and the per-pack manifest rules
 * without needing to manually run the old script.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { ProjectTemplateGenerator } from './index';
import type { ProjectConfig } from '@shared/schema';

interface Expectations {
  shouldInclude: string[];
  shouldNotInclude: string[];
}

const generator = new ProjectTemplateGenerator();

/**
 * Shared helper: generate a project for the given config and assert the
 * expected files are / are not present. All assertions are substring
 * matches to stay robust against minor path reshuffles inside the pack.
 */
async function assertGeneratedFiles(
  config: ProjectConfig,
  expectations: Expectations
): Promise<void> {
  const files = await generator.generateProject(config);
  const paths = files.map((f) => f.path);

  expect(files.length, 'generator produced zero files').toBeGreaterThan(0);

  for (const expected of expectations.shouldInclude) {
    expect(
      paths.some((p) => p.includes(expected)),
      `expected a generated file whose path contains "${expected}"\n` +
        `got: ${paths.slice(0, 20).join(', ')}${paths.length > 20 ? ', ...' : ''}`
    ).toBe(true);
  }

  for (const unexpected of expectations.shouldNotInclude) {
    expect(
      paths.some((p) => p.includes(unexpected)),
      `did not expect a generated file path to contain "${unexpected}"`
    ).toBe(false);
  }
}

describe('TemplateEngine — integration', () => {
  // These integration runs can take a few seconds each on Windows when
  // the repo is cold — bump the per-test timeout.
  beforeAll(() => {
    // Warm-up the generator once so the first real test doesn't absorb
    // the handlebars compile cost.
    return generator.generateProject({
      testingType: 'web',
      framework: 'selenium',
      language: 'java',
      testRunner: 'testng',
      buildTool: 'maven',
      testingPattern: 'page-object-model',
      projectName: 'warmup',
      includeSampleTests: true,
    });
  }, 30_000);

  // -----------------------------------------------------------------
  // Test 1 — Minimal configuration (no optional selections)
  // -----------------------------------------------------------------
  describe('minimal configuration', () => {
    const baseConfig: ProjectConfig = {
      testingType: 'web',
      framework: 'selenium',
      language: 'java',
      testRunner: 'testng',
      buildTool: 'maven',
      testingPattern: 'page-object-model',
      projectName: 'minimal-test-project',
      includeSampleTests: true,
    };

    it('generates only the core files when no CI/CD or reporting tool is selected', async () => {
      await assertGeneratedFiles(baseConfig, {
        shouldInclude: [
          'pom.xml',
          'LoginTests',
          'LoginPage',
          'BasePage',
          'DriverManager',
          'testng.xml',
        ],
        shouldNotInclude: [
          '.github/workflows',
          'Jenkinsfile',
          '.gitlab-ci.yml',
          'azure-pipelines.yml',
          '.circleci/config.yml',
          'ExtentManager',
          'AllureManager',
          'extent-config.xml',
          'allure.properties',
        ],
      });
    }, 30_000);
  });

  // -----------------------------------------------------------------
  // Test 2 — Maximal configuration (all optional selections)
  // -----------------------------------------------------------------
  describe('maximal configuration', () => {
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
      artifactId: 'test-project',
    };

    it('generates GitHub Actions + ExtentReports artifacts together', async () => {
      await assertGeneratedFiles(config, {
        shouldInclude: [
          '.github/workflows/tests.yml',
          'ExtentManager',
          'extent-config.xml',
          'pom.xml',
          'LoginTests',
          'LoginPage',
        ],
        shouldNotInclude: ['Jenkinsfile', '.gitlab-ci.yml', 'AllureManager', 'allure.properties'],
      });
    }, 30_000);
  });

  // -----------------------------------------------------------------
  // Test 3 — CI/CD tool variations (Jenkins / GitLab / Azure / CircleCI)
  // -----------------------------------------------------------------
  describe('CI/CD tool variations', () => {
    const base: ProjectConfig = {
      testingType: 'web',
      framework: 'selenium',
      language: 'java',
      testRunner: 'testng',
      buildTool: 'maven',
      testingPattern: 'page-object-model',
      projectName: 'cicd-test-project',
      includeSampleTests: true,
    };

    const allCiArtifacts = [
      '.github/workflows',
      'Jenkinsfile',
      '.gitlab-ci.yml',
      'azure-pipelines.yml',
      '.circleci/config.yml',
    ];

    const cases: Array<{
      name: string;
      tool: NonNullable<ProjectConfig['cicdTool']>;
      artifact: string;
    }> = [
      { name: 'Jenkins', tool: 'jenkins', artifact: 'Jenkinsfile' },
      { name: 'GitLab CI', tool: 'gitlab-ci', artifact: '.gitlab-ci.yml' },
      { name: 'Azure DevOps', tool: 'azure-devops', artifact: 'azure-pipelines.yml' },
      { name: 'CircleCI', tool: 'circleci', artifact: '.circleci/config.yml' },
    ];

    for (const { name, tool, artifact } of cases) {
      it(`emits ${name} artifacts and excludes the others`, async () => {
        await assertGeneratedFiles(
          { ...base, cicdTool: tool },
          {
            shouldInclude: [artifact],
            shouldNotInclude: allCiArtifacts.filter((a) => a !== artifact),
          }
        );
      }, 30_000);
    }
  });

  // -----------------------------------------------------------------
  // Test 4 — Reporting tool variations
  // -----------------------------------------------------------------
  describe('reporting tool variations', () => {
    const base: ProjectConfig = {
      testingType: 'web',
      framework: 'selenium',
      language: 'java',
      testRunner: 'testng',
      buildTool: 'maven',
      testingPattern: 'page-object-model',
      projectName: 'reporting-test-project',
      includeSampleTests: true,
    };

    it('emits ExtentReports manager + config when extent-reports is picked', async () => {
      await assertGeneratedFiles(
        { ...base, reportingTool: 'extent-reports' },
        {
          shouldInclude: ['ExtentManager', 'extent-config.xml'],
          shouldNotInclude: ['AllureManager', 'allure.properties'],
        }
      );
    }, 30_000);

    it('emits Allure config when allure is picked', async () => {
      await assertGeneratedFiles(
        { ...base, reportingTool: 'allure' },
        {
          shouldInclude: ['allure.properties'],
          shouldNotInclude: ['ExtentManager', 'extent-config.xml'],
        }
      );
    }, 30_000);

    it('emits no report tool files when testng-reports (built-in) is picked', async () => {
      await assertGeneratedFiles(
        { ...base, reportingTool: 'testng-reports' },
        {
          shouldInclude: ['pom.xml'],
          shouldNotInclude: [
            'ExtentManager',
            'AllureManager',
            'extent-config.xml',
            'allure.properties',
          ],
        }
      );
    }, 30_000);
  });

  // -----------------------------------------------------------------
  // Test 5 — API pack with ExtentReports (legacy regression fix)
  // -----------------------------------------------------------------
  describe('API pack with ExtentReports', () => {
    const config: ProjectConfig = {
      testingType: 'api',
      framework: 'restassured',
      language: 'java',
      testRunner: 'testng',
      buildTool: 'maven',
      testingPattern: 'fluent',
      projectName: 'api-extent-test',
      includeSampleTests: true,
      reportingTool: 'extent-reports',
    };

    it('includes ExtentReportManager and extent-config.xml, not AllureManager', async () => {
      // The API pack ships ExtentReportManager.java (not ExtentManager.java),
      // so we match on "ExtentReport" which covers both the class file and
      // the config. Guards against regressions in the extent-reports
      // conditional for the API REST Assured TestNG Maven pack.
      await assertGeneratedFiles(config, {
        shouldInclude: ['ExtentReportManager', 'extent-config.xml'],
        shouldNotInclude: ['AllureManager'],
      });
    }, 30_000);
  });

  // -----------------------------------------------------------------
  // Test 6 — Playwright Java JUnit5 pack (junit-platform props + PlaywrightFactory)
  // -----------------------------------------------------------------
  describe('Playwright Java JUnit5 pack', () => {
    const config: ProjectConfig = {
      testingType: 'web',
      framework: 'playwright',
      language: 'java',
      testRunner: 'junit5',
      buildTool: 'maven',
      testingPattern: 'page-object-model',
      projectName: 'playwright-junit5-test',
      includeSampleTests: true,
    };

    it('includes JUnit5 platform config + PlaywrightManager and excludes TestNG suite file', async () => {
      // The Playwright Java JUnit5 Maven pack ships PlaywrightManager.java
      // (not PlaywrightFactory) and junit-platform.properties for the
      // JUnit5 runner. The testng.xml entry is gated on
      // testRunner === 'testng' in the manifest, so it must NOT appear
      // in the generated output for this junit5 pack.
      await assertGeneratedFiles(config, {
        shouldInclude: [
          'junit-platform.properties',
          'PlaywrightManager',
          'LoginPage',
          'LoginTests',
        ],
        shouldNotInclude: ['testng.xml'],
      });
    }, 30_000);
  });

  // -----------------------------------------------------------------
  // Test 7 — Python pack (inline conditionals)
  // -----------------------------------------------------------------
  describe('Python Selenium pack with pytest-html', () => {
    const config: ProjectConfig = {
      testingType: 'web',
      framework: 'selenium',
      language: 'python',
      testRunner: 'pytest',
      buildTool: 'pip',
      testingPattern: 'page-object-model',
      projectName: 'python-selenium-test',
      includeSampleTests: true,
      reportingTool: 'pytest-html',
    };

    it('produces Python sources and avoids leaking Java build artefacts', async () => {
      await assertGeneratedFiles(config, {
        shouldInclude: ['requirements.txt', 'conftest.py', 'home_page.py', 'login_page.py'],
        shouldNotInclude: ['pom.xml', '.java'],
      });
    }, 30_000);
  });

  // -----------------------------------------------------------------
  // Test 8 — Desktop pack (legacy cleanup verification)
  // -----------------------------------------------------------------
  describe('Desktop WinAppDriver pack', () => {
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
      reportingTool: 'extent-reports',
    };

    it('includes pom.xml, GH Actions workflow, ExtentManager and drops legacy staging.properties', async () => {
      await assertGeneratedFiles(config, {
        shouldInclude: ['pom.xml', '.github/workflows/tests.yml', 'ExtentManager'],
        shouldNotInclude: ['staging.properties'],
      });
    }, 30_000);
  });
});
