import handlebars from 'handlebars';
import { promises as fs } from 'fs';
import path from 'path';
import { ProjectConfig } from '@shared/schema';
import { TemplatePackManifest, TemplateContext, TemplatePackFile, TemplateFile } from './types';
import { fileURLToPath } from 'url';
import {
  getCachedManifest,
  setCachedManifest,
  getCachedTemplate,
  setCachedTemplate,
  isCacheEnabled,
  getCacheStats,
} from '../services/cacheService';
import { loadSharedVersions, mergeVersions } from './shared/versionLoader';
import { logger } from '../utils/logger';
import { isSampleTestFile as checkSampleTestFile } from './sampleTestPatterns';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Re-export TemplateFile type for backward compatibility
export type { TemplateFile } from './types';

export class TemplatePackEngine {
  private packsDirectory: string;
  private hb: typeof handlebars;

  constructor(packsDirectory: string = path.join(__dirname, 'packs')) {
    this.packsDirectory = packsDirectory;
    // Use isolated Handlebars instance for security (Defense in Depth)
    this.hb = handlebars.create();
    // Disable dynamic partials as they are not used and pose a security risk
    this.hb.registerPartial = () => { };
    this.registerHelpers();
  }

  private registerHelpers() {
    // Existing helpers
    this.hb.registerHelper('eq', (a: any, b: any) => a === b);
    this.hb.registerHelper('or', (...args: any[]) => {
      const opts = args.pop();
      return args.some(Boolean);
    });
    this.hb.registerHelper(
      'includes',
      (arr: any[], val: any) => Array.isArray(arr) && arr.includes(val)
    );

    // New helpers for sophisticated templates
    this.hb.registerHelper('lowerCase', (str: string) => (str ? str.toLowerCase() : ''));
    this.hb.registerHelper('upperCase', (str: string) => (str ? str.toUpperCase() : ''));
    this.hb.registerHelper('pascalCase', (str: string) => {
      if (!str) return '';
      return str.replace(/(?:^|[-_])([a-z])/g, (_, char) => char.toUpperCase());
    });
    this.hb.registerHelper('packageToPath', (packageName: string) => {
      if (!packageName) return '';
      return packageName.replace(/\./g, '/');
    });
    this.hb.registerHelper('escapeXml', (str: string) => {
      if (!str) return '';
      return str.replace(/[<>&'"]/g, (char) => {
        const entities: Record<string, string> = {
          '<': '&lt;',
          '>': '&gt;',
          '&': '&amp;',
          "'": '&apos;',
          '"': '&quot;',
        };
        return entities[char] || char;
      });
    });
    this.hb.registerHelper('json', (obj: any) => JSON.stringify(obj, null, 2));
    this.hb.registerHelper('join', (arr: string[], separator: string = ', ') =>
      Array.isArray(arr) ? arr.join(separator) : ''
    );
    this.hb.registerHelper('ternary', (condition: any, trueVal: any, falseVal: any) =>
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
   * Merges manifest-specific versions with shared versions from versions.json
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

      // Load shared versions and merge with manifest-specific versions
      const sharedVersions = await loadSharedVersions();
      manifest.toolVersions = mergeVersions(manifest.toolVersions || {}, sharedVersions);

      // Cache the manifest (with merged versions)
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
  private async loadTemplateFile(
    packKey: string,
    filePath: string,
    isTemplate: boolean = false
  ): Promise<string> {
    // For template files, append .hbs extension to the file path
    const actualFilePath = isTemplate ? `${filePath}.hbs` : filePath;
    const fullPath = path.join(this.packsDirectory, packKey, 'files', actualFilePath);

    try {
      return await fs.readFile(fullPath, 'utf-8');
    } catch (error) {
      throw new Error(
        `Failed to load template file: ${filePath} in pack ${packKey}. Error: ${error}`
      );
    }
  }

  /**
   * Create template context with computed fields
   */
  private createTemplateContext(
    config: ProjectConfig,
    toolVersions: Record<string, string>
  ): TemplateContext {
    // Safe path sanitization
    const sanitizePath = (input: string): string => {
      return input
        .replace(/\.\./g, '') // Remove .. sequences
        .replace(/^\/+/, '') // Remove leading slashes
        .replace(/[^a-zA-Z0-9._/-]/g, '_'); // Replace unsafe characters
    };

    const groupId = config.groupId || 'com.example';
    const artifactId =
      config.artifactId || config.projectName.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-');

    // Create C# namespace from project name (e.g., "my-project" -> "MyProject")
    const projectNamespace = config.projectName
      .split(/[-_\s]+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');

    return {
      ...config,
      javaPackage: groupId,
      packageName: groupId, // Alias for templates using {{packageName}}
      packagePath: sanitizePath(groupId.replace(/\./g, '/')),
      // C# specific namespaces
      projectNamespace: projectNamespace,
      csharpNamespace: projectNamespace, // Alias for templates using {{csharpNamespace}}
      safeArtifactId: sanitizePath(artifactId),
      safeGroupId: sanitizePath(groupId),
      envs: ['dev', 'qa', 'prod'],
      toolVersions,
      timestamp: new Date().toISOString().replace(/[:.]/g, '-'),
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
      const isWorkflowFile =
        filePath.includes('Jenkinsfile') ||
        filePath.includes('.github/workflows/') ||
        filePath.includes('azure-pipelines.yml') ||
        filePath.includes('.gitlab-ci.yml') ||
        filePath.includes('.circleci/config.yml');

      let processedContent = content;

      const rawBlocks: string[] = [];
      const hasRawBlocks =
        processedContent.includes('{{raw}}') || processedContent.includes('{{{{raw}}}}');

      if (hasRawBlocks) {
        // Handle {{{{raw}}}}...{{{{/raw}}}} format (4 braces - Handlebars native raw blocks)
        processedContent = processedContent.replace(
          /\{\{\{\{raw\}\}\}\}([\s\S]*?)\{\{\{\{\/raw\}\}\}\}/g,
          (match, content) => {
            const placeholder = `%%RAW_BLOCK_${rawBlocks.length}%%`;
            rawBlocks.push(content);
            return placeholder;
          }
        );
        // Handle {{raw}}...{{/raw}} format (2 braces - custom raw blocks)
        processedContent = processedContent.replace(
          /\{\{raw\}\}([\s\S]*?)\{\{\/raw\}\}/g,
          (match, content) => {
            const placeholder = `%%RAW_BLOCK_${rawBlocks.length}%%`;
            rawBlocks.push(content);
            return placeholder;
          }
        );
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
          processedContent = processedContent.replace(
            /<<\s*parameters\.([a-zA-Z0-9_]+)\s*>>/g,
            '%%CIRCLECI_PARAM_OPEN%% parameters.$1 %%CIRCLECI_PARAM_CLOSE%%'
          );
        }
      }

      // Now Handlebars can compile without seeing raw blocks
      const template = this.hb.compile(processedContent);
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
      const template = this.hb.compile(filePath);
      return template(context);
    } catch (error) {
      throw new Error(`Template path processing failed for ${filePath}: ${error}`);
    }
  }

  /**
   * Check if a file is a sample/example test file
   * Uses centralized patterns from sampleTestPatterns.ts
   */
  private isSampleTestFile(filePath: string): boolean {
    return checkSampleTestFile(filePath);
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
  async generateProject(
    config: ProjectConfig,
    options: { strict?: boolean } = { strict: true }
  ): Promise<TemplateFile[]> {
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
  async *generateProjectStream(
    config: ProjectConfig,
    options: { strict?: boolean } = { strict: true }
  ): AsyncGenerator<TemplateFile> {
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
            templateContent = await this.loadTemplateFile(
              packKey,
              fileConfig.path,
              fileConfig.isTemplate
            );
          } catch (error) {
            // If file doesn't exist, skip it (allows for optional files)
            logger.warn(`Template file not found: ${fileConfig.path}, skipping`);
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
            mode: fileConfig.mode,
          };
        } catch (fileError) {
          logger.error(`Error processing file ${fileConfig.path}`, { error: fileError });

          if (options.strict) {
            throw fileError;
          }
          // Continue with other files instead of failing completely (Legacy non-strict mode)
          continue;
        }
      }
    } catch (error) {
      logger.error(`Template pack generation failed for ${packKey}`, { error });
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
        config.language.toLowerCase(), // java, python, javascript, typescript
        config.framework.toLowerCase(), // playwright, selenium, cypress, etc.
        config.testRunner?.toLowerCase(), // testng, junit5, pytest, jest, etc.
        config.buildTool?.toLowerCase(), // maven, gradle, npm, pip, etc.
      ];

      // Add core dependencies
      for (const [key, version] of Object.entries(allDependencies)) {
        const keyLower = key.toLowerCase();

        // Always include core dependencies
        if (coreDependencies.some((core) => core && keyLower.includes(core.replace('-', '')))) {
          filteredDependencies[key] = version as string;
          continue;
        }

        // Include logging dependencies based on language
        const isJava = config.language.toLowerCase() === 'java';
        const isJsTs =
          config.language.toLowerCase() === 'javascript' ||
          config.language.toLowerCase() === 'typescript';
        const isPython = config.language.toLowerCase() === 'python';
        const isCSharp = config.language.toLowerCase() === 'c#' || config.language.toLowerCase() === 'csharp';

        if (
          (isJava && (keyLower.includes('log4j') || keyLower.includes('slf4j') || keyLower.includes('logback'))) ||
          (isJsTs && (keyLower.includes('winston') || keyLower.includes('bunyan'))) ||
          (isPython && (keyLower.includes('pytest') || keyLower.includes('logging'))) ||
          (isCSharp && (keyLower.includes('serilog') || keyLower.includes('nlog')))
        ) {
          filteredDependencies[key] = version as string;
          continue;
        }
      }

      // Add reporting tool dependency if selected
      if (config.reportingTool) {
        const reportingToolLower = config.reportingTool.toLowerCase().replace('-', '');
        for (const [key, version] of Object.entries(allDependencies)) {
          const keyLower = key.toLowerCase().replace('-', '');
          if (
            keyLower.includes(reportingToolLower) ||
            (config.reportingTool === 'extent-reports' && keyLower.includes('extent')) ||
            (config.reportingTool === 'allure' && keyLower.includes('allure'))
          ) {
            filteredDependencies[key] = version as string;
          }
        }
      }

      // Add BDD/Cucumber dependency if BDD pattern is selected
      if (config.testingPattern === 'bdd') {
        const isJava = config.language.toLowerCase() === 'java';
        const isPython = config.language.toLowerCase() === 'python';
        const isJsTs =
          config.language.toLowerCase() === 'javascript' ||
          config.language.toLowerCase() === 'typescript';
        const isCSharp = config.language.toLowerCase() === 'c#' || config.language.toLowerCase() === 'csharp';

        for (const [key, version] of Object.entries(allDependencies)) {
          const keyLower = key.toLowerCase();

          if (isJava && (keyLower.includes('cucumber-java') || keyLower.includes('cucumber-testng') || keyLower.includes('cucumber-junit'))) {
            filteredDependencies[key] = version as string;
          } else if (isPython && (keyLower.includes('behave') || keyLower.includes('pytest-bdd'))) {
            filteredDependencies[key] = version as string;
          } else if (isJsTs && (keyLower.includes('cucumber') && !keyLower.includes('java'))) {
            // Avoid cucumber-java in JS
            filteredDependencies[key] = version as string;
          } else if (isCSharp && (keyLower.includes('specflow') || keyLower.includes('reqnroll'))) {
            filteredDependencies[key] = version as string;
          }
        }
      }

      // Add mobile-specific dependencies for mobile testing
      if (config.testingType === 'mobile') {
        const isJava = config.language.toLowerCase() === 'java';
        const isPython = config.language.toLowerCase() === 'python';
        const isJsTs =
          config.language.toLowerCase() === 'javascript' ||
          config.language.toLowerCase() === 'typescript';
        const isCSharp = config.language.toLowerCase() === 'c#' || config.language.toLowerCase() === 'csharp';
        const isSwift = config.language.toLowerCase() === 'swift';

        for (const [key, version] of Object.entries(allDependencies)) {
          const keyLower = key.toLowerCase();

          if (keyLower.includes('appium')) {
            // Appium client bindings are specific
            if (isJava && keyLower.includes('java')) filteredDependencies[key] = version as string;
            else if (isPython && keyLower.includes('python')) filteredDependencies[key] = version as string;
            else if (isCSharp && keyLower.includes('webdriver')) filteredDependencies[key] = version as string; // Appium.WebDriver
            else if (isJsTs && (keyLower.includes('webdriverio') || keyLower.includes('appium'))) filteredDependencies[key] = version as string; // JS usually uses webdriverio or blanket appium
          } else if (isJava && keyLower.includes('espresso')) {
            filteredDependencies[key] = version as string;
          } else if (isSwift && keyLower.includes('xcuitest')) {
            filteredDependencies[key] = version as string;
          }
        }
      }

      // Add API-specific dependencies for API testing
      if (config.testingType === 'api') {
        const isJava = config.language.toLowerCase() === 'java';
        const isPython = config.language.toLowerCase() === 'python';
        const isJsTs =
          config.language.toLowerCase() === 'javascript' ||
          config.language.toLowerCase() === 'typescript';

        for (const [key, version] of Object.entries(allDependencies)) {
          const keyLower = key.toLowerCase();

          if (isJava && (keyLower.includes('rest-assured') || keyLower.includes('gson') || keyLower.includes('jackson'))) {
            filteredDependencies[key] = version as string;
          } else if (isPython && (keyLower.includes('requests'))) {
            filteredDependencies[key] = version as string;
          } else if (isJsTs && (keyLower.includes('supertest') || keyLower.includes('axios'))) {
            filteredDependencies[key] = version as string;
          }
        }
      }

      return filteredDependencies;
    } catch (error) {
      logger.error(`Failed to load dependencies for ${packKey}`, { error });
      return {};
    }
  }

  /**
   * Get available template packs
   */
  async getAvailableTemplatePacks(): Promise<string[]> {
    try {
      const entries = await fs.readdir(this.packsDirectory, { withFileTypes: true });
      const packDirs = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);

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
