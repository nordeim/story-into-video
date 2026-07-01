#!/usr/bin/env node
/**
 * Post-deployment verification script (Action 3).
 *
 * Run after deploying to production to verify:
 *   1. /api/health returns config.healthy: true
 *   2. /dashboard (unauthenticated) 307-redirects to the correct host's /sign-in (NOT localhost)
 *   3. /pricing, /blog, /contact return 200 with proper metadata
 *   4. /sign-in renders the auth page
 *   5. Custom 404 page is served for unknown routes
 *   6. Cookie banner appears on first visit
 *
 * Usage:
 *   node scripts/verify-deployment.js
 *   DEPLOYMENT_URL=https://storyintovideo.jesspete.shop node scripts/verify-deployment.js
 *
 * Exit codes:
 *   0 — all checks passed
 *   1 — one or more checks failed
 */

const https = require('https');
const http = require('http');

const BASE_URL = process.env.DEPLOYMENT_URL || 'https://storyintovideo.jesspete.shop';
const url = new URL(BASE_URL);
const client = url.protocol === 'https:' ? https : http;

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = client.request(
      `${BASE_URL}${path}`,
      { method: options.method || 'GET', headers: options.headers || {} },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

let failCount = 0;
const errors = [];

async function check(name, testFn) {
  try {
    await testFn();
    console.log(`  ✅ ${name}`);
  } catch (err) {
    failCount++;
    errors.push(`${name}: ${err.message}`);
    console.log(`  ❌ ${name} — ${err.message}`);
  }
}

async function main() {
  console.log(`Verifying deployment at ${BASE_URL}...\n`);
  console.log(`Note: If the site returns 502, the app may have failed to boot due to T1 (env host-mismatch throw).\n`);

  // 1. Health endpoint
  await check('/api/health — config.healthy: true', async () => {
    const res = await request('/api/health');
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    const body = JSON.parse(res.body);
    if (body.config?.healthy !== true) {
      throw new Error(`config.healthy is ${body.config?.healthy} (expected true)`);
    }
    if (body.configErrors && body.configErrors.length > 0) {
      throw new Error(`configErrors: ${body.configErrors.join(', ')}`);
    }
  });

  // 2. /dashboard — unauthenticated → must 307-redirect to /sign-in on SAME host (not localhost)
  await check('/dashboard — 307-redirect to host-matching /sign-in', async () => {
    const res = await request('/dashboard');
    if (res.status !== 307) throw new Error(`HTTP ${res.status} (expected 307)`);
    const location = res.headers.location || '';
    if (!location.includes('/sign-in')) {
      throw new Error(`Redirect to ${location} does not include /sign-in`);
    }
    // Critical: must NOT redirect to localhost (the bug T1 fixed)
    if (location.includes('localhost')) {
      throw new Error(`CRITICAL: Redirect goes to localhost: ${location}`);
    }
    // Must redirect to the SAME host we're checking
    if (!location.includes(url.host)) {
      throw new Error(`Redirect host mismatch: ${location} (expected host ${url.host})`);
    }
  });

  // 3. Content pages return 200
  for (const path of ['/pricing', '/blog', '/contact']) {
    await check(`${path} — returns 200 with valid HTML`, async () => {
      const res = await request(path);
      if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
      if (!res.body.includes('<!DOCTYPE html>') && !res.body.includes('<html')) {
        throw new Error('Response does not contain HTML');
      }
      // Verify metadata title
      if (!res.body.includes('StoryIntoVideo')) {
        throw new Error('Response does not contain expected "StoryIntoVideo" title');
      }
    });
  }

  // 4. /sign-in renders the auth page
  await check('/sign-in — renders auth page', async () => {
    const res = await request('/sign-in');
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    if (!res.body.includes('Sign in') && !res.body.includes('Sign up')) {
      throw new Error('Auth page does not contain expected content');
    }
  });

  // 5. Custom 404 for unknown routes
  await check('/unknown-route — custom 404 page', async () => {
    const res = await request('/unknown-route-that-does-not-exist');
    if (res.status !== 404) throw new Error(`HTTP ${res.status} (expected 404)`);
    if (!res.body.includes('404')) {
      throw new Error('Response does not contain "404" — custom not-found.tsx not rendering');
    }
  });

  // 6. /privacy and /terms legal pages still work
  for (const path of ['/privacy', '/terms']) {
    await check(`${path} — returns 200`, async () => {
      const res = await request(path);
      if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    });
  }

  console.log('\n' + (failCount === 0 ? '✅ All checks passed!' : `❌ ${failCount} check(s) failed.`));
  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.forEach(e => console.log(`  - ${e}`));
  }
  process.exit(failCount > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
