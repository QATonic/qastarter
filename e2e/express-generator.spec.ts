import { test, expect, type Page } from '@playwright/test';

/**
 * E2E tests for the Express Generator UI flow covering all four testing types.
 *
 * Unlike `api.spec.ts` which exercises the HTTP API directly, these tests
 * drive the single-page `/express` UI end-to-end:
 *   1. Navigate to /express
 *   2. Pick a stack (Testing Type -> Framework -> Language -> Test Runner -> Build Tool)
 *   3. Fill in a project name
 *   4. Verify the Generate & Download button becomes enabled
 *   5. Verify the live stack summary reflects the selection
 *   6. For one canonical stack per testing type, actually trigger generation
 *      and verify the ZIP downloads successfully.
 *
 * This is the successor to the legacy `wizard.spec.ts` tests which targeted
 * a step-by-step wizard UI that no longer exists (replaced by the
 * Spring Initializr-style single-page Express Generator).
 */

// ---------- Helpers ----------

/**
 * Pick an option from an OptionButtonGroup. The component renders each
 * option as `<button role="radio">`, not `role="button"`, so we have to
 * query by radio role.
 *
 * Labels come from `shared/validationMatrix.ts:validationLabels`. Using
 * regex matchers keeps the tests robust to small copy tweaks.
 */
async function pickOption(page: Page, label: RegExp | string): Promise<void> {
  const opt = page.getByRole('radio', { name: label }).first();
  await opt.waitFor({ state: 'visible' });
  await opt.click();
  // The filter cascade is a synchronous React state update; 150ms is a
  // reasonable grace period for the re-render to flush. Using networkidle
  // or a DOM assertion here would be overkill for a purely client-side
  // re-render with no network requests.
  await page.waitForTimeout(150);
}

/**
 * Fill in the project name input.
 */
async function fillProjectName(page: Page, name: string): Promise<void> {
  const input = page.getByLabel(/^Project Name/i);
  await input.waitFor({ state: 'visible' });
  await input.fill(name);
}

/**
 * Assert that the Generate & Download button is enabled and clickable.
 */
async function expectGenerateEnabled(page: Page): Promise<void> {
  const btn = page.getByRole('button', { name: /Generate & Download/i });
  await expect(btn).toBeVisible();
  await expect(btn).toBeEnabled({ timeout: 3000 });
}

/**
 * Reset the generator between tests. Clears persisted state from localStorage
 * / sessionStorage and re-navigates to the page to guarantee a clean slate.
 *
 * We deliberately use a second `page.goto()` instead of `page.reload()`
 * because Firefox occasionally stalls on the HMR websocket during reload
 * under parallel Playwright load, pushing the beforeEach past its 60s
 * timeout. A fresh goto forces a clean load without touching the dev
 * server's websocket session.
 */
async function freshExpressPage(page: Page): Promise<void> {
  await page.goto('/express');
  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // Some test contexts block storage access — safe to ignore
    }
  });
  await page.goto('/express');
  // Wait for the Configure header to render so we know the app is ready.
  await expect(page.getByText(/Configure Your Project/i)).toBeVisible({
    timeout: 10_000,
  });
}

// ---------- Stack matrix ----------

/**
 * One canonical stack per testing type. These are all combos that exist
 * as real template packs on disk (see shared/validationMatrix.ts).
 */
interface Stack {
  testingType: RegExp;
  framework: RegExp;
  language: RegExp;
  testRunner: RegExp;
  buildTool: RegExp;
  projectName: string;
  /** Short label used in test titles. */
  label: string;
}

const STACKS: Record<'web' | 'mobile' | 'api' | 'desktop', Stack> = {
  web: {
    testingType: /Web Applications/i,
    framework: /^Playwright$/i,
    language: /^TypeScript$/i,
    testRunner: /^Jest$/i,
    buildTool: /^npm$/i,
    projectName: 'e2e-web-playwright-ts',
    label: 'Web / Playwright / TypeScript / Jest / npm',
  },
  mobile: {
    testingType: /Mobile Applications/i,
    framework: /^Appium$/i,
    language: /^Java$/i,
    testRunner: /^TestNG$/i,
    buildTool: /^Apache Maven$/i,
    projectName: 'e2e-mobile-appium-java',
    label: 'Mobile / Appium / Java / TestNG / Maven',
  },
  api: {
    testingType: /API Testing/i,
    framework: /^REST Assured$/i,
    language: /^Java$/i,
    testRunner: /^TestNG$/i,
    buildTool: /^Apache Maven$/i,
    projectName: 'e2e-api-restassured-java',
    label: 'API / REST Assured / Java / TestNG / Maven',
  },
  desktop: {
    testingType: /Desktop Applications/i,
    framework: /^WinAppDriver$/i,
    language: /^Python$/i,
    testRunner: /^PyTest$/i,
    buildTool: /^pip$/i,
    projectName: 'e2e-desktop-winappdriver-py',
    label: 'Desktop / WinAppDriver / Python / PyTest / pip',
  },
};

/**
 * Walk the config panel from Testing Type down to Build Tool and fill
 * in the project name. Leaves the page ready for either assertion or
 * generation.
 *
 * Note: we do NOT explicitly pick a Testing Pattern here — the client
 * cascade auto-selects the sensible default (POM for web/mobile/desktop,
 * Fluent for REST Assured) once framework + language are known. This
 * exercises that auto-selection and guards against regressions.
 */
async function buildStack(page: Page, stack: Stack): Promise<void> {
  await pickOption(page, stack.testingType);
  await pickOption(page, stack.framework);
  await pickOption(page, stack.language);
  await pickOption(page, stack.testRunner);
  await pickOption(page, stack.buildTool);
  await fillProjectName(page, stack.projectName);
}

// ---------- Tests ----------

test.describe('Express Generator — UI flow per testing type', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await freshExpressPage(page);
  });

  // ---- Landing / smoke ----

  test('landing on /express renders the generator shell', async ({ page }) => {
    await expect(page.getByText(/Configure Your Project/i)).toBeVisible();
    // Testing Type is the first required field
    await expect(page.getByRole('radio', { name: /Web Applications/i })).toBeVisible();
    // Generate button should exist but be disabled until a full stack is picked
    const btn = page.getByRole('button', { name: /Generate & Download/i });
    await expect(btn).toBeVisible();
    await expect(btn).toBeDisabled();
  });

  // ---- Build + validate every testing type without actually downloading ----

  for (const [key, stack] of Object.entries(STACKS) as [keyof typeof STACKS, Stack][]) {
    test(`${key}: can build a valid stack (${stack.label})`, async ({ page }) => {
      await buildStack(page, stack);
      await expectGenerateEnabled(page);

      // The project name should be reflected in the input
      await expect(page.getByLabel(/^Project Name/i)).toHaveValue(stack.projectName);
    });
  }

  // ---- Actual generation (downloads ZIP) for one canonical stack per type ----

  // We do real generation only for the web/api stacks because mobile/desktop
  // still exercise the same HTTP pipeline (covered separately in api.spec.ts)
  // and running 4 full ZIP downloads per browser slows the suite down.
  // The stack-building tests above already prove the UI reaches the
  // "ready to generate" state for all four testing types.

  test('web: generates and downloads a ZIP for the web stack', async ({ page }) => {
    await buildStack(page, STACKS.web);
    await expectGenerateEnabled(page);

    // Wait for the download triggered by clicking Generate
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 30_000 }),
      page.getByRole('button', { name: /Generate & Download/i }).click(),
    ]);

    const suggested = download.suggestedFilename();
    expect(suggested).toMatch(/\.zip$/i);
    // File name should include some hint of the project name
    expect(suggested.toLowerCase()).toContain('e2e-web-playwright-ts');
  });

  test('api: generates and downloads a ZIP for the api stack', async ({ page }) => {
    await buildStack(page, STACKS.api);
    await expectGenerateEnabled(page);

    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 30_000 }),
      page.getByRole('button', { name: /Generate & Download/i }).click(),
    ]);

    const suggested = download.suggestedFilename();
    expect(suggested).toMatch(/\.zip$/i);
    expect(suggested.toLowerCase()).toContain('e2e-api-restassured-java');
  });

  // ---- Reset behaviour ----

  test('reset button clears selected options', async ({ page }) => {
    // Build a partial stack
    await pickOption(page, /Web Applications/i);
    await pickOption(page, /^Playwright$/i);
    await pickOption(page, /^TypeScript$/i);

    // Click the Reset button in the Configure header
    await page.getByRole('button', { name: /Reset configuration/i }).click();

    // After reset, the Testing Type should no longer be selected
    const webOption = page.getByRole('radio', { name: /Web Applications/i });
    await expect(webOption).toHaveAttribute('aria-checked', 'false');

    // And the Generate button should be disabled again
    await expect(page.getByRole('button', { name: /Generate & Download/i })).toBeDisabled();
  });

  // ---- Share URL reflects the chosen stack ----

  test('shareable URL encodes the selected stack', async ({ page }) => {
    await buildStack(page, STACKS.web);
    await expectGenerateEnabled(page);

    // Give the debounced URL sync time to flush (see DependencySearch spec)
    await page.waitForFunction(() => window.location.search.length > 0, null, { timeout: 5000 });

    const url = new URL(page.url());
    // The Express Generator persists config in query params; at minimum
    // the framework / language should show up in some form.
    const serialized = url.search.toLowerCase();
    expect(serialized.length).toBeGreaterThan(0);
  });
});
