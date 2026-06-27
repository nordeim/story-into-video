import { test, expect } from '@playwright/test';

import { signIn } from './helpers/auth';

/**
 * dashboard — Authenticated dashboard page tests.
 *
 * Validates:
 *  - Seeded projects are displayed
 *  - Project cards show correct metadata (title, style, ratio, status)
 *  - Clicking a project navigates to project detail
 *  - New Project link navigates to /create
 *
 * NOTE: These tests require the database to be seeded (pnpm db:seed).
 * The Playwright config auto-starts `pnpm dev` but does NOT auto-seed.
 * Run `pnpm db:seed` before running these tests.
 */

test.describe('dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test('dashboard shows seeded projects', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /Dragon/ }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Ocean Mystery' }),
    ).toBeVisible();
  });

  test('project cards show style, ratio, and status', async ({ page }) => {
    // Check Dragons Quest card content
    const dragonCard = page
      .getByRole('link', { name: /Dragon/ })
      .first();
    await expect(dragonCard).toContainText('anime');
    await expect(dragonCard).toContainText('portrait');
    await expect(dragonCard).toContainText('completed');

    // Check Ocean Mystery card content
    const oceanCard = page
      .getByRole('link', { name: /Ocean Mystery/ })
      .first();
    await expect(oceanCard).toContainText('realistic');
    await expect(oceanCard).toContainText('landscape');
    await expect(oceanCard).toContainText('pending');
  });

  test('clicking a project navigates to /projects/[id]', async ({ page }) => {
    await page
      .getByRole('link', { name: /Dragon/ })
      .first()
      .click();
    await page.waitForURL(/\/projects\/[a-f0-9-]+/);
    await expect(page.getByRole('heading', { name: /Dragon/ })).toBeVisible();
  });

  test('New Project link navigates to /create', async ({ page }) => {
    await page.getByRole('link', { name: 'New Project' }).click();
    await page.waitForURL('/create');
    expect(new URL(page.url()).pathname).toBe('/create');
  });

  test('dashboard shows correct heading and description', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Your Projects' })).toBeVisible();
    await expect(
      page.getByText('Manage your story-into-video projects.'),
    ).toBeVisible();
  });
});
