import handlebars from 'handlebars';
import { ProjectConfig } from '@shared/schema';
import { TemplatePackEngine } from './templatePackEngine';

export interface TemplateFile {
  path: string;
  content: string;
  isTemplate: boolean;
  mode?: string;
}

export class ProjectTemplateGenerator {
  private templatePackEngine: TemplatePackEngine;

  constructor(packsDirectory?: string) {
    this.templatePackEngine = new TemplatePackEngine(packsDirectory);

    // Register required Handlebars helpers for fallback
    handlebars.registerHelper('eq', (a: any, b: any) => a === b);
    handlebars.registerHelper('or', (...args: any[]) => {
      const opts = args.pop();
      return args.some(Boolean);
    });
    handlebars.registerHelper(
      'includes',
      (arr: any[], val: any) => Array.isArray(arr) && arr.includes(val)
    );
  }

  public async generateProject(config: ProjectConfig): Promise<TemplateFile[]> {
    // Try to use sophisticated template pack first
    const hasTemplatePack = await this.templatePackEngine.hasTemplatePack(config);

    if (hasTemplatePack) {
      console.log('Using sophisticated template pack for:', {
        testingType: config.testingType,
        language: config.language,
        framework: config.framework,
        testRunner: config.testRunner,
        buildTool: config.buildTool,
      });
      // Use strict mode by default
      return await this.templatePackEngine.generateProject(config, { strict: true });
    } else {
      console.error('Template pack not found for configuration:', config);
      throw new Error(
        `No template pack found for configuration: ${config.testingType}/${config.language}/${config.framework}. Please verify your selection.`
      );
    }
  }

  public async *generateProjectStream(config: ProjectConfig): AsyncGenerator<TemplateFile> {
    const hasTemplatePack = await this.templatePackEngine.hasTemplatePack(config);
    if (hasTemplatePack) {
      yield* this.templatePackEngine.generateProjectStream(config, { strict: true });
    } else {
      throw new Error(
        `No template pack found for configuration: ${config.testingType}/${config.language}/${config.framework}.`
      );
    }
  }

  public async getDependencies(config: ProjectConfig): Promise<Record<string, string>> {
    // Try to get dependencies from template pack manifest
    const hasTemplatePack = await this.templatePackEngine.hasTemplatePack(config);

    if (hasTemplatePack) {
      return await this.templatePackEngine.getDependencies(config);
    } else {
      console.error('Template pack not found for dependencies:', config);
      return {};
    }
  }

}
