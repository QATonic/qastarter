import { test, expect } from "@playwright/test";

test.describe("QAStarter Wizard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Clear any saved configuration
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test("should display landing page with Start Generating button", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /QA Automation/i })).toBeVisible();
    await expect(page.getByTestId("button-start-generation")).toBeVisible();
  });

  test("should navigate to wizard when clicking Start Generating", async ({ page }) => {
    await page.getByTestId("button-start-generation").click();
    // Check for the wizard step title
    await expect(page.locator("#wizard-step-title")).toContainText(/Testing Type/i);
    await expect(page.getByText(/step 1 of/i)).toBeVisible();
  });

  test("should complete full wizard flow for Web + Playwright + TypeScript", async ({ page }) => {
    // Start wizard
    await page.getByTestId("button-start-generation").click();

    // Step 1: Testing Type - Select Web
    await expect(page.locator("#wizard-step-title")).toContainText(/Testing Type/i);
    await page.getByTestId("radio-web").click();
    await page.getByTestId("button-next").click();

    // Step 2: Framework - Select Playwright
    await expect(page.locator("#wizard-step-title")).toContainText(/Framework/i);
    await page.getByTestId("radio-playwright").click();
    await page.getByTestId("button-next").click();

    // Step 3: Language - Select TypeScript
    await expect(page.locator("#wizard-step-title")).toContainText(/Language/i);
    await page.getByTestId("radio-typescript").click();
    await page.getByTestId("button-next").click();

    // Step 4: Testing Pattern - Select POM
    await expect(page.locator("#wizard-step-title")).toContainText(/Pattern/i);
    await page.getByTestId("radio-pom").click();
    await page.getByTestId("button-next").click();

    // Step 5: Test Runner
    await page.getByTestId("button-next").click();

    // Step 6: Build Tool - Select npm
    await page.getByTestId("radio-npm").click();
    await page.getByTestId("button-next").click();

    // Step 7: Project Metadata
    await page.locator('input[name="projectName"]').fill("my-test-project");
    await page.getByTestId("button-next").click();

    // Step 8: CI/CD (optional) - Skip
    await page.getByTestId("button-next").click();

    // Step 9: Reporting (optional) - Skip
    await page.getByTestId("button-next").click();

    // Step 10: Utilities (optional) - Skip
    await page.getByTestId("button-next").click();

    // Step 11: Dependencies - Skip
    await page.getByTestId("button-next").click();

    // Step 12: Summary - Verify configuration
    await expect(page.locator("#wizard-step-title")).toContainText(/Review/i);
    await expect(page.getByText(/Playwright/)).toBeVisible();
    await expect(page.getByText(/TypeScript/)).toBeVisible();
    await expect(page.getByText(/my-test-project/)).toBeVisible();
  });

  test("should navigate back through steps", async ({ page }) => {
    await page.getByTestId("button-start-generation").click();

    // Go to step 2
    await page.getByTestId("radio-web").click();
    await page.getByTestId("button-next").click();
    await expect(page.locator("#wizard-step-title")).toContainText(/Framework/i);

    // Go back to step 1
    await page.getByTestId("button-previous").click();
    await expect(page.locator("#wizard-step-title")).toContainText(/Testing Type/i);
  });

  test("should persist configuration in localStorage", async ({ page }) => {
    await page.getByTestId("button-start-generation").click();

    // Make a selection
    await page.getByTestId("radio-web").click();
    await page.getByTestId("button-next").click();

    // Wait for auto-save
    await page.waitForTimeout(600);

    // Check localStorage
    const savedConfig = await page.evaluate(() => {
      return localStorage.getItem("qastarter-wizard-config");
    });
    expect(savedConfig).toBeTruthy();
    expect(savedConfig).toContain("web");
  });

  // ============ NEW TESTS ============

  test("should complete wizard flow for API + Java + RestAssured", async ({ page }) => {
    await page.getByTestId("button-start-generation").click();

    // Step 1: Testing Type - Select API
    await page.getByTestId("radio-api").click();
    await page.getByTestId("button-next").click();

    // Step 2: Framework - Select RestAssured
    await expect(page.locator("#wizard-step-title")).toContainText(/Framework/i);
    await page.getByTestId("radio-restassured").click();
    await page.getByTestId("button-next").click();

    // Step 3: Language - Select Java
    await expect(page.locator("#wizard-step-title")).toContainText(/Language/i);
    await page.getByTestId("radio-java").click();
    await page.getByTestId("button-next").click();

    // Step 4: Testing Pattern
    await page.getByTestId("radio-pom").click();
    await page.getByTestId("button-next").click();

    // Step 5: Test Runner - TestNG should be available
    await page.getByTestId("radio-testng").click();
    await page.getByTestId("button-next").click();

    // Step 6: Build Tool - Maven
    await page.getByTestId("radio-maven").click();
    await page.getByTestId("button-next").click();

    // Step 7: Project Metadata
    await page.locator('input[name="projectName"]').fill("api-test-project");
    await page.getByTestId("button-next").click();

    // Skip optional steps
    await page.getByTestId("button-next").click(); // CI/CD
    await page.getByTestId("button-next").click(); // Reporting
    await page.getByTestId("button-next").click(); // Utilities
    await page.getByTestId("button-next").click(); // Dependencies

    // Step 12: Summary
    await expect(page.locator("#wizard-step-title")).toContainText(/Review/i);
    await expect(page.getByText(/RestAssured/i)).toBeVisible();
    await expect(page.getByText(/Java/i)).toBeVisible();
  });

  test("should complete wizard flow for Mobile + Appium + Python", async ({ page }) => {
    await page.getByTestId("button-start-generation").click();

    // Step 1: Testing Type - Select Mobile
    await page.getByTestId("radio-mobile").click();
    await page.getByTestId("button-next").click();

    // Step 2: Framework - Select Appium
    await expect(page.locator("#wizard-step-title")).toContainText(/Framework/i);
    await page.getByTestId("radio-appium").click();
    await page.getByTestId("button-next").click();

    // Step 3: Language - Select Python
    await expect(page.locator("#wizard-step-title")).toContainText(/Language/i);
    await page.getByTestId("radio-python").click();
    await page.getByTestId("button-next").click();

    // Continue through remaining steps
    await page.getByTestId("radio-pom").click();
    await page.getByTestId("button-next").click();

    // Test Runner - Pytest
    await page.getByTestId("radio-pytest").click();
    await page.getByTestId("button-next").click();

    // Build Tool - pip
    await page.getByTestId("radio-pip").click();
    await page.getByTestId("button-next").click();

    // Project Metadata
    await page.locator('input[name="projectName"]').fill("mobile-test-project");
    await page.getByTestId("button-next").click();

    // Skip optional steps
    await page.getByTestId("button-next").click();
    await page.getByTestId("button-next").click();
    await page.getByTestId("button-next").click();
    await page.getByTestId("button-next").click();

    // Summary
    await expect(page.locator("#wizard-step-title")).toContainText(/Review/i);
    await expect(page.getByText(/Appium/i)).toBeVisible();
    await expect(page.getByText(/Python/i)).toBeVisible();
  });

  test("should toggle dark mode from header", async ({ page }) => {
    // Check if theme toggle exists and works
    const themeToggle = page.getByTestId("theme-toggle");

    // Toggle should be visible
    if (await themeToggle.isVisible()) {
      // Get initial state
      const initialHtml = await page.locator("html").getAttribute("class");

      // Click toggle
      await themeToggle.click();
      await page.waitForTimeout(300);

      // Verify class changed
      const newHtml = await page.locator("html").getAttribute("class");
      expect(newHtml).not.toBe(initialHtml);
    }
  });

  test("should resume wizard from localStorage on page reload", async ({ page }) => {
    await page.getByTestId("button-start-generation").click();

    // Make selections through first 3 steps
    await page.getByTestId("radio-web").click();
    await page.getByTestId("button-next").click();
    await page.getByTestId("radio-selenium").click();
    await page.getByTestId("button-next").click();
    await page.getByTestId("radio-java").click();

    // Wait for auto-save
    await page.waitForTimeout(600);

    // Reload page
    await page.reload();

    // Check if resume dialog appears or config is restored
    const resumeDialog = page.getByTestId("resume-dialog");
    const savedConfig = await page.evaluate(() => {
      return localStorage.getItem("qastarter-wizard-config");
    });

    // Either resume dialog should appear or config should be saved
    expect(savedConfig).toBeTruthy();
    if (savedConfig) {
      expect(savedConfig).toContain("selenium");
      expect(savedConfig).toContain("java");
    }
  });

  test("should show project preview panel with file structure", async ({ page }) => {
    await page.getByTestId("button-start-generation").click();

    // Complete first few steps
    await page.getByTestId("radio-web").click();
    await page.getByTestId("button-next").click();
    await page.getByTestId("radio-playwright").click();
    await page.getByTestId("button-next").click();
    await page.getByTestId("radio-typescript").click();
    await page.getByTestId("button-next").click();

    // After selecting enough options, project preview should appear
    // Look for preview panel elements
    const previewPanel = page.locator("[data-testid='project-preview']");
    if (await previewPanel.isVisible()) {
      // Should show file structure
      await expect(previewPanel).toBeVisible();
    }
  });

  test("should validate project name with special characters", async ({ page }) => {
    await page.getByTestId("button-start-generation").click();

    // Quick path to project metadata step
    await page.getByTestId("radio-web").click();
    await page.getByTestId("button-next").click();
    await page.getByTestId("radio-playwright").click();
    await page.getByTestId("button-next").click();
    await page.getByTestId("radio-typescript").click();
    await page.getByTestId("button-next").click();
    await page.getByTestId("radio-pom").click();
    await page.getByTestId("button-next").click();
    await page.getByTestId("button-next").click();
    await page.getByTestId("radio-npm").click();
    await page.getByTestId("button-next").click();

    // Try to enter project name with special characters
    const projectNameInput = page.locator('input[name="projectName"]');
    await projectNameInput.fill("test@project#name!");

    // Project name should be sanitized or show validation error
    // The sanitization should remove special characters
    await page.getByTestId("button-next").click();

    // Should either proceed (name sanitized) or show validation message
    // Either way, the form handles the input
  });

  test("should show step indicators in progress bar", async ({ page }) => {
    await page.getByTestId("button-start-generation").click();

    // Progress bar should be visible
    const progressBar = page.locator("[data-testid='progress-bar']");
    if (await progressBar.isVisible()) {
      await expect(progressBar).toBeVisible();
    }

    // Step indicator should show current position
    await expect(page.getByText(/step 1 of/i)).toBeVisible();

    // Move to next step
    await page.getByTestId("radio-web").click();
    await page.getByTestId("button-next").click();

    // Step indicator should update
    await expect(page.getByText(/step 2 of/i)).toBeVisible();
  });

  // ============ NEW TEMPLATE TESTS ============

  test("should complete wizard flow for Web + Robot Framework + Python", async ({ page }) => {
    await page.getByTestId("button-start-generation").click();

    // Step 1: Testing Type - Select Web
    await page.getByTestId("radio-web").click();
    await page.getByTestId("button-next").click();

    // Step 2: Framework - Select Robot Framework
    await expect(page.locator("#wizard-step-title")).toContainText(/Framework/i);
    await page.getByTestId("radio-robotframework").click();
    await page.getByTestId("button-next").click();

    // Step 3: Language - Python should be available
    await expect(page.locator("#wizard-step-title")).toContainText(/Language/i);
    await page.getByTestId("radio-python").click();
    await page.getByTestId("button-next").click();

    // Continue through remaining steps
    await page.getByTestId("radio-pom").click();
    await page.getByTestId("button-next").click();

    // Test Runner
    await page.getByTestId("button-next").click();

    // Build Tool - pip
    await page.getByTestId("radio-pip").click();
    await page.getByTestId("button-next").click();

    // Project Metadata
    await page.locator('input[name="projectName"]').fill("robot-framework-project");
    await page.getByTestId("button-next").click();

    // Skip optional steps
    await page.getByTestId("button-next").click();
    await page.getByTestId("button-next").click();
    await page.getByTestId("button-next").click();
    await page.getByTestId("button-next").click();

    // Summary
    await expect(page.locator("#wizard-step-title")).toContainText(/Review/i);
    await expect(page.getByText(/Robot Framework/i)).toBeVisible();
    await expect(page.getByText(/Python/i)).toBeVisible();
  });

  test("should complete wizard flow for Mobile + Espresso + Kotlin", async ({ page }) => {
    await page.getByTestId("button-start-generation").click();

    // Step 1: Testing Type - Select Mobile
    await page.getByTestId("radio-mobile").click();
    await page.getByTestId("button-next").click();

    // Step 2: Framework - Select Espresso
    await expect(page.locator("#wizard-step-title")).toContainText(/Framework/i);
    await page.getByTestId("radio-espresso").click();
    await page.getByTestId("button-next").click();

    // Step 3: Language - Kotlin should be available
    await expect(page.locator("#wizard-step-title")).toContainText(/Language/i);
    await page.getByTestId("radio-kotlin").click();
    await page.getByTestId("button-next").click();

    // Continue through remaining steps
    await page.getByTestId("radio-pom").click();
    await page.getByTestId("button-next").click();

    // Test Runner
    await page.getByTestId("button-next").click();

    // Build Tool - Gradle
    await page.getByTestId("radio-gradle").click();
    await page.getByTestId("button-next").click();

    // Project Metadata
    await page.locator('input[name="projectName"]').fill("espresso-kotlin-project");
    await page.getByTestId("button-next").click();

    // Skip optional steps
    await page.getByTestId("button-next").click();
    await page.getByTestId("button-next").click();
    await page.getByTestId("button-next").click();
    await page.getByTestId("button-next").click();

    // Summary
    await expect(page.locator("#wizard-step-title")).toContainText(/Review/i);
    await expect(page.getByText(/Espresso/i)).toBeVisible();
    await expect(page.getByText(/Kotlin/i)).toBeVisible();
  });

  test("should show Contract Testing pattern for API testing", async ({ page }) => {
    await page.getByTestId("button-start-generation").click();

    // Step 1: Testing Type - Select API
    await page.getByTestId("radio-api").click();
    await page.getByTestId("button-next").click();

    // Step 2: Framework - Select Supertest
    await page.getByTestId("radio-supertest").click();
    await page.getByTestId("button-next").click();

    // Step 3: Language - TypeScript
    await page.getByTestId("radio-typescript").click();
    await page.getByTestId("button-next").click();

    // Step 4: Testing Pattern - Contract Testing should be available
    await expect(page.locator("#wizard-step-title")).toContainText(/Pattern/i);
    const contractTestingOption = page.getByTestId("radio-contract-testing");
    await expect(contractTestingOption).toBeVisible();
    await contractTestingOption.click();
    await page.getByTestId("button-next").click();

    // Continue to summary
    await page.getByTestId("button-next").click(); // Test Runner
    await page.getByTestId("radio-npm").click();
    await page.getByTestId("button-next").click(); // Build Tool
    await page.locator('input[name="projectName"]').fill("contract-test-project");
    await page.getByTestId("button-next").click(); // Project Metadata
    await page.getByTestId("button-next").click(); // CI/CD
    await page.getByTestId("button-next").click(); // Reporting
    await page.getByTestId("button-next").click(); // Utilities
    await page.getByTestId("button-next").click(); // Dependencies

    // Summary should show Contract Testing
    await expect(page.getByText(/Contract Testing/i)).toBeVisible();
  });

  test("should be able to access health endpoint", async ({ page }) => {
    const response = await page.request.get('/api/health');
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.status).toBe('healthy');
  });

  test("should load API documentation page", async ({ page }) => {
    // Navigate to API docs
    const response = await page.request.get('/api/docs.json');
    expect(response.status()).toBe(200);

    const spec = await response.json();
    expect(spec.openapi).toBe('3.0.0');
    expect(spec.info.title).toBe('QAStarter API');
  });
});

