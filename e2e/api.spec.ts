import { test, expect } from '@playwright/test';

test.describe('QAStarter API', () => {
  test('GET /api/v1/metadata should return valid metadata', async ({ request }) => {
    const response = await request.get('/api/v1/metadata');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('testingTypes');
    expect(data.data).toHaveProperty('frameworks');
    expect(data.data).toHaveProperty('languages');
    expect(data.data).toHaveProperty('buildTools');
    expect(data.data).toHaveProperty('testRunners');

    // Verify some expected values exist in the arrays
    const testingTypeIds = data.data.testingTypes.map((t: any) => t.id);
    expect(testingTypeIds).toContain('web');
    expect(testingTypeIds).toContain('api');

    const frameworkIds = data.data.frameworks.map((f: any) => f.id);
    expect(frameworkIds).toContain('playwright');
    expect(frameworkIds).toContain('selenium');

    const languageIds = data.data.languages.map((l: any) => l.id);
    expect(languageIds).toContain('typescript');
    expect(languageIds).toContain('java');
  });

  test('GET /api/v1/config/options should return wizard options', async ({ request }) => {
    const response = await request.get('/api/v1/config/options');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('testingTypes');
    expect(data.data).toHaveProperty('tools');
    expect(data.data).toHaveProperty('languages');
    expect(data.data).toHaveProperty('buildTools');
  });

  test('POST /api/project-preview should return file structure', async ({ request }) => {
    const response = await request.post('/api/project-preview', {
      data: {
        testingType: 'web',
        framework: 'playwright',
        language: 'typescript',
        testingPattern: 'pom',
        testRunner: 'jest',
        buildTool: 'npm',
        projectName: 'test-project',
        cicdTool: '',
        reportingTool: '',
        utilities: {},
      },
    });
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('projectStructure');
    expect(data.data).toHaveProperty('totalFiles');
    expect(data.data.totalFiles).toBeGreaterThan(0);
  });

  test('POST /api/generate-project should return zip file', async ({ request }) => {
    const response = await request.post('/api/generate-project', {
      data: {
        testingType: 'web',
        framework: 'playwright',
        language: 'typescript',
        testingPattern: 'pom',
        testRunner: 'jest',
        buildTool: 'npm',
        projectName: 'test-project',
        cicdTool: '',
        reportingTool: '',
        utilities: {},
      },
    });
    expect(response.ok()).toBeTruthy();

    // Should return a zip file
    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('application/zip');

    const contentDisposition = response.headers()['content-disposition'];
    expect(contentDisposition).toContain('test-project');
    expect(contentDisposition).toContain('.zip');
  });

  test('POST /api/generate-project with invalid config should return error', async ({
    request,
  }) => {
    const response = await request.post('/api/generate-project', {
      data: {
        testingType: 'invalid',
        framework: 'invalid',
        language: 'invalid',
        projectName: 'test',
      },
    });

    // Should return 400 error
    expect(response.status()).toBe(400);
  });

  test('POST /api/validate-config should validate configuration', async ({ request }) => {
    // Valid config
    const validResponse = await request.post('/api/validate-config', {
      data: {
        testingType: 'web',
        framework: 'playwright',
        language: 'typescript',
        testingPattern: 'pom',
        testRunner: 'jest',
        buildTool: 'npm',
        projectName: 'test-project',
      },
    });
    expect(validResponse.ok()).toBeTruthy();
    const validData = await validResponse.json();
    expect(validData.isValid).toBe(true);

    // Invalid config
    const invalidResponse = await request.post('/api/validate-config', {
      data: {
        testingType: 'web',
        framework: 'cypress',
        language: 'java', // Cypress doesn't support Java
        testingPattern: 'pom',
        testRunner: 'testng',
        buildTool: 'maven',
        projectName: 'test-project',
      },
    });
    expect(invalidResponse.ok()).toBeTruthy();
    const invalidData = await invalidResponse.json();
    expect(invalidData.isValid).toBe(false);
  });

  test('GET /api/stats should return generation statistics', async ({ request }) => {
    const response = await request.get('/api/stats');
    // Stats endpoint may return error if no database is configured
    // Just verify it returns a valid response structure
    const data = await response.json();
    expect(data).toHaveProperty('success');
  });

  test('GET /api/v1/generate should generate project via query params', async ({ request }) => {
    const response = await request.get(
      '/api/v1/generate?projectName=cli-test&testingType=web&framework=selenium&language=java&buildTool=maven&testRunner=testng&testingPattern=pom'
    );
    expect(response.ok()).toBeTruthy();

    // Should return a zip file
    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('application/zip');

    const contentDisposition = response.headers()['content-disposition'];
    expect(contentDisposition).toContain('cli-test');
  });

  // ============ NEW TESTS ============

  test('POST /api/generate-project with empty body should return 400', async ({ request }) => {
    const response = await request.post('/api/generate-project', {
      data: {},
    });
    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toHaveProperty('code');
  });

  test('POST /api/generate-project with missing required fields should return validation error', async ({
    request,
  }) => {
    const response = await request.post('/api/generate-project', {
      data: {
        projectName: 'my-project',
        // Missing testingType, framework, language, etc.
      },
    });
    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data.success).toBe(false);
  });

  test('POST /api/generate-project with special characters in project name should return error', async ({
    request,
  }) => {
    const baseConfig = {
      testingType: 'web',
      framework: 'selenium',
      language: 'java',
      testingPattern: 'pom',
      testRunner: 'testng',
      buildTool: 'maven',
      cicdTool: '',
      reportingTool: '',
      utilities: {},
    };
    const response = await request.post('/api/generate-project', {
      data: {
        ...baseConfig,
        projectName: 'test@project#name!',
      },
    });

    // Server strict validation returns 400
    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  test('POST /api/validate-config with incompatible framework/language combo', async ({
    request,
  }) => {
    // RestAssured only works with Java
    const response = await request.post('/api/validate-config', {
      data: {
        testingType: 'api',
        framework: 'restassured',
        language: 'python', // Incompatible
        testingPattern: 'pom',
        testRunner: 'pytest',
        buildTool: 'pip',
        projectName: 'test',
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.isValid).toBe(false);
  });

  test('POST /api/project-preview with valid Java config should return Maven structure', async ({
    request,
  }) => {
    const response = await request.post('/api/project-preview', {
      data: {
        testingType: 'web',
        framework: 'selenium',
        language: 'java',
        testingPattern: 'pom',
        testRunner: 'testng',
        buildTool: 'maven',
        projectName: 'java-project',
        cicdTool: '',
        reportingTool: '',
        utilities: {},
      },
    });
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.totalFiles).toBeGreaterThan(0);

    // Should contain pom.xml for Maven projects
    const fileNames = JSON.stringify(data.data.projectStructure);
    expect(fileNames).toContain('pom.xml');
  });

  test('GET /api/v1/generate with minimal params should use defaults', async ({ request }) => {
    const response = await request.get('/api/v1/generate?projectName=minimal-test');
    expect(response.ok()).toBeTruthy();

    // Should return a zip file with defaults applied
    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('application/zip');
  });

  test('POST /api/generate-project with utilities should include utility files', async ({
    request,
  }) => {
    const response = await request.post('/api/generate-project', {
      data: {
        testingType: 'web',
        framework: 'selenium',
        language: 'java',
        testingPattern: 'pom',
        testRunner: 'testng',
        buildTool: 'maven',
        projectName: 'utils-test',
        cicdTool: '',
        reportingTool: '',
        utilities: {
          configReader: true,
          screenshotUtility: true,
          logger: true,
        },
      },
    });
    expect(response.ok()).toBeTruthy();

    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('application/zip');
  });

  test('GET /api/v1/config/options should return complete config data', async ({
    request,
  }) => {
    const response = await request.get('/api/v1/config/options');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);
    // Verify the data has the expected structure
    expect(data.data).toHaveProperty('testingTypes');
    expect(data.data).toHaveProperty('tools');
    expect(data.data).toHaveProperty('languages');
    expect(data.data).toHaveProperty('buildTools');
    expect(data.data).toHaveProperty('testRunners');
  });

  test('POST /api/generate-project for different testing types', async ({ request }) => {
    // Test API testing type
    const apiResponse = await request.post('/api/generate-project', {
      data: {
        testingType: 'api',
        framework: 'restassured',
        language: 'java',
        testingPattern: 'pom',
        testRunner: 'testng',
        buildTool: 'maven',
        projectName: 'api-test-project',
        cicdTool: '',
        reportingTool: '',
        utilities: {},
      },
    });
    expect(apiResponse.ok()).toBeTruthy();
    expect(apiResponse.headers()['content-type']).toContain('application/zip');

    // Test Mobile testing type
    const mobileResponse = await request.post('/api/generate-project', {
      data: {
        testingType: 'mobile',
        framework: 'appium',
        language: 'java',
        testingPattern: 'pom',
        testRunner: 'testng',
        buildTool: 'maven',
        projectName: 'mobile-test-project',
        cicdTool: '',
        reportingTool: '',
        utilities: {},
      },
    });
    expect(mobileResponse.ok()).toBeTruthy();
    expect(mobileResponse.headers()['content-type']).toContain('application/zip');
  });

  test('POST /api/generate-project with very long project name should handle gracefully', async ({
    request,
  }) => {
    const longName = 'a'.repeat(200); // Very long name
    const response = await request.post('/api/generate-project', {
      data: {
        testingType: 'web',
        framework: 'selenium',
        language: 'java',
        testingPattern: 'pom',
        testRunner: 'testng',
        buildTool: 'maven',
        projectName: longName,
        cicdTool: '',
        reportingTool: '',
        utilities: {},
      },
    });

    // Should either succeed with truncated name, return validation error, or rate limit
    // When running against existing dev server, rate limits might be hit
    expect([200, 400, 429]).toContain(response.status());
  });

  test('POST /api/generate-project with empty project name should return error', async ({
    request,
  }) => {
    const response = await request.post('/api/generate-project', {
      data: {
        testingType: 'web',
        framework: 'selenium',
        language: 'java',
        testingPattern: 'pom',
        testRunner: 'testng',
        buildTool: 'maven',
        projectName: '',
        cicdTool: '',
        reportingTool: '',
        utilities: {},
      },
    });

    // Empty project name should be rejected (400) or rate limited (429)
    expect([400, 429]).toContain(response.status());
  });
});
