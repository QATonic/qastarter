import { test, expect, type Page } from '@playwright/test';

/**
 * E2E tests for the Express Generator dependency search feature.
 *
 * These tests mock the `/api/v1/dependencies/*` endpoints so the
 * suite never hits Maven Central or the public npm registry from
 * CI. The goal is to exercise the full add-dep / version-pick /
 * URL-persistence UX without external flakiness.
 */

/**
 * Helper: pick a stack option in the Express Generator config panel.
 *
 * The OptionButtonGroup component renders each option as
 * `<button role="radio">` so we have to look up by radio role, not button.
 * Labels come from `shared/validationMatrix.ts:validationLabels`.
 */
async function pickOption(page: Page, label: RegExp | string): Promise<void> {
  const opt = page.getByRole('radio', { name: label }).first();
  await opt.waitFor({ state: 'visible' });
  await opt.click();
}

test.describe('Express Generator — Dependency Search', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear persisted state from any previous run
    await context.clearCookies();
    await page.goto('/express');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
  });

  test('searches npm, adds a package, and shows it in the preview panel', async ({ page }) => {
    // Mock the npm search endpoint
    await page.route('**/api/v1/dependencies/search**', async (route) => {
      const url = new URL(route.request().url());
      const registry = url.searchParams.get('registry');
      const q = url.searchParams.get('q');
      expect(registry).toBe('npm');
      expect(q).toContain('axios');

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            registry: 'npm',
            query: q,
            count: 1,
            results: [
              {
                id: 'axios',
                registry: 'npm',
                name: 'axios',
                version: '1.6.2',
                description: 'Promise based HTTP client for the browser and node.js',
                homepage: 'https://axios-http.com',
              },
            ],
          },
        }),
      });
    });

    // Pick Web + Playwright + TypeScript so npm is the default registry
    await pickOption(page, /Web Applications/i);
    await pickOption(page, /^Playwright$/i);
    await pickOption(page, /^TypeScript$/i);

    // Search for axios
    const searchInput = page.getByPlaceholder(/search npm/i);
    await expect(searchInput).toBeVisible();
    await searchInput.fill('axios');

    // Wait for mocked result to land
    const addButton = page.getByRole('button', { name: /^Add axios$/i });
    await expect(addButton).toBeVisible({ timeout: 5000 });

    await addButton.click();

    // The button should flip to "Added"
    await expect(page.getByRole('button', { name: /axios already added/i })).toBeVisible();

    // And a chip should appear in the "Added Dependencies" section
    await expect(page.getByText(/Added Dependencies \(1\)/i)).toBeVisible();

    // Preview panel should also surface the custom dep
    await expect(page.getByText(/Custom Dependencies/i)).toBeVisible();
  });

  test('version picker replaces the dep version with a chosen one', async ({ page }) => {
    // Mock search
    await page.route('**/api/v1/dependencies/search**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            registry: 'npm',
            query: 'lodash',
            count: 1,
            results: [
              {
                id: 'lodash',
                registry: 'npm',
                name: 'lodash',
                version: '4.17.21',
                description: 'Lodash utility library',
                homepage: 'https://lodash.com',
              },
            ],
          },
        }),
      });
    });

    // Mock versions
    await page.route('**/api/v1/dependencies/versions**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            registry: 'npm',
            id: 'lodash',
            versions: ['4.17.21', '4.17.20', '4.17.19', '4.17.15'],
          },
        }),
      });
    });

    await pickOption(page, /Web Applications/i);
    await pickOption(page, /^Playwright$/i);
    await pickOption(page, /^TypeScript$/i);

    await page.getByPlaceholder(/search npm/i).fill('lodash');

    const addButton = page.getByRole('button', { name: /^Add lodash$/i });
    await expect(addButton).toBeVisible({ timeout: 5000 });
    await addButton.click();

    // Open the version picker on the chip
    const versionTrigger = page.getByRole('button', {
      name: /Change version of lodash/i,
    });
    await expect(versionTrigger).toBeVisible();
    await versionTrigger.click();

    // Pick an older version
    await page.getByRole('button', { name: '4.17.20' }).click();

    // Chip should now show the new version
    await expect(
      page.getByRole('button', { name: /Change version of lodash, currently 4\.17\.20/i })
    ).toBeVisible();
  });

  test('persists selected dependency in the shareable URL', async ({ page }) => {
    await page.route('**/api/v1/dependencies/search**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            registry: 'npm',
            query: 'dotenv',
            count: 1,
            results: [
              {
                id: 'dotenv',
                registry: 'npm',
                name: 'dotenv',
                version: '16.3.1',
              },
            ],
          },
        }),
      });
    });

    await pickOption(page, /Web Applications/i);
    await pickOption(page, /^Playwright$/i);
    await pickOption(page, /^TypeScript$/i);

    await page.getByPlaceholder(/search npm/i).fill('dotenv');
    await page.getByRole('button', { name: /^Add dotenv$/i }).click();

    // Give the debounced URL sync (300ms) time to flush
    await page.waitForFunction(
      () => new URL(window.location.href).searchParams.get('d') !== null,
      null,
      { timeout: 5000 }
    );

    // The URL should now carry a base64url-encoded `d` param
    const depsParam = await page.evaluate(() =>
      new URL(window.location.href).searchParams.get('d')
    );
    expect(depsParam).toBeTruthy();

    // Decode and verify
    const decoded = await page.evaluate((encoded: string) => {
      let padded = encoded.replace(/-/g, '+').replace(/_/g, '/');
      while (padded.length % 4) padded += '=';
      return decodeURIComponent(escape(atob(padded)));
    }, depsParam!);

    const parsed = JSON.parse(decoded);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toMatchObject({
      id: 'dotenv',
      registry: 'npm',
      name: 'dotenv',
      version: '16.3.1',
    });
  });

  test('surfaces an error when the registry API fails', async ({ page }) => {
    await page.route('**/api/v1/dependencies/search**', async (route) => {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: { message: 'Upstream registry unavailable' },
        }),
      });
    });

    await pickOption(page, /Web Applications/i);
    await pickOption(page, /^Playwright$/i);
    await pickOption(page, /^TypeScript$/i);

    await page.getByPlaceholder(/search npm/i).fill('brokenpkg');

    // The component should surface the error message
    await expect(page.getByText(/Upstream registry unavailable/i)).toBeVisible({
      timeout: 5000,
    });
  });

  test('auto-selects Maven registry when language is Java', async ({ page }) => {
    let capturedRegistry: string | null = null;
    await page.route('**/api/v1/dependencies/search**', async (route) => {
      const url = new URL(route.request().url());
      capturedRegistry = url.searchParams.get('registry');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            registry: capturedRegistry,
            query: url.searchParams.get('q'),
            count: 1,
            results: [
              {
                id: 'com.squareup.okhttp3:okhttp',
                registry: 'maven',
                name: 'okhttp',
                group: 'com.squareup.okhttp3',
                version: '4.12.0',
              },
            ],
          },
        }),
      });
    });

    // Pick a Java-based stack
    await pickOption(page, /API Testing/i);
    await pickOption(page, /^REST Assured$/i);
    await pickOption(page, /^Java$/i);

    await page.getByPlaceholder(/search maven central/i).fill('okhttp');

    await expect(page.getByRole('button', { name: /^Add okhttp$/i })).toBeVisible({
      timeout: 5000,
    });
    expect(capturedRegistry).toBe('maven');
  });
});
