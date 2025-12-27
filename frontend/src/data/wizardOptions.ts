import { OptionData, FilterRules, WizardState } from '../types/wizard';
import { apiService } from '../services/api';

// Default fallback data - aligned with backend validation matrix (33 templates)
// Updated: December 26, 2025
export const defaultWizardOptions: OptionData = {
  testingTypes: ['Web', 'API', 'Mobile', 'Desktop'],
  methodologies: ['TDD', 'BDD', 'Hybrid'],
  tools: [
    // Web
    'Selenium', 'Playwright', 'Cypress', 'WebdriverIO',
    // API
    'RestAssured', 'Requests', 'Supertest', 'RestSharp',
    // Mobile
    'Appium', 'XCUITest', 'Espresso',
    // Desktop
    'WinAppDriver', 'PyAutoGUI'
  ],
  languages: ['Java', 'Python', 'JavaScript', 'TypeScript', 'C#', 'Swift'],
  buildTools: ['Maven', 'Gradle', 'npm', 'pip', 'NuGet', 'SPM'],
  testRunners: ['JUnit 5', 'TestNG', 'Pytest', 'Jest', 'Mocha', 'NUnit', 'XCTest', 'Cypress'],
  scenarios: {
    Web: ['Login', 'Logout', 'SignUp', 'Search', 'Navigation', 'Form Validation'],
    API: ['CRUD Operations', 'Authentication', 'Error Handling', 'Schema Validation', 'Rate Limiting'],
    Mobile: ['Login', 'Logout', 'SignUp', 'Navigation', 'Push Notifications', 'Gestures', 'Device Rotation'],
    Desktop: ['Login', 'File Operations', 'Menu Navigation', 'Form Validation', 'Window Management']
  },
  cicdOptions: ['Jenkins', 'GitHub Actions', 'GitLab CI', 'Azure DevOps', 'CircleCI'],
  reportingOptions: ['Allure Reports', 'Extent Reports', 'TestNG Reports', 'JUnit Reports', 'Pytest HTML', 'Mochawesome'],
  otherIntegrations: ['Docker', 'Selenium Grid', 'BrowserStack', 'Sauce Labs'],
  dependencies: ['Logging', 'Screenshot', 'Config Loader', 'Page Object Model', 'Data Provider', 'Retry Logic', 'Wait Helpers']
};

// Filter rules aligned with actual templates (33 templates)
export const defaultFilterRules: FilterRules = {
  testingType: {
    'Web': {
      tools: ['Selenium', 'Playwright', 'Cypress', 'WebdriverIO'],
      languages: ['Java', 'Python', 'JavaScript', 'TypeScript', 'C#']
    },
    'API': {
      tools: ['RestAssured', 'Requests', 'Supertest', 'RestSharp'],
      languages: ['Java', 'Python', 'JavaScript', 'TypeScript', 'C#']
    },
    'Mobile': {
      tools: ['Appium', 'XCUITest', 'Espresso'],
      languages: ['Java', 'Python', 'JavaScript', 'TypeScript', 'C#', 'Swift']
    },
    'Desktop': {
      tools: ['WinAppDriver', 'PyAutoGUI'],
      languages: ['Java', 'Python', 'C#']
    }
  },
  tool: {
    // Web frameworks
    'Selenium': {
      languages: ['Java', 'Python', 'JavaScript', 'TypeScript', 'C#']
    },
    'Playwright': {
      languages: ['Java', 'Python', 'JavaScript', 'TypeScript', 'C#']
    },
    'Cypress': {
      languages: ['JavaScript', 'TypeScript']
    },
    'WebdriverIO': {
      languages: ['JavaScript', 'TypeScript']
    },
    // API frameworks
    'RestAssured': {
      languages: ['Java']
    },
    'Requests': {
      languages: ['Python']
    },
    'Supertest': {
      languages: ['JavaScript', 'TypeScript']
    },
    'RestSharp': {
      languages: ['C#']
    },
    // Mobile frameworks
    'Appium': {
      languages: ['Java', 'Python', 'JavaScript', 'TypeScript', 'C#']
    },
    'XCUITest': {
      languages: ['Swift']
    },
    'Espresso': {
      languages: ['Java']
    },
    // Desktop frameworks
    'WinAppDriver': {
      languages: ['Java', 'Python', 'C#']
    },
    'PyAutoGUI': {
      languages: ['Python']
    }
  },
  language: {
    'Java': {
      buildTools: ['Maven', 'Gradle'],
      testRunners: ['JUnit 5', 'TestNG']
    },
    'Python': {
      buildTools: ['pip'],
      testRunners: ['Pytest']
    },
    'JavaScript': {
      buildTools: ['npm'],
      testRunners: ['Jest', 'Mocha', 'Cypress']
    },
    'TypeScript': {
      buildTools: ['npm'],
      testRunners: ['Jest', 'Mocha', 'Cypress']
    },
    'C#': {
      buildTools: ['NuGet'],
      testRunners: ['NUnit']
    },
    'Swift': {
      buildTools: ['SPM'],
      testRunners: ['XCTest']
    }
  },
  // New: Tool + Language -> specific test runners (for precise filtering)
  toolLanguage: {
    // Web - Selenium
    'Selenium-Java': { testRunners: ['TestNG', 'JUnit 5'], buildTools: ['Maven', 'Gradle'] },
    'Selenium-Python': { testRunners: ['Pytest'], buildTools: ['pip'] },
    'Selenium-JavaScript': { testRunners: ['Jest'], buildTools: ['npm'] },
    'Selenium-TypeScript': { testRunners: ['Jest'], buildTools: ['npm'] },
    'Selenium-C#': { testRunners: ['NUnit'], buildTools: ['NuGet'] },
    
    // Web - Playwright
    'Playwright-Java': { testRunners: ['TestNG', 'JUnit 5'], buildTools: ['Maven', 'Gradle'] },
    'Playwright-Python': { testRunners: ['Pytest'], buildTools: ['pip'] },
    'Playwright-JavaScript': { testRunners: ['Jest'], buildTools: ['npm'] },
    'Playwright-TypeScript': { testRunners: ['Jest'], buildTools: ['npm'] },
    'Playwright-C#': { testRunners: ['NUnit'], buildTools: ['NuGet'] },
    
    // Web - Cypress
    'Cypress-JavaScript': { testRunners: ['Cypress'], buildTools: ['npm'] },
    'Cypress-TypeScript': { testRunners: ['Cypress'], buildTools: ['npm'] },
    
    // Web - WebdriverIO
    'WebdriverIO-JavaScript': { testRunners: ['Mocha'], buildTools: ['npm'] },
    'WebdriverIO-TypeScript': { testRunners: ['Mocha'], buildTools: ['npm'] },
    
    // API - RestAssured
    'RestAssured-Java': { testRunners: ['TestNG'], buildTools: ['Maven'] },
    
    // API - Requests
    'Requests-Python': { testRunners: ['Pytest'], buildTools: ['pip'] },
    
    // API - Supertest
    'Supertest-JavaScript': { testRunners: ['Jest'], buildTools: ['npm'] },
    'Supertest-TypeScript': { testRunners: ['Jest'], buildTools: ['npm'] },
    
    // API - RestSharp
    'RestSharp-C#': { testRunners: ['NUnit'], buildTools: ['NuGet'] },
    
    // Mobile - Appium
    'Appium-Java': { testRunners: ['TestNG'], buildTools: ['Maven'] },
    'Appium-Python': { testRunners: ['Pytest'], buildTools: ['pip'] },
    'Appium-JavaScript': { testRunners: ['Jest'], buildTools: ['npm'] },
    'Appium-TypeScript': { testRunners: ['Jest'], buildTools: ['npm'] },
    'Appium-C#': { testRunners: ['NUnit'], buildTools: ['NuGet'] },
    
    // Mobile - Espresso
    'Espresso-Java': { testRunners: ['JUnit 5'], buildTools: ['Gradle'] },
    
    // Mobile - XCUITest
    'XCUITest-Swift': { testRunners: ['XCTest'], buildTools: ['SPM'] },
    
    // Desktop - WinAppDriver
    'WinAppDriver-Java': { testRunners: ['TestNG'], buildTools: ['Maven'] },
    'WinAppDriver-Python': { testRunners: ['Pytest'], buildTools: ['pip'] },
    'WinAppDriver-C#': { testRunners: ['NUnit'], buildTools: ['NuGet'] },
    
    // Desktop - PyAutoGUI
    'PyAutoGUI-Python': { testRunners: ['Pytest'], buildTools: ['pip'] }
  }
};

// Dynamic data loaded from backend
let wizardOptions: OptionData = defaultWizardOptions;
let filterRules: FilterRules = defaultFilterRules;

/**
 * Load configuration options from backend
 */
export const loadWizardOptions = async (): Promise<OptionData> => {
  try {
    const options = await apiService.getConfigurationOptions();
    wizardOptions = options;
    return options;
  } catch (error) {
    console.warn('Failed to load wizard options from backend, using defaults:', error);
    return defaultWizardOptions;
  }
};

/**
 * Load filter rules from backend
 */
export const loadFilterRules = async (): Promise<FilterRules> => {
  try {
    const rules = await apiService.getFilterRules();
    filterRules = rules;
    return rules;
  } catch (error) {
    console.warn('Failed to load filter rules from backend, using defaults:', error);
    return defaultFilterRules;
  }
};

/**
 * Get current wizard options (loads from backend if not already loaded)
 */
export const getWizardOptions = async (): Promise<OptionData> => {
  if (wizardOptions === defaultWizardOptions) {
    return await loadWizardOptions();
  }
  return wizardOptions;
};

/**
 * Get current filter rules (loads from backend if not already loaded)
 */
export const getFilterRules = async (): Promise<FilterRules> => {
  if (filterRules === defaultFilterRules) {
    return await loadFilterRules();
  }
  return filterRules;
};

/**
 * Get filtered options based on current wizard state
 * Uses precise tool+language mapping when available
 */
export const getFilteredOptions = async (
  currentStep: string,
  wizardState: WizardState,
  allOptions?: OptionData
): Promise<string[]> => {
  // Use provided options or load from backend
  const options = allOptions || await getWizardOptions();
  const rules = await getFilterRules();
  
  const { testingType, tool, language } = wizardState;

  switch (currentStep) {
    case 'tools': {
      if (testingType && rules.testingType[testingType]?.tools) {
        return rules.testingType[testingType].tools!;
      }
      return options.tools;
    }

    case 'languages': {
      let availableLanguages = options.languages;
      
      // Filter by testing type first
      if (testingType && rules.testingType[testingType]?.languages) {
        availableLanguages = rules.testingType[testingType].languages!;
      }
      
      // Then filter by tool
      if (tool && rules.tool[tool]?.languages) {
        const toolLanguages = rules.tool[tool].languages!;
        availableLanguages = availableLanguages.filter(lang => toolLanguages.includes(lang));
      }
      
      return availableLanguages;
    }

    case 'buildTools': {
      // Use precise tool+language mapping if available
      if (tool && language && rules.toolLanguage) {
        const key = `${tool}-${language}`;
        if (rules.toolLanguage[key]?.buildTools) {
          return rules.toolLanguage[key].buildTools!;
        }
      }
      
      // Fallback to language-based filtering
      if (language && rules.language[language]?.buildTools) {
        return rules.language[language].buildTools!;
      }
      return options.buildTools;
    }

    case 'testRunners': {
      // Use precise tool+language mapping if available
      if (tool && language && rules.toolLanguage) {
        const key = `${tool}-${language}`;
        if (rules.toolLanguage[key]?.testRunners) {
          return rules.toolLanguage[key].testRunners!;
        }
      }
      
      // Fallback to language-based filtering
      if (language && rules.language[language]?.testRunners) {
        return rules.language[language].testRunners!;
      }
      return options.testRunners;
    }

    case 'scenarios': {
      if (testingType && options.scenarios[testingType as keyof typeof options.scenarios]) {
        return options.scenarios[testingType as keyof typeof options.scenarios];
      }
      return [];
    }

    default:
      return [];
  }
};

// Export the current options for compatibility (will be default until loaded)
export { wizardOptions };
