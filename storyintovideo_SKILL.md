---
name: storyintovideo
description: Complete engineering reference for the StoryIntoVideo production SaaS — a luxury-dark cinematic AI story-into-video generator built with Next.js 16, React 19, Tailwind v4 CSS-first @theme, Auth.js v5, Drizzle/Postgres, Inngest, and a fully-wired 6-step AI pipeline (moderate → analyze → characters → scenes → voiceover → subtitles → assemble). Covers the marketing clone design system, the 5-layer production architecture, exact color tokens, the 13 CSS keyframes, the auth-first Server Action pattern, SSE progress streaming, image moderation (ADR-011), and every bug encountered during the 4-sprint build + remediation sprint. v2.0.0 reflects the post-remediation codebase (227 unit tests + 48 E2E tests, Steps 4-6 wired, inngest.send uncommented, assemble-video rewritten, legal pages live, husky pre-commit hook active).
version: 2.0.0
---

# StoryIntoVideo — Engineering Skill Reference

> **Purpose:** Single-source engineering reference for the StoryIntoVideo codebase. Other coding agents (Claude, Gemini, Codex, etc.) should consult this file when extending, debugging, or replicating this project. Every section is grounded in actual code — exact classNames, color values, configuration flags, and the reasoning behind every non-obvious decision.
>
> **Authoritative Sources:** This SKILL.md is derived from `CLAUDE.md` · `AGENTS.md` · `README.md` · `PRODUCTION_READINESS_PLAN.md` · `Project_Requirements_Document.md` · the actual source tree under `src/`. When in doubt, consult `CLAUDE.md` as the source of truth.
>
> **v2.0.0 changelog:** Reflects the remediation sprint — Steps 4-6 wired into Inngest, `inngest.send()` uncommented, `assemble-video.ts` rewritten (4 defects fixed), SSE progress stream at `/api/projects/[id]/progress`, download/share buttons on project detail, image moderation via `moderateImage` (ADR-011), `/privacy` + `/terms` legal pages, husky + lint-staged pre-commit hook, documentation drifts fixed. Test count 164 → 227.

---

## Table of Contents

1. [Project Identity & Design Philosophy](#1-project-identity--design-philosophy)
2. [Tech Stack & Environment](#2-tech-stack--environment)
3. [Bootstrapping & Configuration](#3-bootstrapping--configuration)
4. [The Design System (Code-First)](#4-the-design-system-code-first)
5. [Component Architecture & Patterns](#5-component-architecture--patterns)
6. [Custom Hooks Deep Dive](#6-custom-hooks-deep-dive)
7. [Content Management: Static Data Files](#7-content-management-static-data-files)
8. [Accessibility (WCAG AAA) Implementation](#8-accessibility-wcag-aaa-implementation)
9. [Anti-Patterns & Common Bugs](#9-anti-patterns--common-bugs)
10. [Debugging Guide](#10-debugging-guide)
11. [Pre-Ship Checklist](#11-pre-ship-checklist)
12. [Lessons Learnt & How to Avoid Them](#12-lessons-learnt--how-to-avoid-them)
13. [Pitfalls to Avoid](#13-pitfalls-to-avoid)
14. [Best Practices](#14-best-practices)
15. [Coding Patterns](#15-coding-patterns)
16. [Coding Anti-Patterns](#16-coding-anti-patterns)
17. [Responsive Breakpoint Reference](#17-responsive-breakpoint-reference)
18. [Z-Index Layer Map](#18-z-index-layer-map)
19. [Color Reference (Complete)](#19-color-reference-complete)
20. [The Complete TypeScript Interface Reference](#20-the-complete-typescript-interface-reference)
21. [Validation Matrix](#21-validation-matrix)

---

## 1. Project Identity & Design Philosophy

### What StoryIntoVideo Is

StoryIntoVideo is a production SaaS application that transforms written stories into fully produced video content via a 6-step AI pipeline (story analysis → character generation → scene generation → voiceover → subtitle alignment → video assembly). The codebase has two layers:

1. **Marketing front end** — a pixel-accurate clone of `storyintovideo.com`, a luxury-dark, cinematic SaaS landing page. Every color token, keyframe, and hover micro-interaction was field-verified from the live production DOM.
2. **Production backend** — auth, database, AI pipeline, billing, and storage built behind the marketing facade using a 5-layer architecture (middleware → app → features → domain → lib).

### The Core Thesis: "Luxury-Dark Cinematic"

The design philosophy is **luxury-dark cinematic** — not brutalist, not minimal, not generic SaaS. The page treats the viewport like a screening room:

- A near-black canvas (`#020202`, NOT pure `#000`) interrupted by a single dominant accent of warm amber-gold (`#febf00`).
- The H1 is set in **Outfit weight 820** — an extra-bold display weight rarely seen in SaaS, giving the headline a cinematic title-card quality.
- A full-bleed background video plays behind the hero under three stacked overlays (vertical scrim + radial amber glow + bottom fade).
- The entire experience runs on a **13-keyframe CSS motion library** — shimmer sweeps, grid pulses, scanlines, border glows — with zero JavaScript animation libraries.

### The Three Foundational Pillars

1. **Amber is rationed.** `#febf00` is the only hue permitted to assert itself. It appears on CTAs, active states, focus rings, and the eyebrow badges — nowhere else. The CTA hierarchy is deliberate: ghost link → glass pill → gradient pill → solid amber, rationing the accent from least to most prominent.

2. **The singular purple exception.** The yellow→purple gradient (`bg-gradient-to-r from-yellow-500 to-purple-500`) on example-card hover is the **only purple on the entire site**. It exists as a deliberate surprise — a moment of color rebellion in an otherwise monochrome+amber palette. Do not add purple anywhere else.

3. **CSS-only animation.** No Framer Motion. No GSAP. No anime.js. All 13 keyframes are `@keyframes` in `globals.css`. Scroll reveal uses `IntersectionObserver` → `data-revealed` attribute → CSS transition. This is critical for the Lighthouse ≥95 performance budget.

### Explicit Rejections (Anti-Generic Mandate)

- **No Inter/Roboto safety.** Geist Sans (body) + Outfit (headings) + Geist Mono (accents) — all self-hosted, no Google Fonts CDN.
- **No purple-gradient-on-white clichés.** The background is near-black, not white.
- **No predictable Bootstrap-style card grids.** The Features section uses a continuous hairline grid (shared surface with `border-neutral-800` dividers), not boxed cards.
- **No `tailwind.config.ts`.** Tailwind v4 CSS-first `@theme` block in `globals.css` only.
- **No `force-static` on app routes.** The marketing page is static; all app routes are dynamic.
- **No `any` type.** ESLint enforces `@typescript-eslint/no-explicit-any: error`. Use `unknown` instead.
- **No `process.env.*` direct access.** Always import `env` from `@/lib/env` (Zod-validated at module load).

### The Meticulous Six-Phase Workflow

All implementation work follows this mandatory workflow (per `CLAUDE.md`):

1. **ANALYZE** — Deep requirement mining. Never assume. Check existing patterns before writing new code.
2. **PLAN** — Structured roadmap. Present plan for confirmation before coding.
3. **VALIDATE** — Get explicit approval before implementation.
4. **IMPLEMENT** — Modular, tested components. Test each before integration. TDD: RED → GREEN → REFACTOR, one cycle per logical change.
5. **VERIFY** — Run full quality gate: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`.
6. **DELIVER** — Confirm all checks pass. Document deviations.

---

## 2. Tech Stack & Environment

### Exact Versions (verified against `package.json`)

**Runtime dependencies:**

| Package | Version | Purpose |
|---|---|---|
| `next` | ^16.2.0 | Framework (App Router, hybrid rendering, Turbopack dev) |
| `react` | ^19.2.0 | UI |
| `react-dom` | ^19.2.0 | UI |
| `tailwindcss` | ^4.3.0 | Styling (CSS-first `@theme`) |
| `@tailwindcss/postcss` | ^4.3.0 | PostCSS plugin (mandatory for Tailwind v4) |
| `next-auth` | 5.0.0-beta.31 | Auth.js v5 (Google OAuth + Credentials) |
| `@auth/drizzle-adapter` | ^1.11.2 | Auth.js ↔ Drizzle adapter |
| `drizzle-orm` | ^0.45.2 | ORM (SQL-first, type-safe) |
| `postgres` | ^3.4.9 | PostgreSQL driver (Neon pooled connection) |
| `inngest` | ^4.11.0 | Job queue (6-step AI pipeline) |
| `openai` | ^6.45.0 | GPT-4o + Whisper + Moderation |
| `replicate` | ^1.4.0 | SDXL + IP-Adapter image generation |
| `elevenlabs` | ^1.59.0 | TTS voiceover |
| `stripe` | ^22.3.0 | Billing (Checkout + Portal + Webhooks) |
| `@aws-sdk/client-s3` | ^3.1075.0 | Cloudflare R2 storage (S3-compatible) |
| `@aws-sdk/s3-request-presigner` | ^3.1075.0 | R2 signed URLs |
| `fluent-ffmpeg` | ^2.1.3 | Video assembly (MP4 composition) |
| `@ffmpeg-installer/ffmpeg` | ^1.1.0 | FFmpeg binary path |
| `@radix-ui/react-accordion` | ^1.2.0 | FAQ accordion primitive |
| `@radix-ui/react-dialog` | ^1.1.0 | Mobile nav Sheet primitive |
| `@radix-ui/react-dropdown-menu` | ^2.1.0 | Language switcher primitive |
| `@radix-ui/react-slot` | ^1.3.0 | Button asChild pattern |
| `bcryptjs` | ^3.0.3 | Password hashing (credentials provider) |
| `class-variance-authority` | ^0.7.1 | Button variants |
| `clsx` | ^2.1.1 | Conditional className |
| `tailwind-merge` | ^3.0.0 | Tailwind class dedup |
| `geist` | ^1.7.0 | Geist Sans + Geist Mono fonts |
| `lucide-react` | ^0.460.0 | Icons |
| `zod` | ^4.4.3 | Env + Server Action input validation |

**Dev dependencies (notable):**

| Package | Version | Purpose |
|---|---|---|
| `typescript` | ^5.9.0 | Type checking |
| `vitest` | ^4.0.0 | Unit test runner (jsdom env) |
| `@testing-library/react` | ^16.0.0 | Component testing |
| `@testing-library/jest-dom` | ^6.9.0 | DOM matchers |
| `@playwright/test` | ^1.61.0 | E2E tests (Chromium) |
| `jsdom` | ^29.0.0 | DOM simulation for Vitest |
| `eslint` | ^9.0.0 | Linting (flat config) |
| `typescript-eslint` | ^8.62.0 | TS ESLint rules |
| `eslint-plugin-react` | ^7.37.5 | React rules |
| `eslint-plugin-react-hooks` | ^7.1.1 | Hooks rules |
| `@next/eslint-plugin-next` | ^16.2.9 | Next.js rules |
| `prettier` | ^3.8.0 | Code formatting |
| `prettier-plugin-tailwindcss` | ^0.8.0 | Tailwind class sorting |
| `drizzle-kit` | ^0.31.10 | Migration generator |
| `tsx` | ^4.22.4 | TypeScript execution (seed script) |
| `dotenv-cli` | ^11.0.0 | Load .env.local for CLI scripts |
| `husky` | ^9.1.7 | Git pre-commit hooks |
| `lint-staged` | ^17.0.8 | Run linters on staged files |

### Engine Requirements

```json
"engines": {
  "node": ">=20.0.0",
  "pnpm": ">=9.0.0"
}
```

### TypeScript Strict Mode (Critical Flags)

`tsconfig.json` enables maximum strictness. These flags are non-negotiable:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "ES2022"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "verbatimModuleSyntax": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "paths": { "@/*": ["./src/*"] }
  },
  "exclude": ["node_modules", "skills", "docs"]
}
```

**Critical flag explanations:**

- **`verbatimModuleSyntax: true`** — requires `import type` for type-only imports. `import { Foo }` where `Foo` is a type errors. Must use `import type { Foo }` or `import { type Foo }`.
- **`noUncheckedIndexedAccess: true`** — array/object access returns `T | undefined`. `arr[0]` is `T | undefined`, not `T`. Forces null checks.
- **`isolatedModules: true`** — each file must be independently transpilable. Affects re-exports: `export { Foo } from './foo'` works, but type re-exports need `export type { Foo }`.
- **`strict: true`** — enables `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`, `strictBindCallApply`, `strictPropertyInitialization`, `noImplicitThis`, `alwaysStrict`.

### Package Manager

**pnpm** is the only supported package manager. `pnpm-lock.yaml` is the source of truth. `package-lock.json` should NOT exist (delete it if `npm install` created one — the project uses pnpm).

```bash
pnpm install          # Install deps (activates husky via `prepare` script)
pnpm dev              # Start dev server (Turbopack, port 3000)
pnpm lint             # ESLint flat config
pnpm typecheck        # tsc --noEmit
pnpm test             # Vitest (227 unit tests)
pnpm test:e2e         # Playwright (48 E2E tests, requires `pnpm exec playwright install`)
pnpm build            # Production build
pnpm drizzle-kit generate   # Create migration SQL from schema diff
pnpm drizzle-kit migrate    # Apply migrations (needs DATABASE_URL_UNPOOLED)
pnpm db:seed                # Run seed script (dev@storyintovideo.com / password123)
pnpm db:reset               # Migrate + seed in one command
```

---

## 3. Bootstrapping & Configuration

### From Zero (Recreating This Project)

This is **not** a Vite project. It uses Next.js 16 App Router. To bootstrap a similar project from scratch:

```bash
# 1. Create Next.js 16 app
pnpm create next-app@latest story-into-video \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --use-pnpm

# 2. Install runtime deps
pnpm add next-auth@5.0.0-beta.31 @auth/drizzle-adapter drizzle-orm postgres
pnpm add inngest openai replicate elevenlabs stripe
pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
pnpm add fluent-ffmpeg @ffmpeg-installer/ffmpeg
pnpm add @radix-ui/react-accordion @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-slot
pnpm add bcryptjs class-variance-authority clsx tailwind-merge geist lucide-react zod

# 3. Install dev deps
pnpm add -D drizzle-kit tsx dotenv-cli
pnpm add -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
pnpm add -D @playwright/test
pnpm add -D husky lint-staged prettier prettier-plugin-tailwindcss
pnpm add -D @types/bcryptjs @types/fluent-ffmpeg @types/node @types/react @types/react-dom

# 4. Install Playwright browsers
pnpm exec playwright install chromium

# 5. Initialize husky
pnpm exec husky init
echo "pnpm lint-staged" > .husky/pre-commit
chmod +x .husky/pre-commit

# 6. Download Outfit variable font (for weight 820 access)
# Source: https://github.com/google/fonts/raw/main/ofl/outfit/Outfit%5Bwght%5D.ttf
# Convert to woff2 via fonttools, place at public/fonts/Outfit-VariableFont.woff2
```

### `next.config.ts`

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  allowedDevOrigins: ['storyintovideo.jesspete.shop', '192.168.2.132'],
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
```

**Notes:**
- `reactStrictMode: true` — surfaces side-effect bugs in dev.
- `poweredByHeader: false` — removes `X-Powered-By: Next.js` header (security).
- `allowedDevOrigins` — needed when dev server is accessed from non-localhost (LAN IP or tunnel).
- Security headers (X-Frame-Options DENY, nosniff, strict referrer) are applied to all routes.

### `postcss.config.mjs` (Tailwind v4 — Critical)

```javascript
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};

export default config;
```

**⚠️ Critical:** Tailwind v4 uses `@tailwindcss/postcss`, NOT the old `tailwindcss` PostCSS plugin. If you write `plugins: { tailwindcss: {} }` (v3 syntax), Tailwind classes won't apply.

### `eslint.config.mjs` (ESLint 9 Flat Config)

```javascript
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import nextPlugin from '@next/eslint-plugin-next';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: [
      'node_modules/**', '.next/**', 'out/**', 'build/**', 'coverage/**',
      'playwright-report/**', 'test-results/**', 'public/**',
      'skills/**', 'docs/**', 'scripts/**', 'next-env.d.ts',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx,js,jsx,mjs,cjs}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      '@next/next': nextPlugin,
    },
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: 'detect' } },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      ...nextPlugin.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      'react/no-unescaped-entities': 'off',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
);
```

**Key rules:**
- `@typescript-eslint/no-explicit-any: error` — zero `any` allowed. Use `unknown`.
- `@typescript-eslint/consistent-type-imports: error` — enforces `import type` for type-only imports (pairs with `verbatimModuleSyntax`).
- `react-hooks/exhaustive-deps: warn` — warns on missing deps in `useEffect`/`useCallback`.

### `drizzle.config.ts`

```typescript
import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/lib/db/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL_UNPOOLED!,  // Direct connection, NOT pooled
  },
  verbose: true,
  strict: true,
});
```

**⚠️ Critical:** Drizzle Kit needs `DATABASE_URL_UNPOOLED` (Neon's direct host), NOT the pooled `-pooler` host. DDL operations are unreliable over PgBouncer pooling. Never use `drizzle-kit push` in production — always `generate` + review + `migrate`.

### `vitest.config.ts`

Vitest uses jsdom environment. The `setup.ts` file provides dummy env vars so the Zod env module doesn't throw at module load.

### `playwright.config.ts`

- Chromium only (not Firefox/WebKit)
- Auto-starts `pnpm dev` on port 3000
- Base URL: `http://localhost:3000`
- Requires `pnpm exec playwright install` after fresh clone (browser binaries not in node_modules)

### `.env.example` → `.env.local`

The env module (`src/lib/env/index.ts`) is Zod-validated at module load. Required vars:

```bash
# Database (Neon)
DATABASE_URL=postgresql://user:pass@ep-pooler.region.aws.neon.tech/db?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://user:pass@ep-direct.region.aws.neon.tech/db?sslmode=require

# Auth
AUTH_SECRET=<openssl rand -base64 32>  # MUST be ≥32 chars, not a known-weak value
AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=<optional>             # Both required to enable Google OAuth
GOOGLE_CLIENT_SECRET=<optional>

# AI Providers
OPENAI_API_KEY=sk-...
REPLICATE_API_TOKEN=r8_...
ELEVENLABS_API_KEY=...

# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...

# Cloudflare R2 (3 buckets)
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_UPLOADS=siv-uploads
R2_BUCKET_GENERATED=siv-generated
R2_BUCKET_VIDEOS=siv-videos

# Inngest
INNGEST_EVENT_KEY=...
INNGEST_SIGNING_KEY=...

# Email (Resend)
RESEND_API_KEY=re_...

# Rate Limiting (Upstash) — env in schema, integration not yet implemented
UPSTASH_REDIS_REST_URL=https://example.upstash.io
UPSTASH_REDIS_REST_TOKEN=...

# Monitoring (Sentry) — env in schema, integration not yet implemented
SENTRY_DSN=https://example@sentry.io/1

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

**Build-context fallback:** When `NEXT_PHASE=phase-production-build` or `NODE_ENV=test`, the env module returns placeholder values so `next build` succeeds without real env vars. At runtime, real env vars MUST be set or the app fails fast.

### `components.json` (shadcn/ui config — hand-written, CLI not used)

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/app/globals.css",
    "baseColor": "zinc",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/lib/hooks"
  },
  "iconLibrary": "lucide"
}
```

**Note:** The shadcn CLI timed out during the original build, so all 4 UI primitives (`button.tsx`, `accordion.tsx`, `sheet.tsx`, `dropdown-menu.tsx`) are hand-written in `src/components/ui/` following the new-york style.

### husky + lint-staged Configuration

**`package.json` additions:**

```json
{
  "scripts": {
    "prepare": "husky || true"
  },
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,css,mjs}": ["prettier --write"]
  }
}
```

**`.husky/pre-commit`:**

```bash
#!/usr/bin/env sh
pnpm lint-staged
```

**⚠️ Critical:** The `|| true` in the `prepare` script is intentional — it prevents `pnpm install` from failing on first install when husky isn't yet installed. Do NOT remove it.

---

## 4. The Design System (Code-First)

This section is the verbatim source of truth for the design system. Every token, keyframe, and utility class is reproduced from `src/app/globals.css`.

### The `@theme` Block (Tailwind v4 CSS-First Configuration)

```css
@import 'tailwindcss';

/* Explicit content scanning — app/ is auto-scanned, we add components/ and lib/ */
@source '../components/**/*.{ts,tsx}';
@source '../lib/**/*.{ts,tsx}';

@theme {
  /* ── Color Palette (verified from live site :root) ── */
  --color-background: #020202;
  --color-foreground: #f8f8f8;
  --color-card: #060607;
  --color-card-foreground: #f8f8f8;
  --color-popover: #0b0b0d;
  --color-popover-foreground: #f8f8f8;
  --color-primary: #febf00;
  --color-primary-foreground: #020202;
  --color-secondary: #111114;
  --color-secondary-foreground: #f8f8f8;
  --color-muted: #1a1a1d;
  --color-muted-foreground: #8e8e95;
  --color-accent: #febf00;
  --color-accent-foreground: #020202;
  --color-destructive: #ff2d39;
  --color-destructive-foreground: #f8f8f8;
  --color-border: #1a1a1d;
  --color-input: #0b0b0d;
  --color-ring: #febf0080;

  /* Chart palette (reserved for future dashboard use) */
  --color-chart-1: #febf00;
  --color-chart-2: #00aa6f;
  --color-chart-3: #8d92f9;
  --color-chart-4: #f14d4c;
  --color-chart-5: #7bc27e;

  /* ── Typography ── */
  --font-sans: var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-geist-mono), ui-monospace, SFMono-Regular, monospace;
  --font-heading: var(--font-outfit), ui-sans-serif, system-ui, sans-serif;

  /* ── Border Radius ── */
  --radius: 0.75rem;
  --radius-sm: calc(0.75rem - 4px);
  --radius-md: calc(0.75rem - 2px);
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-2xl: 1.25rem;

  /* ── Shadows ── */
  --shadow-hero-input: 0 20px 80px rgba(0, 0, 0, 0.6);
  --shadow-eyebrow-glow: 0 0 30px rgba(234, 179, 8, 0.1);
  --shadow-cta-glow: 0 0 40px rgba(251, 191, 36, 0.3);

  /* ── Animations (13 keyframes, all kebab-case) ── */
  --animate-fade-in-up: fade-in-up 0.6s ease-out both;
  --animate-float: float 6s ease-in-out infinite;
  --animate-glow-pulse: glow-pulse 3s ease-in-out infinite;
  --animate-border-glow: border-glow 4s ease-in-out infinite;
  --animate-composite-pulse-text: composite-pulse-text 2s ease-in-out infinite;
  --animate-shimmer: shimmer 3s linear infinite;
  --animate-btn-shimmer: btn-shimmer 1.5s ease-in-out infinite;
  --animate-grid-shimmer: grid-shimmer 8s ease-in-out infinite;
  --animate-grid-sweep-h: grid-sweep-h 8s linear infinite;
  --animate-grid-sweep-v: grid-sweep-v 10s linear infinite;
  --animate-scanline-scroll: scanline-scroll 1s linear infinite;
  --animate-lang-dropdown-in: lang-dropdown-in 0.15s ease-out;
  --animate-marquee-scroll: marquee-scroll 40s linear infinite;

  /* ── Keyframes (inside @theme so Tailwind v4 picks them up) ── */
  @keyframes fade-in-up { /* ... see full source ... */ }
  @keyframes float { /* ... */ }
  @keyframes glow-pulse { /* ... */ }
  @keyframes border-glow { /* ... */ }
  @keyframes composite-pulse-text { /* ... */ }
  @keyframes shimmer { /* ... */ }
  @keyframes btn-shimmer { /* ... */ }
  @keyframes grid-shimmer { /* ... */ }
  @keyframes grid-sweep-h { /* ... */ }
  @keyframes grid-sweep-v { /* ... */ }
  @keyframes scanline-scroll { /* ... */ }
  @keyframes lang-dropdown-in { /* ... */ }
  @keyframes marquee-scroll { /* ... */ }
}
```

(Full keyframe bodies are in `src/app/globals.css` lines 78-213. All 13 use kebab-case names.)

### The 13 Keyframes (Complete Reference)

| # | Name | Duration | Purpose |
|---|---|---|---|
| 1 | `fade-in-up` | 0.6s ease-out both | Entrance: opacity 0→1 + translateY 20px→0 |
| 2 | `float` | 6s ease-in-out infinite | Ambient: translateY 0→-12px→0 (cards) |
| 3 | `glow-pulse` | 3s ease-in-out infinite | Amber box-shadow pulse 20px→40px→20px |
| 4 | `border-glow` | 4s ease-in-out infinite | Border color 0.08→0.2→0.08 amber |
| 5 | `composite-pulse-text` | 2s ease-in-out infinite | Opacity 0.7→1→0.7 (text shimmer) |
| 6 | `shimmer` | 3s linear infinite | Background-position 200%→-200% (gradient sweep) |
| 7 | `btn-shimmer` | 1.5s ease-in-out infinite | translateX -100%→100% (button sweep) |
| 8 | `grid-shimmer` | 8s ease-in-out infinite | translate(-20%,-30%)→(70%,40%)→(-20%,-30%) |
| 9 | `grid-sweep-h` | 8s linear infinite | translateX -600px→(600px+100vw) |
| 10 | `grid-sweep-v` | 10s linear infinite | translateY -500px→(500px+100vh) |
| 11 | `scanline-scroll` | 1s linear infinite | background-position-x 0→30px |
| 12 | `lang-dropdown-in` | 0.15s ease-out | opacity 0→1 + translateY(-4px) scale(0.96)→0 |
| 13 | `marquee-scroll` | 40s linear infinite | translateX 0→-50% (infinite style chips ticker) |

### The `@utility` Classes (Tailwind v4 Idiom)

```css
/* Hide scrollbar (for carousels) */
@utility scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
}

/* Marquee edge mask — fades chips at left/right edges */
@utility marquee-mask {
  -webkit-mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent);
  mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent);
}

/* Marquee track — infinite horizontal scroll, pauses on hover */
@utility marquee-track {
  display: flex;
  gap: 0.5rem;
  width: max-content;
  animation: var(--animate-marquee-scroll);
  &:hover { animation-play-state: paused; }
  @media (max-width: 640px) { animation-duration: 30s; }
}

/* Glass input widget (Hero story textarea wrapper) */
@utility glass-input {
  position: relative;
  border-radius: var(--radius-2xl);
  background-color: rgb(9 9 11 / 0.6);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  padding: 1.25rem;
  border: 1px solid rgb(255 255 255 / 0.08);
  transition-property: border-color, box-shadow;
  transition-duration: 500ms;
  box-shadow: var(--shadow-hero-input);
  @media (min-width: 640px) { padding: 1.5rem; }
  &:hover { border-color: rgb(255 255 255 / 0.12); }
  &:focus-within {
    border-color: rgb(251 191 36 / 0.3);
    box-shadow: var(--shadow-hero-input), 0 0 30px rgb(251 191 36 / 0.1);
  }
}

/* Eyebrow badge — amber pill with ambient glow */
@utility eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 1rem;
  border-radius: 9999px;
  background-color: rgb(251 191 36 / 0.1);
  border: 1px solid rgb(251 191 36 / 0.25);
  backdrop-filter: blur(4px);
  font-size: 11px;
  font-weight: 600;
  color: var(--color-primary);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  box-shadow: var(--shadow-eyebrow-glow);
}

/* Section heading (H2) — Outfit, fluid clamp size */
@utility section-heading {
  font-family: var(--font-heading);
  font-weight: 700;
  letter-spacing: -0.03em;
  color: #ffffff;
  font-size: clamp(2rem, 5vw, 3rem);
  line-height: 1.1;
}

/* Tier-4 CTA: solid amber pill with hover scale + glow */
@utility cta-amber {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.625rem;
  padding: 0.875rem 2rem;
  background-color: var(--color-primary);
  color: var(--color-primary-foreground);
  font-weight: 700;
  font-size: 15px;
  border-radius: 9999px;
  transition-property: background-color, box-shadow, transform;
  transition-duration: 200ms;
  &:hover {
    background-color: rgb(252 211 77);
    box-shadow: 0 10px 15px -3px rgb(251 191 36 / 0.2);
    transform: scale(1.02);
  }
}
```

### Global Element Styles (`@layer base`)

```css
@layer base {
  * { border-color: var(--color-border); }

  html {
    scroll-behavior: smooth;
    -webkit-text-size-adjust: 100%;
  }

  body {
    background-color: var(--color-background);
    color: var(--color-foreground);
    font-family: var(--font-sans);
    font-size: 16px;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
  }

  h1, h2, h3, h4, h5, h6 { font-family: var(--font-heading); }

  ::selection {
    background-color: rgba(251, 191, 36, 0.3);
    color: #fff;
  }

  ::-webkit-scrollbar { width: 10px; height: 10px; }
  ::-webkit-scrollbar-track { background: #020202; }
  ::-webkit-scrollbar-thumb {
    background: #1a1a1d;
    border-radius: 5px;
    border: 2px solid #020202;
  }
  ::-webkit-scrollbar-thumb:hover { background: #2a2a2d; }

  :focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
}
```

### Scroll Reveal (CSS-Only, Data-Attribute Driven)

```css
[data-reveal] {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease-out, transform 0.6s ease-out;
  transition-delay: var(--reveal-delay, 0s);
}

[data-reveal][data-revealed='true'] {
  opacity: 1;
  transform: translateY(0);
}
```

The `useReveal` hook flips `data-revealed` from `false` to `true` when the element enters the viewport via `IntersectionObserver`. The CSS handles the actual transition.

### Radix Accordion Content Animation (grid-template-rows trick)

```css
.radix-accordion-content {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 300ms ease-out;
}

.radix-accordion-content[data-state='open'] {
  grid-template-rows: 1fr;
}

.radix-accordion-content > div {
  overflow: hidden;
}
```

Modern GPU-accelerated alternative to `max-height` animation. Supported in Chrome 117+, Firefox 118+, Safari 17.4+.

### Reduced Motion Global Override

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  .marquee-track { animation: none !important; }
  video[autoplay] { display: none; }
  [data-reveal] { opacity: 1 !important; transform: none !important; }
}
```

### Typography Hierarchy (Exact)

| Element | Font | Weight | Class | Tracking |
|---|---|---|---|---|
| H1 (hero desktop) | Outfit | **820** | `font-heading text-[4.5rem]` | `-0.04em` |
| H1 (hero mobile) | Outfit | 820 | `text-4xl` | scales with `em` |
| H2 (sections) | Outfit | 700 | `font-heading text-4xl lg:text-6xl` | `-0.03em` |
| Body | Geist Sans | 400 | `font-sans text-lg` | normal |
| Ratio toggles | Geist Mono | 400 | `font-mono text-[10px]` | — |

**⚠️ Critical:** Outfit weight 820 is unavailable from Google Fonts API (which only serves discrete weights). Must self-host via `next/font/local` pointing to `public/fonts/Outfit-VariableFont.woff2` (45KB, weight range 100-900).

### Color System (Non-Negotiable)

```
Background:    #020202  (near-black, warm-neutral — NOT pure #000)
Primary/Amber: #febf00  (CTAs, active states, focus rings, accents)
Surface:       #060607  (cards)
Muted text:    #8e8e95  (zinc-400 equivalent)
Body text:     #d4d4d8  (zinc-300, used via Tailwind utility, not a custom token)
Foreground:    #f8f8f8  (headings, default text)
Border:        #1a1a1d  (hairline dividers)
Destructive:   #ff2d39  (error states)
Ring:          #febf0080 (50% opacity amber focus ring)
```

**⚠️ Critical:** `#febf00` ≠ Tailwind's `amber-400` (`#fbbf24`). These are different colors. Always use the custom `--color-primary` token, never `amber-400`.

---

## 5. Component Architecture & Patterns

### The 5-Layer Architecture (Golden Rule)

```
Layer 0: src/middleware.ts        — Cookie check, redirect. NO DB. Edge runtime.
Layer 1: src/app/                 — Route structure, metadata, Suspense. Layouts must NOT fetch data.
Layer 2: src/features/            — UI composition, data binding, mutations (auth, projects, pipeline, billing)
Layer 3: src/features/*/domain/   — Pure business logic. No Next.js or DB runtime imports (import type only)
Layer 4: src/lib/                 — Infrastructure: Drizzle, Auth.js, Inngest, R2, Stripe, AI providers. Side effects only.
```

**Golden Rule:** A lower layer may never import from a higher layer. Domain may import types from Infrastructure but never runtime code.

### Server vs Client Component Split

**Client components (`'use client'`)** — only when state/browser APIs are needed:

*Marketing layer (5):*
- `Navbar` — scroll state (`useScrolled`), mobile Sheet toggle
- `Hero` — textarea state, chip click, ratio toggle, character counter
- `Examples` — carousel arrow click handlers
- `Faq` — Radix Accordion (stateful)
- `Workflow` — `useState` for poster→video fade-in choreography

*App layer (7):*
- `AuthForm` — Google OAuth + credentials `signIn()`
- `CreateWizard` — story input + style + ratio + counter
- `Providers` — SessionProvider wrapper
- `ScrollReveal` — IntersectionObserver primitive
- `ProjectProgressPanel` — SSE subscriber + live progress bar
- `ProjectDownloadButton` — fetches signed R2 URL on mount
- `ProjectShareButton` — Web Share API + clipboard fallback

**Server components (default)** — pure static HTML/CSS:
- `Features`, `Testimonials`, `UseCases`, `FinalCta`, `Footer` (marketing)
- `dashboard`, `project-detail`, `billing`, `privacy`, `terms` pages (app)

### Marketing Section Order (Fixed, Top → Bottom)

1. **Navbar** (`'use client'` — fixed overlay, scroll-aware bg, mobile Sheet)
2. **Hero** (`'use client'` — video bg + glass input + style marquee + chips + ratio toggle)
3. **Examples** (`'use client'` — carousel with arrow handlers)
4. **Workflow** (`'use client'` — video loading state + 4 alternating media/text rows)
5. **Features** (server — 4×2 grid, hover accent bar, hairline borders)
6. **Testimonials** (server — 3×2 grid, initials avatars)
7. **Use Cases** (server — 2×2 grid, corner glow on hover)
8. **FAQ** (`'use client'` — Radix Accordion)
9. **Final CTA** (server — dot-grid bg, amber CTA pill)
10. **Footer** (server — 3 link columns + copyright)

### Component Breakdowns

#### Hero (`src/components/sections/hero.tsx`)

**4 layers:**
1. Background video (`/hero-bg.mp4`) with `autoPlay muted loop playsInline preload="metadata"`, under three overlays: vertical scrim (`bg-gradient-to-b from-zinc-950/85 via-zinc-950/70 to-zinc-950/80`), radial amber glow (`radial-gradient(rgba(251,191,36,0.12),rgba(0,0,0,0) 65%)`), bottom fade.
2. Content: eyebrow badge + H1 (Outfit 820, `text-[4.5rem] tracking-[-0.04em]`) + subtitle + glass input widget (textarea + 4 story chips + character counter + ratio toggle).
3. Style tags marquee (7 chips × 2 = 14, infinite scroll via `marquee-track` @utility).
4. Bottom fade into next section.

**State:**
- `story: string` — textarea content
- `activeRatio: AspectRatio` — `{ label: '9:16', value: 'portrait' }` (default) or `{ label: '16:9', value: 'landscape' }`

**Interactions:**
- Chip click → `setStory(STORY_SEEDS[label])` (300-500 char seed text)
- Character counter: `{story.length} / 500`, amber at ≥450 chars
- Ratio toggle: `aria-pressed` toggle buttons, single-selection enforced

#### Navbar (`src/components/sections/navbar.tsx`)

- Fixed `top-0 z-50`, scroll-aware bg: transparent → `bg-zinc-950/70 backdrop-blur-[24px] border-b border-white/10` at `scrollY > 10`
- Desktop: logo + 4 nav links + EN dropdown (decorative — no i18n) + Sign in (ghost) + Get Started (glass pill)
- Mobile (`<sm`): logo + EN + hamburger → right-side Sheet (Radix Dialog)

#### ProjectProgressPanel (`src/components/app/project-progress-panel.tsx`)

- Client component subscribes to SSE via `useProjectProgress(projectId)`
- Renders: status label (10 states), progress detail text, progress bar (`<div role="progressbar">`), connection error message
- Falls back to initial SSR values before SSE delivers first message

#### ProjectDownloadButton (`src/components/app/project-download-button.tsx`)

- Client component, fetches signed R2 URL on mount via `getSignedDownloadUrl('videos', videoKey)`
- Renders: loading state ("Preparing…") → `<a href={signedUrl} download>` amber pill
- 1-hour URL expiry (re-fetched on every mount, so always fresh)

#### ProjectShareButton (`src/components/app/project-share-button.tsx`)

- Client component, uses Web Share API when available, falls back to `navigator.clipboard.writeText`
- Shows transient "Copied!" state for 2 seconds after clipboard success

### Auth-First Server Action Pattern

Every Server Action starts with `verifySession()` before any other logic. **Never wrap in try/catch** — it throws `NEXT_REDIRECT` which must propagate.

```typescript
'use server';

export async function createProjectAction(input: z.infer<typeof CreateProjectSchema>) {
  // 1. AUTH FIRST
  const session = await verifySession({ redirectTo: '/create' });
  const userId = session.user?.id;
  if (!userId) return { success: false, error: 'Not authenticated', code: 'UNAUTHORIZED' };

  // 2. ZOD VALIDATE
  const parsed = CreateProjectSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: '...', code: 'VALIDATION' };

  // 3. CONTENT MODERATION (ADR-011)
  const moderation = await moderateContent(parsed.data.story);
  if (moderation.flagged) return { success: false, error: '...', code: 'FLAGGED' };

  // 4. CREDITS
  try {
    await getOrCreateSubscription(userId);
    await debitCredits(userId, CREDIT_COSTS.analysis, 'analysis');
  } catch (err) {
    if (err instanceof InsufficientCreditsError) {
      return { success: false, error: err.message, code: 'INSUFFICIENT_CREDITS' };
    }
    throw err;
  }

  // 5. INSERT PROJECT
  const [project] = await db.insert(projects).values({ ... }).returning();

  // 6. TRIGGER INNGEST PIPELINE
  await inngest.send({ name: PIPELINE_EVENT, data: { projectId: project.id } });

  // 7. REVALIDATE + REDIRECT
  revalidatePath('/dashboard');
  redirect(`/projects/${project.id}`);
}
```

### `queries.ts` Boundary

All DB access goes through feature-level `queries.ts` files. Components never call `db` directly. This enables testing + future swap.

- `src/features/projects/queries.ts` — `getUserProjects`, `getProject` (owner-checked, LEFT JOIN videos)
- `src/features/pipeline/queries.ts` — `appendCharacter`, `appendScene`, `appendVoiceover`, `appendVideo`, `updateVideoSubtitle`, `updateProjectProgress`, `setProjectFailed`, `getProjectCharacters`, `getProjectScenes`, `getProjectVoiceover`, `getProjectVideo`
- `src/features/billing/queries.ts` — `getOrCreateSubscription`, `debitCredits` (transactional), `refillCredits`, `getUsageSummary`

### Domain Isolation

`src/features/*/domain/` contains pure functions — no Next.js or DB runtime imports (`import type` only for type-only deps). This is critical for testability.

- `src/features/auth/domain/verify-session.ts` — DAL auth function (throws NEXT_REDIRECT)
- `src/features/pipeline/domain/analyze-story.ts` — GPT-4o JSON mode
- `src/features/pipeline/domain/moderate-content.ts` — OpenAI Moderation API
- `src/features/pipeline/domain/moderate-image.ts` — Replicate safety_concept parser (ADR-011)
- `src/features/pipeline/domain/generate-character.ts` — Replicate SDXL
- `src/features/pipeline/domain/generate-scene.ts` — Replicate SDXL + IP-Adapter
- `src/features/pipeline/domain/synthesize-voice.ts` — ElevenLabs TTS (chunked)
- `src/features/pipeline/domain/align-subtitles.ts` — Whisper ASR → SRT
- `src/features/pipeline/domain/assemble-video.ts` — FFmpeg compositor (SRT temp file + Buffer readback)
- `src/features/billing/domain/tier-limits.ts` — `TIER_LIMITS` + `CREDIT_COSTS`

---

## 6. Custom Hooks Deep Dive

### `useScrolled(threshold = 10): boolean`

**File:** `src/lib/hooks/use-scrolled.ts`

Returns `true` when `window.scrollY` exceeds the given threshold. Used by the Navbar to toggle its scroll-aware background.

```typescript
'use client';

import { useEffect, useState } from 'react';

export function useScrolled(threshold = 10): boolean {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll(); // Initialize on mount
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  return scrolled;
}
```

**Key details:**
- `passive: true` — improves scroll performance (browser doesn't wait for `preventDefault`)
- `onScroll()` called once on mount — initializes state correctly if page is loaded scrolled
- `threshold` in deps — re-binds listener if threshold changes
- Cleanup: `removeEventListener` on unmount

### `useReveal<T extends HTMLElement>(options): { ref, revealed }`

**File:** `src/lib/hooks/use-reveal.ts`

Wraps `IntersectionObserver` to trigger a one-shot reveal flag when an element enters the viewport. Used by the `ScrollReveal` primitive and section components for cinematic staggered entrance animations.

```typescript
'use client';

import { useEffect, useRef, useState } from 'react';

interface UseRevealOptions {
  threshold?: number;      // Default 0.15
  rootMargin?: string;     // Default '0px 0px -50px 0px' (triggers 50px before entering)
  once?: boolean;          // Default true — disconnects after first intersection
}

export function useReveal<T extends HTMLElement = HTMLDivElement>(
  options: UseRevealOptions = {},
): { ref: React.RefObject<T | null>; revealed: boolean } {
  const { threshold = 0.15, rootMargin = '0px 0px -50px 0px', once = true } = options;
  const ref = useRef<T>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry) return;
        if (entry.isIntersecting) {
          setRevealed(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setRevealed(false);
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return { ref, revealed };
}
```

**Key details:**
- `rootMargin: '0px 0px -50px 0px'` — negative bottom margin triggers reveal 50px BEFORE the element fully enters viewport (smoother)
- `once: true` (default) — observer disconnects after first intersection (no re-hide on scroll up)
- `once: false` — toggles `revealed` on every intersection (use for re-animating sections)
- Generic `T extends HTMLElement` — type the ref for the specific element (`HTMLDivElement`, `HTMLElement`, etc.)
- The `data-reveal` / `data-revealed` CSS attributes handle the actual visual transition; this hook just flips the flag

**Usage pattern:**
```tsx
const { ref, revealed } = useReveal<HTMLDivElement>();
return <div ref={ref} data-reveal data-revealed={revealed}>...</div>;
```

### `useReducedMotion(): boolean`

**File:** `src/lib/hooks/use-reduced-motion.ts`

Returns `true` when the user has OS-level reduced-motion preference enabled. Used to conditionally skip JS-driven animations (the global CSS `@media (prefers-reduced-motion: reduce)` handles declarative cases).

```typescript
'use client';

import { useEffect, useState } from 'react';

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mediaQuery.matches);

    onChange(); // Initialize on mount
    mediaQuery.addEventListener('change', onChange);
    return () => mediaQuery.removeEventListener('change', onChange);
  }, []);

  return reduced;
}
```

**Key details:**
- `onChange()` called once on mount — initializes state correctly
- Listens for `change` event — user toggling the preference updates the hook live
- The global CSS override handles most cases declaratively; this hook is for JS-driven decisions (e.g., skipping a video autoplay, disabling a JS animation)

### `useProjectProgress(projectId): ProjectProgressState`

**File:** `src/lib/hooks/use-project-progress.ts`

Subscribes to the SSE progress stream at `/api/projects/[id]/progress`. Opens an `EventSource`, parses incoming JSON events, and exposes the latest status/progress to the component. Closes the `EventSource` on unmount or when status reaches a terminal state.

```typescript
'use client';

import { useEffect, useState } from 'react';

export interface ProjectProgressState {
  status: string | null;
  progressPercent: number | null;
  progressDetail: string | null;
  errorMessage: string | null;
  connectionState: 'connecting' | 'open' | 'closed' | 'error';
}

const TERMINAL_STATUSES = new Set(['completed', 'failed']);

export function useProjectProgress(projectId: string): ProjectProgressState {
  const [state, setState] = useState<ProjectProgressState>(INITIAL_STATE);

  useEffect(() => {
    if (!projectId) return;

    const eventSource = new EventSource(`/api/projects/${projectId}/progress`);

    eventSource.onopen = () => {
      setState((prev) => ({ ...prev, connectionState: 'open' }));
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setState({ ...data, connectionState: 'open' });

        // Close the EventSource when terminal — server will also close,
        // but this avoids a redundant reconnect attempt
        if (TERMINAL_STATUSES.has(data.status)) {
          eventSource.close();
          setState((prev) => ({ ...prev, connectionState: 'closed' }));
        }
      } catch {
        // Malformed JSON — ignore the message
      }
    };

    eventSource.onerror = () => {
      setState((prev) => ({
        ...prev,
        connectionState: EventSource.CLOSED ? 'closed' : 'error',
      }));
    };

    return () => {
      eventSource.close();  // ⚠️ CRITICAL — never leak the connection
    };
  }, [projectId]);

  return state;
}
```

**Key details:**
- **Cleanup is non-negotiable** — `useEffect` must return `() => eventSource.close()`. Otherwise the connection leaks when the user navigates away.
- **Terminal state close** — when `status ∈ {completed, failed}`, the hook closes the EventSource client-side (server also closes, but this avoids a reconnect attempt).
- **Malformed JSON ignored** — `try/catch` around `JSON.parse` swallows bad messages without crashing the hook.
- **`onerror` uses `EventSource.CLOSED`** — distinguishes between transient errors (reconnect) and permanent close.

---

## 7. Content Management: Static Data Files

> **⚠️ Adaptation note:** The sample skill structure references `import.meta.glob` (a Vite feature). This project uses **Next.js App Router**, not Vite — `import.meta.glob` is not available. Content is managed via **static TypeScript data files** in `src/lib/data/`. This is the idiomatic Next.js pattern.

### The 10 Static Data Files

All marketing content lives in `src/lib/data/*.ts` as typed constants imported by components:

| File | Export | Type | Used by |
|---|---|---|---|
| `nav-links.ts` | `NAV_LINKS`, `NAV_LANGUAGES` | `NavLink[]`, `DropdownItem[]` | Navbar |
| `story-seeds.ts` | `STORY_SEEDS`, `DEFAULT_STORY_EXAMPLES` | `Record<string, string>`, `StoryExample[]` | Hero (chip click → textarea) |
| `style-chips.ts` | `STYLE_CHIPS` | `StyleChip[]` (7 items, "Cyberpunk" has sublabel) | Hero marquee |
| `examples.ts` | `EXAMPLES` | `ExampleCard[]` (6 items, 9:16 WebP thumbnails) | Examples carousel |
| `workflow-steps.ts` | `WORKFLOW_STEPS` | `WorkflowStep[]` (4 items, alternating media/text) | Workflow section |
| `features.ts` | `FEATURES` | `Feature[]` (8 items, 4×2 grid) | Features section |
| `testimonials.ts` | `TESTIMONIALS` | `Testimonial[]` (6 items, 3×2 grid) | Testimonials section |
| `use-cases.ts` | `USE_CASES` | `UseCase[]` (4 items, 2×2 grid) | Use Cases section |
| `faq-items.ts` | `FAQ_ITEMS` | `FAQItem[]` (6 items, Radix Accordion) | FAQ section |
| `footer-links.ts` | `FOOTER_COLUMNS` | `FooterColumn[]` (3 columns) | Footer |

### Example: `story-seeds.ts`

```typescript
import type { StoryExample } from '@/types';

export const STORY_SEEDS: Record<string, string> = {
  'Time travel': `Dr. Elena Voss pressed her palm against the cold brass...`,
  'Space odyssey': `The colony ship Aurora drifted past Neptune...`,
  'Rival chefs': `In the Michelin-starred kitchen of Maison Lumière...`,
  'Victorian mystery': `The fog rolled in over Whitechapel as Lady Ashford...`,
};

export const DEFAULT_STORY_EXAMPLES: StoryExample[] = Object.keys(STORY_SEEDS).map((label) => ({
  label,
  seed: STORY_SEEDS[label]!,
}));
```

### Example: `style-chips.ts`

```typescript
import type { StyleChip } from '@/types';

export const STYLE_CHIPS: StyleChip[] = [
  { label: 'Ghibli' },
  { label: 'Oil Painting' },
  { label: 'Anime' },
  { label: 'Realistic' },
  { label: 'Cyberpunk', sublabel: 'Futuristic neon' },  // Only "Cyberpunk" has a sublabel
  { label: 'Watercolor' },
  { label: 'Comic' },
];
```

### Why Static Files (Not `import.meta.glob` or a CMS)

1. **Type safety** — every data file imports its interface from `@/types`, so adding a malformed item is a TypeScript error.
2. **Zero runtime cost** — constants are inlined at build time. No file-system reads, no glob resolution.
3. **Field-verified from PRD** — all content was hand-copied from `Project_Requirements_Document.md` (v2.0, 2718 lines) and field-verified against the live `storyintovideo.com` DOM.
4. **No CMS dependency** — the marketing page is statically prerendered. A CMS would add latency + a build-time data fetch.

### Adding New Content

To add a new testimonial:

1. Open `src/lib/data/testimonials.ts`
2. Add a new object to the `TESTIMONIALS` array:
   ```typescript
   {
     id: 't7',
     quote: '...',
     authorName: '...',
     authorRole: '...',
     initials: 'AB',
   }
   ```
3. The `Testimonials` section component maps over the array — no component changes needed.

To add a new marketing section:

1. Create `src/lib/data/<section>-data.ts` with a typed export
2. Add the interface to `src/types/index.ts`
3. Create `src/components/sections/<section>.tsx` (server or client based on interactivity)
4. Import + render in `src/app/page.tsx` in the correct position in the section order

### Asset Files (Not Version-Controlled)

Media assets are **not** in `src/lib/data/` — they're in `public/`:

| Category | Count | Location | Source |
|---|---|---|---|
| Workflow videos + posters | 5 | `public/workflow/showcase-step{1-4}.mp4` + posters | `./scripts/download-assets.sh` (R2 bucket) |
| Hero background video | 1 | `public/hero-bg.mp4` (46KB) | Generated from `hero-poster.webp` via ffmpeg zoompan |
| Example card thumbnails | 6 | `public/examples/example-{1-6}.webp` (9:16 portrait) | `./scripts/generate-thumbnails.sh` |
| Outfit variable font | 1 | `public/fonts/Outfit-VariableFont.woff2` (45KB) | Google Fonts GitHub → fonttools woff2 |

---

## 8. Accessibility (WCAG AAA) Implementation

### Focus Rings (Non-Negotiable)

Global `:focus-visible` in `globals.css`:

```css
:focus-visible {
  outline: 2px solid var(--color-primary);  /* #febf00 */
  outline-offset: 2px;
}
```

Tailwind equivalent: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400`

**Note:** Use `:focus-visible` (not `:focus`) — only shows ring on keyboard navigation, not mouse clicks.

### Skip-to-Content Link

In `src/app/layout.tsx`:

```tsx
<a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-amber-400 focus:px-4 focus:py-2 focus:text-zinc-950">
  Skip to content
</a>
```

Visually hidden by default, appears on focus. First tabbable element on every page.

### Hero Video Accessibility

```tsx
<div className="absolute inset-0 z-0" aria-hidden="true">
  <video autoPlay muted loop playsInline preload="metadata" poster="/hero-poster.webp">
    <source src="/hero-bg.mp4" type="video/mp4" />
  </video>
  ...
</div>
```

- `aria-hidden="true"` on the wrapper — video is decorative, no audio
- `muted` + `playsInline` — required for autoplay on iOS
- `preload="metadata"` — don't download the full video until needed

### `prefers-reduced-motion: reduce` (Global Override)

The global CSS override disables ALL animations:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  .marquee-track { animation: none !important; }
  video[autoplay] { display: none; }
  [data-reveal] { opacity: 1 !important; transform: none !important; }
}
```

- All animations/transition durations → 0.01ms (effectively instant)
- Marquee stops
- Autoplay videos hidden
- Scroll-reveal elements shown immediately (no opacity 0)

The `useReducedMotion()` hook is for JS-driven decisions (e.g., skipping a programmatic animation) — the CSS handles declarative cases.

### Touch Targets ≥ 44×44px

Ratio toggle buttons in Hero use `min-h-[44px] min-w-[44px]` to meet WCAG AAA touch target requirements on mobile.

### Color Contrast

- Body text `#d4d4d8` (zinc-300) on `#020202` (background) = **12.6:1** (WCAG AAA, requires 7:1)
- Muted text `#8e8e95` on `#020202` = **7.4:1** (WCAG AAA)
- Amber `#febf00` on `#020202` = **11.6:1** (WCAG AAA)

### Semantic HTML

- `<nav aria-label="Main">` on the navbar
- `<main id="main">` as the skip-to-content target
- `<section>` for each marketing section (with `aria-labelledby` pointing to the H2)
- `<button type="button">` for non-submitting buttons
- `<a>` for navigation (never `<button onClick={() => router.push()}>`)

### ARIA Patterns

- **Accordion** (FAQ): Radix Accordion provides `aria-expanded`, `aria-controls`, `role="region"` automatically
- **Sheet** (mobile nav): Radix Dialog provides `role="dialog"`, `aria-modal="true"`, focus trap automatically
- **Dropdown** (language switcher): Radix DropdownMenu provides `role="menu"`, `role="menuitem"`, `aria-haspopup` automatically
- **Progress bar** (ProjectProgressPanel): `<div role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>`

---

## 9. Anti-Patterns & Common Bugs

39 documented pitfalls across 3 phases. Each is a real bug encountered during the build.

### Marketing Layer (inherited, #1-12)

1. **Pure black vs near-black** — Background is `#020202`, NOT `#000` or `#0a0a0a`. Pure black looks digital; near-black looks cinematic.
2. **Amber shade mismatch** — PRD amber `#febf00` ≠ Tailwind `amber-400` (`#fbbf24`). Always use the custom `--color-primary` token.
3. **Outfit 820 unavailable from Google Fonts API** — must self-host via `next/font/local` pointing to `public/fonts/Outfit-VariableFont.woff2`.
4. **Feature grid uses hairline borders, not cards** — continuous surface separated by `border-neutral-800` dividers, not boxed cards with shadows.
5. **Examples hover gradient is the ONLY purple** — `bg-gradient-to-r from-yellow-500 to-purple-500` on card hover. Do not add purple anywhere else.
6. **CTA hierarchy is deliberate** — ghost link → glass pill → gradient pill → solid amber. Ration the amber accent from least to most prominent.
7. **Geist Mono for ratio toggles, NOT Geist Sans** — `font-mono text-[10px]` for 9:16/16:9 buttons.
8. **`next lint` deprecated in Next.js 16** — use `eslint .` directly (the `lint` script in `package.json` runs `eslint .`).
9. **shadcn CLI times out** — primitives are hand-written in `src/components/ui/`, not CLI-generated.
10. **Grammarly extension** — `suppressHydrationWarning` required on both `<html>` AND `<body>` (not just `<html>`). Browser extension injects `data-new-gr-c-s-check-loaded` and `data-gr-ext-installed` attributes before React hydrates.
11. **Workflow is `'use client'`** — uses `useState` for poster→video fade-in choreography. Don't assume server components for "mostly static" sections.
12. **Playwright browsers** — `pnpm install` doesn't install browser binaries; run `pnpm exec playwright install` after fresh clone.

### Production App Layer (#13-25)

13. **`verifySession()` must not be wrapped in try/catch** — it throws `NEXT_REDIRECT` which must propagate. Wrapping it silently swallows the redirect.
14. **`process.env.*` is forbidden** — always import `env` from `@/lib/env`. The Zod schema validates at module load; typos like `GOOGLE_CLIENTID` (missing underscore) would silently return `undefined` and disable OAuth.
15. **Zod `.url()` rejects `postgresql://`** — the `DATABASE_URL` validation uses `.refine()` with a postgres scheme check, not `.url()` (Zod's URL validator rejects non-standard schemes).
16. **Build fails without env vars** — the env module has a build-context fallback (returns placeholders when `NEXT_PHASE === 'phase-production-build'` or `NODE_ENV === 'test'`). At runtime, real env vars MUST be set or the app fails fast.
17. **DrizzleAdapter rejects Proxy-based db** — `DrizzleAdapter(db)` validates the db object's structure. The db must be a real Drizzle client, not a Proxy. The `postgres()` client doesn't connect until a query runs, so eager instantiation is safe.
18. **Auth route handler must be `force-dynamic`** — `export const dynamic = 'force-dynamic'` in `src/app/api/auth/[...nextauth]/route.ts` prevents Next.js from trying to prerender it (which fails because DrizzleAdapter can't be instantiated without env vars).
19. **Inngest v4 `createFunction` signature changed** — the trigger is part of the config object (`triggers: [{ event: '...' }]`), NOT a second argument. Older examples show `createFunction(config, trigger, handler)` which is wrong for v4.
20. **Stripe SDK v22+ uses camelCase** — `subscription.current_period_end` is now `subscription.currentPeriodEnd`. The webhook handler uses a fallback cast to support both.
21. **ElevenLabs `textToSpeech.convert()` returns a `Readable`** — not a `ReadableStream`. The `streamToBuffer` helper handles both via duck-typing (`getReader` check + async iteration fallback).
22. **Buffer → Blob requires `new Uint8Array(buffer)`** — `new File([audioBuffer], ...)` fails TypeScript's strict types because `Buffer<ArrayBufferLike>` is not assignable to `BlobPart`. Wrap with `new Uint8Array(audioBuffer)`.
23. **`NODE_ENV` is read-only in tests** — use `vi.stubEnv('NODE_ENV', 'test')` instead of direct assignment.
24. **Middleware runs on Edge runtime** — no Node.js APIs, no DB access. It only checks cookie presence; actual session validity is verified by `verifySession()` in Server Components/Actions.
25. **esbuild build scripts need approval** — `pnpm-workspace.yaml` must list `esbuild` under `onlyBuiltDependencies` or `pnpm install` skips the postinstall (drizzle-kit, vitest depend on esbuild).

### Remediation Sprint (#26-39)

26. **Vitest mock factories are hoisted above imports** — `vi.mock()` calls are lifted to the top of the file by the transformer. Any variable referenced inside the factory must use `vi.hoisted()` or be defined inline. Referencing an outer `const mockFn = vi.fn()` from inside `vi.mock(...)` throws `Cannot access 'mockFn' before initialization`.
27. **Mocked SDK constructors need `class` syntax** — `vi.fn().mockImplementation(() => ({ ... }))` returns an arrow function that cannot be `new`-ed. The real code does `new S3Client(...)`, so the mock must be a class: `class MockS3Client { send = sendMock; }`. Otherwise: `TypeError: () => ({...}) is not a constructor`.
28. **`.tsx` extension is mandatory for test files containing JSX** — `render(<Component />)` in a `*.test.ts` file produces `[PARSE_ERROR] Expected '>' but found 'Identifier'` from oxc. Rename to `*.test.tsx`.
29. **`fetch()` in the Inngest pipeline hits real DNS in tests** — Steps 5 and 6 download audio/SRT from R2 via `fetch(signedUrl)`. In tests, the signed URL is `https://r2.example.com/...` which fails with `ENOTFOUND`. Stub `fetch` globally: `vi.stubGlobal('fetch', fetchMock)`.
30. **SSE routes use `auth()` not `verifySession()`** — `verifySession()` throws `NEXT_REDIRECT` (a redirect), which is wrong for an API/SSE endpoint that should return 401 JSON. Use `auth()` directly: `const session = await auth(); if (!session?.user?.id) return NextResponse.json({error:'Unauthorized'},{status:401});`.
31. **SSE polling vs. Postgres LISTEN/NOTIFY** — serverless SSE can't hold a long-lived Postgres connection for LISTEN/NOTIFY. The progress route polls the DB every 2s and closes the stream on terminal status (`completed`/`failed`). 2s is fast enough for a 5-15min pipeline without hammering the DB.
32. **`EventSource` cleanup is critical** — `useEffect` must return a cleanup function that calls `eventSource.close()`. Forgetting this leaks the connection when the user navigates away. The hook also closes the EventSource when status reaches a terminal state.
33. **`getProject()` LEFT JOINs videos** — the query returns `videoKey`, `subtitleKey`, `videoDuration`, `videoResolution` (all nullable). The project detail page uses `project.videoKey` to conditionally render the download button. Don't add a second DB round-trip — the join is cheap.
34. **`putObject` for pipeline vs. `getSignedUploadUrl` for client uploads** — Inngest pipeline steps already have the Buffer in memory (TTS audio, FFmpeg output), so they use `putObject()` (direct S3 PUT). Client uploads (e.g., user avatar) use `getSignedUploadUrl()` so the browser uploads directly to R2 without round-tripping through the server.
35. **`assemble-video.ts` temp file lifecycle** — the rewritten function writes SRT to `/tmp/siv-srt-<ts>.srt`, runs FFmpeg to `/tmp/siv-video-<ts>.mp4`, reads the MP4 into a Buffer, then `unlink`s both. If FFmpeg errors mid-run, the `on('error')` handler still cleans up. Never leak temp files.
36. **`moderateImage` fail-open policy** — when Replicate's output shape is unknown (e.g., a model that doesn't expose `safety_concept`), `moderateImage` returns `flagged:false`. This is a deliberate tradeoff: fail-closed would block all generations from such models, which is worse UX than accepting the small risk. Document this in your launch readiness review.
37. **husky `prepare` script uses `|| true`** — `package.json` has `"prepare": "husky || true"`. The `|| true` prevents `pnpm install` from failing if husky isn't yet installed (first install on a fresh clone). Don't remove it.
38. **`lint-staged` runs on staged files only** — not the whole codebase. Configured in `package.json` under `lint-staged`. Staged `.ts/.tsx` files get `eslint --fix` + `prettier --write`; `.json/.md/.css/.mjs` get `prettier --write` only.
39. **Source-reading tests must strip comments before regex** — when asserting "code does not contain X", strip comments first: `src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')`. Otherwise the docblock (which may mention the old pattern by name) triggers a false positive.

---

## 10. Debugging Guide

Step-by-step verification for common issues.

### E2E Tests Fail with "Executable doesn't exist"

**Symptom:** `pnpm test:e2e` fails with `Error: webServer:_port:3000 ... Executable doesn't exist`

**Cause:** Playwright browsers not installed. `pnpm install` doesn't install browser binaries.

**Fix:** `pnpm exec playwright install` (installs Chromium). Re-run `pnpm test:e2e`.

### Hydration Mismatch Console Error

**Symptom:** Console error in dev: `Hydration failed because the initial UI does not match what was rendered on the server`

**Cause:** Browser extension (Grammarly) injects `data-new-gr-c-s-check-loaded` and `data-gr-ext-installed` attributes into `<body>` before React hydrates.

**Fix:** `suppressHydrationWarning` on both `<html>` AND `<body>` in `src/app/layout.tsx` (already applied — verify if you see the error).

### `next lint` Command Not Found

**Symptom:** `next lint` returns `Unknown command: lint`

**Cause:** `next lint` deprecated in Next.js 16.

**Fix:** Use `eslint .` directly. The `lint` script in `package.json` already does this.

### Outfit Weight 820 Not Rendering

**Symptom:** H1 looks like weight 700, not 820.

**Cause:** `next/font/google` only serves discrete weights (100, 200, ..., 900). 820 is not a discrete weight — it requires the variable font.

**Fix:** Self-host via `next/font/local`:
```typescript
const outfit = localFont({
  src: '../../public/fonts/Outfit-VariableFont.woff2',
  weight: '100 900',  // Variable font range
  variable: '--font-outfit',
  display: 'swap',
});
```
Then in the Hero: `<h1 style={{ fontWeight: 820 }}>...</h1>`.

### Tailwind Classes Not Applying

**Symptom:** Classes like `bg-background` or `text-primary` don't work.

**Cause:** Missing `@source` directives OR `postcss.config.mjs` uses old Tailwind v3 syntax.

**Fix 1:** Verify `globals.css` has:
```css
@source '../components/**/*.{ts,tsx}';
@source '../lib/**/*.{ts,tsx}';
```

**Fix 2:** Verify `postcss.config.mjs` uses `@tailwindcss/postcss` (NOT `tailwindcss`):
```javascript
plugins: { '@tailwindcss/postcss': {} }  // ✅ Tailwind v4
// NOT: plugins: { tailwindcss: {} }     // ❌ Tailwind v3
```

### Cross-Origin Dev Resource Blocked

**Symptom:** `/_next/webpack-hmr` requests blocked when accessing dev server from LAN IP or tunnel.

**Cause:** Next.js blocks `/_next/webpack-hmr` from non-localhost origins by default.

**Fix:** Add origin to `allowedDevOrigins` in `next.config.ts`:
```typescript
allowedDevOrigins: ['storyintovideo.jesspete.shop', '192.168.2.132'],
```
Restart dev server.

### Build Fails: "Invalid environment variables"

**Symptom:** `next build` fails with `❌ Invalid environment variables: DATABASE_URL must be a postgresql:// URL`

**Cause:** Real env vars not set in `.env.local`. The build-context fallback only applies when `NEXT_PHASE=phase-production-build` or `NODE_ENV=test`.

**Fix:** Copy `.env.example` → `.env.local`, fill in real values. For build-only validation, the fallback should kick in — verify `NEXT_PHASE` env var is set by Next.js during build.

### Build Fails: "Failed to collect page data for /api/auth/[...nextauth]"

**Symptom:** `next build` fails during page-data collection for the auth route.

**Cause:** Auth route tries to prerender DrizzleAdapter, which needs env vars at module load.

**Fix:** Ensure `export const dynamic = 'force-dynamic'` in `src/app/api/auth/[...nextauth]/route.ts`.

### `drizzle-kit generate` Errors

**Symptom:** `pnpm drizzle-kit generate` fails with connection error.

**Cause:** `DATABASE_URL_UNPOOLED` not set. Drizzle Kit needs the direct (unpooled) Neon connection for DDL.

**Fix:** Set `DATABASE_URL_UNPOOLED` in `.env.local` (use Neon's direct host, not the `-pooler` host).

### Inngest Function Not Triggering

**Symptom:** Project created but pipeline never starts. No Inngest events in dashboard.

**Cause:** Function not registered in `src/lib/inngest/functions.ts`, OR `inngest.send()` not called.

**Fix 1:** Verify function is in the `functions` array exported from `src/lib/inngest/functions.ts`.

**Fix 2:** Verify `createProjectAction` calls `inngest.send({ name: PIPELINE_EVENT, data: { projectId: project.id } })` (uncommented — was commented out pre-remediation).

### Stripe Webhook Returns 400 "Invalid signature"

**Symptom:** `POST /api/stripe/webhook` returns 400.

**Cause:** `STRIPE_WEBHOOK_SECRET` mismatch OR body parsed as JSON (must be raw).

**Fix 1:** Use `await req.text()` (NOT `.json()`) to get the raw body.

**Fix 2:** Verify `STRIPE_WEBHOOK_SECRET` matches the Stripe Dashboard webhook endpoint signing secret.

### `pnpm install` Warns "Ignored build scripts: esbuild"

**Symptom:** `pnpm install` warns about ignored build scripts.

**Cause:** `pnpm-workspace.yaml` missing esbuild approval.

**Fix:** Add `esbuild` to `onlyBuiltDependencies` array in `pnpm-workspace.yaml`:
```yaml
onlyBuiltDependencies:
  - esbuild
```

### Tests Fail: "Cannot find module 'next/server'"

**Symptom:** Unit test fails with `Cannot find module 'next/server'`.

**Cause:** jsdom can't load Next.js server modules. `next-auth` transitively imports `next/server`.

**Fix:** Mock `next-auth`, `next/navigation`, and `@/lib/db` in tests that transitively import them:
```typescript
vi.mock('next-auth', () => ({ ... }));
vi.mock('next/navigation', () => ({ redirect: vi.fn(), ... }));
vi.mock('@/lib/db', () => ({ db: { ... } }));
```

### Tests Fail: "Cannot access 'X' before initialization"

**Symptom:** Unit test fails with `Cannot access 'sendMock' before initialization`.

**Cause:** `vi.mock()` factory references a `vi.fn()` defined in the test body. `vi.mock()` is hoisted above imports; the variable is `undefined` at factory execution time.

**Fix:** Use `vi.hoisted()`:
```typescript
const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn() }));
vi.mock('@/lib/inngest/client', () => ({ inngest: { send: sendMock } }));
```

### Tests Fail: "X is not a constructor"

**Symptom:** Unit test fails with `TypeError: () => ({...}) is not a constructor`.

**Cause:** Mock factory returns an arrow function, but real code does `new X()`.

**Fix:** Use `class` syntax in the mock factory:
```typescript
vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: class MockS3Client { send = sendMock; },
  PutObjectCommand: class { constructor(public input: unknown) {} },
}));
```

### Tests Fail: "[PARSE_ERROR] Expected '>' but found 'Identifier'"

**Symptom:** Unit test fails with oxc parse error.

**Cause:** Test file uses JSX (`render(<Component />)`) but has `.test.ts` extension.

**Fix:** Rename to `*.test.tsx`. oxc needs the `.tsx` extension to parse JSX.

### Pipeline Tests Fail: "fetch failed: ENOTFOUND r2.example.com"

**Symptom:** `pipeline-sprint5.test.ts` fails with `fetch failed: ENOTFOUND r2.example.com`.

**Cause:** Steps 5 and 6 download audio/SRT from R2 via `fetch(signedUrl)`. In tests, the signed URL is `https://r2.example.com/...` which hits real DNS.

**Fix:** Stub global `fetch`:
```typescript
const fetchMock = vi.fn().mockResolvedValue({
  arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
  text: () => Promise.resolve('1\n00:00:00,000 --> 00:00:05,000\nHello\n'),
});
vi.stubGlobal('fetch', fetchMock);
```

### SSE Route Returns 307 Redirect Instead of 401 JSON

**Symptom:** `GET /api/projects/[id]/progress` returns 307 redirect to `/sign-in`.

**Cause:** Used `verifySession()` (throws redirect) instead of `auth()` (returns null).

**Fix:** API routes use `auth()` directly:
```typescript
const session = await auth();
if (!session?.user?.id) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### SSE Stream Hangs / Never Closes

**Symptom:** SSE connection stays open forever after project completes.

**Cause:** `controller.close()` not called on terminal status.

**Fix:** Poll DB every 2s; when `status ∈ {completed, failed}`, call `controller.close()` + `clearInterval(interval)`:
```typescript
if (TERMINAL_STATUSES.has(current.status)) {
  controller.close();
  clearInterval(interval);
}
```

### `EventSource` Leaks Across Navigations

**Symptom:** Multiple SSE connections accumulate in the Network tab.

**Cause:** `useEffect` cleanup missing `eventSource.close()`.

**Fix:** Return a cleanup function from `useEffect`:
```typescript
useEffect(() => {
  const eventSource = new EventSource(...);
  // ...
  return () => { eventSource.close(); };  // ⚠️ CRITICAL
}, [projectId]);
```

### husky Pre-Commit Hook Doesn't Run

**Symptom:** `git commit` doesn't trigger lint-staged.

**Cause:** `pnpm install` didn't run the `prepare` script (first install), OR `.husky/pre-commit` not executable.

**Fix 1:** Run `pnpm install` (activates `prepare: husky` script).

**Fix 2:** `chmod +x .husky/pre-commit`.

### `replicate.run()` Returns Wrong Shape

**Symptom:** `TypeError: output[0] is not a function` or similar.

**Cause:** Model output type varies — sometimes `string[]`, sometimes `string`, sometimes an object.

**Fix:** Cast via `as unknown as string[]` and check length before indexing:
```typescript
const output = (await replicate.run(SDXL_MODEL, { input: { ... } })) as unknown as string[];
if (!output || output.length === 0) throw new Error('Replicate returned no image URLs');
const imageUrl = output[0]!;
```

### `moderateImage` Returns `flagged:false` for Unknown Replicate Output

**Symptom:** Generated image passes moderation even though the model supports safety fields.

**Cause:** Fail-open policy for models that don't expose `safety_concept`. The field name might be different.

**Fix:** If your model supports safety fields, verify the field name matches one of: `safety_concept`, `api_safety_concept`, `safety`. Update `extractSafetyCategories()` in `src/features/pipeline/domain/moderate-image.ts` if needed.

---

## 11. Pre-Ship Checklist

Run every item before claiming completion. All must pass.

### Quality Gate (Mandatory)

```bash
pnpm lint         # ESLint flat config — 0 warnings
pnpm typecheck    # tsc --noEmit — 0 errors
pnpm test         # Vitest — 227/227 unit tests pass
pnpm test:e2e     # Playwright — 48/48 E2E tests pass (requires `pnpm exec playwright install`)
pnpm build        # next build — 0 errors
pnpm format:check # Prettier — all files use Prettier code style
```

**Pre-commit chain:** `pnpm lint && pnpm typecheck && pnpm test && pnpm build`. husky + lint-staged auto-runs ESLint + Prettier on staged `.ts/.tsx` files via `.husky/pre-commit` (activated by `pnpm install` via the `prepare` script). The hook only checks staged files — run the full chain manually before pushing.

### Visual Verification

- [ ] Marketing page is visually indistinguishable from `storyintovideo.com` at 1440×900
- [ ] Lighthouse ≥ 95 across Performance, Accessibility, Best Practices, SEO (marketing page)
- [ ] Background video plays (muted, looped, playsInline)
- [ ] Hero H1 renders in Outfit weight 820 (not 700)
- [ ] Amber CTA buttons are `#febf00`, not Tailwind `amber-400` (`#fbbf24`)
- [ ] Examples hover shows the ONLY purple gradient on the site
- [ ] Mobile nav Sheet opens/closes correctly (< 640px viewport)
- [ ] FAQ accordion expands/collapses with grid-template-rows animation
- [ ] Scroll reveal triggers on all sections (opacity 0→1, translateY 20px→0)
- [ ] `prefers-reduced-motion: reduce` disables all animations (verify in DevTools)

### Functional Verification

- [ ] `/sign-in` and `/sign-up` render with AuthForm (Google OAuth + credentials)
- [ ] Unauthenticated `/dashboard` redirects to `/sign-in` (middleware)
- [ ] Authenticated `/dashboard` shows project list (or empty state)
- [ ] `/create` wizard accepts story (100-5000 chars), style, ratio
- [ ] `createProjectAction` triggers Inngest pipeline (`inngest.send` called)
- [ ] `/projects/[id]` shows live progress via SSE (status updates every 2s)
- [ ] Completed project shows Download button (signed R2 URL)
- [ ] Completed project shows Share button (Web Share API + clipboard fallback)
- [ ] `/billing` shows 4-tier plan table
- [ ] `/privacy` and `/terms` render with full legal content
- [ ] `/api/health` returns `{ status: 'ok', timestamp: '...' }`

### Production App Layer (5-Layer Architecture)

- [ ] Middleware (Layer 0) runs on Edge runtime — no DB access, no Node.js APIs
- [ ] App routes (Layer 1) — layouts don't fetch data
- [ ] Features (Layer 2) — all DB access through `queries.ts` boundary
- [ ] Domain (Layer 3) — pure functions, no Next.js/DB runtime imports (`import type` only)
- [ ] Lib (Layer 4) — infrastructure only, side effects only
- [ ] Golden Rule: no lower layer imports from a higher layer
- [ ] All Server Actions start with `verifySession()` (auth-first)
- [ ] `verifySession()` never wrapped in try/catch
- [ ] API routes use `auth()` (not `verifySession()`)
- [ ] No `process.env.*` direct access — always `import { env } from '@//lib/env'`

### Pre-Commit Hook

- [ ] `pnpm install` ran (activates husky via `prepare` script)
- [ ] `.husky/pre-commit` is executable (`chmod +x`)
- [ ] `git commit` triggers `pnpm lint-staged` on staged files

### Database

- [ ] `pnpm drizzle-kit generate` succeeds (creates migration SQL)
- [ ] `pnpm drizzle-kit migrate` succeeds (applies to real Neon)
- [ ] `pnpm db:seed` succeeds (dev user: `dev@storyintovideo.com` / `password123`)
- [ ] Drizzle Studio (`pnpm drizzle-kit studio`) shows 11 tables, 8 enums, 10 FKs

### External Services (for production deploy)

- [ ] Neon PostgreSQL provisioned (pooled + unpooled connection strings)
- [ ] Google OAuth credentials (optional — both ID + SECRET required to enable)
- [ ] OpenAI API key (starts with `sk-`)
- [ ] Replicate API token (starts with `r8_`)
- [ ] ElevenLabs API key
- [ ] Cloudflare R2 (3 buckets: `siv-uploads`, `siv-generated`, `siv-videos`)
- [ ] Stripe products configured (4 tiers: Free/Creator/Pro/Studio) — update `PRICE_IDS`
- [ ] Inngest event key + signing key
- [ ] Resend API key (starts with `re_`)
- [ ] Upstash Redis (rate limiting — env in schema, integration TBD)
- [ ] Sentry DSN (monitoring — env in schema, integration TBD)

### Final Sanity Check

```bash
# From clean clone
git clone <repo>
cd story-into-video
pnpm install
pnpm exec playwright install chromium
cp .env.example .env.local  # Fill in real values
pnpm drizzle-kit generate && pnpm drizzle-kit migrate
pnpm db:seed
pnpm dev  # Verify http://localhost:3000 loads

# In another terminal
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

---

## 12. Lessons Learnt & How to Avoid Them

27 lessons across 3 phases. Each is a real lesson from a real bug.

### Marketing Layer (inherited, #1-5)

1. **`suppressHydrationWarning` on `<body>`** — Browser extensions inject attributes before React hydrates. `<html>` alone is insufficient. **Avoid:** always add `suppressHydrationWarning` to both `<html>` AND `<body>` in `layout.tsx`.

2. **Workflow is `'use client'`** — Uses `useState` for video loading choreography. Don't assume server components for "mostly static" sections. **Avoid:** check for `useState`/`useEffect`/event handlers before deciding server vs client.

3. **Test counts drift from plans** — MEP planned 6+3, actual is now 227 unit + 48 E2E. **Avoid:** always verify against `pnpm test` output, never trust doc-stated counts blindly.

4. **File structure evolves** — `components/primitives/`, `lib/hooks/`, `lib/data/` were created during build. **Avoid:** update docs as you build; don't assume the initial structure is final.

5. **Playwright needs separate install** — `pnpm install` doesn't install browser binaries. **Avoid:** document `pnpm exec playwright install` in README + CLAUDE.md + AGENTS.md.

### Production App Layer (#6-15)

6. **Zod `.url()` rejects `postgresql://`** — discovered when the env module threw "DATABASE_URL must be a postgresql:// URL" at build time. **Avoid:** use `.refine()` with a scheme check for non-standard URL schemes.

7. **Env validation needs build-context fallback** — without it, `next build` fails during page-data collection. **Avoid:** add `NEXT_PHASE === 'phase-production-build'` check that returns placeholders.

8. **`postgres()` defers connection until first query** — allows eager db instantiation without breaking the build. **Avoid:** don't assume client instantiation connects — verify with `postgres()` docs.

9. **DrizzleAdapter validates db object structure** — a Proxy-based lazy db was rejected. **Avoid:** use a real Drizzle client; DrizzleAdapter introspects the db object's structure.

10. **Inngest v4 changed `createFunction` signature** — trigger is now in the config object, not a second argument. **Avoid:** check the installed version's docs, not generic Inngest examples.

11. **Auth unit tests must mock `next-auth` + `next/navigation`** — jsdom can't load `next/server` (transitively imported by `next-auth`). **Avoid:** always mock these in auth-related tests.

12. **Source-reading tests are valid** for server-only modules (auth config, middleware, route handlers) that can't be rendered in jsdom. **Avoid:** don't dismiss `readFileSync`-based tests — they verify structural patterns that can't be asserted via rendering.

13. **Stripe SDK v22 camelCase breaking change** — `currentPeriodEnd` not `current_period_end`. **Avoid:** use a union cast to support both: `subscription.currentPeriodEnd ?? subscription.current_period_end`.

14. **ElevenLabs returns `Readable`, not `ReadableStream`** — duck-type the input in `streamToBuffer`. **Avoid:** check for `getReader` (ReadableStream) vs async iteration (Node Readable).

15. **TDD with mocked AI providers works well** — all 6 pipeline domain functions are fully unit-tested; real API calls only needed for manual E2E validation. **Avoid:** always mock AI provider SDKs in tests — never make real API calls.

### Remediation Sprint (#16-27)

16. **Vitest mock hoisting is the #1 test bug** — `vi.mock()` factories are hoisted above imports. Use `vi.hoisted()` for shared `vi.fn()` state. Symptom: `Cannot access 'X' before initialization`. **Avoid:** pattern: `const { mockFn } = vi.hoisted(() => ({ mockFn: vi.fn() })); vi.mock('mod', () => ({ x: mockFn }));`

17. **Mock constructors must be `class`, not arrow fns** — `new S3Client(...)` requires `new`-able mock. Arrow fns throw `"X is not a constructor"`. **Avoid:** use `class MockS3Client { send = sendMock; }` in mock factories.

18. **`.tsx` extension is mandatory for JSX tests** — oxc throws `[PARSE_ERROR] Expected '>' but found 'Identifier'` for JSX in `*.test.ts`. **Avoid:** always name test files with JSX as `*.test.tsx`.

19. **SSE in Next.js 16** — `ReadableStream` + `text/event-stream` content-type + 2s DB polling. Simpler than Postgres LISTEN/NOTIFY for serverless (no long-lived connection). **Avoid:** don't attempt LISTEN/NOTIFY on serverless — connection lifecycle is too short.

20. **`auth()` vs `verifySession()` for API routes** — `verifySession()` throws redirect (wrong for JSON). API routes use `auth()` → null → 401 JSON. **Avoid:** API routes return JSON, not redirects — use `auth()`.

21. **`EventSource` cleanup is non-negotiable** — `useEffect` must return `() => eventSource.close()`. Otherwise the connection leaks when the user navigates away. **Avoid:** always return cleanup from `useEffect` that creates connections.

22. **Image moderation via Replicate safety output is preferred** — zero extra API calls vs. OpenAI vision moderation. Fail-open for unknown shapes (deliberate tradeoff). **Avoid:** prefer parsing existing safety fields over adding a second API call.

23. **`getProject()` LEFT JOIN videos is cheaper than two queries** — the project detail page needs video data for the download button. LEFT JOIN adds <1ms; second query adds 5-15ms. **Avoid:** prefer JOINs over multiple queries when the UI needs both.

24. **`putObject` (pipeline) vs `getSignedUploadUrl` (client)** — pipeline has Buffer in memory → direct PUT. Client uploads use presigned URL → browser uploads directly to R2. **Avoid:** don't mix the two patterns — pipeline uses `putObject`, client uses presigned.

25. **TDD exposed 4 latent defects in `assemble-video.ts`** — placeholder Buffer, missing SRT write, missing input options, brittle filter extraction. All discoverable only by writing tests first. **Avoid:** TDD on legacy code is the strongest argument for the practice — the tests document the contract the code should have been meeting.

26. **Source-reading tests must strip comments** — `src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')` before regex, else docblocks trigger false positives. **Avoid:** always strip comments before regex-matching source code for "does not contain X" assertions.

27. **husky `prepare` script with `|| true` is intentional** — prevents `pnpm install` failure on first install. **Avoid:** don't "fix" this by removing the fallback — it's deliberate.

---

## 13. Pitfalls to Avoid

Consolidated anti-patterns. Violating any of these is a critical error.

### Architecture

- **Do not add `tailwind.config.ts`** — all tokens belong in `globals.css` `@theme` block (Tailwind v4 CSS-first)
- **Do not use `next/font/google` for Outfit** — it can't serve weight 820; use `next/font/local`
- **Do not use Framer Motion or GSAP** — all animation is CSS-only (13 keyframes in `globals.css`)
- **Do not use camelCase keyframes** — kebab-case is the modern convention (e.g., `fade-in-up`, not `fadeInUp`)
- **Do not use `force-static` on app routes** — only the marketing page can be static; app routes are dynamic
- **Do not put DB access in components** — use the `queries.ts` boundary
- **Do not put DB access in middleware** — middleware runs on Edge runtime (no DB, no Node.js APIs)

### TypeScript

- **Do not use `any`** — ESLint enforces `@typescript-eslint/no-explicit-any: error`. Use `unknown` or proper types.
- **Do not use `type` for object shapes** — use `interface` (per project convention). `type` is for unions/intersections.
- **Do not use default exports for components** — use named exports: `export function Hero()`, not `export default function Hero()`
- **Do not omit `import type` for type-only imports** — `verbatimModuleSyntax` requires it

### Styling

- **Do not use Tailwind `amber-400`** — it's `#fbbf24`, not `#febf00`. Use the custom `--color-primary` token.
- **Do not use pure `#000`** — background is `#020202` (near-black, warm-neutral)
- **Do not add purple anywhere except the examples hover gradient** — it's the singular purple exception
- **Do not use CDN links** — all assets self-hosted (fonts via `next/font`, images via `next/image`)

### Auth

- **Do not wrap `verifySession()` in try/catch** — it throws `NEXT_REDIRECT` which must propagate
- **Do not use `verifySession()` in API routes** — use `auth()` (returns null → 401 JSON, not redirect)
- **Do not read `process.env.AUTH_SECRET` directly** — use `env.AUTH_SECRET` from the validated env module

### Database

- **Do not use `db push` in production** — always `drizzle-kit generate` + review + `migrate`
- **Do not use the pooled connection for DDL** — Drizzle Kit needs `DATABASE_URL_UNPOOLED` (direct host)
- **Do not make R2 buckets public** — use signed URLs (1-hour expiry)

### Pipeline

- **Do not skip content moderation** — every story input must be moderated (ADR-011). Story moderation via OpenAI Moderation API; image moderation via Replicate `safety_concept` parsing.
- **Do not skip the `inngest.send()` call** — projects are inserted but the pipeline never fires without it
- **Do not leak temp files in `assemble-video.ts`** — always `unlink` SRT + output MP4 after reading into Buffer

### Testing

- **Do not reference outer `vi.fn()` from inside `vi.mock()` factories** — use `vi.hoisted()`
- **Do not use arrow functions for mocked constructors** — use `class` syntax
- **Do not name JSX test files `*.test.ts`** — must be `*.test.tsx`
- **Do not run real API calls in tests** — always mock OpenAI/Replicate/ElevenLabs SDKs
- **Do not forget to mock `fetch`** in tests that exercise the Inngest pipeline (Steps 5-6 download from R2)
- **Do not skip the verification chain** — `pnpm lint && pnpm typecheck && pnpm test && pnpm build`

---

## 14. Best Practices

### Architecture

1. **5-layer architecture** — middleware → app → features → domain → lib. Lower layers never import from higher layers.
2. **`queries.ts` boundary** — all DB access through feature-level `queries.ts` files. Components never call `db` directly.
3. **Domain isolation** — pure functions in `src/features/*/domain/` (no Next.js/DB runtime imports, `import type` only).
4. **Auth-first Server Actions** — every Server Action starts with `verifySession()` before any logic.
5. **Zod env validation** — never read `process.env.*` directly. Import `env` from `@/lib/env`.

### Component Design

6. **Server components by default** — add `'use client'` only when using `useState`, `useEffect`, event handlers, or browser APIs.
7. **Named exports** — `export function Hero()`, never `export default function Hero()`.
8. **`interface` for props** — defined in `src/types/index.ts` or co-located. `type` for unions/intersections only.
9. **`cn()` utility** for conditional class merging (`clsx` + `tailwind-merge`).
10. **Early returns** over deeply nested conditionals.
11. **Composition over inheritance**.

### Styling

12. **CSS-only animation** — no Framer Motion, no GSAP. All 13 keyframes in `globals.css`.
13. **Tailwind v4 CSS-first** — `@theme` block in `globals.css`, no `tailwind.config.ts`.
14. **Custom `--color-primary` token** — never use Tailwind's `amber-400` (different color).
15. **`@utility` for single-purpose helpers** — `scrollbar-hide`, `marquee-mask`, `marquee-track`, `glass-input`, `eyebrow`, `section-heading`, `cta-amber`.
16. **`@source` directives** for content scanning — `@source '../components/**/*.{ts,tsx}';` + `@source '../lib/**/*.{ts,tsx}';`.

### Testing

17. **TDD: RED → GREEN → REFACTOR** — one cycle per logical change. Write failing test first, implement to pass, refactor.
18. **Mock AI provider SDKs** — never make real API calls in tests.
19. **Mock `next-auth`, `next/navigation`, `@/lib/db`** in tests that transitively import them (jsdom can't load `next/server`).
20. **Use `vi.hoisted()`** for shared mock state referenced inside `vi.mock()` factories.
21. **Use `class` syntax** for mocked SDK constructors (arrow functions can't be `new`-ed).
22. **`.tsx` extension** for test files containing JSX.
23. **Strip comments** before regex-matching source code in source-reading tests.
24. **Source-reading tests are valid** for server-only modules (auth config, middleware, route handlers, legal page content).

### Pipeline

25. **Each Inngest step is idempotent** — Inngest may retry. Failed steps set `project.status = 'failed'`.
26. **Each step debits credits** — via `debitCredits()` (Drizzle transaction). Credit costs: analysis=5, char=10, scene=8, voiceover=15, subtitle_alignment=3, video_assembly=30.
27. **Image moderation after each generation** — `moderateImage` on character + scene outputs. Fail-open for unknown Replicate output shapes.
28. **`putObject` for pipeline Buffer uploads** — direct S3 PUT, faster than presigned URLs for in-memory buffers.
29. **Cleanup temp files** — `assemble-video.ts` `unlink`s SRT + output MP4 after reading into Buffer.

### UX

30. **SSE for live progress** — poll DB every 2s, close on terminal status. Simpler than LISTEN/NOTIFY on serverless.
31. **`EventSource` cleanup on unmount** — `useEffect` returns `() => eventSource.close()`.
32. **Signed R2 URLs for downloads** — 1-hour expiry, re-fetched on every mount so always fresh.
33. **Web Share API + clipboard fallback** — `navigator.share()` when available, `navigator.clipboard.writeText()` otherwise.

---

## 15. Coding Patterns

### Named Exports (Always)

```typescript
// ✅ Correct
export function Hero() { ... }
export function Navbar() { ... }

// ❌ Wrong — default export
export default function Hero() { ... }
```

### `interface` for Object Shapes

```typescript
// ✅ Correct
interface HeroProps {
  title: string;
  children: React.ReactNode;
}

// ❌ Wrong — type for object shape
type HeroProps = {
  title: string;
  children: React.ReactNode;
};
```

`type` is for unions/intersections:
```typescript
type AspectRatioValue = 'portrait' | 'landscape';
type ProjectStatus = (typeof projects.status.enumValues)[number];
```

### Explicit `import type`

```typescript
// ✅ Correct (verbatimModuleSyntax)
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import type { AspectRatio } from '@/types';

// ❌ Wrong — mixed import
import { useState, type AspectRatio } from '@/types';  // works but inconsistent
```

### Early Returns

```typescript
// ✅ Correct — early return
export async function getProject(projectId: string, userId: string) {
  const [row] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (row && row.userId !== userId) return null;
  return row;
}

// ❌ Wrong — deeply nested
export async function getProject(projectId: string, userId: string) {
  const [row] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (row) {
    if (row.userId === userId) {
      return row;
    } else {
      return null;
    }
  }
  return null;
}
```

### `cn()` for Conditional Classes

```typescript
import { cn } from '@/lib/utils';

<button className={cn(
  'base-classes',
  scrolled && 'bg-zinc-950/70 backdrop-blur-[24px]',
  !scrolled && 'bg-transparent',
)} />
```

### Auth-First Server Action

```typescript
'use server';

export async function someAction(input: z.infer<typeof SomeSchema>) {
  const session = await verifySession({ redirectTo: '/some-path' });
  const userId = session.user?.id;
  if (!userId) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };

  // ... rest of action
}
```

### API Route Pattern (auth, not verifySession)

```typescript
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ... rest of handler
}
```

### SSE Route Pattern

```typescript
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const project = await getProject(id, session.user.id);
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const stream = new ReadableStream({
    async start(controller) {
      // Poll DB every 2s, enqueue `data: JSON\n\n`, close on terminal status
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', ... },
  });
}
```

### Domain Function Pattern (Pure)

```typescript
// src/features/pipeline/domain/analyze-story.ts
import { z } from 'zod';
import { openai, GPT_MODEL } from '@/lib/ai/openai';

const AnalyzedStorySchema = z.object({ ... });
export type AnalyzedStory = z.infer<typeof AnalyzedStorySchema>;

export async function analyzeStory(story: string): Promise<AnalyzedStory> {
  // Pure function — no Next.js, no DB runtime
  const completion = await openai.chat.completions.create({ ... });
  return AnalyzedStorySchema.parse(JSON.parse(completion.choices[0]?.message?.content));
}
```

---

## 16. Coding Anti-Patterns

Every item in this section is forbidden. ESLint or TypeScript will catch most; the rest are project conventions enforced by code review.

### TypeScript

- **`any`** — ESLint error. Use `unknown` or proper types.
- **`type` for object shapes** — use `interface`. `type` is for unions/intersections only.
- **Default exports for components** — use named exports.
- **Missing `import type`** — `verbatimModuleSyntax` requires it for type-only imports.
- **`process.env.*` direct access** — always `import { env } from '@//lib/env'`.
- **Non-null assertion (`!`) without justification** — `noUncheckedIndexedAccess` makes `arr[0]` return `T | undefined`. Use `arr[0]!` only after a length check, or use a guard.

### React

- **`'use client'` on every file** — only when needed (state, effects, event handlers, browser APIs).
- **`<a>` for internal navigation** — use `next/link` (`<Link>`).
- **`<img>` for raster images** — use `next/image` (`<Image>`).
- **Google Fonts CDN link** — use `next/font` (self-hosted).
- **Framer Motion / GSAP** — all animation is CSS-only.

### Styling

- **`tailwind.config.ts`** — Tailwind v4 CSS-first `@theme` in `globals.css` only.
- **Tailwind `amber-400`** — use custom `--color-primary: #febf00`.
- **Pure `#000` background** — use `#020202`.
- **Purple anywhere except examples hover** — singular exception.
- **camelCase keyframes** — kebab-case only.

### Auth

- **`verifySession()` in try/catch** — throws `NEXT_REDIRECT` which must propagate.
- **`verifySession()` in API routes** — use `auth()` (returns null → 401 JSON).
- **`process.env.AUTH_SECRET`** — use `env.AUTH_SECRET` from validated env module.

### Database

- **`db push` in production** — always `drizzle-kit generate` + `migrate`.
- **Pooled connection for DDL** — use `DATABASE_URL_UNPOOLED`.
- **DB access in components** — use `queries.ts` boundary.
- **DB access in middleware** — Edge runtime can't access DB.
- **Public R2 buckets** — use signed URLs (1-hour expiry).

### Pipeline

- **Skip content moderation** — mandatory on story input + generated images (ADR-011).
- **Skip `inngest.send()`** — projects are inserted but pipeline never fires.
- **Leak temp files** — `assemble-video.ts` must `unlink` SRT + output MP4.
- **`Buffer.from('placeholder')`** — read the actual output file into a Buffer.

### Testing

- **Outer `vi.fn()` in `vi.mock()` factory** — use `vi.hoisted()`.
- **Arrow function for mocked constructor** — use `class` syntax.
- **`.test.ts` for JSX** — must be `.test.tsx`.
- **Real API calls** — always mock AI provider SDKs.
- **Missing `fetch` mock** — Steps 5-6 download from R2 via `fetch()`.
- **Skip verification chain** — `pnpm lint && pnpm typecheck && pnpm test && pnpm build`.

### Build

- **`next lint`** — deprecated in Next.js 16. Use `eslint .`.
- **`force-static` on app routes** — only marketing page can be static.
- **Missing `export const dynamic = 'force-dynamic'`** on API routes — causes prerender failure.
- **Missing `esbuild` in `onlyBuiltDependencies`** — `pnpm install` skips postinstall.

---

## 17. Responsive Breakpoint Reference

This project uses Tailwind's default breakpoints (no customization in `@theme`):

| Token | Min Width | Target |
|---|---|---|
| (default) | 0 | Mobile portrait 375px |
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablet portrait |
| `lg` | 1024px | Tablet landscape / laptop |
| `xl` | 1280px | Desktop (matches `max-w-7xl`) |
| `2xl` | 1536px | Large desktop |

### Usage Patterns

```tsx
// Hero H1 — fluid via responsive chain
<h1 className="font-heading text-4xl lg:text-[4.5rem] tracking-[-0.04em]">

// Section H2 — fluid via clamp() in @utility section-heading
<h2 className="section-heading">  /* font-size: clamp(2rem, 5vw, 3rem); */

// Container — max-w-7xl = 1280px (matches xl breakpoint)
<div className="mx-auto max-w-7xl px-6">

// Marquee — slower on mobile (30s vs 40s)
@utility marquee-track {
  animation: var(--animate-marquee-scroll);
  @media (max-width: 640px) { animation-duration: 30s; }
}

// Navbar — desktop links hidden on mobile, hamburger shown
<header>
  <nav className="flex h-16 max-w-7xl items-center justify-between px-6">
    {/* Desktop links */}
    <div className="hidden sm:flex ...">...</div>
    {/* Mobile hamburger */}
    <button className="sm:hidden ...">...</button>
  </nav>
</header>
```

---

## 18. Z-Index Layer Map

| Layer | Z-Index | Element | Location |
|---|---|---|---|
| Skip link (focused) | `z-[100]` | Skip-to-content link | `src/app/layout.tsx` |
| Navbar | `z-50` | Fixed header | `src/components/sections/navbar.tsx` |
| Hero overlays | `z-0` | Background video + scrim + radial glow | `src/components/sections/hero.tsx` |
| Hero content | `z-10` | Eyebrow + H1 + glass input + marquee | `src/components/sections/hero.tsx` |
| Mobile Sheet | Radix portal (auto) | Mobile nav drawer | `src/components/ui/sheet.tsx` |
| Language dropdown | Radix portal (auto) | Language switcher | `src/components/ui/dropdown-menu.tsx` |

### Usage Notes

- **Navbar `z-50`** — sits above hero content but below skip link (which only appears on focus)
- **Hero overlays `z-0`** + **Hero content `z-10`** — content sits above the video background
- **Radix portals** (Sheet, DropdownMenu) auto-manage their own z-index via `@radix-ui/react-dialog` / `@radix-ui/react-dropdown-menu` — they render to `document.body` with high z-index
- **Skip link `z-[100]`** — highest in the stack, but only visible on keyboard focus (`sr-only focus:not-sr-only`)

---

## 19. Color Reference (Complete)

All 17 `@theme` color tokens + 5 chart colors. Verified from `src/app/globals.css` lines 17-43.

### Core Palette

| Token | Hex | RGB | Usage |
|---|---|---|---|
| `--color-background` | `#020202` | `rgb(2, 2, 2)` | Page background (near-black, warm-neutral — NOT pure #000) |
| `--color-foreground` | `#f8f8f8` | `rgb(248, 248, 248)` | Default foreground text, headings |
| `--color-card` | `#060607` | `rgb(6, 6, 7)` | Card surfaces |
| `--color-card-foreground` | `#f8f8f8` | `rgb(248, 248, 248)` | Text on cards |
| `--color-popover` | `#0b0b0d` | `rgb(11, 11, 13)` | Popover backgrounds (Sheet, Dropdown) |
| `--color-popover-foreground` | `#f8f8f8` | `rgb(248, 248, 248)` | Text in popovers |
| `--color-primary` | `#febf00` | `rgb(254, 191, 0)` | CTAs, active states, focus rings, accents (NOT Tailwind amber-400) |
| `--color-primary-foreground` | `#020202` | `rgb(2, 2, 2)` | Text on primary (dark on amber) |
| `--color-secondary` | `#111114` | `rgb(17, 17, 20)` | Secondary surfaces |
| `--color-secondary-foreground` | `#f8f8f8` | `rgb(248, 248, 248)` | Text on secondary |
| `--color-muted` | `#1a1a1d` | `rgb(26, 26, 29)` | Muted backgrounds, borders |
| `--color-muted-foreground` | `#8e8e95` | `rgb(142, 142, 149)` | Muted text (zinc-400 equivalent) |
| `--color-accent` | `#febf00` | `rgb(254, 191, 0)` | Accent (same as primary) |
| `--color-accent-foreground` | `#020202` | `rgb(2, 2, 2)` | Text on accent |
| `--color-destructive` | `#ff2d39` | `rgb(255, 45, 57)` | Error states, destructive actions |
| `--color-destructive-foreground` | `#f8f8f8` | `rgb(248, 248, 248)` | Text on destructive |
| `--color-border` | `#1a1a1d` | `rgb(26, 26, 29)` | Hairline borders, dividers |
| `--color-input` | `#0b0b0d` | `rgb(11, 11, 13)` | Input backgrounds |
| `--color-ring` | `#febf0080` | `rgba(254, 191, 0, 0.5)` | Focus ring (50% opacity amber) |

### Chart Palette (Reserved)

| Token | Hex | Purpose |
|---|---|---|
| `--color-chart-1` | `#febf00` | Amber (primary) |
| `--color-chart-2` | `#00aa6f` | Green |
| `--color-chart-3` | `#8d92f9` | Indigo |
| `--color-chart-4` | `#f14d4c` | Red |
| `--color-chart-5` | `#7bc27e` | Light green |

### Body Text (Tailwind Utility, NOT a Custom Token)

| Class | Hex | Usage |
|---|---|---|
| `text-zinc-300` | `#d4d4d8` | Paragraph/body text (used via Tailwind utility, not a custom token) |

### Contrast Ratios (WCAG AAA = 7:1)

| Foreground | Background | Ratio | Standard |
|---|---|---|---|
| `#d4d4d8` (zinc-300) | `#020202` | **12.6:1** | AAA |
| `#8e8e95` (muted) | `#020202` | **7.4:1** | AAA |
| `#febf00` (amber) | `#020202` | **11.6:1** | AAA |
| `#f8f8f8` (foreground) | `#020202` | **16.9:1** | AAA |

### Critical Color Warnings

- **`#febf00` ≠ Tailwind `amber-400` (`#fbbf24`)** — these are different colors. Always use the custom `--color-primary` token.
- **Background is `#020202`, NOT pure `#000`** — pure black looks digital; near-black looks cinematic.
- **The yellow→purple gradient on examples hover is the ONLY purple on the site** — do not add purple anywhere else.

---

## 20. The Complete TypeScript Interface Reference

All 12 interfaces in `src/types/index.ts`. Every marketing data file imports from this module.

```typescript
import type { LucideIcon } from 'lucide-react';

/** Navigation link in the Navbar (desktop + mobile Sheet). */
interface NavLink {
  label: string;
  href: string;
}

/** Story example chip in the Hero — clicking populates the textarea. */
interface StoryExample {
  label: string;
  /** The multi-paragraph seed text injected into the textarea on click. */
  seed: string;
}

/** Aspect ratio toggle button in the Hero (9:16 portrait or 16:9 landscape). */
interface AspectRatio {
  label: '9:16' | '16:9';
  value: 'portrait' | 'landscape';
}

/** Portrait example card in the Examples carousel. */
interface ExampleCard {
  id: string;
  title: string;
  /** Style tag shown below the title (e.g., "Anime · Romance"). */
  styleTag: string;
  /** Path to the 9:16 WebP thumbnail in /public/examples/. */
  thumbnail: string;
  href: string;
}

/** One of the 4 alternating media/text rows in the Workflow section. */
interface WorkflowStep {
  number: 1 | 2 | 3 | 4;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  /** Path to the looping MP4 demo in /public/workflow/. */
  videoSrc: string;
  /** Path to the WebP poster shown before the video loads. */
  videoPoster: string;
  /** Desktop layout: which side the media sits on. Mobile always stacks media-above-text. */
  mediaPosition: 'left' | 'right';
}

/** One of the 8 items in the Features 4×2 hairline grid. */
interface Feature {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

/** One of the 6 testimonial cards in the Testimonials 3×2 grid. */
interface Testimonial {
  id: string;
  quote: string;
  authorName: string;
  authorRole: string;
  /** 2-letter initials rendered in the amber gradient avatar (e.g., "SK"). */
  initials: string;
}

/** One of the 4 use case cards in the UseCases 2×2 grid. */
interface UseCase {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
}

/** One of the 6 items in the FAQ Radix Accordion. */
interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

/** A single link in the Footer. */
interface FooterLink {
  label: string;
  href: string;
}

/** A titled column of links in the Footer. */
interface FooterColumn {
  title: string;
  links: FooterLink[];
}

/** A chip in the Hero style tags marquee. */
interface StyleChip {
  label: string;
  /** Optional smaller sublabel (only "Cyberpunk" uses this: "Futuristic neon"). */
  sublabel?: string;
}
```

### Additional Domain Interfaces (in feature files)

These are NOT in `src/types/index.ts` — they're co-located with their domain functions:

```typescript
// src/features/pipeline/domain/analyze-story.ts
interface AnalyzedStory {
  title: string;
  summary: string;
  characters: AnalyzedCharacter[];
  scenes: AnalyzedScene[];
}

// src/features/pipeline/domain/synthesize-voice.ts
interface SynthesizeVoiceInput { text: string; voiceId?: string; }
interface SynthesizeVoiceOutput { audioBuffer: Buffer; duration: number; }

// src/features/pipeline/domain/align-subtitles.ts
interface AlignSubtitlesOutput { cues: SubtitleCue[]; srt: string; }

// src/features/pipeline/domain/assemble-video.ts
interface AssembleVideoInput {
  sceneImageUrls: string[];
  sceneDurations: number[];
  audioUrl: string;
  subtitlesSrt: string;
  aspectRatio: 'portrait' | 'landscape';
  resolution: '720p' | '1080p' | '4k';
}
interface AssembleVideoOutput { videoBuffer: Buffer; duration: number; }

// src/features/pipeline/domain/moderate-image.ts
interface ModerateImageInput { imageUrl: string; rawOutput: unknown; }
interface ImageModerationResult { flagged: boolean; categories: string[]; }

// src/lib/hooks/use-project-progress.ts
interface ProjectProgressState {
  status: string | null;
  progressPercent: number | null;
  progressDetail: string | null;
  errorMessage: string | null;
  connectionState: 'connecting' | 'open' | 'closed' | 'error';
}
```

---

## 21. Validation Matrix

This table validates the SKILL.md against the codebase. Every claim is verified.

| # | Claim | Source File | Verified |
|---|---|---|---|
| 1 | Next.js ^16.2.0 | `package.json:56` | ✅ |
| 2 | React ^19.2.0 | `package.json:60` | ✅ |
| 3 | Tailwind ^4.3.0 | `package.json:95` | ✅ |
| 4 | Auth.js 5.0.0-beta.31 | `package.json:57` | ✅ |
| 5 | Drizzle ^0.45.2 | `package.json:50` | ✅ |
| 6 | Inngest ^4.11.0 | `package.json:54` | ✅ |
| 7 | Stripe ^22.3.0 | `package.json:63` | ✅ |
| 8 | `verbatimModuleSyntax: true` | `tsconfig.json:21` | ✅ |
| 9 | `noUncheckedIndexedAccess: true` | `tsconfig.json:16` | ✅ |
| 10 | `@tailwindcss/postcss` in postcss.config | `postcss.config.mjs:4` | ✅ |
| 11 | `@theme` block with `--color-primary: #febf00` | `globals.css:24` | ✅ |
| 12 | 13 keyframes, all kebab-case | `globals.css:78-213` | ✅ |
| 13 | `@utility` classes (7 total) | `globals.css:281-389` | ✅ |
| 14 | `prefers-reduced-motion` global override | `globals.css:433-455` | ✅ |
| 15 | `:focus-visible` outline 2px solid primary | `globals.css:269-272` | ✅ |
| 16 | 5-layer architecture | `src/middleware.ts`, `src/app/`, `src/features/`, `src/features/*/domain/`, `src/lib/` | ✅ |
| 17 | `verifySession()` throws NEXT_REDIRECT | `src/features/auth/domain/verify-session.ts` | ✅ |
| 18 | `auth()` used in API routes (not verifySession) | `src/app/api/projects/[id]/progress/route.ts` | ✅ |
| 19 | `useScrolled` hook | `src/lib/hooks/use-scrolled.ts` | ✅ |
| 20 | `useReveal` hook with IntersectionObserver | `src/lib/hooks/use-reveal.ts` | ✅ |
| 21 | `useReducedMotion` hook | `src/lib/hooks/use-reduced-motion.ts` | ✅ |
| 22 | `useProjectProgress` SSE hook | `src/lib/hooks/use-project-progress.ts` | ✅ |
| 23 | 10 static data files in `src/lib/data/` | `ls src/lib/data/` | ✅ |
| 24 | 12 interfaces in `src/types/index.ts` | `src/types/index.ts` | ✅ |
| 25 | `createProjectAction` calls `inngest.send()` | `src/features/projects/actions.ts:117-121` | ✅ |
| 26 | Inngest pipeline wires Steps 0-6 | `src/features/pipeline/inngest.ts` | ✅ |
| 27 | `moderateImage` parses Replicate safety_concept | `src/features/pipeline/domain/moderate-image.ts` | ✅ |
| 28 | `assemble-video.ts` rewrites with SRT temp file + Buffer readback | `src/features/pipeline/domain/assemble-video.ts` | ✅ |
| 29 | `putObject` helper in `r2.ts` | `src/lib/storage/r2.ts:78-91` | ✅ |
| 30 | `getProject()` LEFT JOINs videos | `src/features/projects/queries.ts:31-66` | ✅ |
| 31 | 227 unit tests across 32 files | `pnpm test` output | ✅ |
| 32 | 48 E2E tests across 9 files | `pnpm test:e2e` output | ✅ |
| 33 | 14 routes total | `src/app/` file tree | ✅ |
| 34 | husky + lint-staged pre-commit hook | `.husky/pre-commit`, `package.json:27-37` | ✅ |
| 35 | `prepare: "husky \|\| true"` script | `package.json:27` | ✅ |

---

## Reference Documents

| Document | Role |
|---|---|
| `CLAUDE.md` | Agent briefing document (stack, conventions, pitfalls, anti-patterns) — source of truth |
| `AGENTS.md` | Compact agent instructions |
| `README.md` | Quick start + architecture + design system summary |
| `Project_Requirements_Document.md` | Canonical marketing spec (v2.0, 2718 lines, field-verified from live DOM) |
| `PRODUCTION_READINESS_PLAN.md` | Engineering blueprint (11 ADRs, 27 TDD task cards, risk register, pre-launch checklist) |
| `MASTER_EXECUTION_PLAN.md` | Marketing clone execution record (8 phases, 15 decisions, 20 risks) |
| `Project_Brief.md` | Validation of session doc against codebase |
| `deviation_report_validation.md` | Validation of the deviation report (1 genuine gap + 1 enhancement) |

---

## Success Criteria

You are successful when:

- `pnpm lint` exits with 0 warnings
- `pnpm typecheck` exits with 0 errors
- `pnpm test` passes all 227 unit tests
- `pnpm test:e2e` passes all 48 E2E tests (requires Playwright browsers installed)
- `pnpm build` exits with 0 errors
- Lighthouse scores ≥ 95 across Performance, Accessibility, Best Practices, SEO (marketing page)
- The marketing page is visually indistinguishable from `storyintovideo.com` at 1440×900
- The full pipeline works end-to-end: signup → paste story → AI generates video → download
- All external services are provisioned and `.env.local` is complete
- The pre-launch checklist (`PRODUCTION_READINESS_PLAN.md` §8) is fully checked
- husky pre-commit hook fires on `git commit` (verify with a test commit)

---

**End of `storyintovideo_SKILL.md` v2.0.0** — single-source engineering reference for the StoryIntoVideo codebase. Derived from `CLAUDE.md` · `AGENTS.md` · `README.md` · `PRODUCTION_READINESS_PLAN.md` · `Project_Requirements_Document.md` · the actual source tree under `src/`. When in doubt, consult `CLAUDE.md` as the source of truth.
