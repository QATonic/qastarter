/**
 * Shared Version Loader
 *
 * Provides centralized tool versions.
 * Last updated: January 2026
 */

// Centralized tool versions - Updated to latest stable versions (Jan 2026)
export const toolVersions = {
  // Languages & Runtimes
  java: '17',  // Updated from 11 - LTS version
  python: '3.12',  // Updated from 3.11
  node: '20',  // LTS version
  npm: '10',
  dotnet: '8.0',  // LTS version
  swift: '5.10',  // Updated from 5.9
  kotlin: '2.0.0',  // Updated from 1.9.22

  // Web Frameworks
  selenium: '4.18.0',  // Updated from 4.16.0
  playwright: '1.42.0',  // Updated from 1.41.0
  cypress: '13.7.0',  // Updated from 13.6.3
  webdriverio: '8.33.0',  // Updated from 8.27.0

  // Mobile Frameworks
  appium: '9.1.0',  // Updated from 9.0.0
  espresso: '3.5.1',
  xcuitest: '15.2',  // Updated from 15.0

  // API Frameworks
  restassured: '5.4.0',
  requests: '2.31.0',
  supertest: '6.3.4',
  restsharp: '111.3.0',  // Updated from 110.2.0
  pact: '4.6.4',  // Updated from 4.6.3
  apollo: '3.10.0',  // Added for GraphQL
  grpc: '1.62.0',  // Added for gRPC

  // Test Runners
  junit5: '5.10.2',  // Updated from 5.10.1
  testng: '7.9.0',  // Updated from 7.8.0
  pytest: '8.0.0',  // Updated from 7.4.4
  jest: '29.7.0',
  mocha: '10.3.0',  // Updated from 10.2.0
  nunit: '4.1.0',  // Updated from 3.14.0
  xunit: '2.7.0',  // Added
  xctest: '15.2',  // Updated from 15.0
  cucumber: '7.16.0',  // Updated from 7.15.0
  robotframework: '7.0',

  // Reporting
  allure: '2.27.0',  // Updated from 2.25.0
  extentreports: '5.1.2',  // Updated from 5.1.1
  jesthtmlreporter: '3.10.2',
  mochawesome: '7.1.3',

  // Utilities
  log4j: '2.23.0',  // Updated from 2.22.0
  winston: '3.12.0',  // Updated from 3.11.0
  jackson: '2.17.0',  // Updated from 2.16.0
  gson: '2.10.1',

  // Build Tools
  maven: '3.9.6',
  gradle: '8.6',
  
  // Maven Plugins (Common)
  maven_compiler_plugin: '3.12.1',  // Updated from 3.11.0
  maven_surefire_plugin: '3.2.5',  // Updated from 3.1.2
};

/**
 * Load shared versions
 * Returns the static flattened map of versions
 */
export async function loadSharedVersions(): Promise<Record<string, string>> {
  return toolVersions;
}

/**
 * Merge manifest versions with shared versions
 * Manifest versions take precedence over shared versions
 */
export function mergeVersions(
  manifestVersions: Record<string, string>,
  sharedVersions: Record<string, string>
): Record<string, string> {
  return {
    ...sharedVersions,
    ...manifestVersions, // Manifest overrides shared
  };
}

/**
 * Get version for a specific tool
 */
export async function getToolVersion(tool: keyof typeof toolVersions): Promise<string | undefined> {
  // @ts-ignore
  return toolVersions[tool];
}

export function clearVersionsCache(): void {
  // No-op as we don't cache anymore
}
