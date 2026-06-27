import { test, expect } from '@playwright/test';

test.describe('Hero CTA navigation', () => {
  test('Hero "Start Creating" CTA links to /create', async ({ page }) => {
    await page.goto('/');
    const cta = page.getByRole('link', { name: /Start Creating/i }).first();
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href', '/create');
  });

  test('Final CTA "Start Creating — It\'s Free" links to /create', async ({ page }) => {
    await page.goto('/');
    const cta = page.getByRole('link', {
      name: /Start Creating — It's Free/i,
    });
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href', '/create');
  });

  test('Navbar "Get Started" links to /sign-up (desktop)', async ({ page }) => {
    await page.goto('/');
    await page.setViewportSize({ width: 1440, height: 900 });
    const cta = page.getByRole('link', { name: /^Get Started$/ });
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href', '/sign-up');
  });
});
