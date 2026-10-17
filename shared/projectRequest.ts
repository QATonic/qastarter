import { z } from 'zod';
import { defaultUtilities, projectConfigSchema } from './schema';
import { WizardValidator } from './validationMatrix';

const utilityAliases: Record<string, string> = {
  screenshot: 'screenshotUtility',
  logging: 'logger',
  dataDriver: 'dataProvider',
};

/** One input contract for GET generation, POST requests and CLI/MCP callers. */
export const projectRequestSchema = z.preprocess((input) => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return input;
  const config = { ...input } as Record<string, unknown>;
  if (config.testingPattern === 'pom') config.testingPattern = 'page-object-model';
  if (typeof config.framework === 'string' && typeof config.language === 'string') {
    if (config.testRunner === undefined) {
      config.testRunner = WizardValidator.getAvailableTestRunnersForFramework(
        config.framework,
        config.language
      )[0];
    }
    if (config.buildTool === undefined) {
      config.buildTool = WizardValidator.getAvailableBuildToolsForFramework(
        config.framework,
        config.language
      )[0];
    }
    if (config.testingPattern === undefined) {
      config.testingPattern = WizardValidator.getAvailableTestingPatternsForFramework(
        config.framework,
        config.language
      )[0];
    }
  }
  if (config.includeSampleTests === 'true') config.includeSampleTests = true;
  if (config.includeSampleTests === 'false') config.includeSampleTests = false;
  const utilities =
    typeof config.utilities === 'string'
      ? config.utilities
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean)
      : config.utilities;
  if (Array.isArray(utilities) && utilities.every((value) => typeof value === 'string')) {
    const names = utilities.map((value) =>
      Object.hasOwn(utilityAliases, value) ? utilityAliases[value] : value
    );
    if (names.every((name) => Object.hasOwn(defaultUtilities, name))) {
      config.utilities = Object.fromEntries(names.map((name) => [name, true]));
    }
  }
  return config;
}, projectConfigSchema);

export const configValidationResultSchema = z.object({
  valid: z.boolean(),
  errors: z.array(z.object({ field: z.string(), message: z.string() })).optional(),
});

export type ConfigValidationResult = z.infer<typeof configValidationResultSchema>;
