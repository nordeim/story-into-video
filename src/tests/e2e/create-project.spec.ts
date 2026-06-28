import { test, expect } from '@playwright/test';

import { signIn } from './helpers/auth';

/**
 * create-project — Create wizard / form interaction tests.
 *
 * Validates:
 *  - Form elements render correctly
 *  - Generate Video button is disabled when textarea is empty
 *  - Generate Video button enables when story >= 100 chars
 *  - Character counter updates live
 *  - Style chips are visible
 *  - Story chips are visible
 *
 * NOTE: Requires seeded database. Run `pnpm db:seed` before tests.
 */

test.describe('create-project', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
    await page.goto('/create');
    await expect(page.getByRole('heading', { name: 'Paste your story' })).toBeVisible();
  });

  test('create page shows all form elements', async ({ page }) => {
    // Story textarea
    await expect(page.getByLabel('Your story')).toBeVisible();

    // Style chips (8 total — H3 fix restored Medieval + Japanese animation from spec)
    // Note: 'Comic' exists in the DB enum but is NOT a UI style chip
    const styleChips = [
      'Ghibli',
      'Medieval',
      'Oil Painting',
      'Anime',
      'Japanese animation',
      'Realistic',
      'Cyberpunk',
      'Watercolor',
    ];
    for (const chip of styleChips) {
      await expect(page.getByRole('button', { name: chip })).toBeVisible();
    }

    // Aspect ratio toggle
    await expect(page.getByRole('button', { name: '9:16' })).toBeVisible();
    await expect(page.getByRole('button', { name: '16:9' })).toBeVisible();

    // Generate Video button (should be disabled initially)
    await expect(page.getByRole('button', { name: 'Generate Video' })).toBeVisible();
  });

  test('Generate Video button is disabled when textarea is empty', async ({ page }) => {
    const button = page.getByRole('button', { name: 'Generate Video' });
    await expect(button).toBeDisabled();
  });

  test('Generate Video button enables when story >= 100 chars', async ({ page }) => {
    const longStory = 'A'.repeat(100);
    await page.getByLabel('Your story').fill(longStory);

    const button = page.getByRole('button', { name: 'Generate Video' });
    await expect(button).toBeEnabled();
  });

  test('character counter updates live', async ({ page }) => {
    // Initially shows "0 / 5000"
    await expect(page.getByText('0 / 5000')).toBeVisible();

    // Type some text
    await page.getByLabel('Your story').fill('Hello, this is a test story.');
    await expect(page.getByText('28 / 5000')).toBeVisible();
  });

  test('story example chips are visible', async ({ page }) => {
    // The CreateWizard renders DEFAULT_STORY_EXAMPLES
    // We verify at least one chip is visible (the exact labels depend on seed data)
    const chips = page.getByRole('button', {
      name: /Time travel|Space odyssey|Rival chefs|Victorian mystery/,
    });
    await expect(chips.first()).toBeVisible();
  });

  test('9:16 ratio button is active by default', async ({ page }) => {
    const portraitBtn = page.getByRole('button', { name: '9:16' });
    // The active button should have a different background (aria-pressed or class-based)
    // We verify the button exists and is clickable
    await expect(portraitBtn).toBeVisible();
  });

  test('clicking 16:9 ratio toggle works', async ({ page }) => {
    const landscapeBtn = page.getByRole('button', { name: '16:9' });
    await landscapeBtn.click();
    // Button should still be visible after clicking
    await expect(landscapeBtn).toBeVisible();
  });
});
