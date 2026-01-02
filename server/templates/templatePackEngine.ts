import handlebars from 'handlebars';
import { promises as fs } from 'fs';
import path from 'path';
import { ProjectConfig } from '@shared/schema';
import { TemplatePackManifest, TemplateContext, TemplatePackFile } from './types';
import { fileURLToPath } from 'url';
import {
  getCachedManifest,
  setCachedManifest,
  getCachedTemplate,
  setCachedTemplate,
  isCacheEnabled,
  getCacheStats
} from '../services/cacheService';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface TemplateFile {
  path: string;
  content: string;
  isTemplate: boolean;
  mode?: string;
}

export class TemplatePackEngine {
  private packsDirectory: string;

  constructor(packsDirectory: string = path.join(__dirname, 'packs')) {
    this.packsDirectory = packsDirectory;
    this.registerHelpers();
  }

  private registerHelpers() {
    // Existing helpers
    handlebars.registerHelper('eq', (a: any, b: any) => a === b);
    handlebars.registerHelper('or', (...args: any[]) => {
      const opts = args.pop();
      return args.some(Boolean);
    });
    handlebars.registerHelper('includes', (arr: any[], val: any) =>
      Array.isArray(arr) && arr.includes(val)
    );

    // New helpers for sophisticated templates
    handlebars.registerHelper('lowerCase', (str: string) =>
      str ? str.toLowerCase() : ''
    );
    handlebars.registerHelper('upperCase', (str: string) =>
      str ? str.toUpperCase() : ''
    );
    handlebars.registerHelper('pascalCase', (str: string) => {
      if (!str) return '';
      return str.replace(/(?:^|[-_])([a-z])/g, (_, char) => char.toUpperCase());
    });
    handlebars.registerHelper('packageToPath', (packageName: string) => {
      if (!packageName) return '';
      return packageName.replace(/\./g, '/');
    });
    handlebars.registerHelper('escapeXml', (str: string) => {
      if (!str) return '';
      return str.replace(/[<>&'"]/g, (char) => {
        const entities: Record<string, string> = {
          '<': '&lt;',
          '>': '&gt;',
          '&': '&amp;',
          "'": '&apos;',
          '"': '&quot;'
        };
        return entities[char] || char;
      });
    });
    handlebars.registerHelper('json', (obj: any) => JSON.stringify(obj, null, 2));
    handlebars.registerHelper('join', (arr: string[], separator: string = ', ') =>
      Array.isArray(arr) ? arr.join(separator) : ''
    );
    handlebars.registerHelper('ternary', (condition: any, trueVal: any, falseVal: any) =>
      condition ? trueVal : falseVal
    );
  }

  /**
   * Find template pack by configuration combination
   */
  private getTemplatePackKey(config: ProjectConfig): string {
    const { testingType, framework, language, testingPattern, testRunner, buildTool } = config;
    return `${testingType}-${language}-${framework}-${testRunner}-${buildTool}`;
  }

  /**
   * Load template pack manifest (with caching)
   */
  private async loadManifest(packKey: string): Promise<TemplatePackManifest> {
    // Check cache first
    if (isCacheEnabled()) {
      const cached = getCachedManifest<TemplatePackManifest>(packKey);
      if (cached) {
        return cached;
      }
    }

    const manifestPath = path.join(this.packsDirectory, packKey, 'manifest.json');

    try {
      const manifestContent = await fs.readFile(manifestPath, 'utf-8');
      const manifest = JSON.parse(manifestContent) as TemplatePackManifest;

      // Cache the manifest
      if (isCacheEnabled()) {
        setCachedManifest(packKey, manifest);
      }

      return manifest;
    } catch (error) {
      throw new Error(`Failed to load template pack manifest: ${packKey}. Error: ${error}`);
    }
  }

  /**
   * Load template file content
   */
  private async loadTemplateFile(packKey: string, filePath: string, isTemplate: boolean = false): Promise<string> {
    // For template files, append .hbs extension to the file path
    const actualFilePath = isTemplate ? `${filePath}.hbs` : filePath;
    const fullPath = path.join(this.packsDirectory, packKey, 'files', actualFilePath);

    try {
      return await fs.readFile(fullPath, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to load template file: ${filePath} in pack ${packKey}. Error: ${error}`);
    }
  }

  /**
   * Create template context with computed fields
   */
  private createTemplateContext(config: ProjectConfig, toolVersions: Record<string, string>): TemplateContext {
    // Safe path sanitization
    const sanitizePath = (input: string): string => {
      return input
        .replace(/\.\./g, '') // Remove .. sequences
        .replace(/^\/+/, '') // Remove leading slashes
        .replace(/[^a-zA-Z0-9._/-]/g, '_'); // Replace unsafe characters
    };

    const groupId = config.groupId || 'com.example';
    const artifactId = config.artifactId || config.projectName.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-');

    return {
      ...config,
      javaPackage: groupId,
      packagePath: sanitizePath(groupId.replace(/\./g, '/')),
      safeArtifactId: sanitizePath(artifactId),
      safeGroupId: sanitizePath(groupId),
      envs: ['dev', 'qa', 'prod'],
      toolVersions,
      timestamp: new Date().toISOString().replace(/[:.]/g, '-')
    };
  }

  /**
   * Process template content with Handlebars (with caching for compiled templates)
   */
  private processTemplate(content: string, context: TemplateContext, filePath: string): string {
    try {
      // Generate cache key based on content hash
      const cacheKey = `${filePath}:${content.length}:${content.substring(0, 100)}`;

      // Handle CI/CD workflow files with special expression masking
      const isWorkflowFile = filePath.includes('Jenkinsfile') ||
        filePath.includes('.github/workflows/') ||
        filePath.includes('azure-pipelines.yml') ||
        filePath.includes('.gitlab-ci.yml') ||
        filePath.includes('.circleci/config.yml');

      let processedContent = content;


      const rawBlocks: string[] = [];
      const hasRawBlocks = processedContent.includes('{{raw}}') || processedContent.includes('{{{{raw}}}}');

      if (hasRawBlocks) {
        // Handle {{{{raw}}}}...{{{{/raw}}}} format (4 braces - Handlebars native raw blocks)
        processedContent = processedContent.replace(/\{\{\{\{raw\}\}\}\}([\s\S]*?)\{\{\{\{\/raw\}\}\}\}/g, (match, content) => {
          const placeholder = `%%RAW_BLOCK_${rawBlocks.length}%%`;
          rawBlocks.push(content);
          return placeholder;
        });
        // Handle {{raw}}...{{/raw}} format (2 braces - custom raw blocks)
        processedContent = processedContent.replace(/\{\{raw\}\}([\s\S]*?)\{\{\/raw\}\}/g, (match, content) => {
          const placeholder = `%%RAW_BLOCK_${rawBlocks.length}%%`;
          rawBlocks.push(content);
          return placeholder;
        });
      }

      if (isWorkflowFile) {
        // Mask CI/CD expressions before Handlebars compilation
        const JENKINS_OPEN = '%%JENKINS_OPEN%%';
        const JENKINS_CLOSE = '%%JENKINS_CLOSE%%';
        const GHA_OPEN = '%%GHA_OPEN%%';
        const GHA_CLOSE = '%%GHA_CLOSE%%';

        processedContent = processedContent
          // Mask Jenkins ${...} expressions
          .replace(/\$\{([^}]+)\}/g, `${JENKINS_OPEN}$1${JENKINS_CLOSE}`)
          // Mask GitHub Actions ${{...}} expressions
          .replace(/\$\{\{([^}]+)\}\}/g, `${GHA_OPEN}$1${GHA_CLOSE}`);

        // CircleCI-specific masking (in addition to raw block extraction)
        if (filePath.includes('.circleci/config.yml')) {
          // Mask CircleCI's << parameters.* >>
          processedContent = processedContent
            .replace(/<<\s*parameters\.([a-zA-Z0-9_]+)\s*>>/g, '%%CIRCLECI_PARAM_OPEN%% parameters.$1 %%CIRCLECI_PARAM_CLOSE%%');
        }
      }

      // Now Handlebars can compile without seeing raw blocks
      const template = handlebars.compile(processedContent);
      let result = template(context);

      // Restore raw blocks AFTER Handlebars rendering (if any were extracted)
      if (hasRawBlocks) {
        result = result.replace(/%%RAW_BLOCK_(\d+)%%/g, (match, index) => {
          return rawBlocks[parseInt(index)];
        });
      }

      // Restore CI/CD expressions after rendering
      if (isWorkflowFile) {
        result = result
          .replace(/%%CIRCLECI_OPEN%%/g, '{{')
          .replace(/%%CIRCLECI_CLOSE%%/g, '}}')
          .replace(/%%CIRCLECI_PARAM_OPEN%%/g, '<<')
          .replace(/%%CIRCLECI_PARAM_CLOSE%%/g, '>>')
          .replace(/%%JENKINS_OPEN%%/g, '${')
          .replace(/%%JENKINS_CLOSE%%/g, '}')
          .replace(/%%GHA_OPEN%%/g, '${{')
          .replace(/%%GHA_CLOSE%%/g, '}}');
      }

      return result;
    } catch (error) {
      throw new Error(`Template processing failed for ${filePath}: ${error}`);
    }
  }

  /**
   * Process template file path
   */
  private processTemplatePath(filePath: string, context: TemplateContext): string {
    try {
      const template = handlebars.compile(filePath);
      return template(context);
    } catch (error) {
      throw new Error(`Template path processing failed for ${filePath}: ${error}`);
    }
  }

  /**
   * Check if a file is a sample/example test file
   */
  private isSampleTestFile(filePath: string): boolean {
    const lowerPath = filePath.toLowerCase();
    const fileName = filePath.split('/').pop()?.toLowerCase() || '';

    // Exclude essential test infrastructure files (NOT sample tests)
    const isInfrastructure =
      fileName === 'conftest.py.hbs' ||
      fileName === 'setup.js.hbs' ||
      fileName === 'setup.ts.hbs' ||
      fileName === 'basetest.cs.hbs' ||
      fileName === 'hooks.java.hbs' ||
      fileName === 'hooks.cs.hbs' ||
      fileName === 'basescreen.swift.hbs' ||
      fileName === 'testdata.swift.hbs' ||
      fileName.startsWith('base') ||
      fileName.includes('testdata.');

    if (isInfrastructure) {
      return false;
    }

    // Check if file is in a test directory
    const isInTestDirectory =
      lowerPath.includes('/tests/') ||
      lowerPath.includes('/test/') ||
      lowerPath.includes('/src/test/') ||
      lowerPath.includes('/androidtest/') ||      // Android Espresso
      lowerPath.includes('/uitests/') ||           // Swift XCUITest
      lowerPath.includes('/features/') ||          // BDD feature files
      lowerPath.includes('/step_defs/') ||         // Python BDD steps
      lowerPath.includes('/step-definitions/') ||  // TypeScript BDD steps
      lowerPath.includes('/stepdefinitions/') ||   // Java BDD steps
      lowerPath.includes('/steps/') ||             // Generic BDD steps
      lowerPath.includes('/bdd/') ||               // BDD directory
      lowerPath.includes('/cypress/e2e/') ||       // Cypress E2E tests
      lowerPath.includes('/cypress/integration/') || // Cypress integration (old)
      lowerPath.match(/\/tests\//i) ||
      lowerPath.match(/\/test\//i) ||
      lowerPath.match(/\/androidtest\//i) ||
      lowerPath.match(/\/uitests\//i) ||
      lowerPath.match(/\/features\//i) ||
      lowerPath.match(/\/step_defs\//i) ||
      lowerPath.match(/\/step-definitions\//i) ||
      lowerPath.match(/\/stepdefinitions\//i) ||
      lowerPath.match(/\/steps\//i) ||
      lowerPath.match(/\/bdd\//i) ||
      lowerPath.match(/\/cypress\/e2e\//i) ||
      lowerPath.match(/\/cypress\/integration\//i);

    if (!isInTestDirectory) {
      return false;
    }

    // Check if it's a test file by extension and naming patterns
    const isTestFile =
      // Java test patterns
      fileName.endsWith('tests.java.hbs') ||
      fileName.endsWith('test.java.hbs') ||
      fileName.endsWith('steps.java.hbs') ||
      fileName.includes('testrunner.java.hbs') ||
      fileName.includes('suite.java.hbs') ||
      // Python test patterns
      fileName.startsWith('test_') ||
      fileName.endsWith('_test.py.hbs') ||
      // JavaScript/TypeScript test patterns
      fileName.endsWith('.test.js.hbs') ||
      fileName.endsWith('.test.ts.hbs') ||
      fileName.endsWith('.spec.js.hbs') ||
      fileName.endsWith('.spec.ts.hbs') ||
      fileName.endsWith('.steps.js.hbs') ||  // BDD step definitions
      fileName.endsWith('.steps.ts.hbs') ||  // BDD step definitions
      fileName.endsWith('_steps.js.hbs') ||  // Alternative BDD naming
      fileName.endsWith('_steps.ts.hbs') ||  // Alternative BDD naming
      fileName.endsWith('.cy.js.hbs') ||     // Cypress tests
      fileName.endsWith('.cy.ts.hbs') ||     // Cypress tests
      // C# test patterns
      fileName.endsWith('tests.cs.hbs') ||
      fileName.endsWith('test.cs.hbs') ||
      // Swift test patterns
      fileName.endsWith('test.swift.hbs') ||
      fileName.endsWith('uitest.swift.hbs') ||
      fileName.endsWith('tests.swift.hbs') ||
      // BDD feature files (Gherkin)
      fileName.endsWith('.feature.hbs') ||
      fileName.endsWith('.story.hbs');

    return isTestFile;
  }

  /**
   * Evaluate if a file should be included based on conditional rules
   */
  private shouldIncludeFile(fileConfig: TemplatePackFile, config: ProjectConfig): boolean {
    // Check if sample tests should be excluded
    if (config.includeSampleTests === false && this.isSampleTestFile(fileConfig.path)) {
      return false;
    }

    // If no conditional, always include
    if (!fileConfig.conditional) {
      return true;
    }

    // Evaluate each condition
    for (const [key, expectedValue] of Object.entries(fileConfig.conditional)) {
      // Handle nested keys like "utilities.logger"
      const keys = key.split('.');
      let actualValue: any = config;

      for (const k of keys) {
        actualValue = actualValue?.[k];
      }

      // Check if actual value matches expected value
      if (actualValue !== expectedValue) {
        return false;
      }
    }

    return true;
  }

  /**
   * Generate project using template pack (Array version)
   */
  async generateProject(config: ProjectConfig, options: { strict?: boolean } = { strict: true }): Promise<TemplateFile[]> {
    const files: TemplateFile[] = [];
    for await (const file of this.generateProjectStream(config, options)) {
      files.push(file);
    }
    return files;
  }

  /**
   * Generate project using template pack (Streaming version)
   * Yields files one by one to avoid memory pressure
   */
  async *generateProjectStream(config: ProjectConfig, options: { strict?: boolean } = { strict: true }): AsyncGenerator<TemplateFile> {
    const packKey = this.getTemplatePackKey(config);

    try {
      // Load manifest
      const manifest = await this.loadManifest(packKey);

      // Create template context
      const context = this.createTemplateContext(config, manifest.toolVersions);

      for (const fileConfig of manifest.files) {
        // Check if file should be included based on conditional rules
        if (!this.shouldIncludeFile(fileConfig, config)) {
          continue;
        }

        try {
          // Process file path
          const processedPath = this.processTemplatePath(fileConfig.path, context);

          // Load file content - try with conditional suffix first if file has conditionals
          let templateContent: string;
          try {
            templateContent = await this.loadTemplateFile(packKey, fileConfig.path, fileConfig.isTemplate);
          } catch (error) {
            // If file doesn't exist, skip it (allows for optional files)
            console.warn(`Template file not found: ${fileConfig.path}, skipping`);
            if (options.strict) {
              throw new Error(`Required template file not found: ${fileConfig.path}`);
            }
            continue;
          }

          // Process content if it's a template
          const processedContent = fileConfig.isTemplate
            ? this.processTemplate(templateContent, context, fileConfig.path)
            : templateContent;

          yield {
            path: processedPath,
            content: processedContent,
            isTemplate: fileConfig.isTemplate,
            mode: fileConfig.mode
          };

        } catch (fileError) {
          console.error(`Error processing file ${fileConfig.path}:`, fileError);

          if (options.strict) {
            throw fileError;
          }
          // Continue with other files instead of failing completely (Legacy non-strict mode)
          continue;
        }
      }

    } catch (error) {
      console.error(`Template pack generation failed for ${packKey}:`, error);
      throw error;
    }
  }

  /**
   * Check if template pack exists for configuration
   */
  async hasTemplatePack(config: ProjectConfig): Promise<boolean> {
    const packKey = this.getTemplatePackKey(config);
    const manifestPath = path.join(this.packsDirectory, packKey, 'manifest.json');

    try {
      await fs.access(manifestPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get dependencies from template pack manifest, filtered by user selections
   */
  async getDependencies(config: ProjectConfig): Promise<Record<string, string>> {
    const packKey = this.getTemplatePackKey(config);

    try {
      const manifest = await this.loadManifest(packKey);
      const allDependencies = manifest.toolVersions || {};

      // Filter dependencies based on user selections
      const filteredDependencies: Record<string, string> = {};

      // Core dependencies that are always included based on the template
      const coreDependencies = [
        config.language.toLowerCase(),           // java, python, javascript, typescript
        config.framework.toLowerCase(),          // playwright, selenium, cypress, etc.
        config.testRunner?.toLowerCase(),        // testng, junit5, pytest, jest, etc.
        config.buildTool?.toLowerCase(),         // maven, gradle, npm, pip, etc.
      ];

      // Add core dependencies
      for (const [key, version] of Object.entries(allDependencies)) {
        const keyLower = key.toLowerCase();

        // Always include core dependencies
        if (coreDependencies.some(core => core && keyLower.includes(core.replace('-', '')))) {
          filteredDependencies[key] = version as string;
          continue;
        }

        // Include logging dependencies (always needed)
        if (keyLower.includes('log4j') || keyLower.includes('logging') || keyLower.includes('winston')) {
          filteredDependencies[key] = version as string;
          continue;
        }
      }

      // Add reporting tool dependency if selected
      if (config.reportingTool) {
        const reportingToolLower = config.reportingTool.toLowerCase().replace('-', '');
        for (const [key, version] of Object.entries(allDependencies)) {
          const keyLower = key.toLowerCase().replace('-', '');
          if (keyLower.includes(reportingToolLower) ||
            (config.reportingTool === 'extent-reports' && keyLower.includes('extent')) ||
            (config.reportingTool === 'allure' && keyLower.includes('allure'))) {
            filteredDependencies[key] = version as string;
          }
        }
      }

      // Add BDD/Cucumber dependency if BDD pattern is selected
      if (config.testingPattern === 'bdd') {
        for (const [key, version] of Object.entries(allDependencies)) {
          const keyLower = key.toLowerCase();
          if (keyLower.includes('cucumber') || keyLower.includes('behave') || keyLower.includes('gherkin')) {
            filteredDependencies[key] = version as string;
          }
        }
      }

      // Add mobile-specific dependencies for mobile testing
      if (config.testingType === 'mobile') {
        for (const [key, version] of Object.entries(allDependencies)) {
          const keyLower = key.toLowerCase();
          if (keyLower.includes('appium') || keyLower.includes('espresso') || keyLower.includes('xcuitest')) {
            filteredDependencies[key] = version as string;
          }
        }
      }

      // Add API-specific dependencies for API testing
      if (config.testingType === 'api') {
        for (const [key, version] of Object.entries(allDependencies)) {
          const keyLower = key.toLowerCase();
          if (keyLower.includes('rest') || keyLower.includes('request') || keyLower.includes('supertest') ||
            keyLower.includes('jackson') || keyLower.includes('gson')) {
            filteredDependencies[key] = version as string;
          }
        }
      }

      return filteredDependencies;
    } catch (error) {
      console.error(`Failed to load dependencies for ${packKey}:`, error);
      return {};
    }
  }

  /**
   * Get available template packs
   */
  async getAvailableTemplatePacks(): Promise<string[]> {
    try {
      const entries = await fs.readdir(this.packsDirectory, { withFileTypes: true });
      const packDirs = entries
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name);

      // Filter only directories that have a valid manifest
      const validPacks: string[] = [];
      for (const packDir of packDirs) {
        try {
          await this.loadManifest(packDir);
          validPacks.push(packDir);
        } catch {
          // Skip invalid packs
        }
      }

      return validPacks;
    } catch {
      return [];
    }
  }
}