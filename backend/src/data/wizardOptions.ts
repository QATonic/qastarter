import { ConfigurationOptions, FilterRules } from '@/types/index.js';

export const wizardOptions: ConfigurationOptions = {
  testingTypes: ['Web', 'API', 'Mobile'],
  methodologies: ['TDD', 'BDD', 'Hybrid'],
  tools: [
    'Selenium', 'Playwright', 'Cypress', 
    'RestAssured', 'GraphQL', 'Requests', 
    'Appium', 'XCUITest', 'Espresso'
  ],
  languages: ['Java', 'Python', 'JavaScript', 'TypeScript', 'C#', 'Swift', 'Kotlin'],
  buildTools: ['Maven', 'Gradle', 'NPM', 'Yarn', 'NuGet', 'pip', 'Xcode', 'Android Studio'],
  testRunners: ['JUnit', 'TestNG', 'Pytest', 'Jest', 'Mocha', 'NUnit', 'XCTest', 'Espresso'],
  scenarios: {
    Web: ['Login', 'Logout', 'SignUp'],
    API: ['API CRUD', 'Authentication API', 'Error Handling', 'Rate Limiting', 'GraphQL Queries', 'Schema Validation'],
    Mobile: ['Login', 'Logout', 'SignUp', 'Navigation', 'Push Notifications', 'Offline Mode', 'Gestures', 'Device Rotation']
  },
  cicdOptions: ['Jenkins', 'Azure Pipeline', 'GitHub Actions', 'GitLab CI', 'CircleCI'],
  reportingOptions: ['Extent Reports', 'Allure Reports', 'TestNG Reports', 'Jest Reports', 'Mochawesome'],
  otherIntegrations: ['Docker'],
  dependencies: ['Logging', 'Screenshot', 'Config Loader', 'POM', 'Data Provider', 'Retry Logic', 'Database Utils']
};

export const filterRules: FilterRules = {
  testingType: {
    'Web': {
      tools: ['Selenium', 'Playwright', 'Cypress'],
      languages: ['Java', 'Python', 'JavaScript', 'TypeScript', 'C#']
    },
    'API': {
      tools: ['RestAssured', 'GraphQL', 'Requests', 'Playwright'],
      languages: ['Java', 'Python', 'JavaScript', 'TypeScript', 'C#']
    },
    'Mobile': {
      tools: ['Appium', 'XCUITest', 'Espresso'],
      languages: ['Java', 'Python', 'JavaScript', 'TypeScript', 'C#', 'Swift', 'Kotlin']
    }
  },
  tool: {
    'Selenium': {
      languages: ['Java', 'Python', 'JavaScript', 'TypeScript', 'C#']
    },
    'Playwright': {
      languages: ['JavaScript', 'TypeScript', 'Java', 'Python', 'C#']
    },
    'Cypress': {
      languages: ['JavaScript', 'TypeScript']
    },
    'RestAssured': {
      languages: ['Java']
    },
    'GraphQL': {
      languages: ['JavaScript', 'TypeScript', 'Python', 'Java']
    },
    'Requests': {
      languages: ['Python']
    },
    'Appium': {
      languages: ['Java', 'Python', 'JavaScript', 'TypeScript', 'C#']
    },
    'XCUITest': {
      languages: ['Swift']
    },
    'Espresso': {
      languages: ['Java', 'Kotlin']
    }
  },
  language: {
    'Java': {
      buildTools: ['Maven', 'Gradle'],
      testRunners: ['JUnit', 'TestNG']
    },
    'Python': {
      buildTools: ['pip'],
      testRunners: ['Pytest']
    },
    'JavaScript': {
      buildTools: ['NPM', 'Yarn'],
      testRunners: ['Jest', 'Mocha']
    },
    'TypeScript': {
      buildTools: ['NPM', 'Yarn'],
      testRunners: ['Jest', 'Mocha']
    },
    'C#': {
      buildTools: ['NuGet'],
      testRunners: ['NUnit']
    },
    'Swift': {
      buildTools: ['Xcode'],
      testRunners: ['XCTest']
    },
    'Kotlin': {
      buildTools: ['Gradle', 'Android Studio'],
      testRunners: ['Espresso']
    }
  }
};

/**
 * Get filtered options based on current wizard state
 */
export function getFilteredOptions(
  currentStep: string,
  wizardState: {
    testingType?: string;
    tool?: string;
    language?: string;
  },
  allOptions: ConfigurationOptions
): string[] {
  const { testingType, tool, language } = wizardState;

  switch (currentStep) {
    case 'tools': {
      if (testingType && filterRules.testingType[testingType]?.tools) {
        return filterRules.testingType[testingType].tools;
      }
      return allOptions.tools;
    }

    case 'languages': {
      let availableLanguages = allOptions.languages;
      
      // Filter by testing type first
      if (testingType && filterRules.testingType[testingType]?.languages) {
        availableLanguages = filterRules.testingType[testingType].languages;
      }
      
      // Then filter by tool
      if (tool && filterRules.tool[tool]?.languages) {
        const toolLanguages = filterRules.tool[tool].languages;
        availableLanguages = availableLanguages.filter(lang => toolLanguages.includes(lang));
      }
      
      return availableLanguages;
    }

    case 'buildTools': {
      if (language && filterRules.language[language]?.buildTools) {
        return filterRules.language[language].buildTools;
      }
      return allOptions.buildTools;
    }

    case 'testRunners': {
      if (language && filterRules.language[language]?.testRunners) {
        return filterRules.language[language].testRunners;
      }
      return allOptions.testRunners;
    }

    case 'scenarios': {
      if (testingType && allOptions.scenarios[testingType]) {
        return allOptions.scenarios[testingType];
      }
      return [];
    }

    default:
      return [];
  }
} 