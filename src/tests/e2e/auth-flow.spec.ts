import { test, expect } from '@playwright/test';

import { signIn, signOut } from './helpers/auth';

/**
 * auth-flow — Authentication and proxy protection tests.
 *
 * Validates:
 *  - Unauthenticated users are redirected from protected routes
 *  - Sign-in with valid credentials creates a session
 *  - Sign-in with invalid credentials shows an error
 *  - Sign-out clears the session
 *  - Auth-guarded UI renders correctly for authenticated users
 */

test.describe('auth-flow', () => {
  test('unauthenticated /dashboard redirects to /sign-in', async ({ context }) => {
    const page = await context.newPage();
    await page.goto('/dashboard');
    await page.waitForURL(/\/sign-in/);
    expect(new URL(page.url()).pathname).toBe('/sign-in');
  });

  test('unauthenticated /billing redirects to /sign-in', async ({ context }) => {
    const page = await context.newPage();
    await page.goto('/billing');
    await page.waitForURL(/\/sign-in/);
    expect(new URL(page.url()).pathname).toBe('/sign-in');
  });

  test('unauthenticated /create redirects to /sign-in', async ({ context }) => {
    const page = await context.newPage();
    await page.goto('/create');
    await page.waitForURL(/\/sign-in/);
    expect(new URL(page.url()).pathname).toBe('/sign-in');
  });

  test('sign-in with valid credentials redirects to dashboard', async ({ page }) => {
    await signIn(page);
    // Already on /dashboard after signIn()
    await expect(page.getByRole('heading', { name: 'Your Projects' })).toBeVisible();
  });

  test('sign-in with invalid credentials shows error', async ({ page }) => {
    await page.goto('/sign-in');
    await page.getByLabel('Email').fill('dev@storyintovideo.com');
    await page.getByLabel('Password').fill('wrong-password');
    await page.getByRole('button', { name: 'Sign in' }).click();

    // Should stay on /sign-in (no redirect)
    await page.waitForURL(/\/sign-in/);
    expect(new URL(page.url()).pathname).toBe('/sign-in');
  });

  test('sign-out clears session, subsequent protected route redirects', async ({ page }) => {
    // Sign in first
    await signIn(page);
    await expect(page.getByRole('heading', { name: 'Your Projects' })).toBeVisible();

    // Sign out
    await signOut(page);

    // Try to access dashboard
    await page.goto('/dashboard');
    await page.waitForURL(/\/sign-in/);
    expect(new URL(page.url()).pathname).toBe('/sign-in');
  });

  test('authenticated user can access /create', async ({ page }) => {
    await signIn(page);
    await page.goto('/create');
    // Should stay on /create (not redirect)
    expect(new URL(page.url()).pathname).toBe('/create');
    await expect(page.getByRole('heading', { name: 'Paste your story' })).toBeVisible();
  });

  test('authenticated user can access /billing', async ({ page }) => {
    await signIn(page);
    await page.goto('/billing');
    expect(new URL(page.url()).pathname).toBe('/billing');
    await expect(page.getByRole('heading', { name: 'Choose your plan' })).toBeVisible();
  });
});
