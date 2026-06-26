import { test, expect } from '@playwright/test';

test.describe('FAQ accordion behavior', () => {
  test('clicking a question expands the answer', async ({ page }) => {
    await page.goto('/#faq-heading');

    const firstQuestion = page.getByRole('button', {
      name: /What kind of stories/i,
    });
    await firstQuestion.click();

    const answer = page.getByText(/You can turn any narrative into video/i);
    await expect(answer).toBeVisible();
  });

  test('opening a second item closes the first (single-open)', async ({ page }) => {
    await page.goto('/#faq-heading');

    const firstQuestion = page.getByRole('button', {
      name: /What kind of stories/i,
    });
    const secondQuestion = page.getByRole('button', {
      name: /How does AI maintain character/i,
    });

    await firstQuestion.click();
    await expect(page.getByText(/You can turn any narrative/i)).toBeVisible();

    await secondQuestion.click();
    // First answer should now be hidden
    await expect(page.getByText(/You can turn any narrative/i)).not.toBeVisible();
    await expect(page.getByText(/proprietary character-locking system/i)).toBeVisible();
  });

  test('all 6 FAQ questions are present', async ({ page }) => {
    await page.goto('/#faq-heading');

    const questions = [
      /What kind of stories/i,
      /How does AI maintain character/i,
      /Do I own the copyright/i,
      /Can I customize the visual style/i,
      /How long does it take/i,
      /What languages are supported/i,
    ];

    for (const q of questions) {
      await expect(page.getByRole('button', { name: q })).toBeVisible();
    }
  });
});
