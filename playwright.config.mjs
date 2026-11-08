import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30000,
  retries: 0,
  use: {
    baseURL: "http://localhost:3099",
    screenshot: "on",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npx next dev --port 3099",
    port: 3099,
    timeout: 60000,
    reuseExistingServer: true,
    env: {
      // No MONGODB_URI — pages with DB calls return safe fallbacks
      PUBLIC_REGISTRATION_ENABLED: "false",
      AUTH_SESSION_SECRET: "test-secret-for-playwright-only-not-production",
      NODE_ENV: "development",
    },
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
});
