import { test, expect } from '@playwright/test';

import { signIn } from './helpers/auth';

/**
 * project-detail — Project detail page tests.
 *
 * Validates:
 *  - Project title, story, and pipeline status display
 *  - Back to dashboard link works
 *  - Pipeline status text for "completed" state
 *
 * NOTE: Requires seeded database. Run `pnpm db:seed` before tests.
 */

test.describe('project-detail', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test('project detail shows title, story, and status', async ({ page }) => {
    // Navigate to Dragons Quest (completed project)
    await page
      .getByRole('link', { name: /Dragon/ })
      .first()
      .click();
    await page.waitForURL(/\/projects\/[a-f0-9-]+/);

    // Verify title
    await expect(page.getByRole('heading', { name: /Dragon/ })).toBeVisible();

    // Verify story section exists
    await expect(page.getByRole('heading', { name: 'Your Story' })).toBeVisible();

    // Verify pipeline status section
    await expect(page.getByRole('heading', { name: 'Pipeline Status' })).toBeVisible();

    // Verify completed status text
    await expect(page.getByText('Status: completed')).toBeVisible();
  });

  test('completed project shows video ready status', async ({ page }) => {
    await page
      .getByRole('link', { name: /Dragon/ })
      .first()
      .click();
    await page.waitForURL(/\/projects\/[a-f0-9-]+/);

    await expect(page.getByText(/Your video is ready!/i)).toBeVisible();
  });

  test('pending project shows queued for processing status', async ({ page }) => {
    await page
      .getByRole('link', { name: /Ocean Mystery/ })
      .first()
      .click();
    await page.waitForURL(/\/projects\/[a-f0-9-]+/);

    await expect(page.getByText(/queued for processing/i)).toBeVisible();
  });

  test('back to dashboard link works', async ({ page }) => {
    await page
      .getByRole('link', { name: /Dragon/ })
      .first()
      .click();
    await page.waitForURL(/\/projects\/[a-f0-9-]+/);

    await page.getByRole('link', { name: /Back to dashboard/i }).click();
    await page.waitForURL('/dashboard');
    expect(new URL(page.url()).pathname).toBe('/dashboard');
  });

  test('project detail shows style, ratio, and status metadata', async ({ page }) => {
    await page
      .getByRole('link', { name: /Dragon/ })
      .first()
      .click();
    await page.waitForURL(/\/projects\/[a-f0-9-]+/);

    await expect(page.getByText('Style: anime')).toBeVisible();
    await expect(page.getByText('Ratio: portrait')).toBeVisible();
  });
});
