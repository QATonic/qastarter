import { z } from 'zod';
import { pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';

// Database schema for analytics
export const projectGenerations = pgTable('project_generations', {
  id: serial('id').primaryKey(),
  projectName: varchar('project_name', { length: 100 }).notNull(),
  testingType: varchar('testing_type', { length: 50 }).notNull(),
  framework: varchar('framework', { length: 50 }).notNull(),
  language: varchar('language', { length: 50 }).notNull(),
  testingPattern: varchar('testing_pattern', { length: 50 }).notNull(),
  testRunner: varchar('test_runner', { length: 50 }).notNull(),
  buildTool: varchar('build_tool', { length: 50 }).notNull(),
  cicdTool: varchar('cicd_tool', { length: 50 }),
  reportingTool: varchar('reporting_tool', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type ProjectGeneration = typeof projectGenerations.$inferSelect;
export const insertProjectGenerationSchema = createInsertSchema(projectGenerations).omit({
  id: true,
  createdAt: true,
});
export type InsertProjectGeneration = z.infer<typeof insertProjectGenerationSchema>;

// Project configuration schema - Updated to match validation matrix system
export const projectConfigSchema = z.object({
  testingType: z.enum(['web', 'mobile', 'api', 'desktop', 'performance'], {
    required_error: 'Testing type is required',
    invalid_type_error: 'Testing type must be one of: web, mobile, api, desktop, performance',
  }),
  framework: z
    .string({
      required_error: 'Framework is required',
      invalid_type_error: 'Framework must be a string',
    })
    .min(1, 'Framework cannot be empty')
    .max(50, 'Framework cannot exceed 50 characters'),
  language: z
    .string({
      required_error: 'Language is required',
      invalid_type_error: 'Language must be a string',
    })
    .min(1, 'Language cannot be empty')
    .max(50, 'Language cannot exceed 50 characters'),
  testingPattern: z
    .string({
      required_error: 'Testing pattern is required',
      invalid_type_error: 'Testing pattern must be a string',
    })
    .min(1, 'Testing pattern cannot be empty')
    .max(50, 'Testing pattern cannot exceed 50 characters'),
  testRunner: z
    .string({
      required_error: 'Test runner is required',
      invalid_type_error: 'Test runner must be a string',
    })
    .min(1, 'Test runner cannot be empty')
    .max(50, 'Test runner cannot exceed 50 characters'),
  buildTool: z
    .string({
      required_error: 'Build tool is required',
      invalid_type_error: 'Build tool must be a string',
    })
    .min(1, 'Build tool cannot be empty')
    .max(50, 'Build tool cannot exceed 50 characters'),
  projectName: z
    .string({
      required_error: 'Project name is required',
      invalid_type_error: 'Project name must be a string',
    })
    .min(1, 'Project name cannot be empty')
    .max(100, 'Project name cannot exceed 100 characters')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Project name can only contain letters, numbers, hyphens, and underscores'
    ),
  groupId: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[a-zA-Z0-9._-]+$/.test(val),
      'Group ID can only contain letters, numbers, dots, hyphens, and underscores'
    ),
  artifactId: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[a-zA-Z0-9_-]+$/.test(val),
      'Artifact ID can only contain letters, numbers, hyphens, and underscores'
    ),
  cicdTool: z.string().optional(),
  reportingTool: z.string().optional(),
  /**
   * Base URL the generated tests should target out of the box.
   * Defaults to the SauceDemo demo site so samples run green on first
   * clone without a user having to edit any config. Accepts http/https.
   */
  baseUrl: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^https?:\/\/.+/i.test(val),
      'Base URL must start with http:// or https://'
    ),
  /** Test credentials for web testing (defaults to SauceDemo creds when using that URL) */
  testUsername: z.string().max(200).optional(),
  testPassword: z.string().max(200).optional(),
  /** Path to the application under test (mobile APK/IPA, desktop EXE) */
  appPath: z.string().max(500).optional(),
  /** Mobile device or emulator name (e.g., "Android Emulator", "iPhone 14") */
  deviceName: z.string().max(200).optional(),
  /** Mobile platform OS version (e.g., "13.0", "16.0") */
  platformVersion: z.string().max(50).optional(),
  /** Cloud device farm provider for web and mobile testing */
  cloudDeviceFarm: z.enum(['none', 'browserstack', 'saucelabs', 'testmu']).optional().default('none'),
  /** OpenAPI/Swagger spec URL for API schema-driven test generation */
  openApiSpecUrl: z
    .string()
    .max(2000)
    .optional()
    .refine(
      (val) => !val || /^https:\/\/.+/i.test(val),
      'OpenAPI spec URL must use HTTPS'
    ),
  /** API authentication type */
  apiAuthType: z.enum(['none', 'bearer', 'basic', 'api-key']).optional(),
  /** API auth token / key value */
  apiAuthToken: z.string().max(500).optional(),
  includeSampleTests: z.boolean().optional().default(true),
  /**
   * Named environments for multi-environment test execution.
   * Each entry defines a target (e.g. dev, staging, prod) with its own
   * base URL and optional credentials.
   */
  environments: z
    .array(
      z.object({
        name: z.string().min(1).max(50),
        baseUrl: z.string().min(1).max(500).refine(
          (val) => /^https?:\/\/.+/i.test(val),
          'Base URL must start with http:// or https://'
        ),
        username: z.string().max(200).optional(),
        password: z.string().max(200).optional(),
      })
    )
    .max(10, 'A project can include at most 10 environments')
    .optional(),
  utilities: z
    .object({
      configReader: z.boolean().optional(),
      jsonReader: z.boolean().optional(),
      screenshotUtility: z.boolean().optional(),
      logger: z.boolean().optional(),
      dataProvider: z.boolean().optional(),
      faker: z.boolean().optional(),
      includeDocker: z.boolean().optional(),
      includeDockerCompose: z.boolean().optional(),
    })
    .optional(),
  /**
   * User-picked dependencies from Maven Central / npm registry search.
   * These are injected into the generated build file (pom.xml,
   * build.gradle, package.json) alongside the template's default deps.
   * Optional — older callers that don't use the dependency search UI
   * can omit this field entirely.
   */
  dependencies: z
    .array(
      z.object({
        id: z.string().min(1),
        registry: z.enum(['maven', 'npm', 'nuget', 'pypi']),
        name: z.string().min(1),
        version: z.string().min(1),
        group: z.string().optional(),
        description: z.string().optional(),
        homepage: z.string().optional(),
      })
    )
    .max(50, 'A project can include at most 50 user dependencies')
    .optional(),
});

/**
 * A single user-picked dependency from the registry search UX.
 * Exported separately so server code can reference it directly.
 */
export const userDependencySchema = z.object({
  id: z.string().min(1),
  registry: z.enum(['maven', 'npm', 'nuget', 'pypi']),
  name: z.string().min(1),
  version: z.string().min(1),
  group: z.string().optional(),
  description: z.string().optional(),
  homepage: z.string().optional(),
});

export type UserDependency = z.infer<typeof userDependencySchema>;

export const defaultUtilities = {
  configReader: true,
  jsonReader: false,
  screenshotUtility: true,
  logger: true,
  dataProvider: false,
  faker: false,
  includeDocker: false,
  includeDockerCompose: false,
};

export type ProjectConfig = z.infer<typeof projectConfigSchema>;

// API response schemas
export const generateProjectResponseSchema = z.object({
  success: z.boolean(),
  downloadUrl: z.string().optional(),
  message: z.string(),
});

export type GenerateProjectResponse = z.infer<typeof generateProjectResponseSchema>;
