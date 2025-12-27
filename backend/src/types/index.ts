// Project Configuration Types
export interface ProjectConfiguration {
  testingType: 'Web' | 'API' | 'Mobile';
  methodology: 'TDD' | 'BDD' | 'Hybrid';
  tool: string;
  language: string;
  buildTool: string;
  testRunner: string;
  scenarios: string[];
  config: {
    projectName: string;
    groupId?: string;
    artifactId?: string;
    packageName?: string;
  };
  integrations: {
    cicd?: string;
    reporting?: string;
    others: string[];
  };
  dependencies: string[];
}

// Generated Project Types
export interface GeneratedProject {
  id: string;
  configuration: ProjectConfiguration;
  templateId: string;
  status: 'pending' | 'generating' | 'completed' | 'failed' | 'expired';
  progress: number;
  files: GeneratedFile[];
  zipPath?: string;
  downloadUrl?: string;
  downloadCount: number;
  createdAt: Date;
  expiresAt: Date;
  error?: string;
}

export interface GeneratedFile {
  path: string;
  name: string;
  size: number;
  checksum: string;
  type: 'file' | 'directory';
}

// Template Types
export interface Template {
  id: string;
  name: string;
  description: string;
  framework: string;
  language: string;
  version: string;
  path: string;
  files: TemplateFile[];
  dependencies: Dependency[];
  configurations: TemplateConfiguration[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateFile {
  path: string;
  name: string;
  type: 'file' | 'directory';
  template: string;
  conditions?: string[];
}

export interface Dependency {
  name: string;
  version: string;
  scope: 'compile' | 'test' | 'runtime';
  optional: boolean;
}

export interface TemplateConfiguration {
  key: string;
  type: 'string' | 'boolean' | 'array';
  required: boolean;
  default?: any;
  validation?: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: ValidationError[];
  timestamp: string;
  requestId: string;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// Configuration Options
export interface ConfigurationOptions {
  testingTypes: string[];
  methodologies: string[];
  tools: string[];
  languages: string[];
  buildTools: string[];
  testRunners: string[];
  scenarios: {
    [key: string]: string[];
  };
  cicdOptions: string[];
  reportingOptions: string[];
  otherIntegrations: string[];
  dependencies: string[];
}

// Filter Rules
export interface FilterRules {
  testingType: {
    [type: string]: {
      tools?: string[];
      languages?: string[];
    };
  };
  tool: {
    [tool: string]: {
      languages?: string[];
    };
  };
  language: {
    [language: string]: {
      buildTools?: string[];
      testRunners?: string[];
    };
  };
}

// Service Types
export interface FileGenerationOptions {
  outputDir: string;
  templateDir: string;
  projectId: string;
  configuration: ProjectConfiguration;
}

export interface ZipCreationOptions {
  sourceDir: string;
  outputPath: string;
  projectId: string;
}

// Analytics Types
export interface AnalyticsEvent {
  event: string;
  properties: Record<string, any>;
  timestamp: Date;
  sessionId: string;
  userId?: string;
}

// Request Types
export interface GenerateProjectRequest {
  testingType: string;
  methodology: string;
  tool: string;
  language: string;
  buildTool: string;
  testRunner: string;
  scenarios: string[];
  config: {
    projectName: string;
    groupId?: string;
    artifactId?: string;
    packageName?: string;
  };
  integrations: {
    cicd?: string;
    reporting?: string;
    others: string[];
  };
  dependencies: string[];
}

// Environment Configuration
export interface EnvConfig {
  NODE_ENV: string;
  PORT: number;
  HOST: string;
  CORS_ORIGIN: string;
  TEMP_DIR: string;
  GENERATED_DIR: string;
  TEMPLATES_DIR: string;
  MAX_FILE_SIZE: string;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  LOG_LEVEL: string;
  LOG_FORMAT: string;
  PROJECT_EXPIRY_HOURS: number;
} 