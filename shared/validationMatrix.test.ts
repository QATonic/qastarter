import { describe, it, expect, beforeEach } from 'vitest';
import {
  validationMatrix,
  WizardValidator,
  validationLabels,
  ValidationMatrix,
} from './validationMatrix';

describe('ValidationMatrix', () => {
  describe('Structure Validation', () => {
    it('should have all required testing types', () => {
      expect(validationMatrix.testingTypes).toContain('web');
      expect(validationMatrix.testingTypes).toContain('mobile');
      expect(validationMatrix.testingTypes).toContain('api');
      expect(validationMatrix.testingTypes).toContain('desktop');
    });

    it('should have frameworks for each testing type', () => {
      validationMatrix.testingTypes.forEach((type) => {
        expect(validationMatrix.frameworks[type]).toBeDefined();
        expect(validationMatrix.frameworks[type].length).toBeGreaterThan(0);
      });
    });

    it('should have languages for each framework', () => {
      Object.keys(validationMatrix.languages).forEach((framework) => {
        expect(validationMatrix.languages[framework].length).toBeGreaterThan(0);
      });
    });
  });

  describe('Web Frameworks', () => {
    it('should have correct web frameworks', () => {
      const webFrameworks = validationMatrix.frameworks.web;
      expect(webFrameworks).toContain('selenium');
      expect(webFrameworks).toContain('playwright');
      expect(webFrameworks).toContain('cypress');
      expect(webFrameworks).toContain('webdriverio');
    });

    it('should have correct languages for Selenium', () => {
      const seleniumLanguages = validationMatrix.languages.selenium;
      expect(seleniumLanguages).toContain('java');
      expect(seleniumLanguages).toContain('python');
      expect(seleniumLanguages).toContain('csharp');
      expect(seleniumLanguages).toContain('javascript');
      expect(seleniumLanguages).toContain('typescript');
    });

    it('should have correct languages for Playwright', () => {
      const playwrightLanguages = validationMatrix.languages.playwright;
      expect(playwrightLanguages).toContain('java');
      expect(playwrightLanguages).toContain('python');
      expect(playwrightLanguages).toContain('csharp');
      expect(playwrightLanguages).toContain('javascript');
      expect(playwrightLanguages).toContain('typescript');
    });

    it('should have correct languages for Cypress', () => {
      const cypressLanguages = validationMatrix.languages.cypress;
      expect(cypressLanguages).toContain('javascript');
      expect(cypressLanguages).toContain('typescript');
      expect(cypressLanguages).not.toContain('java');
    });
  });

  describe('Mobile Frameworks', () => {
    it('should have correct mobile frameworks', () => {
      const mobileFrameworks = validationMatrix.frameworks.mobile;
      expect(mobileFrameworks).toContain('appium');
      expect(mobileFrameworks).toContain('espresso');
      expect(mobileFrameworks).toContain('xcuitest');
    });

    it('should have correct languages for Appium', () => {
      const appiumLanguages = validationMatrix.languages.appium;
      expect(appiumLanguages).toContain('java');
      expect(appiumLanguages).toContain('python');
      expect(appiumLanguages).toContain('csharp');
    });

    it('should have Java and Kotlin for Espresso', () => {
      expect(validationMatrix.languages.espresso).toEqual(['java', 'kotlin']);
    });

    it('should have Swift only for XCUITest', () => {
      expect(validationMatrix.languages.xcuitest).toEqual(['swift']);
    });
  });

  describe('API Frameworks', () => {
    it('should have correct API frameworks', () => {
      const apiFrameworks = validationMatrix.frameworks.api;
      expect(apiFrameworks).toContain('restassured');
      expect(apiFrameworks).toContain('requests');
      expect(apiFrameworks).toContain('supertest');
      expect(apiFrameworks).toContain('restsharp');
    });

    it('should have Java only for RestAssured', () => {
      expect(validationMatrix.languages.restassured).toEqual(['java']);
    });

    it('should have Python only for Requests', () => {
      expect(validationMatrix.languages.requests).toEqual(['python']);
    });

    it('should have C# only for RestSharp', () => {
      expect(validationMatrix.languages.restsharp).toEqual(['csharp']);
    });
  });

  describe('Desktop Frameworks', () => {
    it('should have correct desktop frameworks', () => {
      const desktopFrameworks = validationMatrix.frameworks.desktop;
      expect(desktopFrameworks).toContain('winappdriver');
      expect(desktopFrameworks).toContain('pyautogui');
    });

    it('should have Python only for PyAutoGUI', () => {
      expect(validationMatrix.languages.pyautogui).toEqual(['python']);
    });
  });
});

describe('WizardValidator', () => {
  describe('getAvailableFrameworks', () => {
    it('should return web frameworks for web testing type', () => {
      const frameworks = WizardValidator.getAvailableFrameworks('web');
      expect(frameworks).toContain('selenium');
      expect(frameworks).toContain('playwright');
      expect(frameworks).toContain('cypress');
      expect(frameworks).toContain('webdriverio');
    });

    it('should return mobile frameworks for mobile testing type', () => {
      const frameworks = WizardValidator.getAvailableFrameworks('mobile');
      expect(frameworks).toContain('appium');
      expect(frameworks).toContain('espresso');
      expect(frameworks).toContain('xcuitest');
    });

    it('should return API frameworks for api testing type', () => {
      const frameworks = WizardValidator.getAvailableFrameworks('api');
      expect(frameworks).toContain('restassured');
      expect(frameworks).toContain('requests');
      expect(frameworks).toContain('supertest');
      expect(frameworks).toContain('restsharp');
    });

    it('should return empty array for invalid testing type', () => {
      const frameworks = WizardValidator.getAvailableFrameworks('invalid');
      expect(frameworks).toEqual([]);
    });
  });

  describe('getAvailableLanguages', () => {
    it('should return correct languages for Selenium', () => {
      const languages = WizardValidator.getAvailableLanguages('selenium');
      expect(languages).toContain('java');
      expect(languages).toContain('python');
      expect(languages).toContain('csharp');
    });

    it('should return correct languages for Cypress', () => {
      const languages = WizardValidator.getAvailableLanguages('cypress');
      expect(languages).toEqual(['javascript', 'typescript']);
    });

    it('should return empty array for invalid framework', () => {
      const languages = WizardValidator.getAvailableLanguages('invalid');
      expect(languages).toEqual([]);
    });
  });

  describe('getAvailableTestRunners', () => {
    it('should return TestNG and JUnit5 for Java', () => {
      const runners = WizardValidator.getAvailableTestRunners('java');
      expect(runners).toContain('testng');
      expect(runners).toContain('junit5');
    });

    it('should return pytest for Python', () => {
      const runners = WizardValidator.getAvailableTestRunners('python');
      expect(runners).toContain('pytest');
    });

    it('should return NUnit for C#', () => {
      const runners = WizardValidator.getAvailableTestRunners('csharp');
      expect(runners).toContain('nunit');
    });

    it('should return empty array for invalid language', () => {
      const runners = WizardValidator.getAvailableTestRunners('invalid');
      expect(runners).toEqual([]);
    });
  });

  describe('getAvailableTestRunnersForFramework', () => {
    it('should return TestNG and JUnit5 for Selenium + Java', () => {
      const runners = WizardValidator.getAvailableTestRunnersForFramework('selenium', 'java');
      expect(runners).toContain('testng');
      expect(runners).toContain('junit5');
    });

    it('should return pytest for Selenium + Python', () => {
      const runners = WizardValidator.getAvailableTestRunnersForFramework('selenium', 'python');
      expect(runners).toContain('pytest');
    });

    it('should return cypress for Cypress + JavaScript', () => {
      const runners = WizardValidator.getAvailableTestRunnersForFramework('cypress', 'javascript');
      expect(runners).toContain('cypress');
    });

    it('should return mocha for WebdriverIO + JavaScript', () => {
      const runners = WizardValidator.getAvailableTestRunnersForFramework(
        'webdriverio',
        'javascript'
      );
      expect(runners).toContain('mocha');
    });

    it('should return TestNG for RestAssured + Java', () => {
      const runners = WizardValidator.getAvailableTestRunnersForFramework('restassured', 'java');
      expect(runners).toContain('testng');
    });

    it('should fallback to general test runners for unknown combination', () => {
      const runners = WizardValidator.getAvailableTestRunnersForFramework('unknown', 'java');
      expect(runners).toContain('testng');
      expect(runners).toContain('junit5');
    });
  });

  describe('getAvailableBuildTools', () => {
    it('should return Maven and Gradle for Java', () => {
      const tools = WizardValidator.getAvailableBuildTools('java');
      expect(tools).toContain('maven');
      expect(tools).toContain('gradle');
    });

    it('should return pip for Python', () => {
      const tools = WizardValidator.getAvailableBuildTools('python');
      expect(tools).toContain('pip');
    });

    it('should return npm for JavaScript', () => {
      const tools = WizardValidator.getAvailableBuildTools('javascript');
      expect(tools).toContain('npm');
    });

    it('should return nuget and dotnet-cli for C#', () => {
      const tools = WizardValidator.getAvailableBuildTools('csharp');
      expect(tools).toContain('nuget');
      expect(tools).toContain('dotnet-cli');
    });
  });

  describe('getAvailableBuildToolsForFramework', () => {
    it('should return Maven and Gradle for Selenium + Java', () => {
      const tools = WizardValidator.getAvailableBuildToolsForFramework('selenium', 'java');
      expect(tools).toContain('maven');
      expect(tools).toContain('gradle');
    });

    it('should return only Gradle for Espresso + Java', () => {
      const tools = WizardValidator.getAvailableBuildToolsForFramework('espresso', 'java');
      expect(tools).toContain('gradle');
    });

    it('should return npm for Cypress + JavaScript', () => {
      const tools = WizardValidator.getAvailableBuildToolsForFramework('cypress', 'javascript');
      expect(tools).toContain('npm');
    });
  });

  describe('getAvailableCicdTools', () => {
    it('should return all CI/CD tools for any framework', () => {
      const tools = WizardValidator.getAvailableCicdTools('selenium');
      expect(tools).toContain('jenkins');
      expect(tools).toContain('github-actions');
      expect(tools).toContain('gitlab-ci');
      expect(tools).toContain('azure-devops');
      expect(tools).toContain('circleci');
    });

    it('should return empty array for invalid framework', () => {
      const tools = WizardValidator.getAvailableCicdTools('invalid');
      expect(tools).toEqual([]);
    });
  });

  describe('getAvailableReportingTools', () => {
    it('should return Allure for Selenium', () => {
      const tools = WizardValidator.getAvailableReportingTools('selenium');
      expect(tools).toContain('allure');
    });

    it('should return empty array for XCUITest', () => {
      const tools = WizardValidator.getAvailableReportingTools('xcuitest');
      expect(tools).toEqual([]);
    });
  });

  describe('getAvailableReportingToolsForFramework', () => {
    it('should return Java-specific reporting tools for Selenium + Java', () => {
      const tools = WizardValidator.getAvailableReportingToolsForFramework('selenium', 'java');
      expect(tools).toContain('allure');
      expect(tools).toContain('extent-reports');
      expect(tools).toContain('testng-reports');
    });

    it('should return Python-specific reporting tools for Selenium + Python', () => {
      const tools = WizardValidator.getAvailableReportingToolsForFramework('selenium', 'python');
      expect(tools).toContain('allure');
      expect(tools).toContain('pytest-html');
    });
  });

  describe('getAvailableTestingPatterns', () => {
    it('should return POM and BDD for Selenium', () => {
      const patterns = WizardValidator.getAvailableTestingPatterns('selenium');
      expect(patterns).toContain('page-object-model');
      expect(patterns).toContain('bdd');
    });

    it('should return fluent and BDD for RestAssured', () => {
      const patterns = WizardValidator.getAvailableTestingPatterns('restassured');
      expect(patterns).toContain('fluent');
      expect(patterns).toContain('bdd');
    });

    it('should return data-driven and BDD for Requests', () => {
      const patterns = WizardValidator.getAvailableTestingPatterns('requests');
      expect(patterns).toContain('data-driven');
      expect(patterns).toContain('bdd');
    });
  });

  describe('getAvailableTestingPatternsForFramework', () => {
    it('should return POM and BDD for Selenium + Java', () => {
      const patterns = WizardValidator.getAvailableTestingPatternsForFramework('selenium', 'java');
      expect(patterns).toContain('page-object-model');
      expect(patterns).toContain('bdd');
    });

    it('should return fluent and BDD for RestAssured + Java', () => {
      const patterns = WizardValidator.getAvailableTestingPatternsForFramework(
        'restassured',
        'java'
      );
      expect(patterns).toContain('fluent');
      expect(patterns).toContain('bdd');
    });

    it('should return functional-patterns and BDD for PyAutoGUI + Python', () => {
      const patterns = WizardValidator.getAvailableTestingPatternsForFramework(
        'pyautogui',
        'python'
      );
      expect(patterns).toContain('functional-patterns');
      expect(patterns).toContain('bdd');
    });
  });

  describe('isCompatible', () => {
    it('should return true for valid testing type + framework', () => {
      expect(WizardValidator.isCompatible('web', 'selenium')).toBe(true);
      expect(WizardValidator.isCompatible('web', 'playwright')).toBe(true);
      expect(WizardValidator.isCompatible('mobile', 'appium')).toBe(true);
      expect(WizardValidator.isCompatible('api', 'restassured')).toBe(true);
    });

    it('should return false for invalid testing type + framework', () => {
      expect(WizardValidator.isCompatible('web', 'appium')).toBe(false);
      expect(WizardValidator.isCompatible('mobile', 'selenium')).toBe(false);
      expect(WizardValidator.isCompatible('api', 'playwright')).toBe(false);
    });

    it('should return true for valid testing type + framework + language', () => {
      expect(WizardValidator.isCompatible('web', 'selenium', 'java')).toBe(true);
      expect(WizardValidator.isCompatible('web', 'cypress', 'javascript')).toBe(true);
      expect(WizardValidator.isCompatible('api', 'restassured', 'java')).toBe(true);
    });

    it('should return false for invalid language for framework', () => {
      expect(WizardValidator.isCompatible('web', 'cypress', 'java')).toBe(false);
      expect(WizardValidator.isCompatible('api', 'restassured', 'python')).toBe(false);
      expect(WizardValidator.isCompatible('mobile', 'espresso', 'python')).toBe(false);
    });
  });

  describe('hasMatchingTemplate', () => {
    it('should return true for valid complete configuration', () => {
      expect(
        WizardValidator.hasMatchingTemplate('web', 'selenium', 'java', 'testng', 'maven')
      ).toBe(true);
      expect(
        WizardValidator.hasMatchingTemplate('web', 'playwright', 'python', 'pytest', 'pip')
      ).toBe(true);
      expect(
        WizardValidator.hasMatchingTemplate('web', 'cypress', 'javascript', 'cypress', 'npm')
      ).toBe(true);
    });

    it('should return false for invalid test runner', () => {
      expect(
        WizardValidator.hasMatchingTemplate('web', 'selenium', 'java', 'pytest', 'maven')
      ).toBe(false);
      expect(
        WizardValidator.hasMatchingTemplate('web', 'cypress', 'javascript', 'testng', 'npm')
      ).toBe(false);
    });

    it('should return false for invalid build tool', () => {
      expect(WizardValidator.hasMatchingTemplate('web', 'selenium', 'java', 'testng', 'npm')).toBe(
        false
      );
      expect(
        WizardValidator.hasMatchingTemplate('web', 'cypress', 'javascript', 'cypress', 'maven')
      ).toBe(false);
    });

    it('should return false for incompatible framework + language', () => {
      expect(WizardValidator.hasMatchingTemplate('web', 'cypress', 'java', 'testng', 'maven')).toBe(
        false
      );
    });
  });

  describe('getTemplatePackName', () => {
    it('should generate correct template pack name', () => {
      const name = WizardValidator.getTemplatePackName(
        'web',
        'selenium',
        'java',
        'testng',
        'maven'
      );
      // Format: testingType-language-framework-testRunner-buildTool
      expect(name).toBe('web-java-selenium-testng-maven');
    });

    it('should generate correct template pack name for Playwright', () => {
      const name = WizardValidator.getTemplatePackName(
        'web',
        'playwright',
        'typescript',
        'jest',
        'npm'
      );
      // Format: testingType-language-framework-testRunner-buildTool
      expect(name).toBe('web-typescript-playwright-jest-npm');
    });
  });

  describe('getFilteredOptions', () => {
    it('should return frameworks for framework step', () => {
      const options = WizardValidator.getFilteredOptions('framework', { testingType: 'web' });
      expect(options).toContain('selenium');
      expect(options).toContain('playwright');
    });

    it('should return empty array if testingType not set', () => {
      const options = WizardValidator.getFilteredOptions('framework', {});
      expect(options).toEqual([]);
    });

    it('should return languages for language step', () => {
      const options = WizardValidator.getFilteredOptions('language', { framework: 'selenium' });
      expect(options).toContain('java');
      expect(options).toContain('python');
    });

    it('should return test runners for testRunner step', () => {
      const options = WizardValidator.getFilteredOptions('testRunner', {
        framework: 'selenium',
        language: 'java',
      });
      expect(options).toContain('testng');
      expect(options).toContain('junit5');
    });

    it('should return build tools for buildTool step', () => {
      const options = WizardValidator.getFilteredOptions('buildTool', {
        framework: 'selenium',
        language: 'java',
      });
      expect(options).toContain('maven');
      expect(options).toContain('gradle');
    });

    it('should return CI/CD tools for cicdTool step', () => {
      const options = WizardValidator.getFilteredOptions('cicdTool', { framework: 'selenium' });
      expect(options).toContain('jenkins');
      expect(options).toContain('github-actions');
    });

    it('should return reporting tools for reportingTool step', () => {
      const options = WizardValidator.getFilteredOptions('reportingTool', {
        framework: 'selenium',
        language: 'java',
      });
      expect(options).toContain('allure');
      expect(options).toContain('extent-reports');
    });

    it('should return testing patterns for testingPattern step', () => {
      const options = WizardValidator.getFilteredOptions('testingPattern', {
        framework: 'selenium',
        language: 'java',
      });
      expect(options).toContain('page-object-model');
      expect(options).toContain('bdd');
    });

    it('should return empty array for unknown step', () => {
      const options = WizardValidator.getFilteredOptions('unknown', { testingType: 'web' });
      expect(options).toEqual([]);
    });
  });

  describe('resetInvalidSelections', () => {
    it('should reset framework when testing type changes to incompatible', () => {
      const config = {
        testingType: 'api',
        framework: 'selenium', // Invalid for API
        language: 'java',
        testRunner: 'testng',
        buildTool: 'maven',
      };
      const result = WizardValidator.resetInvalidSelections(config);
      expect(result.framework).toBe('');
      expect(result.language).toBe('');
      expect(result.testRunner).toBe('');
      expect(result.buildTool).toBe('');
    });

    it('should reset language when framework changes to incompatible', () => {
      const config = {
        testingType: 'web',
        framework: 'cypress',
        language: 'java', // Invalid for Cypress
        testRunner: 'testng',
        buildTool: 'maven',
      };
      const result = WizardValidator.resetInvalidSelections(config);
      expect(result.language).toBe('');
      expect(result.testRunner).toBe('');
      expect(result.buildTool).toBe('');
    });

    it('should reset test runner when language changes', () => {
      const config = {
        testingType: 'web',
        framework: 'selenium',
        language: 'python',
        testRunner: 'testng', // Invalid for Python
        buildTool: 'pip',
      };
      const result = WizardValidator.resetInvalidSelections(config);
      expect(result.testRunner).toBe('');
    });

    it('should reset build tool when language changes', () => {
      const config = {
        testingType: 'web',
        framework: 'selenium',
        language: 'python',
        testRunner: 'pytest',
        buildTool: 'maven', // Invalid for Python
      };
      const result = WizardValidator.resetInvalidSelections(config);
      expect(result.buildTool).toBe('');
    });

    it('should keep valid selections unchanged', () => {
      const config = {
        testingType: 'web',
        framework: 'selenium',
        language: 'java',
        testRunner: 'testng',
        buildTool: 'maven',
        cicdTool: 'jenkins',
        reportingTool: 'allure',
        testingPattern: 'page-object-model',
      };
      const result = WizardValidator.resetInvalidSelections(config);
      expect(result).toEqual(config);
    });

    it('should reset reporting tool when framework/language changes', () => {
      const config = {
        testingType: 'web',
        framework: 'selenium',
        language: 'java',
        reportingTool: 'pytest-html', // Invalid for Java
      };
      const result = WizardValidator.resetInvalidSelections(config);
      expect(result.reportingTool).toBe('');
    });

    it('should reset testing pattern when framework/language changes', () => {
      const config = {
        testingType: 'api',
        framework: 'restassured',
        language: 'java',
        testingPattern: 'page-object-model', // Invalid for RestAssured
      };
      const result = WizardValidator.resetInvalidSelections(config);
      expect(result.testingPattern).toBe('');
    });
  });
});

describe('validationLabels', () => {
  describe('Testing Types Labels', () => {
    it('should have labels for all testing types', () => {
      expect(validationLabels.testingTypes.web).toBe('Web Applications');
      expect(validationLabels.testingTypes.mobile).toBe('Mobile Applications');
      expect(validationLabels.testingTypes.api).toBe('API Testing');
      expect(validationLabels.testingTypes.desktop).toBe('Desktop Applications');
    });
  });

  describe('Framework Labels', () => {
    it('should have labels for web frameworks', () => {
      expect(validationLabels.frameworks.selenium).toBe('Selenium WebDriver');
      expect(validationLabels.frameworks.playwright).toBe('Playwright');
      expect(validationLabels.frameworks.cypress).toBe('Cypress');
    });

    it('should have labels for mobile frameworks', () => {
      expect(validationLabels.frameworks.appium).toBe('Appium');
      expect(validationLabels.frameworks.espresso).toBe('Espresso');
      expect(validationLabels.frameworks.xcuitest).toBe('XCUITest');
    });

    it('should have labels for API frameworks', () => {
      expect(validationLabels.frameworks.restassured).toBe('REST Assured');
      expect(validationLabels.frameworks.requests).toBe('Python Requests');
      expect(validationLabels.frameworks.supertest).toBe('Supertest');
      expect(validationLabels.frameworks.restsharp).toBe('RestSharp');
    });
  });

  describe('Language Labels', () => {
    it('should have labels for all languages', () => {
      expect(validationLabels.languages.java).toBe('Java');
      expect(validationLabels.languages.python).toBe('Python');
      expect(validationLabels.languages.javascript).toBe('JavaScript');
      expect(validationLabels.languages.typescript).toBe('TypeScript');
      expect(validationLabels.languages.csharp).toBe('C#');
      expect(validationLabels.languages.swift).toBe('Swift');
    });
  });

  describe('Test Runner Labels', () => {
    it('should have labels for all test runners', () => {
      expect(validationLabels.testRunners.junit5).toBe('JUnit 5');
      expect(validationLabels.testRunners.testng).toBe('TestNG');
      expect(validationLabels.testRunners.pytest).toBe('PyTest');
      expect(validationLabels.testRunners.jest).toBe('Jest');
      expect(validationLabels.testRunners.mocha).toBe('Mocha');
      expect(validationLabels.testRunners.nunit).toBe('NUnit');
    });
  });

  describe('Build Tool Labels', () => {
    it('should have labels for all build tools', () => {
      expect(validationLabels.buildTools.maven).toBe('Apache Maven');
      expect(validationLabels.buildTools.gradle).toBe('Gradle');
      expect(validationLabels.buildTools.pip).toBe('pip');
      expect(validationLabels.buildTools.npm).toBe('npm');
      expect(validationLabels.buildTools.nuget).toBe('NuGet');
    });
  });

  describe('CI/CD Tool Labels', () => {
    it('should have labels for all CI/CD tools', () => {
      expect(validationLabels.cicdTools.jenkins).toBe('Jenkins');
      expect(validationLabels.cicdTools['github-actions']).toBe('GitHub Actions');
      expect(validationLabels.cicdTools['gitlab-ci']).toBe('GitLab CI');
      expect(validationLabels.cicdTools['azure-devops']).toBe('Azure DevOps');
      expect(validationLabels.cicdTools.circleci).toBe('CircleCI');
    });
  });

  describe('Testing Pattern Labels', () => {
    it('should have labels for all testing patterns', () => {
      expect(validationLabels.testingPatterns['page-object-model']).toBe('Page Object Model (POM)');
      expect(validationLabels.testingPatterns.bdd).toBe('Behavior-Driven Development (BDD)');
      expect(validationLabels.testingPatterns.fluent).toBe('Fluent Pattern');
      expect(validationLabels.testingPatterns['data-driven']).toBe('Data-Driven Testing');
    });
  });
});

describe('Framework + Language Precise Mappings', () => {
  describe('Java Framework Combinations', () => {
    it('should have correct mappings for Selenium + Java', () => {
      const key = 'selenium-java';
      expect(validationMatrix.frameworkLanguageTestRunners[key]).toContain('testng');
      expect(validationMatrix.frameworkLanguageTestRunners[key]).toContain('junit5');
      expect(validationMatrix.frameworkLanguageBuildTools[key]).toContain('maven');
      expect(validationMatrix.frameworkLanguageBuildTools[key]).toContain('gradle');
      expect(validationMatrix.frameworkLanguageReportingTools[key]).toContain('allure');
      expect(validationMatrix.frameworkLanguageReportingTools[key]).toContain('extent-reports');
      expect(validationMatrix.frameworkLanguageTestingPatterns[key]).toContain('page-object-model');
    });

    it('should have correct mappings for Playwright + Java', () => {
      const key = 'playwright-java';
      expect(validationMatrix.frameworkLanguageTestRunners[key]).toContain('testng');
      expect(validationMatrix.frameworkLanguageTestRunners[key]).toContain('junit5');
      expect(validationMatrix.frameworkLanguageBuildTools[key]).toContain('maven');
      expect(validationMatrix.frameworkLanguageBuildTools[key]).toContain('gradle');
    });

    it('should have correct mappings for RestAssured + Java', () => {
      const key = 'restassured-java';
      expect(validationMatrix.frameworkLanguageTestRunners[key]).toContain('testng');
      expect(validationMatrix.frameworkLanguageBuildTools[key]).toContain('maven');
      expect(validationMatrix.frameworkLanguageTestingPatterns[key]).toContain('fluent');
    });

    it('should have correct mappings for Appium + Java', () => {
      const key = 'appium-java';
      expect(validationMatrix.frameworkLanguageTestRunners[key]).toContain('testng');
      expect(validationMatrix.frameworkLanguageBuildTools[key]).toContain('maven');
    });

    it('should have correct mappings for Espresso + Java', () => {
      const key = 'espresso-java';
      expect(validationMatrix.frameworkLanguageTestRunners[key]).toContain('junit5');
      expect(validationMatrix.frameworkLanguageBuildTools[key]).toContain('gradle');
    });
  });

  describe('Python Framework Combinations', () => {
    it('should have correct mappings for Selenium + Python', () => {
      const key = 'selenium-python';
      expect(validationMatrix.frameworkLanguageTestRunners[key]).toContain('pytest');
      expect(validationMatrix.frameworkLanguageBuildTools[key]).toContain('pip');
      expect(validationMatrix.frameworkLanguageReportingTools[key]).toContain('pytest-html');
    });

    it('should have correct mappings for Playwright + Python', () => {
      const key = 'playwright-python';
      expect(validationMatrix.frameworkLanguageTestRunners[key]).toContain('pytest');
      expect(validationMatrix.frameworkLanguageBuildTools[key]).toContain('pip');
    });

    it('should have correct mappings for Requests + Python', () => {
      const key = 'requests-python';
      expect(validationMatrix.frameworkLanguageTestRunners[key]).toContain('pytest');
      expect(validationMatrix.frameworkLanguageBuildTools[key]).toContain('pip');
      expect(validationMatrix.frameworkLanguageTestingPatterns[key]).toContain('data-driven');
    });

    it('should have correct mappings for PyAutoGUI + Python', () => {
      const key = 'pyautogui-python';
      expect(validationMatrix.frameworkLanguageTestRunners[key]).toContain('pytest');
      expect(validationMatrix.frameworkLanguageBuildTools[key]).toContain('pip');
      expect(validationMatrix.frameworkLanguageTestingPatterns[key]).toContain(
        'functional-patterns'
      );
    });
  });

  describe('JavaScript/TypeScript Framework Combinations', () => {
    it('should have correct mappings for Cypress + JavaScript', () => {
      const key = 'cypress-javascript';
      expect(validationMatrix.frameworkLanguageTestRunners[key]).toContain('cypress');
      expect(validationMatrix.frameworkLanguageBuildTools[key]).toContain('npm');
    });

    it('should have correct mappings for WebdriverIO + JavaScript', () => {
      const key = 'webdriverio-javascript';
      expect(validationMatrix.frameworkLanguageTestRunners[key]).toContain('mocha');
      expect(validationMatrix.frameworkLanguageBuildTools[key]).toContain('npm');
    });

    it('should have correct mappings for Supertest + TypeScript', () => {
      const key = 'supertest-typescript';
      expect(validationMatrix.frameworkLanguageTestRunners[key]).toContain('jest');
      expect(validationMatrix.frameworkLanguageBuildTools[key]).toContain('npm');
      expect(validationMatrix.frameworkLanguageTestingPatterns[key]).toContain('data-driven');
    });
  });

  describe('C# Framework Combinations', () => {
    it('should have correct mappings for Selenium + C#', () => {
      const key = 'selenium-csharp';
      expect(validationMatrix.frameworkLanguageTestRunners[key]).toContain('nunit');
      expect(validationMatrix.frameworkLanguageBuildTools[key]).toContain('nuget');
    });

    it('should have correct mappings for RestSharp + C#', () => {
      const key = 'restsharp-csharp';
      expect(validationMatrix.frameworkLanguageTestRunners[key]).toContain('nunit');
      expect(validationMatrix.frameworkLanguageBuildTools[key]).toContain('nuget');
      expect(validationMatrix.frameworkLanguageTestingPatterns[key]).toContain('data-driven');
    });

    it('should have correct mappings for WinAppDriver + C#', () => {
      const key = 'winappdriver-csharp';
      expect(validationMatrix.frameworkLanguageTestRunners[key]).toContain('nunit');
      expect(validationMatrix.frameworkLanguageBuildTools[key]).toContain('nuget');
    });
  });

  describe('Swift Framework Combinations', () => {
    it('should have correct mappings for XCUITest + Swift', () => {
      const key = 'xcuitest-swift';
      expect(validationMatrix.frameworkLanguageTestRunners[key]).toContain('xctest');
      expect(validationMatrix.frameworkLanguageBuildTools[key]).toContain('spm');
    });
  });
});
