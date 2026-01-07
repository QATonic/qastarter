// Comprehensive validation matrix for QAStarter wizard steps
// Defines compatibility between testing types, frameworks, languages, and tools
// Updated: December 27, 2025 - Aligned with actual template inventory (34 templates)

export interface ValidationMatrix {
  testingTypes: string[];
  frameworks: Record<string, string[]>;
  languages: Record<string, string[]>;
  testRunners: Record<string, string[]>;
  buildTools: Record<string, string[]>;
  cicdTools: Record<string, string[]>;
  reportingTools: Record<string, string[]>;
  testingPatterns: Record<string, string[]>;
  // New: Framework + Language -> Test Runner mapping for more precise validation
  frameworkLanguageTestRunners: Record<string, string[]>;
  // New: Framework + Language -> Build Tool mapping for more precise validation
  frameworkLanguageBuildTools: Record<string, string[]>;
  // New: Framework + Language -> Reporting Tool mapping for more precise validation
  frameworkLanguageReportingTools: Record<string, string[]>;
  // New: Framework + Language -> Testing Pattern mapping for more precise validation
  frameworkLanguageTestingPatterns: Record<string, string[]>;
}

// Main validation matrix defining all compatibility rules
export const validationMatrix: ValidationMatrix = {
  // Available testing types
  testingTypes: ['web', 'mobile', 'api', 'desktop'],

  // Testing Type -> Available Frameworks
  frameworks: {
    web: ['selenium', 'playwright', 'cypress', 'webdriverio', 'robotframework'],
    mobile: ['appium', 'espresso', 'xcuitest'],
    api: ['restassured', 'requests', 'supertest', 'restsharp'],
    desktop: ['winappdriver', 'pyautogui']
  },

  // Framework -> Available Languages
  languages: {
    // Web frameworks
    selenium: ['java', 'python', 'csharp', 'javascript', 'typescript'],
    playwright: ['javascript', 'typescript', 'python', 'java', 'csharp'],
    cypress: ['javascript', 'typescript'],
    webdriverio: ['javascript', 'typescript'],
    robotframework: ['python'],  // Robot Framework uses Python

    // Mobile frameworks
    appium: ['java', 'python', 'csharp', 'javascript', 'typescript'],
    espresso: ['java', 'kotlin'],
    xcuitest: ['swift'],

    // API frameworks
    restassured: ['java'],
    requests: ['python'],
    supertest: ['javascript', 'typescript'],
    restsharp: ['csharp'],

    // Desktop frameworks
    winappdriver: ['csharp', 'java', 'python'],
    pyautogui: ['python']
  },

  // Language -> Available Test Runners (general mapping)
  testRunners: {
    java: ['testng', 'junit5'],
    kotlin: ['junit5'],
    python: ['pytest', 'robot'],  // Added 'robot' for Robot Framework
    javascript: ['jest', 'mocha', 'cypress'],
    typescript: ['jest', 'mocha', 'cypress'],
    csharp: ['nunit'],
    swift: ['xctest']
  },

  // Language -> Available Build Tools (general mapping)
  buildTools: {
    java: ['maven', 'gradle'],
    kotlin: ['gradle'],
    python: ['pip'],
    javascript: ['npm'],
    typescript: ['npm'],
    csharp: ['nuget', 'dotnet-cli'],
    swift: ['spm']
  },

  // Framework + Language -> Test Runner (precise mapping based on actual templates)
  // Key format: "framework-language"
  frameworkLanguageTestRunners: {
    // Web - Selenium
    'selenium-java': ['testng', 'junit5'],
    'selenium-python': ['pytest'],
    'selenium-csharp': ['nunit'],
    'selenium-javascript': ['jest'],
    'selenium-typescript': ['jest'],

    // Web - Playwright
    'playwright-java': ['testng', 'junit5'],
    'playwright-python': ['pytest'],
    'playwright-csharp': ['nunit'],
    'playwright-javascript': ['jest'],
    'playwright-typescript': ['jest'],

    // Web - Cypress (uses its own test runner)
    'cypress-javascript': ['cypress'],
    'cypress-typescript': ['cypress'],

    // Web - WebdriverIO
    'webdriverio-javascript': ['mocha'],
    'webdriverio-typescript': ['mocha'],

    // Web - Robot Framework
    'robotframework-python': ['robot'],

    // Mobile - Appium
    'appium-java': ['testng'],
    'appium-python': ['pytest'],
    'appium-csharp': ['nunit'],
    'appium-javascript': ['jest'],
    'appium-typescript': ['jest'],

    // Mobile - Espresso
    'espresso-java': ['junit5'],
    'espresso-kotlin': ['junit5'],

    // Mobile - XCUITest
    'xcuitest-swift': ['xctest'],

    // API - RestAssured
    'restassured-java': ['testng'],

    // API - Requests
    'requests-python': ['pytest'],

    // API - Supertest
    'supertest-javascript': ['jest'],
    'supertest-typescript': ['jest'],

    // API - RestSharp
    'restsharp-csharp': ['nunit'],

    // Desktop - WinAppDriver
    'winappdriver-csharp': ['nunit'],
    'winappdriver-java': ['testng'],
    'winappdriver-python': ['pytest'],

    // Desktop - PyAutoGUI
    'pyautogui-python': ['pytest']
  },

  // Framework + Language -> Build Tool (precise mapping based on actual templates)
  // Key format: "framework-language"
  frameworkLanguageBuildTools: {
    // Web - Selenium
    'selenium-java': ['maven', 'gradle'],
    'selenium-python': ['pip'],
    'selenium-csharp': ['nuget'],
    'selenium-javascript': ['npm'],
    'selenium-typescript': ['npm'],

    // Web - Playwright
    'playwright-java': ['maven', 'gradle'],
    'playwright-python': ['pip'],
    'playwright-csharp': ['nuget'],
    'playwright-javascript': ['npm'],
    'playwright-typescript': ['npm'],

    // Web - Cypress
    'cypress-javascript': ['npm'],
    'cypress-typescript': ['npm'],

    // Web - WebdriverIO
    'webdriverio-javascript': ['npm'],
    'webdriverio-typescript': ['npm'],

    // Web - Robot Framework
    'robotframework-python': ['pip'],

    // Mobile - Appium
    'appium-java': ['maven', 'gradle'],
    'appium-python': ['pip'],
    'appium-csharp': ['nuget'],
    'appium-javascript': ['npm'],
    'appium-typescript': ['npm'],

    // Mobile - Espresso
    'espresso-java': ['gradle'],
    'espresso-kotlin': ['gradle'],

    // Mobile - XCUITest
    'xcuitest-swift': ['spm'],

    // API - RestAssured
    'restassured-java': ['maven', 'gradle'],

    // API - Requests
    'requests-python': ['pip'],

    // API - Supertest
    'supertest-javascript': ['npm'],
    'supertest-typescript': ['npm'],

    // API - RestSharp
    'restsharp-csharp': ['nuget'],

    // Desktop - WinAppDriver
    'winappdriver-csharp': ['nuget'],
    'winappdriver-java': ['maven', 'gradle'],
    'winappdriver-python': ['pip'],

    // Desktop - PyAutoGUI
    'pyautogui-python': ['pip']
  },

  // Framework + Language -> Reporting Tool (precise mapping based on actual templates)
  // Key format: "framework-language"
  frameworkLanguageReportingTools: {
    // Web - Selenium
    'selenium-java': ['allure', 'extent-reports', 'testng-reports', 'junit-reports'],
    'selenium-python': ['allure', 'pytest-html'],
    'selenium-csharp': ['allure', 'extent-reports', 'nunit-reports'],
    'selenium-javascript': ['allure', 'jest-html-reporter', 'mochawesome'],
    'selenium-typescript': ['allure', 'jest-html-reporter', 'mochawesome'],

    // Web - Playwright
    'playwright-java': ['allure', 'extent-reports', 'testng-reports', 'junit-reports'],
    'playwright-python': ['allure', 'pytest-html'],
    'playwright-csharp': ['allure', 'extent-reports', 'nunit-reports'],
    'playwright-javascript': ['allure', 'jest-html'],
    'playwright-typescript': ['allure', 'jest-html'],

    // Web - Cypress
    'cypress-javascript': ['allure', 'mochawesome', 'jest-html-reporter'],
    'cypress-typescript': ['allure', 'mochawesome', 'jest-html-reporter'],

    // Web - WebdriverIO
    'webdriverio-javascript': ['allure', 'mochawesome', 'jest-html-reporter'],
    'webdriverio-typescript': ['allure', 'mochawesome', 'jest-html-reporter'],

    // Web - Robot Framework
    'robotframework-python': ['robot-reports', 'allure'],

    // Mobile - Appium
    'appium-java': ['allure', 'extent-reports', 'testng-reports', 'junit-reports'],
    'appium-python': ['allure', 'pytest-html'],
    'appium-csharp': ['allure', 'extent-reports', 'nunit-reports'],
    'appium-javascript': ['allure', 'jest-html-reporter', 'mochawesome'],
    'appium-typescript': ['allure', 'jest-html-reporter', 'mochawesome'],

    // Mobile - Espresso
    'espresso-java': ['allure', 'extent-reports', 'testng-reports', 'junit-reports'],
    'espresso-kotlin': ['allure', 'junit-reports'],

    // Mobile - XCUITest
    'xcuitest-swift': [],

    // API - RestAssured
    'restassured-java': ['allure', 'extent-reports', 'testng-reports'],

    // API - Requests
    'requests-python': ['allure', 'pytest-html'],

    // API - Supertest
    'supertest-javascript': ['allure', 'jest-html'],
    'supertest-typescript': ['allure', 'jest-html-reporter', 'mochawesome'],

    // API - RestSharp
    'restsharp-csharp': ['allure', 'extent-reports', 'nunit-reports'],

    // Desktop - WinAppDriver
    'winappdriver-csharp': ['allure', 'extent-reports', 'nunit-reports'],
    'winappdriver-java': ['allure', 'extent-reports'],
    'winappdriver-python': ['allure', 'pytest-html'],

    // Desktop - PyAutoGUI
    'pyautogui-python': ['allure', 'pytest-html']
  },

  // Framework -> Available CI/CD Tools (standardized across all templates)
  cicdTools: {
    selenium: ['jenkins', 'github-actions', 'gitlab-ci', 'azure-devops', 'circleci'],
    playwright: ['jenkins', 'github-actions', 'gitlab-ci', 'azure-devops', 'circleci'],
    cypress: ['jenkins', 'github-actions', 'gitlab-ci', 'azure-devops', 'circleci'],
    webdriverio: ['jenkins', 'github-actions', 'gitlab-ci', 'azure-devops', 'circleci'],
    robotframework: ['jenkins', 'github-actions', 'gitlab-ci', 'azure-devops', 'circleci'],
    appium: ['jenkins', 'github-actions', 'gitlab-ci', 'azure-devops', 'circleci'],
    espresso: ['jenkins', 'github-actions', 'gitlab-ci', 'azure-devops', 'circleci'],
    xcuitest: ['jenkins', 'github-actions', 'gitlab-ci', 'azure-devops', 'circleci'],
    restassured: ['jenkins', 'github-actions', 'gitlab-ci', 'azure-devops', 'circleci'],
    requests: ['jenkins', 'github-actions', 'gitlab-ci', 'azure-devops', 'circleci'],
    supertest: ['jenkins', 'github-actions', 'gitlab-ci', 'azure-devops', 'circleci'],
    restsharp: ['jenkins', 'github-actions', 'gitlab-ci', 'azure-devops', 'circleci'],
    winappdriver: ['jenkins', 'github-actions', 'gitlab-ci', 'azure-devops', 'circleci'],
    pyautogui: ['jenkins', 'github-actions', 'gitlab-ci', 'azure-devops', 'circleci']
  },

  // Framework -> Available Reporting Tools
  // Updated to match actual template dynamicSupport configurations
  reportingTools: {
    selenium: ['allure', 'extent-reports', 'testng-reports', 'junit-reports', 'jest-html-reporter', 'mochawesome', 'pytest-html', 'nunit-reports'],
    playwright: ['allure', 'extent-reports', 'testng-reports', 'junit-reports', 'jest-html', 'pytest-html', 'nunit-reports'],
    cypress: ['allure', 'jest-html-reporter', 'mochawesome'],
    webdriverio: ['allure', 'jest-html-reporter', 'mochawesome'],
    robotframework: ['robot-reports', 'allure'],
    appium: ['allure', 'extent-reports', 'testng-reports', 'junit-reports', 'jest-html-reporter', 'mochawesome', 'pytest-html', 'nunit-reports'],
    espresso: ['allure', 'extent-reports', 'testng-reports', 'junit-reports'],
    xcuitest: [],
    restassured: ['allure', 'extent-reports', 'testng-reports', 'junit-html'],
    requests: ['allure', 'pytest-html', 'pytest-json'],
    supertest: ['allure', 'jest-html', 'jest-html-reporter', 'mochawesome'],
    restsharp: ['allure', 'extent-reports', 'nunit-reports'],
    winappdriver: ['allure', 'extent-reports', 'pytest-html', 'nunit-reports'],
    pyautogui: ['allure', 'pytest-html']
  },

  // Framework -> Available Testing Patterns
  // Updated based on actual template dynamicSupport configurations
  testingPatterns: {
    // Web frameworks - POM is standard, BDD for Agile teams
    selenium: ['page-object-model', 'bdd'],
    playwright: ['page-object-model', 'bdd'],
    cypress: ['page-object-model', 'bdd'],
    webdriverio: ['page-object-model', 'bdd'],
    robotframework: ['page-object-model', 'bdd'],

    // Mobile frameworks - POM is standard, BDD for Agile teams
    appium: ['page-object-model', 'bdd'],
    espresso: ['page-object-model', 'bdd'],
    xcuitest: ['page-object-model', 'bdd'],

    // API frameworks - data-driven, BDD, contract-testing, and fluent patterns
    restassured: ['fluent', 'bdd', 'contract-testing'],
    requests: ['data-driven', 'bdd', 'contract-testing'],
    supertest: ['data-driven', 'bdd', 'contract-testing'],
    restsharp: ['data-driven', 'bdd', 'contract-testing'],

    // Desktop frameworks - POM is standard, some have additional patterns
    winappdriver: ['page-object-model', 'bdd'],
    pyautogui: ['functional-patterns', 'bdd']
  },

  // Framework + Language -> Testing Pattern (precise mapping based on actual templates)
  // Key format: "framework-language"
  frameworkLanguageTestingPatterns: {
    // Web - Selenium (all languages support POM + BDD)
    'selenium-java': ['page-object-model', 'bdd'],
    'selenium-python': ['page-object-model', 'bdd'],
    'selenium-csharp': ['page-object-model', 'bdd'],
    'selenium-javascript': ['page-object-model', 'bdd'],
    'selenium-typescript': ['page-object-model', 'bdd'],

    // Web - Playwright (all languages support POM + BDD)
    'playwright-java': ['page-object-model', 'bdd'],
    'playwright-python': ['page-object-model', 'bdd'],
    'playwright-csharp': ['page-object-model', 'bdd'],
    'playwright-javascript': ['page-object-model', 'bdd'],
    'playwright-typescript': ['page-object-model', 'bdd'],

    // Web - Cypress (POM + BDD)
    'cypress-javascript': ['page-object-model', 'bdd'],
    'cypress-typescript': ['page-object-model', 'bdd'],

    // Web - WebdriverIO (POM + BDD)
    'webdriverio-javascript': ['page-object-model', 'bdd'],
    'webdriverio-typescript': ['page-object-model', 'bdd'],

    // Web - Robot Framework (POM + BDD)
    'robotframework-python': ['page-object-model', 'bdd'],

    // Mobile - Appium (all languages support POM + BDD)
    'appium-java': ['page-object-model', 'bdd'],
    'appium-python': ['page-object-model', 'bdd'],
    'appium-csharp': ['page-object-model', 'bdd'],
    'appium-javascript': ['page-object-model', 'bdd'],
    'appium-typescript': ['page-object-model', 'bdd'],

    // Mobile - Espresso (POM + BDD)
    'espresso-java': ['page-object-model', 'bdd'],
    'espresso-kotlin': ['page-object-model', 'bdd'],

    // Mobile - XCUITest (POM + BDD)
    'xcuitest-swift': ['page-object-model', 'bdd'],

    // API - RestAssured (Fluent + BDD + Contract Testing - Java specific)
    'restassured-java': ['fluent', 'bdd', 'contract-testing'],

    // API - Requests (Data-driven + BDD + Contract Testing - Python specific)
    'requests-python': ['data-driven', 'bdd', 'contract-testing'],

    // API - Supertest (Data-driven + BDD + Contract Testing)
    'supertest-javascript': ['data-driven', 'bdd', 'contract-testing'],
    'supertest-typescript': ['data-driven', 'bdd', 'contract-testing'],

    // API - RestSharp (Data-driven + BDD - C# specific)
    'restsharp-csharp': ['data-driven', 'bdd'],

    // Desktop - WinAppDriver (POM + BDD)
    'winappdriver-csharp': ['page-object-model', 'bdd'],
    'winappdriver-java': ['page-object-model', 'bdd'],
    'winappdriver-python': ['page-object-model', 'bdd'],

    // Desktop - PyAutoGUI (Functional patterns + BDD)
    'pyautogui-python': ['functional-patterns', 'bdd']
  }
};

// Validation helper functions
export class WizardValidator {

  /**
   * Get available frameworks for selected testing type
   */
  static getAvailableFrameworks(testingType: string): string[] {
    return validationMatrix.frameworks[testingType] || [];
  }

  /**
   * Get available languages for selected framework
   */
  static getAvailableLanguages(framework: string): string[] {
    return validationMatrix.languages[framework] || [];
  }

  /**
   * Get available test runners for selected language (general)
   */
  static getAvailableTestRunners(language: string): string[] {
    return validationMatrix.testRunners[language] || [];
  }

  /**
   * Get available test runners for specific framework + language combination (precise)
   * This ensures only valid combinations that have actual templates are shown
   */
  static getAvailableTestRunnersForFramework(framework: string, language: string): string[] {
    const key = `${framework}-${language}`;
    return validationMatrix.frameworkLanguageTestRunners[key] || this.getAvailableTestRunners(language);
  }

  /**
   * Get available build tools for selected language (general)
   */
  static getAvailableBuildTools(language: string): string[] {
    return validationMatrix.buildTools[language] || [];
  }

  /**
   * Get available build tools for specific framework + language combination (precise)
   * This ensures only valid combinations that have actual templates are shown
   */
  static getAvailableBuildToolsForFramework(framework: string, language: string): string[] {
    const key = `${framework}-${language}`;
    return validationMatrix.frameworkLanguageBuildTools[key] || this.getAvailableBuildTools(language);
  }

  /**
   * Get available CI/CD tools for selected framework
   */
  static getAvailableCicdTools(framework: string): string[] {
    return validationMatrix.cicdTools[framework] || [];
  }

  /**
   * Get available reporting tools for selected framework (general)
   */
  static getAvailableReportingTools(framework: string): string[] {
    return validationMatrix.reportingTools[framework] || [];
  }

  /**
   * Get available reporting tools for specific framework + language combination (precise)
   * This ensures only valid combinations that have actual templates are shown
   */
  static getAvailableReportingToolsForFramework(framework: string, language: string): string[] {
    const key = `${framework}-${language}`;
    return validationMatrix.frameworkLanguageReportingTools[key] || this.getAvailableReportingTools(framework);
  }

  /**
   * Get available testing patterns for selected framework
   */
  static getAvailableTestingPatterns(framework: string): string[] {
    return validationMatrix.testingPatterns[framework] || [];
  }

  /**
   * Get available testing patterns for specific framework + language combination (precise)
   * This ensures only valid combinations that have actual templates are shown
   */
  static getAvailableTestingPatternsForFramework(framework: string, language: string): string[] {
    const key = `${framework}-${language}`;
    return validationMatrix.frameworkLanguageTestingPatterns[key] || this.getAvailableTestingPatterns(framework);
  }

  /**
   * Validate if a combination is compatible
   */
  static isCompatible(testingType: string, framework: string, language?: string): boolean {
    // Check if framework is available for testing type
    const availableFrameworks = this.getAvailableFrameworks(testingType);
    if (!availableFrameworks.includes(framework)) {
      return false;
    }

    // If language is provided, check compatibility
    if (language) {
      const availableLanguages = this.getAvailableLanguages(framework);
      if (!availableLanguages.includes(language)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Validate if a complete configuration has a matching template
   */
  static hasMatchingTemplate(testingType: string, framework: string, language: string, testRunner: string, buildTool: string): boolean {
    // First check basic compatibility
    if (!this.isCompatible(testingType, framework, language)) {
      return false;
    }

    // Check if test runner is valid for this framework + language
    const validTestRunners = this.getAvailableTestRunnersForFramework(framework, language);
    if (!validTestRunners.includes(testRunner)) {
      return false;
    }

    // Check if build tool is valid for this framework + language
    const validBuildTools = this.getAvailableBuildToolsForFramework(framework, language);
    if (!validBuildTools.includes(buildTool)) {
      return false;
    }

    return true;
  }

  /**
   * Get the template pack name for a configuration
   */
  static getTemplatePackName(testingType: string, framework: string, language: string, testRunner: string, buildTool: string): string {
    return `${testingType}-${language}-${framework}-${testRunner}-${buildTool}`;
  }

  /**
   * Get filtered options based on current selections
   */
  static getFilteredOptions(step: string, config: any): string[] {
    switch (step) {
      case 'framework':
        return config.testingType ? this.getAvailableFrameworks(config.testingType) : [];

      case 'language':
        return config.framework ? this.getAvailableLanguages(config.framework) : [];

      case 'testRunner':
        // Use precise mapping when both framework and language are selected
        if (config.framework && config.language) {
          return this.getAvailableTestRunnersForFramework(config.framework, config.language);
        }
        return config.language ? this.getAvailableTestRunners(config.language) : [];

      case 'buildTool':
        // Use precise mapping when both framework and language are selected
        if (config.framework && config.language) {
          return this.getAvailableBuildToolsForFramework(config.framework, config.language);
        }
        return config.language ? this.getAvailableBuildTools(config.language) : [];

      case 'cicdTool':
        return config.framework ? this.getAvailableCicdTools(config.framework) : [];

      case 'reportingTool':
        // Use precise mapping when both framework and language are selected
        if (config.framework && config.language) {
          return this.getAvailableReportingToolsForFramework(config.framework, config.language);
        }
        return config.framework ? this.getAvailableReportingTools(config.framework) : [];

      case 'testingPattern':
        // Use precise mapping when both framework and language are selected
        if (config.framework && config.language) {
          return this.getAvailableTestingPatternsForFramework(config.framework, config.language);
        }
        return config.framework ? this.getAvailableTestingPatterns(config.framework) : [];

      default:
        return [];
    }
  }

  /**
   * Reset invalid selections when dependencies change
   */
  static resetInvalidSelections(config: any): any {
    const newConfig = { ...config };

    // If testing type changed, reset framework and downstream selections
    if (config.testingType && config.framework) {
      if (!this.isCompatible(config.testingType, config.framework)) {
        newConfig.framework = '';
        newConfig.language = '';
        newConfig.testRunner = '';
        newConfig.buildTool = '';
        newConfig.cicdTool = '';
        newConfig.reportingTool = '';
        newConfig.testingPattern = '';
      }
    }

    // If framework changed, reset language and downstream selections
    if (config.framework && config.language) {
      if (!this.isCompatible(config.testingType, config.framework, config.language)) {
        newConfig.language = '';
        newConfig.testRunner = '';
        newConfig.buildTool = '';
      }
    }

    // Reset test runner if language changed
    if (config.language && config.testRunner) {
      const availableTestRunners = this.getAvailableTestRunners(config.language);
      if (!availableTestRunners.includes(config.testRunner)) {
        newConfig.testRunner = '';
      }
    }

    // Reset build tool if language changed
    if (config.language && config.buildTool) {
      const availableBuildTools = this.getAvailableBuildTools(config.language);
      if (!availableBuildTools.includes(config.buildTool)) {
        newConfig.buildTool = '';
      }
    }

    // Reset CI/CD tool if framework changed
    if (config.framework && config.cicdTool) {
      const availableCicdTools = this.getAvailableCicdTools(config.framework);
      if (!availableCicdTools.includes(config.cicdTool)) {
        newConfig.cicdTool = '';
      }
    }

    // Reset reporting tool if framework or language changed
    if (config.framework && config.language && config.reportingTool) {
      const availableReportingTools = this.getAvailableReportingToolsForFramework(config.framework, config.language);
      if (!availableReportingTools.includes(config.reportingTool)) {
        newConfig.reportingTool = '';
      }
    }

    // Reset testing pattern if framework or language changed
    if (config.framework && config.language && config.testingPattern) {
      const availableTestingPatterns = this.getAvailableTestingPatternsForFramework(config.framework, config.language);
      if (!availableTestingPatterns.includes(config.testingPattern)) {
        newConfig.testingPattern = '';
      }
    }

    return newConfig;
  }
}

// Human-readable labels for validation matrix options
export const validationLabels = {
  testingTypes: {
    web: 'Web Applications',
    mobile: 'Mobile Applications',
    api: 'API Testing',
    desktop: 'Desktop Applications'
  },

  frameworks: {
    // Web
    selenium: 'Selenium WebDriver',
    playwright: 'Playwright',
    cypress: 'Cypress',
    webdriverio: 'WebdriverIO',
    robotframework: 'Robot Framework',

    // Mobile
    appium: 'Appium',
    espresso: 'Espresso',
    xcuitest: 'XCUITest',

    // API
    restassured: 'REST Assured',
    requests: 'Python Requests',
    supertest: 'Supertest',
    restsharp: 'RestSharp',

    // Desktop
    winappdriver: 'WinAppDriver',
    pyautogui: 'PyAutoGUI'
  },

  languages: {
    java: 'Java',
    kotlin: 'Kotlin',
    python: 'Python',
    javascript: 'JavaScript',
    typescript: 'TypeScript',
    csharp: 'C#',
    swift: 'Swift'
  },

  testRunners: {
    junit5: 'JUnit 5',
    testng: 'TestNG',
    pytest: 'PyTest',
    jest: 'Jest',
    mocha: 'Mocha',
    nunit: 'NUnit',
    xctest: 'XCTest',
    cypress: 'Cypress',
    robot: 'Robot Framework'
  },

  buildTools: {
    maven: 'Apache Maven',
    gradle: 'Gradle',
    pip: 'pip',
    npm: 'npm',
    nuget: 'NuGet',
    'dotnet-cli': '.NET CLI',
    spm: 'Swift Package Manager'
  },

  cicdTools: {
    jenkins: 'Jenkins',
    'github-actions': 'GitHub Actions',
    'gitlab-ci': 'GitLab CI',
    'azure-devops': 'Azure DevOps',
    circleci: 'CircleCI'
  },

  reportingTools: {
    allure: 'Allure Reports',
    'extent-reports': 'ExtentReports',
    'testng-reports': 'TestNG Reports',
    'junit-reports': 'JUnit Reports',
    'junit-html': 'JUnit HTML Reports',
    'playwright-html-reporter': 'Playwright HTML Reporter',
    mochawesome: 'Mochawesome',
    'cypress-dashboard': 'Cypress Dashboard',
    'spec-reporter': 'Spec Reporter',
    'android-test-reports': 'Android Test Reports',
    xcresult: 'XCResult',
    'pytest-html': 'PyTest HTML',
    'pytest-json': 'PyTest JSON',
    'pytest-json-report': 'PyTest JSON Report',
    'jest-html-reporter': 'Jest HTML Reporter',
    'jest-html': 'Jest HTML',
    'nunit-reports': 'NUnit Reports',
    'robot-reports': 'Robot Framework Reports'
  },

  testingPatterns: {
    'page-object-model': 'Page Object Model (POM)',
    pom: 'Page Object Model (POM)',
    bdd: 'Behavior-Driven Development (BDD)',
    fluent: 'Fluent Pattern',
    'data-driven': 'Data-Driven Testing',
    'contract-testing': 'Contract Testing (Pact)',
    'functional-patterns': 'Functional Patterns',
    hybrid: 'Hybrid Pattern'
  }
};