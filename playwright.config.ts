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
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "cross-env RATE_LIMIT_WINDOW_MS=60000 RATE_LIMIT_MAX=1000 RATE_LIMIT_GENERATE_MAX=1000 npm run dev",
    url: "http://localhost:5000",
    reuseExistingServer: true,
    timeout: 120000,
  },
});
