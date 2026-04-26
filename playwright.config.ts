import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // Disable parallel to avoid rate limiting
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 2, // Reduce workers locally
  reporter: "html",
  timeout: 60000,
  use: {
    baseURL: "http://localhost:5000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    actionTimeout: 15000,
  },
  projects: [
    // API tests run once (no browser rendering needed)
    {
      name: "api",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /api\.spec\.ts/,
    },
    // UI tests run across all browsers
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /(smoke|dependency-search|express-generator)\.spec\.ts/,
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
      testMatch: /(smoke|dependency-search|express-generator)\.spec\.ts/,
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
      testMatch: /(smoke|dependency-search|express-generator)\.spec\.ts/,
    },
  ],
  // NOTE: High rate limits are test-only overrides — do NOT use these values in production
  webServer: {
    command: "cross-env RATE_LIMIT_WINDOW_MS=60000 RATE_LIMIT_MAX=1000 RATE_LIMIT_GENERATE_MAX=1000 npm run dev",
    url: "http://localhost:5000",
    reuseExistingServer: true,
    timeout: 120000,
  },
});
