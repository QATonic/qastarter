/**
 * Shared Version Loader
 *
 * Provides centralized tool versions.
 * Refactored to use static constants instead of runtime JSON reading.
 */

// Centralized tool versions
export const toolVersions = {
  // Languages & Runtimes
  java: '11',
  python: '3.11',
  node: '20',
  npm: '10',
  dotnet: '8.0',
  swift: '5.9',
  kotlin: '1.9.22',

  // Web Frameworks
  selenium: '4.16.0',
  playwright: '1.41.0',
  cypress: '13.6.3',
  webdriverio: '8.27.0',

  // Mobile Frameworks
  appium: '9.0.0',
  espresso: '3.5.1',
  xcuitest: '15.0',

  // API Frameworks
  restassured: '5.4.0',
  requests: '2.31.0',
  supertest: '6.3.4',
  restsharp: '110.2.0',
  pact: '4.6.3',

  // Test Runners
  junit5: '5.10.1',
  testng: '7.8.0',
  pytest: '7.4.4',
  jest: '29.7.0',
  mocha: '10.2.0',
  nunit: '3.14.0',
  xctest: '15.0',
  cucumber: '7.15.0',
  robotframework: '7.0',

  // Reporting
  allure: '2.25.0',
  extentreports: '5.1.1',
  jesthtmlreporter: '3.10.2',
  mochawesome: '7.1.3',

  // Utilities
  log4j: '2.22.0',
  winston: '3.11.0',
  jackson: '2.16.0',
  gson: '2.10.1',

  // Maven Plugins (Common)
  maven_compiler_plugin: '3.11.0',
  maven_surefire_plugin: '3.1.2',
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
