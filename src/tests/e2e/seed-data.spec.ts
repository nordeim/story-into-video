import { test, expect } from '@playwright/test';

import { signIn } from './helpers/auth';

/**
 * seed-data — Validate that seeded data is accessible through the UI.
 *
 * These tests confirm that the seed script (pnpm db:seed) correctly
 * populated the database and that the app can query and display it.
 *
 * NOTE: Requires seeded database. Run `pnpm db:seed` before tests.
 */

test.describe('seed-data', () => {
  test('dev user can sign in (user exists with correct bcrypt hash)', async ({ page }) => {
    await signIn(page);
    // If signIn succeeds, the user exists and password hash matches
    await expect(page.getByRole('heading', { name: 'Your Projects' })).toBeVisible();
  });

  test('seeded project 1 (Dragons Quest) exists on dashboard', async ({ page }) => {
    await signIn(page);
    await expect(
      page.getByRole('heading', { name: /Dragon/ }),
    ).toBeVisible();
  });

  test('seeded project 2 (Ocean Mystery) exists on dashboard', async ({ page }) => {
    await signIn(page);
    await expect(
      page.getByRole('heading', { name: 'Ocean Mystery' }),
    ).toBeVisible();
  });

  test('Dragons Quest is in completed status', async ({ page }) => {
    await signIn(page);
    const card = page.getByRole('link', { name: /Dragon/ }).first();
    await expect(card).toContainText('completed');
  });

  test('Ocean Mystery is in pending status', async ({ page }) => {
    await signIn(page);
    const card = page.getByRole('link', { name: /Ocean Mystery/ }).first();
    await expect(card).toContainText('pending');
  });

  test('clicking project navigates to detail page', async ({ page }) => {
    await signIn(page);
    await page
      .getByRole('link', { name: /Dragon/ })
      .first()
      .click();
    await page.waitForURL(/\/projects\/[a-f0-9-]+/);
    // Detail page shows story section
    await expect(page.getByRole('heading', { name: 'Your Story' })).toBeVisible();
  });
});
