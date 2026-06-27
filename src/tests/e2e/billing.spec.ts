import { test, expect } from '@playwright/test';

import { signIn } from './helpers/auth';

/**
 * billing — Billing page plan table tests.
 *
 * Validates:
 *  - 4 plan tiers are displayed
 *  - Free plan shows "Current plan" indicator
 *  - Paid tiers show upgrade buttons
 *  - Back to dashboard link works
 *
 * NOTE: Requires seeded database. Run `pnpm db:seed` before tests.
 */

test.describe('billing', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
    await page.goto('/billing');
    await expect(page.getByRole('heading', { name: 'Choose your plan' })).toBeVisible();
  });

  test('billing page shows all 4 plan tiers', async ({ page }) => {
    // Plan headings are <h2> with capitalize class
    await expect(page.getByRole('heading', { name: 'Free' })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Creator' }),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Pro' })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Studio' }),
    ).toBeVisible();
  });

  test('Free plan shows "Current plan" text', async ({ page }) => {
    await expect(page.getByText('Current plan')).toBeVisible();
  });

  test('Creator plan shows upgrade button', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: 'Upgrade to creator' }),
    ).toBeVisible();
  });

  test('Pro plan shows upgrade button', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: 'Upgrade to pro' }),
    ).toBeVisible();
  });

  test('Studio plan shows upgrade button', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: 'Upgrade to studio' }),
    ).toBeVisible();
  });

  test('back to dashboard link works', async ({ page }) => {
    await page.getByRole('link', { name: /Back to dashboard/i }).click();
    await page.waitForURL('/dashboard');
    expect(new URL(page.url()).pathname).toBe('/dashboard');
  });
});
