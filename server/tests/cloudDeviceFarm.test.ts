import { describe, it, expect, beforeEach } from 'vitest';
import { projectConfigSchema, ProjectConfig } from '@shared/schema';
import {
  validationMatrix,
  WizardValidator,
  validationLabels,
} from '@shared/validationMatrix';
import { TemplatePackEngine } from '../templates/templatePackEngine';
import { TemplatePackFile } from '../templates/types';

// ---------------------------------------------------------------------------
// 1. Schema Validation Tests
// ---------------------------------------------------------------------------
describe('Schema Validation — cloudDeviceFarm', () => {
  /** Minimal valid config used as a base for every schema test. */
  const baseConfig = {
    testingType: 'web' as const,
    framework: 'selenium',
    language: 'java',
    testingPattern: 'page-object-model',
    testRunner: 'testng',
    buildTool: 'maven',
    projectName: 'test-project',
  };

  it("should accept 'none' as a valid cloudDeviceFarm value", () => {
    const result = projectConfigSchema.safeParse({
      ...baseConfig,
      cloudDeviceFarm: 'none',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cloudDeviceFarm).toBe('none');
    }
  });

  it("should accept 'browserstack' as a valid cloudDeviceFarm value", () => {
    const result = projectConfigSchema.safeParse({
      ...baseConfig,
      cloudDeviceFarm: 'browserstack',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cloudDeviceFarm).toBe('browserstack');
    }
  });

  it("should accept 'saucelabs' as a valid cloudDeviceFarm value", () => {
    const result = projectConfigSchema.safeParse({
      ...baseConfig,
      cloudDeviceFarm: 'saucelabs',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cloudDeviceFarm).toBe('saucelabs');
    }
  });

  it("should default to 'none' when cloudDeviceFarm is not provided", () => {
    const result = projectConfigSchema.safeParse(baseConfig);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cloudDeviceFarm).toBe('none');
    }
  });

  it('should reject an invalid cloudDeviceFarm value', () => {
    const result = projectConfigSchema.safeParse({
      ...baseConfig,
      cloudDeviceFarm: 'lambdatest',
    });
    expect(result.success).toBe(false);
  });

  it('should reject a numeric cloudDeviceFarm value', () => {
    const result = projectConfigSchema.safeParse({
      ...baseConfig,
      cloudDeviceFarm: 42,
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 2. Validation Matrix Tests
// ---------------------------------------------------------------------------
describe('Validation Matrix — cloudDeviceFarms', () => {
  describe('Matrix structure', () => {
    it('should have cloudDeviceFarms entries for web and mobile testing types', () => {
      expect(validationMatrix.cloudDeviceFarms.web).toBeDefined();
      expect(validationMatrix.cloudDeviceFarms.web.length).toBeGreaterThan(0);
      expect(validationMatrix.cloudDeviceFarms.mobile).toBeDefined();
      expect(validationMatrix.cloudDeviceFarms.mobile.length).toBeGreaterThan(0);
    });

    it('should contain browserstack and saucelabs for web', () => {
      expect(validationMatrix.cloudDeviceFarms.web).toContain('browserstack');
      expect(validationMatrix.cloudDeviceFarms.web).toContain('saucelabs');
    });

    it('should contain browserstack and saucelabs for mobile', () => {
      expect(validationMatrix.cloudDeviceFarms.mobile).toContain('browserstack');
      expect(validationMatrix.cloudDeviceFarms.mobile).toContain('saucelabs');
    });

    it('should have empty arrays for api, desktop, and performance', () => {
      expect(validationMatrix.cloudDeviceFarms.api).toEqual([]);
      expect(validationMatrix.cloudDeviceFarms.desktop).toEqual([]);
      expect(validationMatrix.cloudDeviceFarms.performance).toEqual([]);
    });
  });

  describe('getFilteredOptions — cloudDeviceFarm', () => {
    it("should return browserstack and saucelabs for testingType 'web'", () => {
      const options = WizardValidator.getFilteredOptions('cloudDeviceFarm', {
        testingType: 'web',
      });
      expect(options).toContain('browserstack');
      expect(options).toContain('saucelabs');
      expect(options.length).toBe(2);
    });

    it("should return browserstack and saucelabs for testingType 'mobile'", () => {
      const options = WizardValidator.getFilteredOptions('cloudDeviceFarm', {
        testingType: 'mobile',
      });
      expect(options).toContain('browserstack');
      expect(options).toContain('saucelabs');
      expect(options.length).toBe(2);
    });

    it("should return empty array for testingType 'api'", () => {
      const options = WizardValidator.getFilteredOptions('cloudDeviceFarm', {
        testingType: 'api',
      });
      expect(options).toEqual([]);
    });

    it("should return empty array for testingType 'desktop'", () => {
      const options = WizardValidator.getFilteredOptions('cloudDeviceFarm', {
        testingType: 'desktop',
      });
      expect(options).toEqual([]);
    });

    it("should return empty array for testingType 'performance'", () => {
      const options = WizardValidator.getFilteredOptions('cloudDeviceFarm', {
        testingType: 'performance',
      });
      expect(options).toEqual([]);
    });

    it('should return empty array when testingType is not set', () => {
      const options = WizardValidator.getFilteredOptions('cloudDeviceFarm', {});
      expect(options).toEqual([]);
    });
  });

  describe('resetInvalidSelections — cloudDeviceFarm', () => {
    it("should clear cloudDeviceFarm when switching from 'web' to 'api'", () => {
      const config = {
        testingType: 'api',
        framework: 'restassured',
        language: 'java',
        testRunner: 'testng',
        buildTool: 'maven',
        cloudDeviceFarm: 'browserstack',
      };
      const result = WizardValidator.resetInvalidSelections(config);
      expect(result.cloudDeviceFarm).toBe('none');
    });

    it("should clear cloudDeviceFarm when switching from 'web' to 'desktop'", () => {
      const config = {
        testingType: 'desktop',
        framework: 'winappdriver',
        language: 'csharp',
        testRunner: 'nunit',
        buildTool: 'nuget',
        cloudDeviceFarm: 'saucelabs',
      };
      const result = WizardValidator.resetInvalidSelections(config);
      expect(result.cloudDeviceFarm).toBe('none');
    });

    it("should preserve cloudDeviceFarm when staying on 'web'", () => {
      const config = {
        testingType: 'web',
        framework: 'selenium',
        language: 'java',
        testRunner: 'testng',
        buildTool: 'maven',
        cloudDeviceFarm: 'browserstack',
      };
      const result = WizardValidator.resetInvalidSelections(config);
      expect(result.cloudDeviceFarm).toBe('browserstack');
    });

    it("should preserve cloudDeviceFarm when staying on 'mobile'", () => {
      const config = {
        testingType: 'mobile',
        framework: 'appium',
        language: 'java',
        testRunner: 'testng',
        buildTool: 'maven',
        cloudDeviceFarm: 'saucelabs',
      };
      const result = WizardValidator.resetInvalidSelections(config);
      expect(result.cloudDeviceFarm).toBe('saucelabs');
    });

    it("should not touch cloudDeviceFarm when it is 'none'", () => {
      const config = {
        testingType: 'api',
        framework: 'restassured',
        language: 'java',
        testRunner: 'testng',
        buildTool: 'maven',
        cloudDeviceFarm: 'none',
      };
      const result = WizardValidator.resetInvalidSelections(config);
      expect(result.cloudDeviceFarm).toBe('none');
    });

    it('should not touch cloudDeviceFarm when it is undefined', () => {
      const config = {
        testingType: 'api',
        framework: 'restassured',
        language: 'java',
        testRunner: 'testng',
        buildTool: 'maven',
      };
      const result = WizardValidator.resetInvalidSelections(config);
      expect(result.cloudDeviceFarm).toBeUndefined();
    });
  });

  describe('Labels — cloudDeviceFarms', () => {
    it("should have a label for 'none'", () => {
      expect(validationLabels.cloudDeviceFarms.none).toBe('None (Local)');
    });

    it("should have a label for 'browserstack'", () => {
      expect(validationLabels.cloudDeviceFarms.browserstack).toBe('BrowserStack');
    });

    it("should have a label for 'saucelabs'", () => {
      expect(validationLabels.cloudDeviceFarms.saucelabs).toBe('Sauce Labs');
    });

    it('should have labels for all cloud device farm options', () => {
      const allFarmKeys = new Set<string>();
      // Collect all farm values from the matrix
      for (const farms of Object.values(validationMatrix.cloudDeviceFarms)) {
        for (const farm of farms) {
          allFarmKeys.add(farm);
        }
      }
      // Also include 'none' which isn't in the matrix arrays but is in labels
      allFarmKeys.add('none');

      for (const key of allFarmKeys) {
        expect(
          (validationLabels.cloudDeviceFarms as Record<string, string>)[key]
        ).toBeDefined();
      }
    });
  });
});

// ---------------------------------------------------------------------------
// 3. Template Context Tests
// ---------------------------------------------------------------------------
describe('Template Context — cloudDeviceFarm', () => {
  let engine: TemplatePackEngine;

  beforeEach(() => {
    // We instantiate with a dummy packs directory; we only exercise
    // createTemplateContext which doesn't hit the filesystem.
    engine = new TemplatePackEngine('/non-existent-packs-dir');
  });

  /**
   * createTemplateContext is private, so we exercise it indirectly
   * via a small helper that invokes the private method through bracket
   * notation — acceptable in tests to avoid exposing internals.
   */
  function buildContext(configOverrides: Partial<ProjectConfig> = {}): Record<string, any> {
    const baseConfig: ProjectConfig = {
      testingType: 'web',
      framework: 'selenium',
      language: 'java',
      testingPattern: 'page-object-model',
      testRunner: 'testng',
      buildTool: 'maven',
      projectName: 'test-project',
      ...configOverrides,
    };
    // Access private method for testing
    return (engine as any).createTemplateContext(baseConfig, {});
  }

  it("should default cloudDeviceFarm to 'none' when undefined in config", () => {
    const ctx = buildContext({ cloudDeviceFarm: undefined });
    expect(ctx.cloudDeviceFarm).toBe('none');
  });

  it("should default cloudDeviceFarm to 'none' when the field is missing entirely", () => {
    // Construct config without cloudDeviceFarm property at all
    const config: any = {
      testingType: 'web',
      framework: 'selenium',
      language: 'java',
      testingPattern: 'page-object-model',
      testRunner: 'testng',
      buildTool: 'maven',
      projectName: 'test-project',
    };
    delete config.cloudDeviceFarm;
    const ctx = (engine as any).createTemplateContext(config, {});
    expect(ctx.cloudDeviceFarm).toBe('none');
  });

  it("should pass through 'browserstack' correctly", () => {
    const ctx = buildContext({ cloudDeviceFarm: 'browserstack' });
    expect(ctx.cloudDeviceFarm).toBe('browserstack');
  });

  it("should pass through 'saucelabs' correctly", () => {
    const ctx = buildContext({ cloudDeviceFarm: 'saucelabs' });
    expect(ctx.cloudDeviceFarm).toBe('saucelabs');
  });

  it("should pass through 'none' correctly", () => {
    const ctx = buildContext({ cloudDeviceFarm: 'none' });
    expect(ctx.cloudDeviceFarm).toBe('none');
  });

  it('should trim whitespace from cloudDeviceFarm value', () => {
    // Force a value with whitespace by bypassing enum narrowing
    const ctx = buildContext({ cloudDeviceFarm: '  browserstack  ' as any });
    expect(ctx.cloudDeviceFarm).toBe('browserstack');
  });

  it('should trim leading/trailing spaces from saucelabs', () => {
    const ctx = buildContext({ cloudDeviceFarm: ' saucelabs ' as any });
    expect(ctx.cloudDeviceFarm).toBe('saucelabs');
  });
});

// ---------------------------------------------------------------------------
// 4. Conditional File Inclusion Tests
// ---------------------------------------------------------------------------
describe('Conditional File Inclusion — cloudDeviceFarm', () => {
  let engine: TemplatePackEngine;

  beforeEach(() => {
    engine = new TemplatePackEngine('/non-existent-packs-dir');
  });

  /**
   * shouldIncludeFile is private, so we access it through bracket notation.
   */
  function shouldInclude(
    fileConfig: TemplatePackFile,
    configOverrides: Partial<ProjectConfig> = {}
  ): boolean {
    const baseConfig: ProjectConfig = {
      testingType: 'web',
      framework: 'selenium',
      language: 'java',
      testingPattern: 'page-object-model',
      testRunner: 'testng',
      buildTool: 'maven',
      projectName: 'test-project',
      ...configOverrides,
    };
    return (engine as any).shouldIncludeFile(fileConfig, baseConfig);
  }

  it("should include a file conditioned on cloudDeviceFarm: 'browserstack' when config matches", () => {
    const file: TemplatePackFile = {
      path: 'src/config/browserstack.conf.ts',
      isTemplate: true,
      conditional: { cloudDeviceFarm: 'browserstack' },
    };
    expect(shouldInclude(file, { cloudDeviceFarm: 'browserstack' })).toBe(true);
  });

  it("should exclude a file conditioned on cloudDeviceFarm: 'browserstack' when config is 'none'", () => {
    const file: TemplatePackFile = {
      path: 'src/config/browserstack.conf.ts',
      isTemplate: true,
      conditional: { cloudDeviceFarm: 'browserstack' },
    };
    expect(shouldInclude(file, { cloudDeviceFarm: 'none' })).toBe(false);
  });

  it("should exclude a file conditioned on cloudDeviceFarm: 'browserstack' when config is 'saucelabs'", () => {
    const file: TemplatePackFile = {
      path: 'src/config/browserstack.conf.ts',
      isTemplate: true,
      conditional: { cloudDeviceFarm: 'browserstack' },
    };
    expect(shouldInclude(file, { cloudDeviceFarm: 'saucelabs' })).toBe(false);
  });

  it("should include a file conditioned on cloudDeviceFarm: 'saucelabs' when config matches", () => {
    const file: TemplatePackFile = {
      path: 'src/config/saucelabs.conf.ts',
      isTemplate: true,
      conditional: { cloudDeviceFarm: 'saucelabs' },
    };
    expect(shouldInclude(file, { cloudDeviceFarm: 'saucelabs' })).toBe(true);
  });

  it("should exclude a file conditioned on cloudDeviceFarm: 'saucelabs' when config is 'browserstack'", () => {
    const file: TemplatePackFile = {
      path: 'src/config/saucelabs.conf.ts',
      isTemplate: true,
      conditional: { cloudDeviceFarm: 'saucelabs' },
    };
    expect(shouldInclude(file, { cloudDeviceFarm: 'browserstack' })).toBe(false);
  });

  it("should exclude a file conditioned on cloudDeviceFarm: 'saucelabs' when config is 'none'", () => {
    const file: TemplatePackFile = {
      path: 'src/config/saucelabs.conf.ts',
      isTemplate: true,
      conditional: { cloudDeviceFarm: 'saucelabs' },
    };
    expect(shouldInclude(file, { cloudDeviceFarm: 'none' })).toBe(false);
  });

  it('should include a file with no conditional regardless of cloudDeviceFarm', () => {
    const file: TemplatePackFile = {
      path: 'src/config/base.conf.ts',
      isTemplate: true,
    };
    expect(shouldInclude(file, { cloudDeviceFarm: 'none' })).toBe(true);
    expect(shouldInclude(file, { cloudDeviceFarm: 'browserstack' })).toBe(true);
    expect(shouldInclude(file, { cloudDeviceFarm: 'saucelabs' })).toBe(true);
  });

  it('should handle multiple conditionals including cloudDeviceFarm', () => {
    const file: TemplatePackFile = {
      path: 'src/config/browserstack-allure.conf.ts',
      isTemplate: true,
      conditional: {
        cloudDeviceFarm: 'browserstack',
        reportingTool: 'allure',
      },
    };
    // Both conditions met
    expect(
      shouldInclude(file, {
        cloudDeviceFarm: 'browserstack',
        reportingTool: 'allure',
      })
    ).toBe(true);
    // cloudDeviceFarm matches but reportingTool does not
    expect(
      shouldInclude(file, {
        cloudDeviceFarm: 'browserstack',
        reportingTool: 'extent-reports',
      })
    ).toBe(false);
    // reportingTool matches but cloudDeviceFarm does not
    expect(
      shouldInclude(file, {
        cloudDeviceFarm: 'none',
        reportingTool: 'allure',
      })
    ).toBe(false);
  });

  it("should exclude cloudDeviceFarm-conditioned files when config cloudDeviceFarm is undefined", () => {
    const file: TemplatePackFile = {
      path: 'src/config/browserstack.conf.ts',
      isTemplate: true,
      conditional: { cloudDeviceFarm: 'browserstack' },
    };
    // When cloudDeviceFarm is not provided at all in the config
    expect(shouldInclude(file, {})).toBe(false);
  });
});
