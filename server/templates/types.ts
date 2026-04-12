import { ProjectConfig, UserDependency } from '@shared/schema';

/**
 * Per-registry buckets of user-picked dependencies, ready for use
 * inside Handlebars templates without further transformation.
 */
export interface UserDependencyBuckets {
  /** All user-picked deps regardless of registry */
  all: UserDependency[];
  /** Maven Central dependencies (group:artifact) */
  maven: UserDependency[];
  /** npm registry dependencies (package name) */
  npm: UserDependency[];
  /** True if at least one user dep was picked */
  hasAny: boolean;
  /** True if at least one Maven dep was picked */
  hasMaven: boolean;
  /** True if at least one npm dep was picked */
  hasNpm: boolean;
}

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
  /**
   * Normalized base URL (trailing slash stripped, default applied).
   * Overrides the optional `baseUrl` from ProjectConfig so templates
   * can rely on it always being present.
   */
  baseUrl: string;
  /** Test credentials — always a string so templates can use {{testUsername}} directly */
  testUsername: string;
  testPassword: string;
  /** Application path — mobile APK/IPA or desktop EXE */
  appPath: string;
  /** Mobile device/emulator name */
  deviceName: string;
  /** Mobile platform OS version */
  platformVersion: string;
  /** API auth type */
  apiAuthType: 'none' | 'bearer' | 'basic' | 'api-key';
  /** API auth token/key value */
  apiAuthToken: string;
  envs: string[];
  toolVersions: Record<string, string>;
  timestamp: string;
  /**
   * User-picked dependencies, bucketed by registry. Templates use
   * this via Handlebars iteration, e.g.:
   *   {{#each userDependencies.maven}}<dependency>...</dependency>{{/each}}
   */
  userDependencies: UserDependencyBuckets;
}

export interface TemplateFile {
  path: string;
  content: string;
  isTemplate: boolean;
  mode?: string;
}
