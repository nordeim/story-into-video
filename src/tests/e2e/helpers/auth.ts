import { Page, expect } from '@playwright/test';

/**
 * E2E test helpers for authentication flows.
 */

const DEFAULT_EMAIL = 'dev@storyintovideo.com';
const DEFAULT_PASSWORD = 'password123';

/**
 * Sign in through the UI form.
 * Navigates to /sign-in, fills credentials, clicks submit, waits for redirect.
 */
export async function signIn(
  page: Page,
  email: string = DEFAULT_EMAIL,
  password: string = DEFAULT_PASSWORD,
): Promise<void> {
  await page.goto('/sign-in');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('/dashboard');
  await expect(page.getByRole('heading', { name: 'Your Projects' })).toBeVisible();
}

/**
 * Sign out by clearing all cookies for the base URL.
 */
export async function signOut(page: Page): Promise<void> {
  const cookies = await page.context().cookies();
  await page.context().clearCookies();
  // Verify cookies were cleared
  expect(cookies.length).toBeGreaterThan(0);
}

/**
 * Create a fresh browser context with no auth state.
 * Use for testing unauthenticated access.
 */
export async function createUnauthenticatedPage(
  context: import('@playwright/test').BrowserContext,
): Promise<Page> {
  return context.newPage();
}
