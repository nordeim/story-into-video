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

  // T2 (remediation): When AUTH_URL and NEXT_PUBLIC_APP_URL have different
  // hosts, Auth.js v5 may redirect auth callbacks to the wrong host (e.g.,
  // http://localhost:3000 in production). The env module emits a console.warn
  // at module load to surface this misconfiguration early.
  it('warns when AUTH_URL host differs from NEXT_PUBLIC_APP_URL host', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const mismatched = {
      ...VALID_ENV,
      AUTH_URL: 'http://localhost:3000',
      NEXT_PUBLIC_APP_URL: 'https://storyintovideo.jesspete.shop',
    };
    Object.assign(process.env, mismatched);
    await import('@/lib/env');
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringMatching(/AUTH_URL.*NEXT_PUBLIC_APP_URL.*host/i),
    );
    warnSpy.mockRestore();
  });

  it('does NOT warn when AUTH_URL and NEXT_PUBLIC_APP_URL hosts match', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const matched = {
      ...VALID_ENV,
      AUTH_URL: 'https://storyintovideo.jesspete.shop',
      NEXT_PUBLIC_APP_URL: 'https://storyintovideo.jesspete.shop',
    };
    Object.assign(process.env, matched);
    await import('@/lib/env');
    expect(warnSpy).not.toHaveBeenCalledWith(
      expect.stringMatching(/AUTH_URL.*NEXT_PUBLIC_APP_URL.*host/i),
    );
    warnSpy.mockRestore();
  });

  // T3 (remediation): OPENAI_API_KEY must accept all valid OpenAI key prefixes,
  // not just 'sk-'. Modern OpenAI keys use prefix-scoped formats:
  //   - sk-...           (legacy)
  //   - sk-proj-...      (project-scoped, the new default)
  //   - sk-svcacct-...   (service account)
  //   - sk-admin-...     (admin)
  // The old `startsWith('sk-')` check rejected all but the first, breaking
  // production rotations to project-scoped keys.
  it.each([
    ['legacy sk- prefix', 'sk-abc123'],
    ['project-scoped sk-proj- prefix', 'sk-proj-abc123XYZ'],
    ['service account sk-svcacct- prefix', 'sk-svcacct-abc123'],
    ['admin sk-admin- prefix', 'sk-admin-abc123'],
  ])('accepts OPENAI_API_KEY with %s', async (_label, key) => {
    const withKey = { ...VALID_ENV, OPENAI_API_KEY: key };
    Object.assign(process.env, withKey);
    const { env } = await import('@/lib/env');
    expect(env.OPENAI_API_KEY).toBe(key);
  });

  it('rejects OPENAI_API_KEY that does not start with any known prefix', async () => {
    const invalid = { ...VALID_ENV, OPENAI_API_KEY: 'not-an-openai-key' };
    Object.assign(process.env, invalid);
    await expect(import('@/lib/env')).rejects.toThrow(/OPENAI_API_KEY/i);
  });

  // T4 (remediation): SDXL model IDs are now env-configurable so they can be
  // rotated without code changes. Both are optional with sensible defaults
  // (the existing hardcoded values). When set, they must match Replicate's
  // `owner/model:sha` format to fail fast on typos.
  it('accepts REPLICATE_SDXL_MODEL matching owner/model:sha format', async () => {
    const withModel = {
      ...VALID_ENV,
      REPLICATE_SDXL_MODEL: 'stability-ai/sdxl:39ed52f2a788939d832ec6675557c771a6b0f9b6ce8bcd3ff0f4e4f3f1e0a6e3',
    };
    Object.assign(process.env, withModel);
    const { env } = await import('@/lib/env');
    expect(env.REPLICATE_SDXL_MODEL).toBe(withModel.REPLICATE_SDXL_MODEL);
  });

  it('rejects REPLICATE_SDXL_MODEL with invalid format', async () => {
    const invalid = { ...VALID_ENV, REPLICATE_SDXL_MODEL: 'not-a-valid-model-id' };
    Object.assign(process.env, invalid);
    await expect(import('@/lib/env')).rejects.toThrow(/REPLICATE_SDXL_MODEL/i);
  });

  it('uses default SDXL model when REPLICATE_SDXL_MODEL is not set', async () => {
    Object.assign(process.env, VALID_ENV);
    const { env } = await import('@/lib/env');
    expect(env.REPLICATE_SDXL_MODEL).toMatch(/^[a-z0-9-]+\/[a-z0-9-]+:[a-f0-9]+$/i);
  });

  it('accepts REPLICATE_SDXL_IPADAPTER_MODEL matching owner/model:sha format', async () => {
    const withModel = {
      ...VALID_ENV,
      REPLICATE_SDXL_IPADAPTER_MODEL: 'lucataco/sdxl-ipadapter:39ed52f2a788939d832ec6675557c771a6b0f9b6ce8bcd3ff0f4e4f3f1e0a6e3',
    };
    Object.assign(process.env, withModel);
    const { env } = await import('@/lib/env');
    expect(env.REPLICATE_SDXL_IPADAPTER_MODEL).toBe(withModel.REPLICATE_SDXL_IPADAPTER_MODEL);
  });
});
