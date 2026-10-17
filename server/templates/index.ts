import { ProjectConfig } from '@shared/schema';
import { TemplatePackEngine } from './templatePackEngine';
import { logger } from '../utils/logger';
import type { TemplateFile } from './types';
import { parseOpenApiFromUrl } from '../services/openApiService';
import { ValidationError } from '../errors';

// Re-export TemplateFile type for backward compatibility
export type { TemplateFile } from './types';

export class ProjectTemplateGenerator {
  private templatePackEngine: TemplatePackEngine;

  constructor(packsDirectory?: string) {
    this.templatePackEngine = new TemplatePackEngine(packsDirectory);
  }

  public async generateProject(config: ProjectConfig): Promise<TemplateFile[]> {
    const files: TemplateFile[] = [];
    for await (const file of this.generateProjectStream(config)) files.push(file);
    return files;
  }

  public async *generateProjectStream(
    config: ProjectConfig,
    options?: {
      strict?: boolean;
      openApiEndpoints?: import('@shared/openApiTypes').OpenApiEndpoint[];
    }
  ): AsyncGenerator<TemplateFile> {
    const hasTemplatePack = await this.templatePackEngine.hasTemplatePack(config);
    if (hasTemplatePack) {
      let openApiEndpoints = options?.openApiEndpoints;
      if (config.testingType === 'api' && config.openApiSpecUrl && openApiEndpoints === undefined) {
        const parsed = await parseOpenApiFromUrl(config.openApiSpecUrl);
        if (parsed === null) {
          throw new ValidationError('Could not load the OpenAPI specification', [
            {
              field: 'openApiSpecUrl',
              message:
                'Provide a public HTTPS URL serving a valid standalone JSON or YAML specification. Bundle external references first.',
            },
          ]);
        }
        openApiEndpoints = parsed;
      }
      yield* this.templatePackEngine.generateProjectStream(config, {
        strict: true,
        ...options,
        openApiEndpoints,
      });
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
      logger.warn('Template pack not found for dependencies', { config });
      return {};
    }
  }
}
