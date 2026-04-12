import { test, expect } from '@playwright/test';

/**
 * Lightweight smoke tests that don't depend on any specific UI flow.
 *
 * These are the survivors from the legacy `wizard.spec.ts` — everything else
 * in that file was testing a step-by-step wizard UI that was replaced by the
 * single-page Express Generator at `/express`. The wizard-specific coverage
 * now lives in `express-generator.spec.ts`.
 *
 * Keep this file short. It should verify:
 *   1. The landing page renders the expected heading + call-to-action
 *   2. The dark-mode toggle actually flips the html class
 *   3. The public `/api/v1/health` endpoint is up
 *   4. The Swagger OpenAPI spec is reachable
 */

test.describe('QAStarter smoke', () => {
  test.beforeEach(async ({ page }) => {
    // Re-navigate instead of reload to dodge a Firefox-specific stall
    // on the Vite HMR websocket during page.reload() under parallel load.
    await page.goto('/');
    await page.evaluate(() => {
      try {
        localStorage.clear();
      } catch {
        // ignore
      }
    });
    await page.goto('/');
  });

  test('landing page renders heading and primary CTA', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /QA Automation/i })).toBeVisible();
    await expect(page.getByTestId('button-start-generation')).toBeVisible();
  });

  test('dark-mode toggle flips the html class', async ({ page }) => {
    // The header renders two theme toggles (desktop + mobile menu) — use the
    // first visible one. Strict mode would otherwise fail on the duplicate.
    const themeToggle = page.getByTestId('button-theme-toggle').first();
    await expect(themeToggle).toBeVisible();

    const initialClass = (await page.locator('html').getAttribute('class')) ?? '';
    await themeToggle.click();
    // Use Playwright auto-retry assertion instead of hardcoded timeout
    if (initialClass.includes('dark')) {
      await expect(page.locator('html')).not.toHaveClass(/dark/, { timeout: 2000 });
    } else {
      await expect(page.locator('html')).toHaveClass(/dark/, { timeout: 2000 });
    }
  });

  test('GET /api/v1/health responds with healthy status', async ({ page }) => {
    const response = await page.request.get('/api/v1/health');
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.status).toBe('healthy');
  });

  test('OpenAPI spec at /api/docs.json is valid', async ({ page }) => {
    const response = await page.request.get('/api/docs.json');
    expect(response.status()).toBe(200);

    const spec = await response.json();
    expect(spec.openapi).toBe('3.0.0');
    expect(spec.info.title).toBe('QAStarter API');
  });
});
