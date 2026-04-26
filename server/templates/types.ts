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
  /** NuGet dependencies (.NET) */
  nuget: UserDependency[];
  /** PyPI dependencies (Python) */
  pypi: UserDependency[];
  /** True if at least one user dep was picked */
  hasAny: boolean;
  /** True if at least one Maven dep was picked */
  hasMaven: boolean;
  /** True if at least one npm dep was picked */
  hasNpm: boolean;
  /** True if at least one NuGet dep was picked */
  hasNuget: boolean;
  /** True if at least one PyPI dep was picked */
  hasPypi: boolean;
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
  /** Cloud device farm provider (browserstack, saucelabs, or none) */
  cloudDeviceFarm: string;
  /** API auth type */
  apiAuthType: 'none' | 'bearer' | 'basic' | 'api-key';
  /** API auth token/key value */
  apiAuthToken: string;
  envs: string[];
  /** Named environments with URLs and optional credentials for multi-env test execution */
  environments: Array<{ name: string; baseUrl: string; username?: string; password?: string }>;
  /** True when at least one named environment is configured */
  hasEnvironments: boolean;
  /** Parsed OpenAPI endpoints for API schema-driven test generation */
  openApiEndpoints: import('@shared/openApiTypes').OpenApiEndpoint[];
  /** True when at least one OpenAPI endpoint is available */
  hasOpenApiEndpoints: boolean;
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
  /**
   * File content. String for text files (all isTemplate:true files plus
   * plain-text isTemplate:false entries). Buffer for binary files
   * (gradle-wrapper.jar, images, etc.) so that UTF-8 re-encoding doesn't
   * corrupt non-UTF-8 byte sequences.
   */
  content: string | Buffer;
  isTemplate: boolean;
  mode?: string;
}
