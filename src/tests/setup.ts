import '@testing-library/jest-dom/vitest';

// ──────────────────────────────────────────────────────────────────────────
// Test environment — provide valid env vars so the Zod-validated env module
// (src/lib/env/index.ts) doesn't throw at module load during tests.
// These are dummy values matching the Zod schema's format requirements.
// Individual env tests (src/tests/unit/env.test.ts) manage their own env state.
// ──────────────────────────────────────────────────────────────────────────
const TEST_ENV = {
  DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
  DATABASE_URL_UNPOOLED: 'postgresql://test:test@localhost:5432/test',
  AUTH_SECRET: 'test-secret-key-for-vitest-environment-32-chars!!',
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
  NODE_ENV: 'test',
} as const;

for (const [key, value] of Object.entries(TEST_ENV)) {
  if (!process.env[key]) {
    process.env[key] = value;
  }
}
