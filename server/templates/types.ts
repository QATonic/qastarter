import { ProjectConfig } from '@shared/schema';

export interface TemplatePackManifest {
  name: string;
  description: string;
  version: string;
  supportedCombination: {
    testingType: string;
    framework: string;
    language: string;
    testingPattern?: string; // Make optional for dynamic support
    testRunner: string;
    buildTool: string;
  };
  dynamicSupport?: {
    reportingTools?: string[];
    cicdTools?: string[];
    testingPatterns?: string[];
  };
  toolVersions: Record<string, string>;
  files: TemplatePackFile[];
  directories?: string[];
}

export interface TemplatePackFile {
  path: string;
  isTemplate: boolean;
  description?: string;
  mode?: string;
  conditional?: Record<string, any>; // e.g., {"reportingTool": "allure"} or {"utilities.logger": true}
}

export interface TemplateContext extends ProjectConfig {
  // Computed fields for templates
  javaPackage: string;
  packageName: string; // Alias for javaPackage, used by some templates
  packagePath: string;
  // C# specific - namespace format
  projectNamespace: string;
  csharpNamespace: string;
  safeArtifactId: string;
  safeGroupId: string;
  envs: string[];
  toolVersions: Record<string, string>;
  timestamp: string;
}

export interface TemplateFile {
  path: string;
  content: string;
  isTemplate: boolean;
  mode?: string;
}
