import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E test configuration.
 * Targets Chromium only (cross-browser visual QA is manual per PRD §13.5).
 * Auto-starts `pnpm dev` if not already running.
 *
 * Projects:
 *   - auth: Tests that don't require auth state (sign-in, redirects)
 *   - app: Tests that require an authenticated session
 *   - marketing: Static page tests (no auth needed)
 */
export default defineConfig({
  testDir: './src/tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'auth',
      testMatch: /(auth-flow|seed-data)\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'app',
      testMatch: /(dashboard|project-detail|create-project|billing)\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3000',
      },
    },
    {
      name: 'marketing',
      testMatch: /(hero-cta|faq-accordion|mobile-nav)\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
