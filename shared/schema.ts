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
  testingType: z.enum(['web', 'mobile', 'api', 'desktop'], {
    required_error: 'Testing type is required',
    invalid_type_error: 'Testing type must be one of: web, mobile, api, desktop',
  }),
  framework: z.string({
    required_error: 'Framework is required',
    invalid_type_error: 'Framework must be a string',
  }).min(1, 'Framework cannot be empty'),
  language: z.string({
    required_error: 'Language is required',
    invalid_type_error: 'Language must be a string',
  }).min(1, 'Language cannot be empty'),
  testingPattern: z.string({
    required_error: 'Testing pattern is required',
    invalid_type_error: 'Testing pattern must be a string',
  }).min(1, 'Testing pattern cannot be empty'),
  testRunner: z.string({
    required_error: 'Test runner is required',
    invalid_type_error: 'Test runner must be a string',
  }).min(1, 'Test runner cannot be empty'),
  buildTool: z.string({
    required_error: 'Build tool is required',
    invalid_type_error: 'Build tool must be a string',
  }).min(1, 'Build tool cannot be empty'),
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
  includeSampleTests: z.boolean().optional().default(true),
  utilities: z
    .object({
      configReader: z.boolean().optional(),
      jsonReader: z.boolean().optional(),
      screenshotUtility: z.boolean().optional(),
      logger: z.boolean().optional(),
      dataProvider: z.boolean().optional(),
      includeDocker: z.boolean().optional(),
      includeDockerCompose: z.boolean().optional(),
    })
    .optional(),
});

export const defaultUtilities = {
  configReader: true,
  jsonReader: false,
  screenshotUtility: true,
  logger: true,
  dataProvider: false,
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
