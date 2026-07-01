import { test, expect } from '@playwright/test';

/**
 * Live site E2E tests — Run against the production deployment.
 *
 * These tests verify that the live site (after env fix) correctly:
 *   - Returns /api/health with config.healthy: true
 *   - Redirects protected routes to /sign-in on the same host
 *   - Serves public content pages with proper HTML
 *   - Renders the auth page with sign-in form
 *   - Shows the custom 404 for unknown routes
 *
 * Run with:
 *   PLAYWRIGHT_BASE_URL=https://storyintovideo.jesspete.shop npx playwright test src/tests/e2e/live-site.spec.ts
 */

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'https://storyintovideo.jesspete.shop';

test.describe('Live site — Action 3 verification', () => {
  test('/api/health — returns healthy with config.healthy: true', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/health`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.status).toBe('healthy');
    expect(body.config.healthy).toBe(true);
    expect(body.configErrors).toBeUndefined();
    expect(body.services.database).toBe('healthy');
    expect(body.services.ffmpeg).toBe('healthy');
  });

  test('/dashboard (unauthenticated) → 307 redirect to /sign-in on same host', async ({
    context,
  }) => {
    const page = await context.newPage();
    const response = await page.goto(`${BASE_URL}/dashboard`);
    expect(response?.status()).toBe(307);
    await page.waitForURL(`${BASE_URL}/sign-in*`);
    const url = new URL(page.url());
    expect(url.pathname).toBe('/sign-in');
    expect(url.host).toBe(new URL(BASE_URL).host);
    // Critical: must NOT redirect to localhost (the original bug T1 fixed)
    expect(url.host).not.toContain('localhost');
  });

  test('/create (unauthenticated) → 307 redirect to /sign-in', async ({ context }) => {
    const page = await context.newPage();
    const response = await page.goto(`${BASE_URL}/create`);
    expect(response?.status()).toBe(307);
    await page.waitForURL(`${BASE_URL}/sign-in*`);
    expect(new URL(page.url()).pathname).toBe('/sign-in');
  });

  test('/billing (unauthenticated) → 307 redirect to /sign-in', async ({ context }) => {
    const page = await context.newPage();
    const response = await page.goto(`${BASE_URL}/billing`);
    expect(response?.status()).toBe(307);
    await page.waitForURL(`${BASE_URL}/sign-in*`);
    expect(new URL(page.url()).pathname).toBe('/sign-in');
  });

  test('/pricing — returns 200 with valid HTML', async ({ page }) => {
    await page.goto(`${BASE_URL}/pricing`);
    await expect(page).toHaveURL(`${BASE_URL}/pricing`);
    await expect(page.getByRole('heading', { name: 'Simple, credit-based pricing' })).toBeVisible();
    expect(await page.getByRole('heading', { level: 1 }).count()).toBeGreaterThan(0);
  });

  test('/blog — returns 200 with valid HTML', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog`);
    await expect(page).toHaveURL(`${BASE_URL}/blog`);
    await expect(page.getByRole('heading', { name: 'Stories from the team' })).toBeVisible();
  });

  test('/contact — returns 200 with valid HTML', async ({ page }) => {
    await page.goto(`${BASE_URL}/contact`);
    await expect(page).toHaveURL(`${BASE_URL}/contact`);
    await expect(page.getByRole('heading', { name: 'Get in touch' })).toBeVisible();
  });

  test('/sign-in — renders auth form', async ({ page }) => {
    await page.goto(`${BASE_URL}/sign-in`);
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Password' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
  });

  test('/privacy and /terms — return 200', async ({ request }) => {
    const [privacy, terms] = await Promise.all([
      request.get(`${BASE_URL}/privacy`),
      request.get(`${BASE_URL}/terms`),
    ]);
    expect(privacy.status()).toBe(200);
    expect(terms.status()).toBe(200);
  });

  test('unknown route → 404 with custom not-found page', async ({ page }) => {
    await page.goto(`${BASE_URL}/unknown-route-that-does-not-exist`);
    await page.waitForLoadState('networkidle');
    // Our custom 404 page renders "404" text
    const bodyText = (await page.locator('body').textContent()) || '';
    expect(bodyText).toContain('404');
    expect(bodyText).toContain('Page not found');
  });

  test('homepage — renders marketing content', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await expect(
      page.getByRole('heading', { name: 'Turn Story Into Video with AI Magic' }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: /Start Creating/i })).toBeVisible();
  });

  test('cookie banner (T8) — renders on first visit', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    const banner = page.getByRole('region', { name: 'Cookie consent' });
    await expect(banner).toBeVisible();
    await expect(banner.getByRole('button', { name: /Got it/i })).toBeVisible();
  });
});
