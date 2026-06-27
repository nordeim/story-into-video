import { z } from 'zod';

/**
 * Environment variable schema — validated once at module load.
 *
 * CRITICAL RULE (from Production Readiness Plan ADR-003):
 * Never read `process.env.*` directly in production code. Import `env` from
 * `@/lib/env` and access `env.VAR_NAME`. Direct `process.env.*` reads bypass
 * validation — typos like `GOOGLE_CLIENTID` (missing underscore) silently
 * return `undefined` and disable the feature with no error.
 *
 * The app fails fast at module load if any required var is missing or invalid.
 * This is intentional — a misconfigured production deployment should refuse to
 * boot rather than silently degrade.
 *
 * BUILD-TIME FALLBACK: If env vars are not set (e.g., during `next build`
 * page-data collection without a .env file), the module exports placeholder
 * values instead of throwing. This allows the build to succeed. At runtime
 * (dev server, production), real env vars must be present — the app will
 * malfunction visibly if they're missing (DB connection fails, auth fails).
 *
 * Pattern source: skills/nextjs16-react19-postgres17/SKILL.md §2
 */

const KNOWN_WEAK_SECRETS = [
  'dev-secret',
  'test-secret',
  'ci-dummy',
  'change-me',
  'placeholder',
  'secret',
  'password',
  'changeme',
];

const envSchema = z
  .object({
    // ── Database (Neon) ──
    DATABASE_URL: z
      .string()
      .min(1)
      .refine((url) => url.startsWith('postgres://') || url.startsWith('postgresql://'), {
        message: 'DATABASE_URL must be a postgresql:// URL',
      }),
    DATABASE_URL_UNPOOLED: z
      .string()
      .min(1)
      .refine((url) => url.startsWith('postgres://') || url.startsWith('postgresql://'), {
        message: 'DATABASE_URL_UNPOOLED must be a postgresql:// URL',
      }),

    // ── Auth (Auth.js v5) ──
    AUTH_SECRET: z
      .string()
      .min(32, 'AUTH_SECRET must be at least 32 characters')
      .refine((val) => !KNOWN_WEAK_SECRETS.includes(val.toLowerCase()), {
        message:
          'AUTH_SECRET is a known-weak value — generate a real one with `openssl rand -base64 32`',
      }),
    AUTH_URL: z.string().url(),

    // ── AI Providers ──
    OPENAI_API_KEY: z.string().min(1).startsWith('sk-'),
    REPLICATE_API_TOKEN: z.string().min(1).startsWith('r8_'),
    ELEVENLABS_API_KEY: z.string().min(1),

    // ── Stripe ──
    STRIPE_SECRET_KEY: z.string().min(1).startsWith('sk_'),
    STRIPE_WEBHOOK_SECRET: z.string().min(1).startsWith('whsec_'),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1).startsWith('pk_'),

    // ── Cloudflare R2 ──
    R2_ACCOUNT_ID: z.string().min(1),
    R2_ACCESS_KEY_ID: z.string().min(1),
    R2_SECRET_ACCESS_KEY: z.string().min(1),
    R2_BUCKET_UPLOADS: z.string().min(1),
    R2_BUCKET_GENERATED: z.string().min(1),
    R2_BUCKET_VIDEOS: z.string().min(1),

    // ── Inngest ──
    INNGEST_EVENT_KEY: z.string().min(1),
    INNGEST_SIGNING_KEY: z.string().min(1),

    // ── Email (Resend) ──
    RESEND_API_KEY: z.string().min(1).startsWith('re_'),

    // ── Rate Limiting (Upstash) ──
    UPSTASH_REDIS_REST_URL: z.string().url(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1),

    // ── Monitoring (Sentry) ──
    SENTRY_DSN: z.string().url(),

    // ── App ──
    NEXT_PUBLIC_APP_URL: z.string().url(),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

    // ── Optional: Google OAuth (both required to enable) ──
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const hasId = !!data.GOOGLE_CLIENT_ID;
    const hasSecret = !!data.GOOGLE_CLIENT_SECRET;
    if (hasId !== hasSecret) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must both be set (or both unset) to enable Google OAuth',
        path: hasId ? ['GOOGLE_CLIENT_SECRET'] : ['GOOGLE_CLIENT_ID'],
      });
    }
  });

type EnvData = z.infer<typeof envSchema>;

/**
 * Parse env vars. In production, fail fast on invalid config. In build/test
 * contexts where env vars may be absent, fall back to placeholder values so
 * the module can be imported without crashing.
 *
 * The IS_BUILD_CONTEXT check detects when we're in a build or test context
 * (no real env vars available) and uses placeholders. At runtime with real env
 * vars, full validation applies.
 */
function parseEnv(): EnvData {
  const result = envSchema.safeParse(process.env);
  if (result.success) return result.data;

  // Build/test fallback — only used during Next.js build (NEXT_PHASE) or tests.
  // At runtime (dev server, production with real NODE_ENV), real env vars MUST
  // be set — otherwise this throws with a descriptive error.
  const isBuildContext =
    process.env.NEXT_PHASE === 'phase-production-build' || process.env.NODE_ENV === 'test';

  if (isBuildContext) {
    // Return placeholders that match schema formats — allows build to proceed.
    // These are NOT used at runtime; real env vars override.
    return {
      DATABASE_URL: 'postgresql://placeholder:placeholder@localhost:5432/placeholder',
      DATABASE_URL_UNPOOLED: 'postgresql://placeholder:placeholder@localhost:5432/placeholder',
      AUTH_SECRET: 'placeholder-secret-key-for-build-context-only-32ch!',
      AUTH_URL: 'http://localhost:3000',
      OPENAI_API_KEY: 'sk-placeholder',
      REPLICATE_API_TOKEN: 'r8_placeholder',
      ELEVENLABS_API_KEY: 'placeholder',
      STRIPE_SECRET_KEY: 'sk_placeholder',
      STRIPE_WEBHOOK_SECRET: 'whsec_placeholder',
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_placeholder',
      R2_ACCOUNT_ID: 'placeholder',
      R2_ACCESS_KEY_ID: 'placeholder',
      R2_SECRET_ACCESS_KEY: 'placeholder',
      R2_BUCKET_UPLOADS: 'siv-uploads',
      R2_BUCKET_GENERATED: 'siv-generated',
      R2_BUCKET_VIDEOS: 'siv-videos',
      INNGEST_EVENT_KEY: 'placeholder',
      INNGEST_SIGNING_KEY: 'placeholder',
      RESEND_API_KEY: 're_placeholder',
      UPSTASH_REDIS_REST_URL: 'https://placeholder.upstash.io',
      UPSTASH_REDIS_REST_TOKEN: 'placeholder',
      SENTRY_DSN: 'https://placeholder@sentry.io/1',
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
      NODE_ENV: 'development',
    };
  }

  // Real runtime with missing/invalid env vars — fail fast.
  const errors = result.error.issues.map((issue) => {
    const path = issue.path.join('.');
    return `  • ${path || '(root)'}: ${issue.message}`;
  });
  throw new Error(
    `\n❌ Invalid environment variables:\n${errors.join('\n')}\n\n` +
      `Check .env.local against .env.example for missing or malformed values.\n`,
  );
}

export const env = parseEnv();

export type Env = EnvData;
