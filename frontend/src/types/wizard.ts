export interface WizardState {
  testingType: string;
  methodology: string;
  tool: string;
  language: string;
  buildTool: string;
  testRunner: string;
  scenarios: string[];
  config: {
    projectName: string;
    groupId: string;
    artifactId: string;
    packageName: string;
  };
  integrations: {
    cicd: string;
    reporting: string;
    others: string[];
  };
  dependencies: string[];
}

export interface WizardStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

export interface OptionData {
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

export interface TreeNode {
  name: string;
  type: 'file' | 'folder';
  children?: TreeNode[];
}

export interface FilterRules {
  testingType: {
    [value: string]: {
      tools?: string[];
      languages?: string[];
    };
  };
  tool: {
    [value: string]: {
      languages?: string[];
    };
  };
  language: {
    [value: string]: {
      buildTools?: string[];
      testRunners?: string[];
    };
  };
  // Precise tool+language mapping for exact template matching
  toolLanguage?: {
    [key: string]: {
      buildTools?: string[];
      testRunners?: string[];
    };
  };
}