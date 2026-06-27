---
name: storyintovideo
description: Complete engineering reference for the StoryIntoVideo production SaaS — a luxury-dark cinematic AI story-into-video generator built with Next.js 16, React 19, Tailwind v4, Auth.js v5, Drizzle/Postgres, Inngest, and a 6-step AI pipeline. Covers the marketing clone design system, the 5-layer production architecture, exact color tokens, the 13 CSS keyframes, the auth-first Server Action pattern, and every bug encountered during the 4-sprint build.
version: 1.0.0
---

# StoryIntoVideo — Engineering Skill Reference

> **Purpose:** Single-source engineering reference for the StoryIntoVideo codebase. Other coding agents (Claude, Gemini, Codex, etc.) should consult this file when extending, debugging, or replicating this project. Every section is grounded in actual code — exact classNames, color values, configuration flags, and the reasoning behind every non-obvious decision.
>
> **Authoritative Sources:** This SKILL.md is derived from `CLAUDE.md` · `AGENTS.md` · `README.md` · `PRODUCTION_READINESS_PLAN.md` · `Project_Requirements_Document.md` · the actual source tree under `src/`. When in doubt, consult `CLAUDE.md` as the source of truth.

---

## Table of Contents

1. [Project Identity & Design Philosophy](#1-project-identity--design-philosophy)
2. [Tech Stack & Environment](#2-tech-stack--environment)
3. [Bootstrapping & Configuration](#3-bootstrapping--configuration)
4. [The Design System (Code-First)](#4-the-design-system-code-first)
5. [Component Architecture & Patterns](#5-component-architecture--patterns)
6. [Custom Hooks Deep Dive](#6-custom-hooks-deep-dive)
7. [Content Management: Static Data Files (not import.meta.glob)](#7-content-management-static-data-files-not-importmetaglob)
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

---

## 1. Project Identity & Design Philosophy

### What StoryIntoVideo Is

StoryIntoVideo is a production SaaS application that transforms written stories into fully produced video content via a 6-step AI pipeline (story analysis → character generation → scene generation → voiceover → subtitle alignment → video assembly). The codebase has two layers:

1. **Marketing front end** — a pixel-accurate clone of `storyintovideo.com`, a luxury-dark, cinematic SaaS landing page. Every color token, keyframe, and hover micro-interaction was field-verified from the live production DOM.
2. **Production backend** — auth, database, AI pipeline, billing, and storage built behind the marketing facade using a 5-layer architecture.

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

---

## 2. Tech Stack & Environment

### Exact Versions (verified against `package.json` + `pnpm-lock.yaml`)

**Runtime dependencies:**

| Package | Version | Purpose |
|---|---|---|
| `next` | ^16.2.0 | Framework (App Router, hybrid rendering) |
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
| `@ffmpeg-installer/ffmpeg` | ^1.1.0 | FFmpeg binary |
| `bcryptjs` | ^3.0.3 | Password hashing (credentials provider) |
| `zod` | ^4.4.3 | Env validation + Server Action input validation |
| `class-variance-authority` | ^0.7.1 | Button variants |
| `clsx` | ^2.1.1 | Conditional class merging |
| `tailwind-merge` | ^3.0.0 | Tailwind class deduplication |
| `geist` | ^1.7.0 | Geist Sans + Geist Mono fonts |
| `lucide-react` | ^0.460.0 | Icons (stroke 1.5, `currentColor`) |
| `@radix-ui/react-accordion` | ^1.2.0 | FAQ accordion |
| `@radix-ui/react-dialog` | ^1.1.0 | Mobile nav Sheet |
| `@radix-ui/react-dropdown-menu` | ^2.1.0 | Language switcher |
| `@radix-ui/react-slot` | ^1.3.0 | Button asChild pattern |

**Dev dependencies (key ones):**

| Package | Version | Purpose |
|---|---|---|
| `drizzle-kit` | ^0.31.10 | Migration generator + applier |
| `vitest` | ^4.1.9 | Unit test runner (jsdom) |
| `@vitejs/plugin-react` | ^6.0.0 | React plugin for Vitest |
| `@playwright/test` | ^1.61.0 | E2E tests (Chromium only) |
| `@testing-library/react` | ^16.0.0 | Component testing |
| `@testing-library/user-event` | ^14.5.0 | User interaction simulation |
| `@testing-library/jest-dom` | ^6.9.0 | DOM matchers for Vitest |
| `jsdom` | ^29.1.1 | DOM environment for tests |
| `eslint` | ^9.39.4 | Linter (flat config) |
| `typescript-eslint` | ^8.62.0 | ESLint TypeScript plugin |
| `eslint-plugin-react` | ^7.37.5 | ESLint React plugin |
| `eslint-plugin-react-hooks` | ^7.1.1 | ESLint React Hooks plugin |
| `@next/eslint-plugin-next` | ^16.2.9 | ESLint Next.js plugin |
| `prettier` | ^3.8.4 | Code formatter |
| `prettier-plugin-tailwindcss` | ^0.8.0 | Tailwind class sorting |
| `typescript` | ^5.9.0 | TypeScript compiler |
| `dotenv` | ^17.4.2 | Env file loading (drizzle-kit) |
| `@types/bcryptjs` | ^3.0.0 | bcryptjs types |
| `@types/fluent-ffmpeg` | ^2.1.28 | fluent-ffmpeg types |

### Critical TypeScript Flags (`tsconfig.json`)

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
    "module": "esnext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "isolatedModules": true,
    "incremental": true,
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts", ".next/dev/types/**/*.ts"],
  "exclude": ["node_modules", "skills", "docs"]
}
```

**Note on `erasableSyntaxOnly`:** This flag is **NOT present** in the project's `tsconfig.json`. The project uses `verbatimModuleSyntax: true` instead, which enforces explicit `import type` for type-only imports. Do not add `erasableSyntaxOnly` — it is not part of this project's configuration.

### Environment Variables (25 total: 23 required + 2 optional)

All validated by Zod at module load in `src/lib/env/index.ts`. The app fails fast with a descriptive, var-named error if any required var is missing or invalid.

```bash
# Required (23)
DATABASE_URL=postgresql://user:pass@ep-pooled.region.aws.neon.tech/db?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://user:pass@ep-direct.region.aws.neon.tech/db?sslmode=require
AUTH_SECRET=                          # min 32 chars; openssl rand -base64 32
AUTH_URL=http://localhost:3000
OPENAI_API_KEY=sk-...
REPLICATE_API_TOKEN=r8_...
ELEVENLABS_API_KEY=
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_UPLOADS=siv-uploads
R2_BUCKET_GENERATED=siv-generated
R2_BUCKET_VIDEOS=siv-videos
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=
RESEND_API_KEY=re_...
UPSTASH_REDIS_REST_URL=https://example.upstash.io
UPSTASH_REDIS_REST_TOKEN=
SENTRY_DSN=https://example@sentry.io/1
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional (2) — Google OAuth (both required to enable)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# With default
NODE_ENV=development    # development | production | test
```

**CRITICAL RULE:** Never read `process.env.*` directly in production code. Import `env` from `@/lib/env` and access `env.VAR_NAME`. The Zod schema validates everything at module load. Direct `process.env.*` reads bypass validation — typos like `GOOGLE_CLIENTID` (missing underscore) silently return `undefined` and disable OAuth with no error.

---

## 3. Bootstrapping & Configuration

### From Zero: Recreating This Project

```bash
# 1. Scaffold Next.js 16 + TypeScript + Tailwind v4
pnpm create next-app@latest story-into-video \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --use-pnpm

cd story-into-video

# 2. Install runtime dependencies
pnpm add next-auth@5.0.0-beta.31 @auth/drizzle-adapter@^1.11.2
pnpm add drizzle-orm@^0.45 postgres@^3.4
pnpm add inngest@^4.11
pnpm add openai@^6.45 replicate@^1.4 elevenlabs@^1.59
pnpm add stripe@^22.3
pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
pnpm add fluent-ffmpeg @ffmpeg-installer/ffmpeg
pnpm add bcryptjs@^3 zod@^4.4
pnpm add geist@^1.7 lucide-react@^0.460

# 3. Install dev dependencies
pnpm add -D drizzle-kit@^0.31 dotenv@^17.4
pnpm add -D @types/bcryptjs @types/fluent-ffmpeg

# 4. Configure pnpm-workspace.yaml for esbuild build scripts
cat > pnpm-workspace.yaml << 'EOF'
allowBuilds:
  esbuild: true
  sharp: true
  unrs-resolver: true
onlyBuiltDependencies:
  - sharp
  - unrs-resolver
  - esbuild
EOF
```

### Critical Configuration Files

#### `next.config.ts` — Security Headers + Image Formats

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

**Note:** `cacheComponents: true`, `cacheLife` profiles, and `turbopack: {}` are NOT in the current `next.config.ts` but are specified in the Production Readiness Plan for future implementation. The current config is simpler.

#### `postcss.config.mjs` — The Tailwind v4 Plugin Is Mandatory

```javascript
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

Without `@tailwindcss/postcss`, Tailwind v4 classes silently don't apply. This is the #1 cause of "my styles aren't working" issues.

#### `eslint.config.mjs` — Flat Config with Direct Plugin Imports

```javascript
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import nextPlugin from '@next/eslint-plugin-next';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['node_modules/**', '.next/**', 'skills/**', 'docs/**', 'scripts/**', 'next-env.d.ts'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx,js,jsx,mjs,cjs}'],
    plugins: { react: reactPlugin, 'react-hooks': reactHooksPlugin, '@next/next': nextPlugin },
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
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

**Why not `eslint-config-next`?** Its `FlatCompat` is broken with ESLint 9.39+. Direct plugin imports are the working approach.

#### `.prettierrc.json`

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "bracketSpacing": true,
  "jsxSingleQuote": false,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

#### `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/setup.ts'],
    include: ['src/tests/unit/**/*.test.{ts,tsx}'],
  },
  resolve: { alias: { '@': resolve(__dirname, './src') } },
});
```

#### `playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src/tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: { baseURL: 'http://localhost:3000', trace: 'on-first-retry' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

#### `drizzle.config.ts`

```typescript
import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/lib/db/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL_UNPOOLED! },
  verbose: true,
  strict: true,
});
```

**CRITICAL:** Drizzle Kit uses `DATABASE_URL_UNPOOLED` (the direct Neon connection), NOT the pooled connection. Pooling + DDL is unreliable. The app uses the pooled connection; migrations use the direct connection.

#### `pnpm-workspace.yaml` — esbuild Build Script Approval

```yaml
allowBuilds:
  esbuild: true
  sharp: true
  unrs-resolver: true
onlyBuiltDependencies:
  - sharp
  - unrs-resolver
  - esbuild
```

**Without this,** `pnpm install` prints "Ignored build scripts: esbuild" and drizzle-kit/vitest (which depend on esbuild) silently break. This took 30 minutes to diagnose.

---

## 4. The Design System (Code-First)

### The `@theme` Block (in `src/app/globals.css`)

All design tokens live in a single `@theme { ... }` block. There is **no `tailwind.config.ts`** — Tailwind v4 CSS-first is the convention.

```css
@import 'tailwindcss';

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

  /* Chart palette (reserved for future dashboard) */
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
  @keyframes fade-in-up { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
  @keyframes float { 0%, 100% { transform: translateY(0) rotate(var(--card-rotate, 0deg)); } 50% { transform: translateY(-12px) rotate(var(--card-rotate, 0deg)); } }
  @keyframes glow-pulse { 0%, 100% { box-shadow: 0 0 20px rgba(251, 191, 36, 0.3); } 50% { box-shadow: 0 0 40px rgba(251, 191, 36, 0.5); } }
  @keyframes border-glow { 0%, 100% { border-color: rgba(245, 184, 0, 0.08); } 50% { border-color: rgba(245, 184, 0, 0.2); } }
  @keyframes composite-pulse-text { 0%, 100% { opacity: 0.7; } 50% { opacity: 1; } }
  @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
  @keyframes btn-shimmer { 0% { transform: translate(-100%); } 100% { transform: translate(100%); } }
  @keyframes grid-shimmer { 0% { transform: translate(-20%, -30%); } 50% { transform: translate(70%, 40%); } 100% { transform: translate(-20%, -30%); } }
  @keyframes grid-sweep-h { 0% { transform: translate(-600px); } 100% { transform: translate(calc(600px + 100vw)); } }
  @keyframes grid-sweep-v { 0% { transform: translateY(-500px); } 100% { transform: translateY(calc(500px + 100vh)); } }
  @keyframes scanline-scroll { 0% { background-position-x: 0; } 100% { background-position-x: 30px; } }
  @keyframes lang-dropdown-in { 0% { opacity: 0; transform: translateY(-4px) scale(0.96); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
  @keyframes marquee-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
}
```

### Custom `@utility` Classes

Tailwind v4 uses `@utility` instead of `@layer components`:

```css
@utility scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; &::-webkit-scrollbar { display: none; } }
@utility marquee-mask { -webkit-mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent); mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent); }
@utility marquee-track { display: flex; gap: 0.5rem; width: max-content; animation: var(--animate-marquee-scroll); &:hover { animation-play-state: paused; } @media (max-width: 640px) { animation-duration: 30s; } }
@utility glass-input { /* backdrop-blur input widget — see source */ }
@utility eyebrow { /* amber pill badge — see source */ }
@utility section-heading { font-family: var(--font-heading); font-weight: 700; letter-spacing: -0.03em; color: #ffffff; font-size: clamp(2rem, 5vw, 3rem); line-height: 1.1; }
@utility cta-amber { /* solid amber pill — see source */ }
```

### Font Loading (in `src/lib/fonts.ts`)

```typescript
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import localFont from 'next/font/local';

// Self-hosted Outfit variable font for weight 820
// (next/font/google only serves discrete weights — 820 unavailable)
const outfit = localFont({
  src: '../../public/fonts/Outfit-VariableFont.woff2',
  weight: '100 900',
  variable: '--font-outfit',
  display: 'swap',
});

export const fontVariables: string = [GeistSans.variable, GeistMono.variable, outfit.variable].join(' ');
```

**Why `next/font/local` for Outfit?** Google Fonts API only serves discrete weights (100, 200, ..., 900). Weight 820 — the cinematic display weight specified in the PRD — is unavailable. The variable font woff2 (45KB, weight range 100–900) is self-hosted at `public/fonts/Outfit-VariableFont.woff2`.

### Typography Hierarchy (Exact Usage)

| Element | Font | Size | Weight | Tracking | Color |
|---|---|---|---|---|---|
| H1 (hero desktop) | Outfit | `text-[4.5rem]` (72px) | **820** (inline style) | `tracking-[-0.04em]` | `#f8f8f8` |
| H1 (hero mobile) | Outfit | `text-4xl` (36px) | 820 | scales with `em` | `#f8f8f8` |
| H2 (sections) | Outfit | `text-4xl lg:text-6xl` | 700 | `tracking-[-0.03em]` | `#f8f8f8` |
| Body | Geist Sans | `text-lg` (18px) | 400 | normal | zinc-300/80 |
| Ratio toggles | Geist Mono | `text-[10px]` | 400 | — | amber-400 / zinc-600 |
| Eyebrow badge | Geist Sans | `text-[11px]` | 600 | `tracking-widest` uppercase | amber-400 |

**H1 weight 820 is applied via inline `style={{ fontWeight: 820 }}`** because Tailwind's `font-extrabold` (800) is the closest utility but isn't 820.

---

## 5. Component Architecture & Patterns

### The 5-Layer Request Model (Golden Rule)

This is the **single most important architectural principle** in the codebase. Deviation creates security and consistency bugs.

```
Layer 0: src/middleware.ts        — Cookie check, redirect. NO DB. NO logic. Edge runtime.
Layer 1: src/app/                 — Route structure, metadata, Suspense. Layouts must NOT fetch data.
Layer 2: src/features/            — UI composition, data binding, mutations (auth, projects, pipeline, billing)
Layer 3: src/features/*/domain/   — Pure business logic. No Next.js or DB runtime imports (import type only)
Layer 4: src/lib/                 — Infrastructure: Drizzle, Auth.js, Inngest, R2, Stripe, AI providers. Side effects only.
```

**Golden Rule:** A lower layer may never import from a higher layer. Domain may import types from Infrastructure but never runtime code.

### Server Components by Default

Use `'use client'` only for:
- Components with `useState`, `useEffect`, `useReducer`, `useRef`
- Components using browser APIs (`window`, `document`, `localStorage`, `matchMedia`)
- Components using `usePathname`, `useRouter`, `useSearchParams`
- Components wrapped in `'use client'` contexts (`SessionProvider`, etc.)

**Never put `'use client'` on a Server Component.** Never import `'use client'` modules into Server Components beyond the boundary.

### Async `params` / `searchParams` / `cookies()` in Next.js 16

In Next.js 16, all three are `Promise<T>`. Always `await` them:

```tsx
// CORRECT
export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
}

// WRONG — synchronous access causes runtime 500
export function ProjectPage({ params }: { params: { id: string } }) {
  const { id } = params; // TypeError: params is not iterable
}
```

### Suspense + Server Component Pattern (Mandatory for Dynamic Data)

```tsx
export default function DashboardPage() {
  return (
    <main>
      <Suspense fallback={<DashboardSkeleton />}>
        <ProjectList />
      </Suspense>
    </main>
  );
}

async function ProjectList() {
  const session = await verifySession({ redirectTo: '/dashboard' });
  const projects = await getUserProjects(session.user.id);
  return <ProjectGrid projects={projects} />;
}
```

### The `queries.ts` Boundary

All DB access goes through feature-level `queries.ts` files. No raw Drizzle calls in components.

```
src/features/projects/queries.ts    ← getUserProjects, getProject, createProject
src/features/pipeline/queries.ts    ← appendCharacter, appendScene, updateProjectProgress
src/features/billing/queries.ts     ← getOrCreateSubscription, debitCredits, refillCredits
```

### Component Philosophy: "Engineered Soul"

Every component has a clear purpose, documented in a JSDoc header. The pattern:

```tsx
/**
 * Hero — client component.
 * 4 layers: (1) background video with vertical scrim + radial amber glow,
 * (2) content (eyebrow + H1 in Outfit 820 + subtitle + glass input widget),
 * (3) style tags marquee, (4) bottom fade into next section.
 *
 * Interactions: textarea state, 4 story chips that populate the textarea,
 * aspect ratio toggle (9:16 default active, 16:9 alternate).
 */
export function Hero() { ... }
```

### Marketing Section Components (10 files in `src/components/sections/`)

| Component | Type | Key Patterns |
|---|---|---|
| `navbar.tsx` | `'use client'` | `useScrolled(10)` → `bg-zinc-950/70 backdrop-blur-[24px]`. Mobile Sheet (Radix Dialog). DropdownMenu for language switcher. |
| `hero.tsx` | `'use client'` | 4 layers (bg video + content + marquee + fade). `useState` for story + activeRatio. Character counter `{story.length} / 500`. |
| `examples.tsx` | `'use client'` | `useRef<HTMLDivElement>` for carousel. `scrollBy({ left: delta, behavior: 'smooth' })`. Yellow→purple hover gradient (the ONLY purple). |
| `workflow.tsx` | `'use client'` | `WorkflowVideo` inner component with `useState(false)` for poster→video fade-in. `onCanPlay` → `setLoaded(true)`. |
| `features.tsx` | Server | 4×2 hairline grid (continuous surface, `border-neutral-800` dividers). Three hover effects: accent bar, title slide, gradient sheen. |
| `testimonials.tsx` | Server | 3×2 grid. `<blockquote>` + `<figcaption>`. Amber gradient avatar (inline `linear-gradient`). |
| `use-cases.tsx` | Server | 2×2 grid. Corner amber glow on hover (`-top-12 -right-12 h-48 w-48 bg-amber-400/10 blur-3xl`). |
| `faq.tsx` | `'use client'` | Radix Accordion. Plus icon rotates 45° on open (`[[data-state=open]>&]:rotate-45`). CSS Grid `grid-template-rows: 0fr→1fr` animation. |
| `final-cta.tsx` | Server | 4 decorative layers (dot-grid, radial halo, top fade, bottom fade). `CtaAmber` (solid amber pill). |
| `footer.tsx` | Server | Brand block + 3 link columns + bottom nav. `mailto:` for support email. |

### App Components (4 files in `src/components/app/`)

| Component | Type | Purpose |
|---|---|---|
| `auth-form.tsx` | `'use client'` | Shared sign-in/sign-up form. Google OAuth button + email/password. `signIn('credentials', { redirect: false })`. |
| `create-wizard.tsx` | `'use client'` | Project creation. Reuses Hero's glass-input pattern (textarea, style chips, ratio toggle, character counter). Calls `createProjectAction`. |
| `empty-state.tsx` | Server | Reusable empty list state (icon + title + description + CTA). |
| `providers.tsx` | `'use client'` | `SessionProvider` wrapper (required by `next-auth/react`). |

### shadcn/ui Primitives (4 hand-written files in `src/components/ui/`)

- `button.tsx` — `class-variance-authority` variants, `@radix-ui/react-slot` for `asChild`
- `accordion.tsx` — Radix Accordion with `grid-template-rows: 0fr→1fr` animation
- `sheet.tsx` — Radix Dialog for mobile nav drawer (right-side)
- `dropdown-menu.tsx` — Radix DropdownMenu for language switcher

These are NOT from the `shadcn` CLI (it timed out). They follow canonical new-york style.

---

## 6. Custom Hooks Deep Dive

### `useScrolled` — Scroll Position Boolean

**File:** `src/lib/hooks/use-scrolled.ts`

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

**Purpose:** Returns `true` when `window.scrollY` exceeds the threshold. Used by Navbar to toggle `bg-zinc-950/70 backdrop-blur-[24px]`.

**Key details:**
- `{ passive: true }` on the scroll listener — critical for scroll performance (allows browser to paint without waiting for JS).
- `onScroll()` called immediately on mount — initializes the state correctly if the page loads scrolled.
- Default threshold is 10px (navbar activates almost immediately).
- `useEffect` dependency is `[threshold]` — re-subscribes if threshold changes.

### `useReveal` — IntersectionObserver One-Shot Reveal

**File:** `src/lib/hooks/use-reveal.ts`

```typescript
'use client';
import { useEffect, useRef, useState } from 'react';

interface UseRevealOptions {
  threshold?: number;      // default 0.15
  rootMargin?: string;     // default '0px 0px -50px 0px'
  once?: boolean;          // default true
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

**Purpose:** Wraps `IntersectionObserver` to trigger a one-shot reveal flag. Used by `ScrollReveal` primitive.

**Key details:**
- `rootMargin: '0px 0px -50px 0px'` — triggers 50px before the element enters the viewport (feels more responsive).
- `once: true` (default) — observer disconnects after first intersection. Set `once: false` for toggle behavior.
- `ref` is typed as `RefObject<T | null>` (not `RefObject<T>`) because `useRef<T>(null)` returns `RefObject<T | null>` in React 19.
- The actual visual transition is CSS-driven via `[data-reveal]` + `[data-revealed='true']` attributes (see `globals.css`).

### `useReducedMotion` — OS Motion Preference Detection

**File:** `src/lib/hooks/use-reduced-motion.ts`

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

**Purpose:** Returns `true` when the user has OS-level reduced-motion preference enabled.

**Key details:**
- The global CSS `@media (prefers-reduced-motion: reduce)` block in `globals.css` handles most cases declaratively. This hook is for JS-driven decisions (e.g., skipping video autoplay, disabling a JS animation).
- `onChange()` called immediately on mount — initializes correctly if the page loads with the preference already set.
- Uses `addEventListener('change', ...)` (modern API), not `addListener` (deprecated).

---

## 7. Content Management: Static Data Files (not import.meta.glob)

### Important: This Project Does NOT Use `import.meta.glob`

`import.meta.glob` is a **Vite-specific** feature. This project uses **Next.js 16**, not Vite. Content management is via **static TypeScript data files** in `src/lib/data/`.

### The Data File Pattern

All static marketing content lives in `src/lib/data/*.ts` — imported by section components. This keeps components clean and data easily editable.

```
src/lib/data/
├── nav-links.ts          # NAV_LINKS array (label + href) + NAV_LANGUAGES
├── story-seeds.ts        # STORY_SEEDS record (label → multi-paragraph seed text) + DEFAULT_STORY_EXAMPLES
├── style-chips.ts        # STYLE_CHIPS array (7 chips, Cyberpunk has sublabel)
├── examples.ts           # EXAMPLE_CARDS array (6 cards: title, styleTag, thumbnail, href)
├── workflow-steps.ts     # WORKFLOW_STEPS array (4 steps: number, title, description, cta, video, poster, mediaPosition)
├── features.ts           # FEATURES array (8 items: id, title, description, icon)
├── testimonials.ts       # TESTIMONIALS array (6 items: id, quote, authorName, authorRole, initials)
├── use-cases.ts          # USE_CASES array (4 items: id, title, description, icon, href)
├── faq-items.ts          # FAQ_ITEMS array (6 items: id, question, answer)
└── footer-links.ts       # FOOTER_COLUMNS array (3 columns: title + links) + FOOTER_BRAND + FOOTER_COPYRIGHT
```

### Example: `nav-links.ts`

```typescript
import type { NavLink } from '@/types';

export const NAV_LINKS: NavLink[] = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Blog', href: '/blog' },
  { label: 'Contact', href: '/contact' },
];

export const NAV_LANGUAGES = ['EN', '中文', '日本語'] as const;
```

### Example: `story-seeds.ts` (with typed Record)

```typescript
import type { StoryExample } from '@/types';

export const STORY_SEEDS: Record<string, string> = {
  'Time travel': `Dr. Elena Voss pressed her palm against the cold brass...`,
  'Space odyssey': `The colony ship Aurora drifted past Neptune...`,
  'Rival chefs': `In the Michelin-starred kitchen of Maison Lumière...`,
  'Victorian mystery': `The fog rolled in over Whitechapel...`,
};

export const DEFAULT_STORY_EXAMPLES: StoryExample[] = Object.keys(STORY_SEEDS).map((label) => ({
  label,
  seed: STORY_SEEDS[label]!,
}));
```

### How to Add New Content

1. **New nav link:** Add to `NAV_LINKS` in `nav-links.ts`
2. **New story seed:** Add a key-value pair to `STORY_SEEDS` in `story-seeds.ts`
3. **New example card:** Add an object to `EXAMPLE_CARDS` in `examples.ts` (follow the `ExampleCard` interface)
4. **New FAQ item:** Add an object to `FAQ_ITEMS` in `faq-items.ts`
5. **New testimonial:** Add an object to `TESTIMONIALS` in `testimonials.ts`

**No build step or glob resolution needed** — the data is TypeScript, type-checked at compile time, tree-shaken by the bundler.

### Why Not `import.meta.glob`?

- This is Next.js, not Vite. `import.meta.glob` doesn't exist.
- Next.js's equivalent for dynamic content loading is `generateStaticParams` + MDX (used for the blog in the blueprint, not yet implemented).
- For the marketing page, static data files are simpler, type-safe, and require no runtime resolution.

---

## 8. Accessibility (WCAG AAA) Implementation

### The 4 Pillars

1. **Focus-visible rings** — `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400` on every interactive element.
2. **Skip-to-content** — `<a href="#main" className="sr-only focus:not-sr-only ...">` at the top of `<body>`.
3. **Reduced motion** — global `@media (prefers-reduced-motion: reduce)` override disables ALL animation.
4. **Color contrast** — zinc-300 on zinc-950 = 12.6:1 (WCAG AAA). Amber on near-black = 10.4:1 (AAA).

### Skip-to-Content Link (in `layout.tsx`)

```tsx
<a
  href="#main"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-amber-400 focus:px-4 focus:py-2 focus:font-medium focus:text-zinc-950 focus:shadow-lg"
>
  Skip to content
</a>
```

The `<main id="main">` target is in `page.tsx`.

### Focus-Visible Rings (global, in `globals.css`)

```css
@layer base {
  :focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
}
```

Plus per-component `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400` on every `<a>`, `<button>`, and `<input>`.

### Reduced Motion (global, in `globals.css`)

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

**Key:** `video[autoplay] { display: none; }` hides autoplaying videos for reduced-motion users. The `[data-reveal]` override forces all scroll-reveal elements visible immediately.

### Hero Video Accessibility

```tsx
<video
  className="h-full w-full object-cover opacity-100 transition-opacity duration-1000"
  autoPlay muted loop playsInline preload="metadata"
  poster="/hero-poster.webp"
  aria-hidden="true"
>
  <source src="/hero-bg.mp4" type="video/mp4" />
</video>
```

- `aria-hidden="true"` — decorative, no audio.
- `muted` — required for autoplay.
- `playsInline` — required for iOS.
- `preload="metadata"` — don't download the full video until the user interacts.

### Touch Targets ≥44×44px

The aspect ratio toggle buttons in the Hero use `min-h-[44px] min-w-[44px]`:

```tsx
<button
  className="flex min-h-[44px] min-w-[44px] items-center justify-center px-2 py-1 font-mono text-[10px] ..."
  aria-pressed={isActive}
>
  {ratio.label}
</button>
```

### ARIA Patterns

- **Accordion:** Radix Accordion provides `aria-expanded`, `aria-controls`, `role="region"` automatically.
- **Sheet (mobile nav):** Radix Dialog provides `role="dialog"`, `aria-modal="true"` automatically.
- **Carousel:** `role="region"` with `aria-label="Example videos carousel"`.
- **Aspect ratio toggle:** `role="group"` with `aria-label="Aspect ratio"`, each button has `aria-pressed`.
- **Navbar nav:** `<nav aria-label="Main">`.

### Contrast Ratios (Verified)

| Foreground | Background | Ratio | Standard |
|---|---|---|---|
| zinc-300 (`#d4d4d8`) | zinc-950 (`#09090b`) | 12.6:1 | AAA |
| amber-400 (`#fbbf24`) | zinc-950 | 10.4:1 | AAA |
| `#febf00` (primary) | `#020202` (background) | 12.8:1 | AAA |
| zinc-500 (`#71717a`) | zinc-950 | 4.7:1 | AA |
| white (`#f8f8f8`) | `#020202` | 18.9:1 | AAA |

---

## 9. Anti-Patterns & Common Bugs

### Marketing Layer (inherited from clone)

1. **Pure black vs near-black:** Background is `#020202`, NOT `#000` or `#0a0a0a`. Using pure black makes the page feel cold; `#020202` is warm-neutral.
2. **Amber shade mismatch:** `#febf00` (PRD amber) ≠ `#fbbf24` (Tailwind `amber-400`). Use the custom `--color-primary` token, never `text-amber-400` for the primary accent.
3. **Outfit 820 unavailable from Google Fonts API:** Must self-host via `next/font/local`. `next/font/google` only serves discrete weights (100, 200, ..., 900).
4. **Feature grid uses hairline borders, not cards:** The 8 features share a continuous surface separated by `border-neutral-800`. Rightmost column and bottom row have `lg:border-r-0` / `lg:border-b-0` to avoid double borders at the grid edge.
5. **Examples hover gradient is the ONLY purple:** `bg-gradient-to-r from-yellow-500 to-purple-500` on card hover only. Do not add purple anywhere else.
6. **CTA hierarchy is deliberate:** Ghost link → glass pill → gradient pill → solid amber. Ration the accent from least to most prominent.
7. **Geist Mono for ratio toggles, NOT Geist Sans:** `font-mono text-[10px]` for the 9:16/16:9 buttons.
8. **`next lint` deprecated in Next.js 16:** Use `eslint .` directly. The `lint` script in `package.json` runs `eslint .`.
9. **shadcn CLI times out:** Primitives are hand-written in `src/components/ui/`, not CLI-generated. Follow canonical new-york style.
10. **Grammarly extension:** `suppressHydrationWarning` required on both `<html>` AND `<body>`. Browser extensions inject attributes into `<body>` before React hydrates. `<html>` alone is insufficient.
11. **Workflow is `'use client'`:** Uses `useState` for poster→video fade-in choreography. Don't assume server components for "mostly static" sections.
12. **Playwright browsers:** `pnpm install` doesn't install browser binaries. Run `pnpm exec playwright install` separately.

### Production App Layer (new — each with root cause + exact fix)

13. **`verifySession()` must not be wrapped in try/catch** — it throws `NEXT_REDIRECT` (via `redirect('/sign-in')`) which must propagate. Wrapping it in try/catch catches the redirect and silently swallows it, leaving the user on the protected page with no session.
    - **Fix:** Never wrap `verifySession()` in try/catch. Let it throw.

14. **`process.env.*` is forbidden** — always import `env` from `@/lib/env`. The Zod schema validates at module load; typos like `GOOGLE_CLIENTID` (missing underscore) silently return `undefined` and disable OAuth with no error.
    - **Fix:** `import { env } from '@/lib/env';` then `env.GOOGLE_CLIENT_ID`.

15. **Zod `.url()` rejects `postgresql://`** — Zod's `.url()` validator rejects non-standard URL schemes. The `DATABASE_URL` validation threw "DATABASE_URL must be a postgresql:// URL" at build time even though the value was valid.
    - **Fix:** Replace `.url()` with `.min(1).refine((url) => url.startsWith('postgres://') || url.startsWith('postgresql://'), { message: '...' })`.

16. **Build fails without env vars** — the env module throws at module load if required vars are missing. The auth route handler imports `DrizzleAdapter(db)` which accesses `env.DATABASE_URL` at build time during page-data collection.
    - **Fix:** Add a build-context fallback in `src/lib/env/index.ts`: when `NEXT_PHASE === 'phase-production-build'` or `NODE_ENV === 'test'`, return placeholder values instead of throwing. At runtime, real env vars MUST be set.

17. **DrizzleAdapter rejects Proxy-based db** — a Proxy-based lazy db (`new Proxy({} as Database, { get(...) { ... } })`) was rejected with "Unsupported database type (object)". DrizzleAdapter validates the db object's structure.
    - **Fix:** Use a real Drizzle client. `postgres()` doesn't connect until a query runs, so eager instantiation is safe: `const queryClient = postgres(env.DATABASE_URL, { prepare: false }); export const db = drizzle(queryClient, { schema });`.

18. **Auth route handler must be `force-dynamic`** — without `export const dynamic = 'force-dynamic'`, Next.js tries to prerender the route, which fails because `DrizzleAdapter` can't be instantiated without env vars.
    - **Fix:** Add `export const dynamic = 'force-dynamic';` to `src/app/api/auth/[...nextauth]/route.ts`.

19. **Inngest v4 `createFunction` signature changed** — the trigger moved into the config object as `triggers: [{ event: '...' }]`, NOT a second argument. Older docs show `createFunction(config, trigger, handler)` which is wrong for v4.
    - **Fix:** `inngest.createFunction({ id: '...', retries: 3, triggers: [{ event: 'pipeline.started' }] }, async ({ event, step }) => { ... })`.

20. **Stripe SDK v22+ uses camelCase** — `subscription.current_period_end` became `subscription.currentPeriodEnd`. TypeScript errors on the snake_case form.
    - **Fix:** Use a dual-cast fallback: `const periodEnd = (subscription as unknown as { currentPeriodEnd?: number }).currentPeriodEnd ?? (subscription as unknown as { current_period_end?: number }).current_period_end;`.

21. **ElevenLabs `textToSpeech.convert()` returns `Readable`, not `ReadableStream`** — the ElevenLabs SDK returns a Node.js `Readable` stream, not a web `ReadableStream`. The original `streamToBuffer` function used `stream.getReader()` which doesn't exist on `Readable`.
    - **Fix:** Duck-type the input: check for `getReader` (web stream) vs. use `for await...of` (Node Readable). See `src/features/pipeline/domain/synthesize-voice.ts`.

22. **Buffer → Blob requires `new Uint8Array(buffer)`** — `new File([audioBuffer], ...)` fails TypeScript's strict types because `Buffer<ArrayBufferLike>` is not assignable to `BlobPart` (the `buffer` property is `ArrayBufferLike` which includes `SharedArrayBuffer`).
    - **Fix:** `new File([new Uint8Array(audioBuffer)], 'voiceover.mp3', { type: 'audio/mp3' })`.

23. **`NODE_ENV` is read-only in tests** — `process.env.NODE_ENV = 'test'` throws "Cannot assign to 'NODE_ENV' because it is a read-only property."
    - **Fix:** Use `vi.stubEnv('NODE_ENV', 'test')` in Vitest.

24. **Middleware runs on Edge runtime** — no Node.js APIs, no DB access. The middleware only checks cookie presence; actual session validity is verified by `verifySession()` in Server Components/Actions.
    - **Fix:** Never import `@/lib/db` or `drizzle-orm` in `middleware.ts`. Use Auth.js v5's `auth` function directly as the default export.

25. **esbuild build scripts need approval** — `pnpm-workspace.yaml` must list `esbuild` under `onlyBuiltDependencies` or `pnpm install` skips the postinstall. drizzle-kit and vitest depend on esbuild; without the postinstall, they silently break.
    - **Fix:** Add `esbuild` to the `onlyBuiltDependencies` array in `pnpm-workspace.yaml`.

26. **`pnpm install` warns "Ignored build scripts: protobufjs"** — the `protobufjs` package (transitive via `@aws-sdk/client-s3`) also needs build script approval.
    - **Fix:** Add `protobufjs` to `onlyBuiltDependencies` if the warning appears. Or use `pnpm approve-builds` interactively.

27. **Auth unit tests must mock `next-auth` and `next/navigation`** — jsdom can't load `next/server` (imported transitively by `next-auth`). The test fails with "Cannot find module 'next/server'".
    - **Fix:** `vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))` and `vi.mock('next/navigation', () => ({ redirect: vi.fn() }))`.

28. **Source-reading tests are valid for server-only modules** — some tests read the source file via `readFileSync` to verify structural patterns (auth config, middleware, route handlers) that can't be asserted via rendering in jsdom.
    - **Fix:** This is intentional. Document it in the test file: "Middleware runs on Edge runtime — we test the config structurally rather than executing it."

29. **`is(x, 'table')` from drizzle-orm has wrong signature** — the `is` function expects a class/constructor as the second argument, not a string.
    - **Fix:** Use `isTable(x)` from `drizzle-orm/table` instead of `is(x, 'table')`.

30. **`verifySession()` test: `result.user` is possibly undefined** — the `Session` type from `next-auth` has `user?: User` (optional).
    - **Fix:** Use optional chaining: `result.user?.id` instead of `result.user.id`.

---

## 10. Debugging Guide

### Symptom: Build fails with "Invalid environment variables"

**Root cause:** The Zod env schema is throwing at module load because required vars are missing or malformed.

**Step-by-step:**
1. Check if `.env.local` exists: `ls -la .env.local`
2. If not: `cp .env.example .env.local`
3. Fill in real values (or placeholder values that match the schema's format requirements)
4. Verify the build-context fallback is working: `NODE_ENV=test pnpm build` should succeed even without `.env.local`
5. Check the exact error message — it names the missing/invalid var: `❌ Invalid environment variables: • DATABASE_URL: ...`

### Symptom: Build fails with "Failed to collect page data for /api/auth/[...nextauth]"

**Root cause:** The auth route handler is being prerendered at build time, but `DrizzleAdapter(db)` can't be instantiated without env vars.

**Step-by-step:**
1. Check `src/app/api/auth/[...nextauth]/route.ts` for `export const dynamic = 'force-dynamic';`
2. If missing, add it.
3. Rebuild: `pnpm build`

### Symptom: Build fails with "Unsupported database type (object) in Auth.js Drizzle adapter"

**Root cause:** The `db` object passed to `DrizzleAdapter(db)` is a Proxy, not a real Drizzle client. DrizzleAdapter validates the db object's structure.

**Step-by-step:**
1. Check `src/lib/db/index.ts` — ensure it exports a real `drizzle(queryClient, { schema })` object, not a Proxy.
2. Ensure `postgres(env.DATABASE_URL, { prepare: false })` is called eagerly (the connection isn't established until a query runs, so this is safe).
3. Rebuild.

### Symptom: Tests fail with "Cannot find module 'next/server'"

**Root cause:** jsdom can't load Next.js server-only modules. The test transitively imports `next-auth` which imports `next/server`.

**Step-by-step:**
1. Identify which module is importing `next-auth` (e.g., `@/features/auth/domain/verify-session`)
2. Mock it: `vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))`
3. Mock `next/navigation` if redirect is used: `vi.mock('next/navigation', () => ({ redirect: vi.fn(() => { throw new Error('NEXT_REDIRECT'); }) }))`
4. Re-run the test.

### Symptom: `drizzle-kit generate` errors

**Root cause:** `DATABASE_URL_UNPOOLED` is not set. Drizzle Kit needs the direct (unpooled) Neon connection for DDL operations.

**Step-by-step:**
1. Check `.env.local` for `DATABASE_URL_UNPOOLED`
2. Ensure it uses the direct Neon host (not the `-pooler` host)
3. Run `pnpm drizzle-kit generate`

### Symptom: Inngest function not triggering

**Root cause:** The function isn't registered in `src/lib/inngest/functions.ts`, or the `inngest.send()` call isn't wired.

**Step-by-step:**
1. Check `src/lib/inngest/functions.ts` — ensure the function is in the `functions` array
2. Check that `inngest.send({ name: 'pipeline.started', data: { projectId } })` is called (in `createProjectAction`, this is currently commented out)
3. Run the Inngest dev server: `npx inngest-cli@latest dev`
4. Verify the function appears in the Inngest dashboard

### Symptom: Stripe webhook returns 400 "Invalid signature"

**Root cause:** Wrong `STRIPE_WEBHOOK_SECRET`, or the request body was parsed as JSON before signature verification.

**Step-by-step:**
1. Ensure the webhook handler reads the body as raw text: `const body = await req.text();` (NOT `await req.json()`)
2. Verify `STRIPE_WEBHOOK_SECRET` matches the Stripe Dashboard webhook endpoint's signing secret
3. Test with the Stripe CLI: `stripe trigger checkout.session.completed`

### Symptom: `pnpm install` warns "Ignored build scripts: esbuild"

**Root cause:** `pnpm-workspace.yaml` doesn't approve esbuild's postinstall script.

**Step-by-step:**
1. Open `pnpm-workspace.yaml`
2. Add `esbuild` to the `onlyBuiltDependencies` array
3. Run `pnpm install` again
4. Verify drizzle-kit and vitest work: `pnpm drizzle-kit --version` and `pnpm vitest --version`

### Symptom: Tailwind classes not applying

**Root cause:** Missing `@source` directives or missing `@tailwindcss/postcss` plugin.

**Step-by-step:**
1. Check `src/app/globals.css` has `@source '../components/**/*.{ts,tsx}';` and `@source '../lib/**/*.{ts,tsx}';`
2. Check `postcss.config.mjs` has `'@tailwindcss/postcss': {}` in plugins
3. Restart the dev server: `pnpm dev`

### Symptom: Hydration mismatch console error

**Root cause:** Browser extension (Grammarly) injects attributes into `<body>` before React hydrates.

**Step-by-step:**
1. Check `src/app/layout.tsx` — ensure both `<html>` and `<body>` have `suppressHydrationWarning`
2. If only `<html>` has it, add to `<body>`: `<body ... suppressHydrationWarning>`

---

## 11. Pre-Ship Checklist

Every item must be verified before claiming completion. Run all commands from the project root.

### Quality Gate (mandatory before every commit)

```bash
pnpm format:check   # All files use Prettier code style
pnpm lint           # ESLint zero warnings
pnpm typecheck      # tsc --noEmit zero errors
pnpm test           # Vitest 164 unit tests pass
pnpm build          # Next.js build zero errors
```

**All five must pass.** If any fails, do not commit.

### E2E Tests (before deploy)

```bash
pnpm exec playwright install   # One-time: install browser binaries
pnpm test:e2e                  # 11 E2E tests pass (Chromium)
```

### Production Readiness (before launch)

- [ ] `.env.local` complete with real credentials (not placeholders)
- [ ] `pnpm drizzle-kit generate` succeeded — migration SQL created in `drizzle/`
- [ ] `pnpm drizzle-kit migrate` succeeded — schema applied to Neon
- [ ] `pnpm drizzle-kit studio` opens — all 11 tables visible
- [ ] Google OAuth app configured (redirect URI: `http://localhost:3000/api/auth/callback/google`)
- [ ] Stripe products created (4 tiers: Free/Creator/Pro/Studio) — `PRICE_IDS` updated in `src/lib/stripe/client.ts`
- [ ] Replicate model IDs verified (`SDXL_MODEL`, `SDXL_IPADAPTER_MODEL` in `src/lib/ai/replicate.ts`)
- [ ] R2 buckets created (3: `siv-uploads`, `siv-generated`, `siv-videos`)
- [ ] Inngest app connected — function visible in dashboard
- [ ] Stripe webhook endpoint registered — `STRIPE_WEBHOOK_SECRET` set
- [ ] Legal pages implemented (`/privacy`, `/terms`) — **mandatory for launch**
- [ ] Content moderation tested — prohibited story input is blocked
- [ ] AI pipeline end-to-end test — sign up → paste story → video generates → download
- [ ] Lighthouse ≥95 on marketing page (Performance, Accessibility, Best Practices, SEO)
- [ ] Visual verification — marketing page matches `storyintovideo.com` at 1440×900

### Code Review Checklist

- [ ] No `any` — use `unknown` and narrow with Zod or type guards
- [ ] No `process.env.*` — use `env` from `@/lib/env`
- [ ] No try/catch around `verifySession()`
- [ ] No DB access in components — use `queries.ts` boundary
- [ ] No DB access in middleware — Edge runtime constraint
- [ ] No R2 buckets made public — use signed URLs
- [ ] No content skipped on moderation — every story input moderated
- [ ] No `force-static` on app routes — only marketing page
- [ ] No CDN links — all assets self-hosted
- [ ] No default exports for components — use named exports
- [ ] No camelCase keyframes — kebab-case only
- [ ] No Framer Motion / GSAP — CSS-only animation
- [ ] All Server Actions start with `verifySession()`
- [ ] All API routes use `auth()` (returns null → 401 JSON), not `verifySession()`
- [ ] All inputs Zod-validated at the boundary

---

## 12. Lessons Learnt & How to Avoid Them

### Marketing Layer (inherited from clone)

1. **`suppressHydrationWarning` on `<body>`** — Browser extensions inject attributes before React hydrates. `<html>` alone is insufficient. **Avoid:** Always add `suppressHydrationWarning` to both `<html>` and `<body>` in the root layout.

2. **Workflow is `'use client'`** — Uses `useState` for video loading choreography. Don't assume server components for "mostly static" sections. **Avoid:** Check for `useState`/`useEffect`/browser APIs before deciding server vs. client.

3. **Test counts drift from plans** — The MEP planned 6+3 tests; actual is 164+11. **Avoid:** Always verify counts against `pnpm test` output, not documentation.

4. **File structure evolves** — `components/primitives/`, `lib/hooks/`, `lib/data/` were created during build. **Avoid:** Update docs as you build; don't assume the initial structure is final.

5. **Playwright needs separate install** — `pnpm install` doesn't install browser binaries. **Avoid:** Run `pnpm exec playwright install` after every fresh clone.

### Production App Layer (new)

6. **Zod `.url()` rejects `postgresql://`** — discovered when the env module threw at build time. **Avoid:** Use `.refine()` for non-standard URL schemes; don't assume `.url()` accepts all valid URLs.

7. **Env validation needs build-context fallback** — without it, `next build` fails during page-data collection. **Avoid:** Always add a build-context fallback (`NEXT_PHASE === 'phase-production-build'` or `NODE_ENV === 'test'`) that returns placeholders.

8. **`postgres()` defers connection until first query** — allows eager db instantiation without breaking the build. **Avoid:** Don't use a Proxy for lazy db; use `postgres()` which is naturally lazy.

9. **DrizzleAdapter validates db object structure** — a Proxy was rejected. **Avoid:** Pass a real Drizzle client to `DrizzleAdapter(db)`.

10. **Inngest v4 changed `createFunction` signature** — trigger is now in config object. **Avoid:** Check the installed version's API before copying examples from docs.

11. **Auth unit tests must mock `next-auth` + `next/navigation`** — jsdom can't load `next/server`. **Avoid:** Always mock Next.js server-only modules in jsdom tests.

12. **Source-reading tests are valid** for server-only modules. **Avoid:** Don't force all tests to render components; some things can only be verified by reading source.

13. **Stripe SDK v22 camelCase breaking change** — `currentPeriodEnd` not `current_period_end`. **Avoid:** Check SDK version's type definitions; use dual-cast fallbacks for cross-version compatibility.

14. **ElevenLabs returns `Readable`, not `ReadableStream`** — duck-type the input. **Avoid:** Don't assume SDKs return web-standard types; Node SDKs often return Node streams.

15. **TDD with mocked AI providers works well** — all 6 pipeline domain functions are fully unit-tested. **Avoid:** Never make real AI API calls in tests; always mock the SDK.

---

## 13. Pitfalls to Avoid

- **Do not add `tailwind.config.ts`** — all tokens belong in `globals.css` `@theme`
- **Do not use `next/font/google` for Outfit** — it can't serve weight 820
- **Do not use Framer Motion or GSAP** — all animation is CSS-only
- **Do not use camelCase keyframes** — kebab-case is the modern convention
- **Do not read `process.env.*` directly** — use the Zod-validated `env` module
- **Do not wrap `verifySession()` in try/catch** — it throws `NEXT_REDIRECT` which must propagate
- **Do not put DB access in components** — use the `queries.ts` boundary
- **Do not put DB access in middleware** — middleware runs on Edge runtime
- **Do not make R2 buckets public** — use signed URLs
- **Do not skip content moderation** — every story input must be moderated (ADR-011)
- **Do not use `force-static` on app routes** — only the marketing page can be static
- **Do not use `any`** — ESLint will error. Use `unknown` or proper types
- **Do not add CDN links** — all assets are self-hosted
- **Do not use default exports for components** — use named exports
- **Do not skip the verification chain** — `pnpm lint && pnpm typecheck && pnpm test && pnpm build`
- **Do not use `db push` in production** — always `drizzle-kit generate` + `migrate`
- **Do not use `is(x, 'table')` from drizzle-orm** — use `isTable(x)` from `drizzle-orm/table`
- **Do not use `.url()` for postgres URLs** — use `.refine()` with a scheme check
- **Do not use `new File([buffer], ...)` directly** — wrap with `new Uint8Array(buffer)`
- **Do not assign to `process.env.NODE_ENV`** — use `vi.stubEnv('NODE_ENV', 'test')`
- **Do not add purple anywhere except the example-card hover gradient** — the singular purple exception
- **Do not use Tailwind's `amber-400` for the primary accent** — use `--color-primary: #febf00`
- **Do not use pure `#000` for the background** — use `#020202` (warm-neutral near-black)
- **Do not forget `suppressHydrationWarning` on `<body>`** — Grammarly injects attributes
- **Do not forget `export const dynamic = 'force-dynamic'` on API routes** — prevents prerender failures
- **Do not forget to approve esbuild builds in `pnpm-workspace.yaml`** — drizzle-kit/vitest depend on it

---

## 14. Best Practices

- **5-layer architecture** — middleware → app → features → domain → lib. Lower layers never import from higher layers.
- **Auth-first Server Actions** — every action starts with `verifySession()` before any logic.
- **`queries.ts` boundary** — all DB access through feature-level queries files.
- **Domain isolation** — pure functions in `src/features/*/domain/`, no Next.js or DB runtime imports.
- **Zod at boundaries** — validate every Server Action input and API route body with Zod schemas.
- **TDD (Red-Green-Refactor)** — write the failing test first, then the minimal code to pass, then refactor. One commit per cycle.
- **CSS-only animation** — `@keyframes` in `globals.css`, `IntersectionObserver` for scroll reveal.
- **Self-hosted fonts** — `next/font` for everything, no Google Fonts CDN.
- **Signed URLs for storage** — R2 buckets are private; access via 1-hour signed URLs.
- **Idempotent webhooks** — check event ID in `usageEvents` before processing Stripe webhooks.
- **Per-step retries** — Inngest handles retries for each pipeline step independently.
- **Credit metering in transactions** — `debitCredits` uses `db.transaction()` with `FOR UPDATE` row lock.
- **Content moderation on all inputs** — OpenAI Moderation API before the pipeline starts.
- **`prefers-reduced-motion` support** — global CSS override + `useReducedMotion` hook for JS decisions.
- **Focus-visible rings** — `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400` everywhere.
- **Named function exports** — `export function ComponentName()`, never default exports.
- **`interface` for object shapes** — `type` for unions/intersections only.
- **Explicit `type` imports** — `import type { X }` enforced by ESLint.
- **`cn()` utility** — `clsx` + `tailwind-merge` for conditional class merging.
- **JSDoc on every component** — the "Engineered Soul" pattern: document purpose, layers, interactions.

---

## 15. Coding Patterns

### Auth-First Server Action Pattern

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { verifySession } from '@/features/auth/domain/verify-session';
import { moderateContent } from '@/features/pipeline/domain/moderate-content';
import { debitCredits } from '@/features/billing/queries';
import { CREDIT_COSTS } from '@/features/billing/domain/tier-limits';
import { db } from '@/lib/db';
import { projects } from '@/lib/db/schema';

const InputSchema = z.object({
  story: z.string().min(100).max(5000),
  style: z.enum(['ghibli', 'oil-painting', 'anime', 'realistic', 'cyberpunk', 'watercolor', 'comic']),
  aspectRatio: z.enum(['portrait', 'landscape']),
});

export async function createProjectAction(input: z.infer<typeof InputSchema>) {
  // 1. AUTH FIRST
  const session = await verifySession({ redirectTo: '/create' });
  const userId = session.user?.id;
  if (!userId) return { success: false, error: 'Not authenticated', code: 'UNAUTHORIZED' as const };

  // 2. ZOD VALIDATE
  const parsed = InputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message, code: 'VALIDATION' as const };

  // 3. CONTENT MODERATION
  const moderation = await moderateContent(parsed.data.story);
  if (moderation.flagged) return { success: false, error: 'Flagged', code: 'FLAGGED' as const };

  // 4. CREDITS
  try {
    await debitCredits(userId, CREDIT_COSTS.analysis, 'analysis');
  } catch (err) {
    if (err instanceof Error && err.name === 'InsufficientCreditsError') {
      return { success: false, error: err.message, code: 'INSUFFICIENT_CREDITS' as const };
    }
    throw err;
  }

  // 5. DB INSERT
  const [project] = await db.insert(projects).values({ ... }).returning();

  // 6. REVALIDATE + REDIRECT
  revalidatePath('/dashboard');
  redirect(`/projects/${project!.id}`);
}
```

### `verifySession()` DAL Pattern

```typescript
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import type { Session } from 'next-auth';

export async function verifySession(options?: { redirectTo?: string }): Promise<Session> {
  const session = await auth();
  if (!session) {
    const callbackUrl = options?.redirectTo ?? '/';
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }
  return session as Session;
}
```

### Suspense + Server Component Pattern

```tsx
function Skeleton() { return <div className="h-48 animate-pulse rounded-2xl bg-white/[0.02]" />; }

async function ProjectList() {
  const session = await verifySession({ redirectTo: '/dashboard' });
  const projects = await getUserProjects(session.user.id);
  if (projects.length === 0) return <EmptyState ... />;
  return <ProjectGrid projects={projects} />;
}

export default function DashboardPage() {
  return (
    <main>
      <Suspense fallback={<Skeleton />}>
        <ProjectList />
      </Suspense>
    </main>
  );
}
```

### Scroll Reveal Pattern (data-attribute driven)

```tsx
// ScrollReveal primitive
'use client';
export function ScrollReveal({ children, delay = 0 }) {
  const { ref, revealed } = useReveal<HTMLElement>();
  return (
    <div
      ref={ref}
      data-reveal=""
      data-revealed={revealed ? 'true' : 'false'}
      style={{ '--reveal-delay': `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
```

```css
/* globals.css */
[data-reveal] { opacity: 0; transform: translateY(20px); transition: opacity 0.6s ease-out, transform 0.6s ease-out; transition-delay: var(--reveal-delay, 0s); }
[data-reveal][data-revealed='true'] { opacity: 1; transform: translateY(0); }
```

### Radix Accordion with CSS Grid Animation

```tsx
// accordion.tsx (shadcn primitive)
<AccordionPrimitive.Content className="radix-accordion-content">
  <div className="pt-0 pb-4">{children}</div>
</AccordionPrimitive.Content>
```

```css
/* globals.css */
.radix-accordion-content { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 300ms ease-out; }
.radix-accordion-content[data-state='open'] { grid-template-rows: 1fr; }
.radix-accordion-content > div { overflow: hidden; }
```

### Credit Metering with Transaction

```typescript
export async function debitCredits(userId, amount, operationType, projectId?) {
  await db.transaction(async (tx) => {
    const [sub] = await tx.select().from(subscriptions)
      .where(eq(subscriptions.userId, userId)).for('update').limit(1); // Row lock
    if (!sub) throw new Error(`No subscription for ${userId}`);
    if (sub.creditsRemaining < amount) throw new InsufficientCreditsError(amount, sub.creditsRemaining);
    await tx.update(subscriptions).set({ creditsRemaining: sub.creditsRemaining - amount }).where(eq(subscriptions.id, sub.id));
    await tx.insert(usageEvents).values({ userId, projectId, type: operationType, cost: amount });
  });
}
```

---

## 16. Coding Anti-Patterns

- **`any` type** — use `unknown` and narrow. ESLint enforces `@typescript-eslint/no-explicit-any: error`.
- **`process.env.*` in app code** — use `env` from `@/lib/env`. The Zod schema validates at module load.
- **try/catch around `verifySession()`** — catches `NEXT_REDIRECT` and silently swallows the redirect.
- **DB calls in components** — use `queries.ts` boundary. Components should never import `db`.
- **DB calls in middleware** — Edge runtime can't reach Postgres. Use cookie checks only.
- **Public R2 buckets** — always use signed URLs. Never make buckets public.
- **Skipped content moderation** — every story input must pass `moderateContent()` before the pipeline starts.
- **`force-static` on app routes** — only the marketing page (`/`) can be static. App routes need dynamic rendering for auth.
- **CDN links** — all assets (fonts, images, videos) must be self-hosted. No Google Fonts CDN.
- **Default exports for components** — use named exports: `export function Hero()`.
- **camelCase keyframes** — use kebab-case: `fade-in-up`, not `fadeInUp`.
- **Framer Motion / GSAP** — CSS-only animation. `@keyframes` + `IntersectionObserver`.
- **`tailwind.config.ts`** — Tailwind v4 CSS-first. All tokens in `globals.css` `@theme`.
- **`next/font/google` for Outfit** — can't serve weight 820. Use `next/font/local`.
- **Tailwind `amber-400` for primary** — use `--color-primary: #febf00` (different color).
- **Pure `#000` background** — use `#020202` (warm-neutral near-black).
- **Missing `suppressHydrationWarning`** — add to both `<html>` and `<body>`.
- **Missing `export const dynamic = 'force-dynamic'` on API routes** — causes prerender failures.
- **`db push` in production** — always `drizzle-kit generate` + `migrate` (reviewable SQL migrations).
- **`is(x, 'table')`** — use `isTable(x)` from `drizzle-orm/table`.
- **`.url()` for postgres URLs** — use `.refine()` with scheme check.
- **`new File([buffer], ...)`** — wrap with `new Uint8Array(buffer)`.
- **`process.env.NODE_ENV = 'test'`** — use `vi.stubEnv('NODE_ENV', 'test')`.

---

## 17. Responsive Breakpoint Reference

Tailwind v4 default breakpoints (no custom config):

| Token | Min Width | Target Device | Marketing Usage |
|---|---|---|---|
| (default) | 0 | Mobile portrait 375px | Single column, hamburger nav, stacked sections |
| `sm` | 640px | Mobile landscape | Desktop nav links appear (`hidden sm:flex`), hero `<br>` appears (`hidden sm:block`) |
| `md` | 768px | Tablet portrait | 2-column grids (features, testimonials), larger H2 (`md:text-6xl`) |
| `lg` | 1024px | Tablet landscape / laptop | 4-column features grid, 3-column testimonials, alternating workflow rows (`lg:grid-cols-2`) |
| `xl` | 1280px | Desktop | Matches `max-w-7xl` container (80rem = 1280px) |
| `2xl` | 1536px | Large desktop | No specific usage in current codebase |

### Key Responsive Class Patterns

```tsx
// Hero H1 — fluid from 36px to 72px
className="text-4xl sm:text-5xl md:text-6xl lg:text-[4.5rem]"

// Section H2 — fluid from 36px to 60px
className="text-4xl lg:text-6xl"

// Container max width
className="mx-auto max-w-7xl"  // 1280px

// Desktop nav links (hidden on mobile)
className="hidden items-center gap-1 sm:flex"

// Mobile hamburger (hidden on desktop)
className="sm:hidden"

// Workflow alternating rows
className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12"

// Features grid responsive columns
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
```

---

## 18. Z-Index Layer Map

The project uses a deliberate z-index hierarchy. Values are verified from the actual source:

| z-index | Element | File | Purpose |
|---|---|---|---|
| `z-50` | Navbar `<header>` | `navbar.tsx:39` | Fixed nav overlay — highest visual priority |
| `z-50` | Sheet overlay + content | `sheet.tsx:29,53` | Mobile nav drawer (Radix Dialog) — overlays navbar |
| `z-50` | DropdownMenu content | `dropdown-menu.tsx:30,200` | Language switcher dropdown |
| `z-50` | Skip-to-content link (on focus) | `layout.tsx:67` | Accessibility — appears on `focus:not-sr-only` |
| `z-10` | Hero content layer | `hero.tsx:62,166` | Above the background video (z-0) |
| `z-10` | Final CTA content | `final-cta.tsx:40` | Above the decorative dot-grid/halo layers |
| `z-0` | Hero background video | `hero.tsx:38` | Behind the content layer |
| `z-0` | Hero bottom fade | `hero.tsx:183` | Masks the seam into the next section |
| `-z-10` | Examples hover glow | `examples.tsx:87` | Behind the card body, visible as a blur glow |

### Z-Index Rules

- **`z-50`** is reserved for overlays that must appear above everything: navbar, Sheet, DropdownMenu, skip-to-content.
- **`z-10`** is for content that must appear above background layers but below overlays.
- **`z-0`** is for background layers (hero video, fades).
- **`-z-10`** is for decorative glows that sit behind the card body.
- **Never use `z-50` for content** — it will overlap the navbar and Sheet.

---

## 19. Color Reference (Complete)

### Primary Palette (from `@theme` block in `globals.css`)

| Token | Hex | Tailwind Equivalent | Usage |
|---|---|---|---|
| `--color-background` | `#020202` | (custom, NOT `zinc-950` = `#09090b`) | Page background (near-black, warm-neutral) |
| `--color-foreground` | `#f8f8f8` | `zinc-50` | Default foreground text |
| `--color-card` | `#060607` | (custom, close to `zinc-950`) | Card surfaces |
| `--color-card-foreground` | `#f8f8f8` | `zinc-50` | Text on card |
| `--color-popover` | `#0b0b0d` | (custom) | Popover/menu surface |
| `--color-popover-foreground` | `#f8f8f8` | `zinc-50` | Text on popover |
| `--color-primary` | `#febf00` | (custom, NOT `amber-400` = `#fbbf24`) | CTAs, active states, focus rings, accents |
| `--color-primary-foreground` | `#020202` | (custom) | Text on primary (near-black) |
| `--color-secondary` | `#111114` | (custom, close to `zinc-900`) | Secondary surface |
| `--color-secondary-foreground` | `#f8f8f8` | `zinc-50` | Text on secondary |
| `--color-muted` | `#1a1a1d` | (custom) | Muted surface (chips, inactive states) |
| `--color-muted-foreground` | `#8e8e95` | (custom, close to `zinc-400` = `#a1a1aa`) | Muted text |
| `--color-accent` | `#febf00` | (same as primary — aliased) | Accent (same as primary) |
| `--color-accent-foreground` | `#020202` | (custom) | Text on accent |
| `--color-destructive` | `#ff2d39` | (custom, close to `red-500`) | Error / destructive |
| `--color-destructive-foreground` | `#f8f8f8` | `zinc-50` | Text on destructive |
| `--color-border` | `#1a1a1d` | (custom, close to `zinc-800` = `#27272a`) | Default border |
| `--color-input` | `#0b0b0d` | (custom) | Input background |
| `--color-ring` | `#febf0080` | (custom, amber at 50% alpha) | Focus ring (amber at 50% alpha) |

### Chart Palette (reserved for future dashboard)

| Token | Hex | Usage |
|---|---|---|
| `--color-chart-1` | `#febf00` | Amber (primary) |
| `--color-chart-2` | `#00aa6f` | Green |
| `--color-chart-3` | `#8d92f9` | Light purple |
| `--color-chart-4` | `#f14d4c` | Red |
| `--color-chart-5` | `#7bc27e` | Light green |

### Zinc Scale (used via Tailwind utilities, not `@theme`)

| Class | Hex | Usage in Project |
|---|---|---|
| `zinc-950` | `#09090b` | Hero section bg, workflow section bg, FAQ bg, use-cases bg, dashboard bg |
| `zinc-900` | `#18181b` | Card backgrounds (`bg-zinc-900`), video containers |
| `zinc-800` | `#27272a` | Hairline borders in features grid (`border-neutral-800`) |
| `zinc-600` | `#52525b` | Inactive ratio toggle text, character counter default |
| `zinc-500` | `#71717a` | Footer copyright, bottom nav links |
| `zinc-400` | `#a1a1aa` | Body text, secondary descriptions |
| `zinc-300` | `#d4d4d8` | Body text (via `text-zinc-300/80`), testimonial quotes |

### Amber Scale (Tailwind utilities)

| Class | Hex | Usage |
|---|---|---|
| `amber-300` | `#fcd34d` | Hero CTA text (`text-amber-300`), hover states |
| `amber-400` | `#fbbf24` | Focus rings, active states, CTA hover (NOT the primary `#febf00`) |
| `amber-400/10` | `rgba(251,191,36,0.1)` | Eyebrow badge bg, icon container bg |
| `amber-400/20` | `rgba(251,191,36,0.2)` | Icon container border, hover border |
| `amber-400/30` | `rgba(251,191,36,0.3)` | Glass input focus border |

### Special Colors

| Color | Hex/Value | Usage | File |
|---|---|---|---|
| Yellow→purple gradient | `from-yellow-500 to-purple-500` | Example card hover glow (the ONLY purple) | `examples.tsx:87` |
| Amber gradient (avatar) | `linear-gradient(to bottom right, #fbbf24, #d97706)` | Testimonial initials avatar | `testimonials.tsx:39` |
| Radial amber glow (hero) | `radial-gradient(rgba(251,191,36,0.12),rgba(0,0,0,0) 65%)` | Hero ambient glow | `hero.tsx:56` |
| Dot-grid (final CTA) | `radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)` | Final CTA background pattern | `final-cta.tsx:18` |

### Shadows

| Token | Value | Usage |
|---|---|---|
| `--shadow-hero-input` | `0 20px 80px rgba(0, 0, 0, 0.6)` | Glass input widget in Hero |
| `--shadow-eyebrow-glow` | `0 0 30px rgba(234, 179, 8, 0.1)` | Eyebrow badge ambient glow |
| `--shadow-cta-glow` | `0 0 40px rgba(251, 191, 36, 0.3)` | CTA button glow |

---

## 20. The Complete TypeScript Interface Reference

All 12 interfaces defined in `src/types/index.ts`. These cover the marketing layer. Production app types (Drizzle schema, AI pipeline, billing) are defined inline in their respective schema/domain files.

### `NavLink`

```typescript
/** Navigation link in the Navbar (desktop + mobile Sheet). */
export interface NavLink {
  label: string;
  href: string;
}
```

### `StoryExample`

```typescript
/** Story example chip in the Hero — clicking populates the textarea. */
export interface StoryExample {
  label: string;
  /** The multi-paragraph seed text injected into the textarea on click. */
  seed: string;
}
```

### `AspectRatio`

```typescript
/** Aspect ratio toggle button in the Hero (9:16 portrait or 16:9 landscape). */
export interface AspectRatio {
  label: '9:16' | '16:9';
  value: 'portrait' | 'landscape';
}
```

### `ExampleCard`

```typescript
/** Portrait example card in the Examples carousel. */
export interface ExampleCard {
  id: string;
  title: string;
  /** Style tag shown below the title (e.g., "Anime · Romance"). */
  styleTag: string;
  /** Path to the 9:16 WebP thumbnail in /public/examples/. */
  thumbnail: string;
  href: string;
}
```

### `WorkflowStep`

```typescript
/** One of the 4 alternating media/text rows in the Workflow section. */
export interface WorkflowStep {
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
```

### `Feature`

```typescript
/** One of the 8 items in the Features 4×2 hairline grid. */
export interface Feature {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
}
```

### `Testimonial`

```typescript
/** One of the 6 testimonial cards in the Testimonials 3×2 grid. */
export interface Testimonial {
  id: string;
  quote: string;
  authorName: string;
  authorRole: string;
  /** 2-letter initials rendered in the amber gradient avatar (e.g., "SK"). */
  initials: string;
}
```

### `UseCase`

```typescript
/** One of the 4 use case cards in the UseCases 2×2 grid. */
export interface UseCase {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
}
```

### `FAQItem`

```typescript
/** One of the 6 items in the FAQ Radix Accordion. */
export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}
```

### `FooterLink`

```typescript
/** A single link in the Footer. */
export interface FooterLink {
  label: string;
  href: string;
}
```

### `FooterColumn`

```typescript
/** A titled column of links in the Footer. */
export interface FooterColumn {
  title: string;
  links: FooterLink[];
}
```

### `StyleChip`

```typescript
/** A chip in the Hero style tags marquee. */
export interface StyleChip {
  label: string;
  /** Optional smaller sublabel (only "Cyberpunk" uses this: "Futuristic neon"). */
  sublabel?: string;
}
```

### Production App Types (defined inline, not in `types/index.ts`)

The production app layer defines types inline in their respective files:

- **Drizzle schema types:** `src/lib/db/schema/{auth,projects,media,billing}.ts` — each `pgTable()` infers its own type. Use `typeof users.$inferSelect` / `typeof users.$inferInsert` for select/insert types.
- **AI pipeline types:** `src/features/pipeline/domain/analyze-story.ts` — `AnalyzedStory`, `AnalyzedCharacter`, `AnalyzedScene` (Zod-inferred).
- **Billing types:** `src/features/billing/domain/tier-limits.ts` — `Plan`, `TierLimit`, `CreditOperation`.
- **Auth types:** `next-auth`'s `Session` type (augmented with `user.id` via the session callback).
- **Server Action result types:** `CreateProjectResult` (discriminated union) in `src/features/projects/actions.ts`.

---

*End of SKILL.md. This document is the single-source engineering reference for the StoryIntoVideo codebase. Every section is grounded in actual code. When in doubt, consult `CLAUDE.md` as the operational source of truth, or read the source files directly.*
