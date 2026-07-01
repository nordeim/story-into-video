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
    // Zod v4's .url() uses new URL() which accepts any scheme — so we
    // compose .url() (validates URL format) with .refine() (restricts
    // the protocol to postgres). This catches more typos than the bare
    // .refine() with startsWith() did (e.g., "postgresql://not a url"
    // is now correctly rejected as a malformed URL).
    DATABASE_URL: z
      .string()
      .min(1)
      .url('DATABASE_URL must be a valid URL')
      .refine((url) => {
        const parsed = new URL(url);
        return parsed.protocol === 'postgres:' || parsed.protocol === 'postgresql:';
      }, 'DATABASE_URL must use the postgres:// or postgresql:// scheme'),
    DATABASE_URL_UNPOOLED: z
      .string()
      .min(1)
      .url('DATABASE_URL_UNPOOLED must be a valid URL')
      .refine((url) => {
        const parsed = new URL(url);
        return parsed.protocol === 'postgres:' || parsed.protocol === 'postgresql:';
      }, 'DATABASE_URL_UNPOOLED must use the postgres:// or postgresql:// scheme'),

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

    // ── Replicate Model IDs (optional, format-validated) ──
    // T4: Both default to the existing hardcoded constants. Operators can
    // override via env to rotate models without code changes. The regex
    // matches Replicate's `owner/model:sha` format (owner + model are
    // lowercase alphanumeric + dashes; sha is a 64-char hex string).
    REPLICATE_SDXL_MODEL: z
      .string()
      .regex(
        /^[a-z0-9-]+\/[a-z0-9-]+:[a-f0-9]{8,}$/,
        'REPLICATE_SDXL_MODEL must match Replicate format: owner/model:sha (e.g. stability-ai/sdxl:39ed52f2...)',
      )
      .default(
        'stability-ai/sdxl:39ed52f2a788939d832ec6675557c771a6b0f9b6ce8bcd3ff0f4e4f3f1e0a6e3',
      ),
    REPLICATE_SDXL_IPADAPTER_MODEL: z
      .string()
      .regex(
        /^[a-z0-9-]+\/[a-z0-9-]+:[a-f0-9]{8,}$/,
        'REPLICATE_SDXL_IPADAPTER_MODEL must match Replicate format: owner/model:sha (e.g. lucataco/sdxl-ipadapter:39ed52f2...)',
      )
      // NOTE: The previous hardcoded placeholder
      // 'lucataco/sdxl-ipadapter:6f288a8d-7e5e-4f0c-8b3f-3e1f3e6e3e3e' did NOT
      // match the format above (the SHA contained hyphens and was 36 chars —
      // looked like a UUID, not a Replicate version hash). The default here
      // uses the SDXL base model hash as a placeholder until a real IP-Adapter
      // version hash is configured via env. **Operators must set
      // REPLICATE_SDXL_IPADAPTER_MODEL to a real lucataco/sdxl-ipadapter
      // version before the pipeline can generate consistent scenes.**
      .default(
        'stability-ai/sdxl:39ed52f2a788939d832ec6675557c771a6b0f9b6ce8bcd3ff0f4e4f3f1e0a6e3',
      ),

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

    // ── Image Moderation Policy (optional, default depends on NODE_ENV) ──
    // When the Replicate output shape is unknown (no recognized safety field):
    //   - 'true'  (dev default): fail-open — flagged=false, moderationSkipped=true
    //   - 'false' (prod default): fail-closed — flagged=true with 'unknown-output-shape'
    //
    // H8 fix: The default is now 'false' (fail-closed) in production to follow
    // the secure-defaults principle. The previous default 'true' (fail-open)
    // allowed unmoderated AI images if an operator forgot to set the var.
    // Dev/test keeps 'true' for convenience (operators can always override).
    // The enum is case-sensitive to catch typos like "True" or "TRUE".
    IMAGE_MODERATION_FAIL_OPEN: z
      .enum(['true', 'false'])
      .optional()
      .default(process.env.NODE_ENV === 'production' ? 'false' : 'true'),

    // ── FFmpeg (Video Assembly) ──
    // H1 fix: FFMPEG_PATH must go through the Zod schema (not process.env.*)
    // The previous code read process.env.FFMPEG_PATH directly in
    // assemble-video.ts, bypassing validation. A typo like FFMPEG_PAHT would
    // silently fall back to /usr/bin/ffmpeg with no warning.
    FFMPEG_PATH: z.string().optional().default('/usr/bin/ffmpeg'),

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
 * Extract the host portion of a URL string. Returns null for invalid URLs
 * (used in the AUTH_URL ↔ NEXT_PUBLIC_APP_URL host-match warning below).
 */
function extractHost(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

/**
 * Parse env vars. In production, fail fast on invalid config. In build/test
 * contexts where env vars may be absent, fall back to placeholder values so
 * the module can be imported without crashing.
 *
 * The IS_BUILD_CONTEXT check detects when we're in a build or test context
 * (no real env vars available) and uses placeholders. At runtime with real env
 * vars, full validation applies.
 *
 * HOST-MISMATCH (T1 remediation, status_11.md): If AUTH_URL and
 * NEXT_PUBLIC_APP_URL resolve to different hosts, Auth.js v5 may redirect
 * auth callbacks to the wrong host (e.g., AUTH_URL=http://localhost:3000
 * leaked to production → /dashboard redirects to localhost → ERR_CONNECTION_REFUSED).
 *
 * The previous behavior (status_10.md) only emitted console.warn — which was
 * silently buried in production server logs. The live storyintovideo.jesspete.shop
 * deployment was broken for exactly this reason. T1 promotes the warning to
 * a THROWN ERROR in production runtime (fail-fast at boot), so the app
 * refuses to start with a clear error instead of silently degrading auth.
 *
 * Behavior matrix:
 *   - production runtime: THROW (fail-fast — operators must fix the env)
 *   - development:        console.warn only (operator is likely debugging)
 *   - test:               console.warn only (test suites rely on env flexibility)
 *   - build context:      never reached (placeholders match: both localhost:3000)
 */
function parseEnv(): EnvData {
  const result = envSchema.safeParse(process.env);
  if (result.success) {
    // Surface AUTH_URL ↔ NEXT_PUBLIC_APP_URL host mismatches. The warn is
    // always emitted for visibility; in production we additionally throw to
    // fail-fast at boot (T1 fix).
    const authHost = extractHost(result.data.AUTH_URL);
    const appHost = extractHost(result.data.NEXT_PUBLIC_APP_URL);
    if (authHost && appHost && authHost !== appHost) {
      const message =
        `[env] AUTH_URL host ("${authHost}") differs from NEXT_PUBLIC_APP_URL host ("${appHost}"). ` +
        `This is a common cause of auth redirect loops in production — e.g. /dashboard ` +
        `redirecting to a localhost URL that browsers cannot reach. ` +
        `Set AUTH_URL to the same host as NEXT_PUBLIC_APP_URL, or rely on trustHost:true ` +
        `(already set in src/lib/auth/config.ts) to use the incoming request's Host header.`;
      console.warn(message);
      // T1: fail-fast in production runtime. Build context is excluded because
      // it uses matching localhost placeholders (never reaches this branch when
      // isBuildContext=true). Dev/test keep the warn-only behavior so operators
      // can debug with mismatched URLs locally.
      if (result.data.NODE_ENV === 'production') {
        throw new Error(
          `\n❌ Host mismatch in environment variables:\n  ${message}\n\n` +
            `Fix: set NEXT_PUBLIC_APP_URL and AUTH_URL to the same host in your production env,\n` +
            `then redeploy. The app refuses to boot to prevent silent auth failures.\n`,
        );
      }
    }
    return result.data;
  }

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
      REPLICATE_SDXL_MODEL:
        'stability-ai/sdxl:39ed52f2a788939d832ec6675557c771a6b0f9b6ce8bcd3ff0f4e4f3f1e0a6e3',
      REPLICATE_SDXL_IPADAPTER_MODEL:
        'stability-ai/sdxl:39ed52f2a788939d832ec6675557c771a6b0f9b6ce8bcd3ff0f4e4f3f1e0a6e3',
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
      IMAGE_MODERATION_FAIL_OPEN: 'true',
      FFMPEG_PATH: '/usr/bin/ffmpeg',
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
