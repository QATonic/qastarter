import fs from 'fs-extra';
import path from 'path';
import handlebars from 'handlebars';
import { config } from '@/utils/config.js';
import { logger } from '@/utils/logger.js';
import { ProjectConfiguration, Template, TemplateFile } from '@/types/index.js';

/**
 * Template Service - Handles template loading and processing
 */
export class TemplateService {
  private templatesCache: Map<string, Template> = new Map();

  /**
   * Get template based on project configuration
   */
  async getTemplate(configuration: ProjectConfiguration): Promise<Template> {
    const templateId = this.getTemplateId(configuration);
    
    // Check cache first
    if (this.templatesCache.has(templateId)) {
      return this.templatesCache.get(templateId)!;
    }

    // Load template from filesystem
    const template = await this.loadTemplate(templateId);
    this.templatesCache.set(templateId, template);
    
    return template;
  }

  /**
   * Determine template ID based on configuration
   */
  private getTemplateId(configuration: ProjectConfiguration): string {
    const { tool, language, testRunner } = configuration;
    
    // Map to specific template directories
    const templateMappings: Record<string, string> = {
      'Selenium-Java-JUnit': 'java-selenium-junit',
      'Selenium-Java-TestNG': 'java-selenium-testng',
      'Selenium-Python-Pytest': 'python-selenium-pytest',
      'Playwright-JavaScript-Jest': 'javascript-playwright-jest',
      'Playwright-TypeScript-Jest': 'typescript-playwright-jest',
      'Cypress-JavaScript-Cypress': 'javascript-cypress',
      'Cypress-TypeScript-Cypress': 'typescript-cypress',
      'RestAssured-Java-JUnit': 'java-restassured-junit',
      'RestAssured-Java-TestNG': 'java-restassured-testng',
      'Requests-Python-Pytest': 'python-requests-pytest',
      'Appium-Java-JUnit': 'java-appium-junit',
      'Appium-Java-TestNG': 'java-appium-testng',
      'XCUITest-Swift-XCTest': 'swift-xcuitest',
      'Espresso-Java-Espresso': 'java-espresso',
      'Espresso-Kotlin-Espresso': 'kotlin-espresso'
    };

    const key = `${tool}-${language}-${testRunner}`;
    return templateMappings[key] || 'java-selenium-junit'; // Default fallback
  }

  /**
   * Load template metadata and files
   */
  private async loadTemplate(templateId: string): Promise<Template> {
    const templateDir = path.join(config.TEMPLATES_DIR, templateId);
    
    if (!await fs.pathExists(templateDir)) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Load template.json metadata
    const metadataPath = path.join(templateDir, 'template.json');
    if (!await fs.pathExists(metadataPath)) {
      throw new Error(`Template metadata not found: ${templateId}/template.json`);
    }

    const metadata = await fs.readJson(metadataPath);
    
    // Load all template files
    const files = await this.loadTemplateFiles(templateDir);

    const template: Template = {
      id: templateId,
      name: metadata.name,
      description: metadata.description,
      framework: metadata.framework,
      language: metadata.language,
      version: metadata.version,
      path: templateDir,
      files,
      dependencies: metadata.dependencies || [],
      configurations: metadata.configurations || [],
      tags: metadata.tags || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    logger.info(`Loaded template: ${templateId}`, { fileCount: files.length });
    return template;
  }

  /**
   * Recursively load all template files
   */
  private async loadTemplateFiles(templateDir: string, relativePath: string = ''): Promise<TemplateFile[]> {
    const files: TemplateFile[] = [];
    const currentDir = path.join(templateDir, relativePath);
    
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      // Skip template.json metadata file
      if (entry.name === 'template.json') {
        continue;
      }

      const entryPath = path.join(relativePath, entry.name);
      
      if (entry.isDirectory()) {
        // Add directory entry
        files.push({
          path: entryPath,
          name: entry.name,
          type: 'directory',
          template: '',
          conditions: []
        });
        
        // Recursively load subdirectory files
        const subFiles = await this.loadTemplateFiles(templateDir, entryPath);
        files.push(...subFiles);
      } else {
        // Load file content as template
        const filePath = path.join(templateDir, entryPath);
        const content = await fs.readFile(filePath, 'utf-8');
        
        files.push({
          path: entryPath,
          name: entry.name,
          type: 'file',
          template: content,
          conditions: []
        });
      }
    }
    
    return files;
  }

  /**
   * Generate project files from template
   */
  async generateFiles(
    template: Template,
    configuration: ProjectConfiguration,
    outputDir: string
  ): Promise<void> {
    logger.info(`Generating files for template: ${template.id}`, { outputDir });

    // Prepare template context
    const context = this.prepareTemplateContext(configuration);
    
    // Process each template file
    for (const templateFile of template.files) {
      await this.processTemplateFile(templateFile, context, outputDir);
    }

    logger.info(`Generated ${template.files.length} files`, { template: template.id });
  }

  /**
   * Prepare Handlebars context from configuration
   */
  private prepareTemplateContext(configuration: ProjectConfiguration): any {
    const context: any = {
      ...configuration,
      // Helper functions for templates
      helpers: {
        includes: (array: string[], value: string) => array.includes(value),
        eq: (a: any, b: any) => a === b,
        ne: (a: any, b: any) => a !== b,
        and: (a: any, b: any) => a && b,
        or: (a: any, b: any) => a || b
      }
    };

    // Add package path for Java templates
    if (configuration.language === 'Java' && configuration.config.packageName) {
      context.packagePath = configuration.config.packageName.replace(/\./g, '/');
    }

    // Add formatted project name variations
    context.projectNameCamel = this.toCamelCase(configuration.config.projectName);
    context.projectNamePascal = this.toPascalCase(configuration.config.projectName);
    context.projectNameKebab = this.toKebabCase(configuration.config.projectName);
    context.projectNameSnake = this.toSnakeCase(configuration.config.projectName);

    return context;
  }

  /**
   * Process individual template file
   */
  private async processTemplateFile(
    templateFile: TemplateFile,
    context: any,
    outputDir: string
  ): Promise<void> {
    if (templateFile.type === 'directory') {
      // Create directory
      const dirPath = path.join(outputDir, this.processPath(templateFile.path, context));
      await fs.ensureDir(dirPath);
      return;
    }

    // Process file path and content with Handlebars
    const processedPath = this.processPath(templateFile.path, context);
    const outputPath = path.join(outputDir, processedPath);

    // Ensure output directory exists
    await fs.ensureDir(path.dirname(outputPath));

    // Process template content
    try {
      const compiledTemplate = handlebars.compile(templateFile.template);
      const processedContent = compiledTemplate(context);
      
      await fs.writeFile(outputPath, processedContent, 'utf-8');
      logger.debug(`Generated file: ${processedPath}`);
    } catch (error) {
      logger.error(`Failed to process template file: ${templateFile.path}`, { error });
      throw error;
    }
  }

  /**
   * Process file/directory path with Handlebars
   */
  private processPath(templatePath: string, context: any): string {
    try {
      const compiledPath = handlebars.compile(templatePath);
      return compiledPath(context);
    } catch (error) {
      // If path processing fails, return original path
      logger.warn(`Failed to process path: ${templatePath}`, { error });
      return templatePath;
    }
  }

  /**
   * String transformation utilities
   */
  private toCamelCase(str: string): string {
    return str.replace(/[-_\s]+(.)/g, (_, char) => char.toUpperCase())
              .replace(/^(.)/, char => char.toLowerCase());
  }

  private toPascalCase(str: string): string {
    return str.replace(/[-_\s]+(.)/g, (_, char) => char.toUpperCase())
              .replace(/^(.)/, char => char.toUpperCase());
  }

  private toKebabCase(str: string): string {
    return str.replace(/[_\s]+/g, '-')
              .replace(/([a-z])([A-Z])/g, '$1-$2')
              .toLowerCase();
  }

  private toSnakeCase(str: string): string {
    return str.replace(/[-\s]+/g, '_')
              .replace(/([a-z])([A-Z])/g, '$1_$2')
              .toLowerCase();
  }

  /**
   * Clear template cache
   */
  clearCache(): void {
    this.templatesCache.clear();
    logger.info('Template cache cleared');
  }
}

// Export singleton instance
export const templateService = new TemplateService(); 