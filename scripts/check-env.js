#!/usr/bin/env node
/**
 * Pre-deployment environment validation script (Action 3 companion).
 *
 * Run this before any production deployment to catch env misconfigurations
 * that would cause T1 to throw at boot time. It replicates the same host-mismatch
 * check the app does at startup, but can be run from any CI/CD pipeline or
 * developer workstation.
 *
 * Usage:
 *   node scripts/check-env.js
 *   # Or with a custom env file:
 *   ENV_FILE=.env.production node scripts/check-env.js
 *
 * Exit codes:
 *   0 — env is clean
 *   1 — env is misconfigured (details written to stderr)
 */

const fs = require('fs');
const path = require('path');

function extractHost(urlStr) {
  try {
    return new URL(urlStr).host;
  } catch {
    return null;
  }
}

function parseEnvFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const vars = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const [key, ...rest] = trimmed.split('=');
    vars[key] = rest.join('=').trim();
  }
  return vars;
}

const envFile = process.env.ENV_FILE || '.env.local';
const envPath = path.resolve(process.cwd(), envFile);

if (!fs.existsSync(envPath)) {
  console.error(`Error: ${envFile} not found at ${envPath}`);
  process.exit(1);
}

const env = parseEnvFile(envPath);
const authUrl = env.AUTH_URL;
const appUrl = env.NEXT_PUBLIC_APP_URL;

let ok = true;
const errors = [];

if (!authUrl) {
  errors.push('Missing: AUTH_URL');
  ok = false;
}
if (!appUrl) {
  errors.push('Missing: NEXT_PUBLIC_APP_URL');
  ok = false;
}

if (authUrl && appUrl) {
  const authHost = extractHost(authUrl);
  const appHost = extractHost(appUrl);

  if (authHost && appHost && authHost !== appHost) {
    errors.push(
      `Host mismatch: AUTH_URL host "${authHost}" ≠ NEXT_PUBLIC_APP_URL host "${appHost}".` +
      `\n  Production T1 will THROW at boot. Set both to the same host.`
    );
    ok = false;
  }

  if (authUrl.includes('localhost') || appUrl.includes('localhost')) {
    errors.push(
      `Warning: AUTH_URL or NEXT_PUBLIC_APP_URL contains "localhost".` +
      `\n  In production this will redirect users to localhost (unreachable).` +
      `\n  Set both to https://storyintovideo.jesspete.shop (or your production host).`
    );
    // This is a warning; don't exit 1 for it unless T1 would throw
  }
}

// Validate AUTH_SECRET
if (!env.AUTH_SECRET) {
  errors.push('Missing: AUTH_SECRET');
  ok = false;
} else if (env.AUTH_SECRET.length < 32) {
  errors.push(`AUTH_SECRET is only ${env.AUTH_SECRET.length} chars (must be ≥32).`);
  ok = false;
}

// Ensure critical API keys are present (not just dev placeholders)
const skipPlaceholderCheck = process.env.SKIP_PLACEHOLDER_CHECK === 'true';
if (!skipPlaceholderCheck) {
  const placeholderPatterns = ['test', 'dummy', 'placeholder', 'changeme'];
  const keysToCheck = [
    'OPENAI_API_KEY',
    'REPLICATE_API_TOKEN',
    'STRIPE_SECRET_KEY',
    'ELEVENLABS_API_KEY',
  ];
  for (const key of keysToCheck) {
    const val = env[key];
    if (!val) {
      errors.push(`Missing: ${key}`);
      ok = false;
    } else if (placeholderPatterns.some(p => val.toLowerCase().includes(p))) {
      errors.push(`Warning: ${key} contains a placeholder value (${val}). May fail in production.`);
    }
  }
}

if (errors.length > 0) {
  console.error(`\nPre-deployment env check for ${envFile}:\n`);
  for (const err of errors) {
    console.error(`  ${err}`);
  }
  if (!ok) {
    console.error(`\nFix these errors before deploying, or the app will fail at boot (T1).\n`);
    process.exit(1);
  } else {
    console.warn(`\nWarnings found but no fatal errors.\n`);
    process.exit(0);
  }
} else {
  console.log(`✅ Environment file ${envFile} is clean — ready for deployment.`);
  process.exit(0);
}
