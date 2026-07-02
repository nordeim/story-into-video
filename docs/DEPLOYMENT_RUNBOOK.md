# Deployment Runbook — StoryIntoVideo Production

> **NF-1 fix:** This runbook documents the production deployment process. The
> live site was previously running `next dev --turbopack` (dev mode) instead of
> `next start` (production mode), causing 5–10× slower response times, source
> code path leakage via chunk names, exposed HMR WebSocket, and uncacheable
> responses. This runbook ensures deployments use the production Dockerfile
> which runs `next start`.

## Quick Start

```bash
# 1. Ensure .env.local has all 27 required production env vars
#    (see .env.example for the full list)
cp .env.example .env.local
# Edit .env.local with real production values

# 2. Build and start the production container
docker compose -f docker-compose.prod.yml up -d --build

# 3. Verify the deployment
node scripts/verify-deployment.js
# (or: curl https://storyintovideo.jesspete.shop/api/health)
```

## Architecture

```
Internet → Cloudflare (DNS + CDN + WAF + HSTS) → Cloudflare Tunnel → Docker container (next start :3000)
                                                                    ↓
                                              Neon Postgres (DB) ← external
                                              Upstash Redis (rate limit) ← external
                                              Cloudflare R2 (media storage) ← external
                                              Inngest (pipeline orchestration) ← external
                                              OpenAI / Replicate / ElevenLabs (AI) ← external
                                              Stripe (billing) ← external
```

The Docker container runs `next start` (production mode) on port 3000, bound
to `127.0.0.1` (Cloudflare Tunnel proxies public traffic to it). The app is
stateless — all persistent state lives in managed external services.

## Critical Environment Variables

| Variable | Why it matters |
|---|---|
| `NEXT_PUBLIC_APP_URL` | Must be `https://storyintovideo.jesspete.shop`. The proxy uses this for redirect URLs (T2 fix). |
| `AUTH_URL` | Must match `NEXT_PUBLIC_APP_URL` host. The env module throws at boot in production if they differ (T1 fix). |
| `AUTH_SECRET` | ≥32 chars, generate with `openssl rand -base64 32`. Never reuse across environments. |
| `DATABASE_URL` | Neon pooled connection (`-pooler` host). Used at runtime. |
| `DATABASE_URL_UNPOOLED` | Neon direct connection. Used by drizzle-kit for migrations only. |
| `REPLICATE_SDXL_IPADAPTER_MODEL` | Must be `lucataco/sdxl-ipadapter:<sha>` for character consistency. Default is a placeholder. |
| `FFMPEG_PATH` | Default `/usr/bin/ffmpeg`. The production Dockerfile installs ffmpeg via `apk add`. |
| `SENTRY_DSN` | In env schema but `@sentry/nextjs` is NOT yet installed (deferred). Set it now for forward-compat. |

### Host-Mismatch Fail-Fast (T1)

The env module (`src/lib/env/index.ts`) THROWS at boot in production when
`AUTH_URL` host ≠ `NEXT_PUBLIC_APP_URL` host. This prevents the P0 outage
where auth callbacks resolved to `localhost:3000`.

If the app returns 502 after deploy, check the container logs for:
```
Error: AUTH_URL host (localhost) does not match NEXT_PUBLIC_APP_URL host (storyintovideo.jesspete.shop)
```

Fix: ensure both env vars point to the same host in `.env.local`.

## Deployment Steps (Detailed)

### 1. Prepare `.env.local`

```bash
cp .env.example .env.local
```

Edit `.env.local` with production values:
- `DATABASE_URL` / `DATABASE_URL_UNPOOLED` → Neon connection strings
- `AUTH_SECRET` → `openssl rand -base64 32`
- `AUTH_URL` / `NEXT_PUBLIC_APP_URL` → `https://storyintovideo.jesspete.shop`
- `OPENAI_API_KEY` → `sk-proj-...`
- `REPLICATE_API_TOKEN` → `r8_...`
- `REPLICATE_SDXL_IPADAPTER_MODEL` → `lucataco/sdxl-ipadapter:<sha>` (NOT the placeholder)
- `ELEVENLABS_API_KEY` → ElevenLabs key
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` → Stripe live keys
- `R2_*` → Cloudflare R2 credentials + 3 bucket names
- `INNGEST_*` → Inngest event + signing keys
- `RESEND_API_KEY` → `re_...`
- `UPSTASH_*` → Upstash Redis URL + token
- `SENTRY_DSN` → Sentry project DSN (forward-compat; integration deferred)
- `FFMPEG_PATH` → `/usr/bin/ffmpeg` (default; installed in the Docker image)
- `NODE_ENV` → `production`

### 2. Validate env vars

```bash
node scripts/check-env.js
```

This script checks for:
- Host mismatch between `AUTH_URL` and `NEXT_PUBLIC_APP_URL`
- `AUTH_SECRET` length ≥ 32 chars
- Placeholder API keys (`sk-test-key`, `r8_test_token`, etc.)
- Missing required vars

Exit 1 = fatal errors; exit 0 = OK (warnings allowed).

### 3. Apply database migrations

```bash
# Only needed on first deploy or when schema changes
pnpm drizzle:migrate
```

⚠️ **Migration 0001 requires pre-cleanup** of duplicate `videos` / `voiceovers`
rows (the unique constraint can't be added if duplicates exist). Run:
```sql
-- Check for duplicates before migrating
SELECT project_id, COUNT(*) FROM videos GROUP BY project_id HAVING COUNT(*) > 1;
SELECT project_id, COUNT(*) FROM voiceovers GROUP BY project_id HAVING COUNT(*) > 1;
-- If any rows exist, manually keep the most recent and delete the rest
```

### 4. Build and start the production container

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

This:
1. Builds the production Docker image (multi-stage: deps → builder → runtime)
2. Starts the container in detached mode
3. Binds to `127.0.0.1:3000` (Cloudflare Tunnel proxies public traffic)

### 5. Verify the deployment

```bash
# Automated verification (9 checks)
node scripts/verify-deployment.js

# Manual health check
curl https://storyintovideo.jesspete.shop/api/health
# Expected: {"status":"healthy","config":{"healthy":true,...}}
```

`verify-deployment.js` checks:
1. `/api/health` returns `config.healthy: true`
2. `/dashboard` redirects (307) to same-host `/sign-in` (NOT localhost)
3. `/pricing`, `/blog`, `/contact` return 200
4. `/sign-in` renders the auth page
5. Unknown routes return 404 (custom page)
6. `/privacy`, `/terms` return 200

### 6. Verify production mode (NOT dev mode)

After deploy, verify the site is running `next start` (not `next dev`):

```bash
# Check response headers — production emits long-cache headers for static assets
curl -I https://storyintovideo.jesspete.shop/_next/static/chunks/main-app-*.js

# Check console in browser — production does NOT emit:
#   [HMR] connected
#   [Fast Refresh] rebuilding
#   Download the React DevTools

# Check JS chunk names — production emits content-hashed names
# (e.g., main-app-a1b2c3d4.js), not source-path names
# (e.g., src_app_layout_tsx_1g18foc.js)
```

If you see HMR/Fast Refresh messages or unhashed chunk names, the deployment
is running `next dev` — rebuild with the production Dockerfile.

## Rollback

```bash
# Stop the current container
docker compose -f docker-compose.prod.yml down

# Rebuild from the previous image (if cached) or revert code + rebuild
git checkout <previous-commit>
docker compose -f docker-compose.prod.yml up -d --build
```

## Troubleshooting

### App returns 502 after deploy

**Cause:** T1 host-mismatch fail-fast threw at boot.
**Fix:** Ensure `AUTH_URL` and `NEXT_PUBLIC_APP_URL` hosts match in `.env.local`.

### `/dashboard` redirects to `localhost:3000`

**Cause:** T2 fix not deployed, or `NEXT_PUBLIC_APP_URL` still set to localhost.
**Fix:** Set `NEXT_PUBLIC_APP_URL=https://storyintovideo.jesspete.shop` in `.env.local`, restart container.

### Character consistency doesn't work (faces vary across scenes)

**Cause:** `REPLICATE_SDXL_IPADAPTER_MODEL` is still the placeholder default.
**Fix:** Set it to `lucataco/sdxl-ipadapter:<sha>` in `.env.local`. Check container logs for the loud `console.warn`.

### Video assembly fails

**Cause:** FFmpeg not found, or `/tmp` out of memory.
**Fix:** Verify `FFMPEG_PATH=/usr/bin/ffmpeg` and that ffmpeg is installed in the container (`docker exec <container> ffmpeg -version`). For large videos, consider the H5 refactor (FFmpeg → R2 streaming via `@aws-sdk/lib-storage` — deferred).

### Stripe checkout fails

**Cause:** `PRICE_IDS` in `src/lib/stripe/client.ts` are placeholders.
**Fix:** Create real Stripe products + prices, then update `PRICE_IDS` or wire them via env vars.
