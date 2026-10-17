import { access } from 'node:fs/promises';
import path from 'node:path';
import { projectRequestSchema } from '@shared/projectRequest';
import type { ProjectConfig } from '@shared/schema';
import { WizardValidator } from '@shared/validationMatrix';
import { sanitizeArtifactId, sanitizeGroupId, sanitizeProjectName } from '@shared/sanitize';
import { IncompatibleCombinationError, ValidationError } from '../errors';

export async function parseProjectConfiguration(
  input: unknown,
  requestId?: string
): Promise<ProjectConfig> {
  const result = projectRequestSchema.safeParse(input);
  if (!result.success) {
    throw new ValidationError(
      'Invalid project configuration',
      result.error.errors.map((error) => ({
        field: error.path.join('.'),
        message: error.message,
      })),
      requestId
    );
  }
  const config = result.data;
  if (!WizardValidator.isCompatible(config.testingType, config.framework, config.language)) {
    throw new IncompatibleCombinationError(
      config.testingType,
      config.framework,
      config.language,
      requestId
    );
  }
  const errors: Array<{ field: string; message: string }> = [];
  const choices: Array<[string, string | undefined, string[]]> = [
    [
      'testRunner',
      config.testRunner,
      WizardValidator.getAvailableTestRunnersForFramework(config.framework, config.language),
    ],
    [
      'buildTool',
      config.buildTool,
      WizardValidator.getAvailableBuildToolsForFramework(config.framework, config.language),
    ],
    [
      'testingPattern',
      config.testingPattern,
      WizardValidator.getAvailableTestingPatternsForFramework(config.framework, config.language),
    ],
    ['cicdTool', config.cicdTool, WizardValidator.getAvailableCicdTools(config.framework)],
    [
      'reportingTool',
      config.reportingTool,
      WizardValidator.getAvailableReportingToolsForFramework(config.framework, config.language),
    ],
  ];
  for (const [field, value, options] of choices) {
    if (value && value !== 'none' && !options.includes(value))
      errors.push({ field, message: `Unsupported ${field}: ${value}` });
  }
  if (errors.length) throw new ValidationError('Unsupported project options', errors, requestId);
  const pack = WizardValidator.getTemplatePackName(
    config.testingType,
    config.framework,
    config.language,
    config.testRunner,
    config.buildTool
  );
  try {
    await access(path.join(process.cwd(), 'server', 'templates', 'packs', pack, 'manifest.json'));
  } catch {
    throw new ValidationError(
      'No template pack exists for this configuration',
      [{ field: 'combination', message: pack }],
      requestId
    );
  }
  config.projectName = sanitizeProjectName(config.projectName);
  if (config.groupId) config.groupId = sanitizeGroupId(config.groupId);
  if (config.artifactId) config.artifactId = sanitizeArtifactId(config.artifactId);
  return config;
}
