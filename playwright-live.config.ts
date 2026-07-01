import { defineConfig, devices } from '@playwright/test';

/**
 * Dedicated Playwright config for live site E2E tests.
 * Unlike the main playwright.config.ts, this has no testMatch filters
 * and targets the live deployment URL instead of localhost:3000.
 */
export default defineConfig({
  testDir: './src/tests/e2e',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'https://storyintovideo.jesspete.shop',
    trace: 'on-first-retry',
    ...devices['Desktop Chrome'],
  },
  testMatch: /live-site\.spec\.ts/,
});
