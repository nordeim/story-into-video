import { test, expect } from '@playwright/test';

test.describe('Mobile navigation', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('hamburger is visible on mobile and opens Sheet', async ({ page }) => {
    await page.goto('/');
    const hamburger = page.getByRole('button', { name: /Open menu/i });
    await expect(hamburger).toBeVisible();
    await hamburger.click();

    const sheet = page.locator('[role="dialog"]');
    await expect(sheet).toBeVisible();
  });

  test('Sheet contains all 4 nav links', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Open menu/i }).click();

    const sheet = page.locator('[role="dialog"]');
    for (const label of ['Features', 'Pricing', 'Blog', 'Contact']) {
      await expect(sheet.getByRole('link', { name: label })).toBeVisible();
    }
  });

  test('Sheet contains Sign in and Get Started', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Open menu/i }).click();

    const sheet = page.locator('[role="dialog"]');
    await expect(sheet.getByRole('link', { name: /Sign in/i })).toBeVisible();
    await expect(sheet.getByRole('link', { name: /Get Started/i })).toBeVisible();
  });

  test('Close button closes the Sheet', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Open menu/i }).click();
    const sheet = page.locator('[role="dialog"]');
    await expect(sheet).toBeVisible();

    await page.getByRole('button', { name: /Close menu/i }).click();
    await expect(sheet).not.toBeVisible();
  });

  test('desktop nav links are hidden on mobile', async ({ page }) => {
    await page.goto('/');
    // Desktop nav links are in a div with class containing "hidden sm:flex"
    // On 375px viewport, they should not be visible
    const desktopNavContainer = page.locator('nav[aria-label="Main"] > div.hidden');
    await expect(desktopNavContainer).not.toBeVisible();
  });
});
