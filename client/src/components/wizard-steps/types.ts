/**
 * Type definitions for the QAStarter Wizard
 */

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
  dependencies: string[];
}

export interface WizardStepProps {
  onNext: () => void;
  onPrevious: () => void;
  stepNumber: number;
  totalSteps: number;
}

export const WIZARD_STEPS = [
  "Testing Type",
  "Framework",
  "Language",
  "Testing Pattern",
  "Test Runner",
  "Build Tool",
  "Project Metadata",
  "CI/CD",
  "Reporting",
  "Utilities",
  "Dependencies",
  "Summary"
] as const;

export const DEFAULT_CONFIG: WizardConfig = {
  testingType: "",
  framework: "",
  language: "",
  testingPattern: "",
  testRunner: "",
  buildTool: "",
  projectName: "",
  groupId: "",
  artifactId: "",
  cicdTool: "",
  reportingTool: "",
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
