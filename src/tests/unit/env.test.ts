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

  // Zod v4 migration: Zod v3's .url() used regex validation that rejected
  // non-standard schemes like postgresql://. The old workaround was a bare
  // .refine() with a startsWith() check. Zod v4's .url() uses new URL()
  // which accepts any scheme — so we can compose .url() (validates URL
  // format) with .refine() (restricts the protocol to postgres). This
  // catches more typos (e.g., "postgresql://" with bad syntax) than the
  // bare .refine() did.
  it('accepts DATABASE_URL with postgresql:// scheme (Zod v4 .url() regression guard)', async () => {
    const valid = {
      ...VALID_ENV,
      DATABASE_URL: 'postgresql://user:pass@host:5432/db?sslmode=require',
    };
    Object.assign(process.env, valid);
    const { env } = await import('@/lib/env');
    expect(env.DATABASE_URL).toBe(valid.DATABASE_URL);
  });

  it('accepts DATABASE_URL with postgres:// scheme (short form)', async () => {
    const valid = {
      ...VALID_ENV,
      DATABASE_URL: 'postgres://user:pass@host:5432/db',
    };
    Object.assign(process.env, valid);
    const { env } = await import('@/lib/env');
    expect(env.DATABASE_URL).toBe(valid.DATABASE_URL);
  });

  it('rejects DATABASE_URL that is not a valid URL (Zod v4 .url() catches malformed)', async () => {
    // The bare .refine() with startsWith() would PASS this string because
    // it starts with "postgresql://". The new .url().refine() composition
    // correctly rejects it because the URL is malformed.
    const malformed = { ...VALID_ENV, DATABASE_URL: 'postgresql://not a url with spaces' };
    Object.assign(process.env, malformed);
    await expect(import('@/lib/env')).rejects.toThrow(/DATABASE_URL|url/i);
  });

  it('env source uses .url() for DATABASE_URL (not bare .refine())', async () => {
    const { readFileSync } = await import('fs');
    const { resolve } = await import('path');
    const envSource = readFileSync(resolve(__dirname, '../../lib/env/index.ts'), 'utf-8');
    // The DATABASE_URL field declaration must compose .url() (validates URL
    // format) with .refine() (restricts the protocol). The bare .refine()
    // approach is obsolete in Zod v4. We extract the region between
    // "DATABASE_URL:" and the start of "DATABASE_URL_UNPOOLED:" to inspect
    // just this field's declaration.
    const startIndex = envSource.indexOf('DATABASE_URL:');
    const endIndex = envSource.indexOf('DATABASE_URL_UNPOOLED:', startIndex);
    expect(startIndex).toBeGreaterThan(-1);
    expect(endIndex).toBeGreaterThan(startIndex);
    const dbUrlBlock = envSource.slice(startIndex, endIndex);
    // .url() may be called with or without a message argument — match .url(
    // followed by anything (lookbehind not needed since we already sliced).
    expect(dbUrlBlock).toMatch(/\.url\(/);
    expect(dbUrlBlock).toMatch(/\.refine\(/);
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
      REPLICATE_SDXL_MODEL:
        'stability-ai/sdxl:39ed52f2a788939d832ec6675557c771a6b0f9b6ce8bcd3ff0f4e4f3f1e0a6e3',
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
      REPLICATE_SDXL_IPADAPTER_MODEL:
        'lucataco/sdxl-ipadapter:39ed52f2a788939d832ec6675557c771a6b0f9b6ce8bcd3ff0f4e4f3f1e0a6e3',
    };
    Object.assign(process.env, withModel);
    const { env } = await import('@/lib/env');
    expect(env.REPLICATE_SDXL_IPADAPTER_MODEL).toBe(withModel.REPLICATE_SDXL_IPADAPTER_MODEL);
  });

  // IMAGE_MODERATION_FAIL_OPEN was previously read directly from process.env
  // in src/features/pipeline/domain/moderate-image.ts, bypassing the Zod
  // schema. This meant typos (e.g., IMAGE_MOD_FAIL_OPEN) silently fell back
  // to the default with no error — exactly the failure mode the env module
  // exists to prevent. The var is now in the schema with enum validation.
  describe('IMAGE_MODERATION_FAIL_OPEN validation', () => {
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

    it('accepts IMAGE_MODERATION_FAIL_OPEN=true', async () => {
      Object.assign(process.env, { ...VALID_ENV, IMAGE_MODERATION_FAIL_OPEN: 'true' });
      const { env } = await import('@/lib/env');
      expect(env.IMAGE_MODERATION_FAIL_OPEN).toBe('true');
    });

    it('accepts IMAGE_MODERATION_FAIL_OPEN=false', async () => {
      Object.assign(process.env, { ...VALID_ENV, IMAGE_MODERATION_FAIL_OPEN: 'false' });
      const { env } = await import('@/lib/env');
      expect(env.IMAGE_MODERATION_FAIL_OPEN).toBe('false');
    });

    it('defaults to "true" when IMAGE_MODERATION_FAIL_OPEN is not set', async () => {
      // Explicitly delete to ensure it's unset
      delete process.env.IMAGE_MODERATION_FAIL_OPEN;
      Object.assign(process.env, VALID_ENV);
      const { env } = await import('@/lib/env');
      expect(env.IMAGE_MODERATION_FAIL_OPEN).toBe('true');
    });

    it('rejects IMAGE_MODERATION_FAIL_OPEN with invalid value (e.g., "maybe")', async () => {
      Object.assign(process.env, { ...VALID_ENV, IMAGE_MODERATION_FAIL_OPEN: 'maybe' });
      await expect(import('@/lib/env')).rejects.toThrow(/IMAGE_MODERATION_FAIL_OPEN/i);
    });

    it('rejects IMAGE_MODERATION_FAIL_OPEN with typo-caught value (e.g., "True" capitalized)', async () => {
      // The enum is case-sensitive — catches typos like "True" or "TRUE"
      // that would silently fall back to default in the old process.env approach.
      Object.assign(process.env, { ...VALID_ENV, IMAGE_MODERATION_FAIL_OPEN: 'True' });
      await expect(import('@/lib/env')).rejects.toThrow(/IMAGE_MODERATION_FAIL_OPEN/i);
    });

    it('exposes IMAGE_MODERATION_FAIL_OPEN on the typed env object', async () => {
      Object.assign(process.env, { ...VALID_ENV, IMAGE_MODERATION_FAIL_OPEN: 'false' });
      const { env } = await import('@/lib/env');
      // The var must be a typed field on the env object (not just process.env).
      // This ensures moderate-image.ts can read env.IMAGE_MODERATION_FAIL_OPEN.
      expect(env).toHaveProperty('IMAGE_MODERATION_FAIL_OPEN');
      expect(typeof env.IMAGE_MODERATION_FAIL_OPEN).toBe('string');
    });
  });
});
