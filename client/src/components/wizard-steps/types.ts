/**
 * Type definitions for the QAStarter Wizard
 */

import React from 'react';

/**
 * Registry a user-picked dependency was fetched from.
 * 'maven' -> Maven Central (Java / Kotlin / Scala builds)
 * 'npm'   -> npm registry (JavaScript / TypeScript builds)
 */
export type DependencyRegistry = 'maven' | 'npm';

/**
 * A dependency the user explicitly added via the dependency search UI.
 * This is the shape persisted on the client and sent to the server
 * alongside the rest of the project config.
 */
export interface UserDependency {
  /** Unique identifier (e.g. "com.squareup.okhttp3:okhttp" or "axios") */
  id: string;
  /** Registry the dependency was pulled from */
  registry: DependencyRegistry;
  /** Human-readable display name */
  name: string;
  /** Selected version string */
  version: string;
  /** Maven group (Maven only) */
  group?: string;
  /** Optional description for UI */
  description?: string;
  /** Upstream homepage (for info link) */
  homepage?: string;
}

export interface WizardConfig {
  testingType: string;
  framework: string;
  language: string;
  testingPattern: string;
  testRunner: string;
  buildTool: string;
  projectName: string;
  groupId?: string;
  artifactId?: string;
  /** Base URL the generated sample tests should target (must include scheme) */
  baseUrl?: string;
  /** Test credentials (web) — auto-populated for SauceDemo, placeholder for custom URLs */
  testUsername?: string;
  testPassword?: string;
  /** Application path (mobile APK/IPA, desktop EXE) */
  appPath?: string;
  /** Mobile device/emulator name */
  deviceName?: string;
  /** Mobile platform OS version */
  platformVersion?: string;
  /** API auth type: none, bearer, basic, api-key */
  apiAuthType?: string;
  /** API auth token/key value */
  apiAuthToken?: string;
  cicdTool: string;
  reportingTool: string;
  utilities: {
    configReader: boolean;
    jsonReader: boolean;
    screenshotUtility: boolean;
    logger: boolean;
    dataProvider: boolean;
    includeDocker: boolean;
    includeDockerCompose: boolean;
  };
  /** User-picked dependencies (from Maven Central / npm search) */
  dependencies: UserDependency[];
}

export interface WizardStepProps {
  onNext: () => void;
  onPrevious: () => void;
  stepNumber: number;
  totalSteps: number;
}

export const WIZARD_STEPS = [
  'Testing Type',
  'Framework',
  'Language',
  'Testing Pattern',
  'Test Runner',
  'Build Tool',
  'Project Metadata',
  'CI/CD',
  'Reporting',
  'Utilities',
  'Dependencies',
  'Summary',
] as const;

export const DEFAULT_CONFIG: WizardConfig = {
  testingType: '',
  framework: '',
  language: '',
  testingPattern: '',
  testRunner: '',
  buildTool: '',
  projectName: '',
  groupId: '',
  artifactId: '',
  baseUrl: 'https://www.saucedemo.com/',
  testUsername: 'standard_user',
  testPassword: 'secret_sauce',
  appPath: '',
  deviceName: '',
  platformVersion: '',
  apiAuthType: 'none',
  apiAuthToken: '',
  cicdTool: '',
  reportingTool: '',
  utilities: {
    configReader: true,
    jsonReader: false,
    screenshotUtility: true,
    logger: true,
    dataProvider: false,
    includeDocker: false,
    includeDockerCompose: false,
  },
  dependencies: [],
};

// Icon type for step options
export type IconComponent = React.ComponentType<{ className?: string }>;
