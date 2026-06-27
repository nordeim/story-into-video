import { describe, it, expect, vi, beforeEach } from 'vitest';

const VALID_ENV = {
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
  DATABASE_URL_UNPOOLED: 'postgresql://user:pass@localhost:5432/db',
  AUTH_SECRET: 'a-very-long-and-secure-secret-key-32chars-min!!',
  AUTH_URL: 'http://localhost:3000',
  OPENAI_API_KEY: 'sk-test-key',
  REPLICATE_API_TOKEN: 'r8_test_token',
  ELEVENLABS_API_KEY: 'test-elevenlabs-key',
  STRIPE_SECRET_KEY: 'sk_test_stripe',
  STRIPE_WEBHOOK_SECRET: 'whsec_test',
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test',
  R2_ACCOUNT_ID: 'test-account-id',
  R2_ACCESS_KEY_ID: 'test-access-key',
  R2_SECRET_ACCESS_KEY: 'test-secret-key',
  R2_BUCKET_UPLOADS: 'siv-uploads-test',
  R2_BUCKET_GENERATED: 'siv-generated-test',
  R2_BUCKET_VIDEOS: 'siv-videos-test',
  INNGEST_EVENT_KEY: 'test-event-key',
  INNGEST_SIGNING_KEY: 'test-signing-key',
  RESEND_API_KEY: 're_test',
  UPSTASH_REDIS_REST_URL: 'https://example.upstash.io',
  UPSTASH_REDIS_REST_TOKEN: 'test-token',
  SENTRY_DSN: 'https://example@sentry.io/1',
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  NODE_ENV: 'production', // Use production to trigger strict validation
} as const;

describe('env module — Zod validation', () => {
  beforeEach(() => {
    vi.resetModules();
    // Clear env vars (preserve essential ones)
    Object.keys(process.env).forEach((key) => {
      if (
        !key.startsWith('npm_') &&
        !['PATH', 'HOME', 'USER', 'SHELL', 'LANG', 'TERM', '_', 'SHLVL', 'PWD'].includes(key)
      ) {
        delete process.env[key];
      }
    });
  });

  it('exports a typed env object with all required vars when env is complete', async () => {
    Object.assign(process.env, VALID_ENV);
    const { env } = await import('@/lib/env');
    expect(env.DATABASE_URL).toBe(VALID_ENV.DATABASE_URL);
    expect(env.AUTH_SECRET).toBe(VALID_ENV.AUTH_SECRET);
    expect(env.OPENAI_API_KEY).toBe(VALID_ENV.OPENAI_API_KEY);
    expect(env.R2_BUCKET_VIDEOS).toBe('siv-videos-test');
  });

  it('throws at module load when DATABASE_URL is missing (production context)', async () => {
    // Set all vars except DATABASE_URL, in production context
    const incomplete = { ...VALID_ENV } as Record<string, string>;
    delete incomplete.DATABASE_URL;
    Object.assign(process.env, incomplete);
    await expect(import('@/lib/env')).rejects.toThrow(/DATABASE_URL/i);
  });

  it('throws at module load when AUTH_SECRET is missing (production context)', async () => {
    const incomplete = { ...VALID_ENV } as Record<string, string>;
    delete incomplete.AUTH_SECRET;
    Object.assign(process.env, incomplete);
    await expect(import('@/lib/env')).rejects.toThrow(/AUTH_SECRET/i);
  });

  it('rejects AUTH_SECRET shorter than 32 characters', async () => {
    const incomplete = { ...VALID_ENV, AUTH_SECRET: 'too-short' };
    Object.assign(process.env, incomplete);
    await expect(import('@/lib/env')).rejects.toThrow(/AUTH_SECRET/i);
  });

  it('validates DATABASE_URL must be a postgresql:// URL', async () => {
    const invalid = { ...VALID_ENV, DATABASE_URL: 'http://not-a-db' };
    Object.assign(process.env, invalid);
    await expect(import('@/lib/env')).rejects.toThrow(/DATABASE_URL|postgres/i);
  });

  it('validates AUTH_URL must be a valid URL', async () => {
    const invalid = { ...VALID_ENV, AUTH_URL: 'not-a-url' };
    Object.assign(process.env, invalid);
    await expect(import('@/lib/env')).rejects.toThrow(/AUTH_URL|url/i);
  });

  it('exposes NEXT_PUBLIC_APP_URL as a public var', async () => {
    Object.assign(process.env, VALID_ENV);
    const { env } = await import('@/lib/env');
    expect(env.NEXT_PUBLIC_APP_URL).toBe('http://localhost:3000');
  });

  it('returns placeholders in build context (allows build without real env)', async () => {
    // Simulate build context — NODE_ENV=test triggers the build fallback
    vi.stubEnv('NODE_ENV', 'test');
    const { env } = await import('@/lib/env');
    // In build context, placeholders are returned (not real values)
    expect(env.DATABASE_URL).toMatch(/^postgresql:\/\//);
    expect(env.AUTH_SECRET.length).toBeGreaterThanOrEqual(32);
  });
});
