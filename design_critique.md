## StoryIntoVideo SKILL.md — Full Design Critique

### 🔴 Critical Errors

**1. Stripe SDK v22 camelCase claim is factually wrong.**

Section 9, item 20 states:

> "Stripe SDK v22+ uses camelCase: `subscription.current_period_end` is now `subscription.currentPeriodEnd`. The webhook handler uses a fallback cast to support both."

This is incorrect in every dimension. The Stripe Node SDK has always mirrored the Stripe REST API, which uses snake_case consistently — and still does. `subscription.currentPeriodEnd` has never existed. What actually happened was a Stripe API-level change in the "Basil" API version (2025-03-31): `current_period_end` and `current_period_start` were **removed** from the top-level subscription object and moved down to subscription items. The Stripe v22 SDK migration guide covers TypeScript type refactoring (e.g., `Stripe.StripeContext` → `Stripe.StripeContextType`) and ESM module changes — not any camelCase conversion.

Any code using `subscription.currentPeriodEnd` would return `undefined` silently, since the field doesn't exist. A webhook handler implementing a "fallback cast to support both" is defending against a problem that doesn't exist, while missing the actual problem (the field was removed). This needs a complete correction: update to read from `subscription.items.data[0].current_period_end` (or equivalent) per the Basil API migration.

---

**2. Vercel `maxDuration = 900` is incorrect for Vercel Pro.**

Section 12 (item 37) and the debugging guide state: "Raising `maxDuration` from 300 → 900 covers Vercel Pro. Vercel Hobby caps at 300s."

With Fluid compute enabled (now the default for all plans), the maximum duration for Vercel Pro and Enterprise is 800 seconds (generally available), with an extended 1800-second maximum in beta. Setting `export const maxDuration = 900` would exceed the GA limit of 800s on Vercel Pro and would only work under the extended beta — not a stable configuration to document as a fix. The actual current limits are:

- Hobby: 300s (with Fluid compute)
- Pro/Enterprise: 800s GA, 1800s beta

The claim "Vercel Pro cap = 900s" is stale. The value in the code should be `800` (or `300` if targeting Hobby compatibility), and the text should be updated to reflect the current Fluid compute limits.

---

### 🟠 Significant Issues

**3. `pnpm-workspace.yaml` mixes deprecated and current syntax with inconsistent package lists.**

The documented `pnpm-workspace.yaml` includes both:

```yaml
allowBuilds:
  '@ffmpeg-installer/linux-x64': true
  esbuild: true
  protobufjs: true
  sharp: true
  unrs-resolver: true

onlyBuiltDependencies:
  - sharp
  - unrs-resolver
  - esbuild
```

`allowBuilds` was introduced in pnpm 10.26 as the replacement for `onlyBuiltDependencies` and `ignoredBuiltDependencies`. In pnpm 11, `onlyBuiltDependencies`, `onlyBuiltDependenciesFile`, `neverBuiltDependencies`, `ignoredBuiltDependencies`, and `ignoreDepScripts` were all removed and replaced by `allowBuilds`.

Having both in the same file is contradictory. The package lists also don't match: `allowBuilds` lists `@ffmpeg-installer/linux-x64` and `protobufjs` which don't appear in `onlyBuiltDependencies`. With pnpm 11 (which the engine requirement `"pnpm": ">=9.0.0"` permits), `onlyBuiltDependencies` is simply ignored — meaning `sharp`, `unrs-resolver`, and `esbuild` are covered by both (redundant), but `@ffmpeg-installer/linux-x64` and `protobufjs` are only in `allowBuilds`. The skill should pick one syntax and be consistent. Given the stack targets pnpm 9+, it should use only `onlyBuiltDependencies` for pnpm 9 compatibility, or update the engine requirement to `"pnpm": ">=10.26.0"` and use only `allowBuilds`.

**4. The `@ffmpeg-installer/linux-x64: true` entry in `allowBuilds` contradicts the removal note.**

The skill explicitly states: "`@ffmpeg-installer/ffmpeg` was removed (Turbopack-incompatible). Replaced with system FFmpeg binary." Yet `@ffmpeg-installer/linux-x64` appears in `allowBuilds`. If the package was removed from `package.json`, there's nothing to approve a build script for. This is either a stale artifact from a prior draft or an error.

**5. Zod v4's `.url()` no longer rejects `postgresql://`.**

Lessons Learned item 6 and Anti-Patterns item 15 state: "Zod `.url()` rejects `postgresql://` — Use `.refine()` with a postgres scheme check." This was true for Zod v3, which used regex-based URL validation. In Zod v4, URL validation now happens using the `new URL()` constructor, which is far more robust than the old regular expression approach. The `URL` constructor accepts any scheme including `postgresql://`, so `.url()` in Zod v4 would happily pass a Postgres connection string. The documented `.refine()` workaround is now an unnecessary complication for a Zod v4 project. This entry should be removed or updated.

**6. React security vulnerability not acknowledged.**

The skill pins `react: ^19.2.0` and `react-dom: ^19.2.0`. CVE-2025-55182 is a critical RCE vulnerability affecting React 19.0.0 through 19.2.2 that is being actively exploited. The patched version is 19.2.3+. The `^19.2.0` range resolves to 19.2.0, 19.2.1, or 19.2.2 on a fresh install — all vulnerable. The version should be `^19.2.3` (or higher). Notably, for Next.js specifically, the fix comes through the Next.js version (16.0.10+), but any project cloning this skill referencing React directly should be on 19.2.3+.

---

### 🟡 Moderate Issues

**7. `animation-duration: 0.01ms` explanation is slightly inaccurate.**

Section 8 states: "`animation-duration: 0.01ms` (NOT `0ms`) — some browsers treat `0ms` as 'use default'." The actual reason for choosing `0.01ms` over `0ms` is that some browsers consider `0ms` a falsy/null value, but more importantly it preserves `animationend` events, so JavaScript logic that listens for animation completion continues to fire. The "use default" framing is imprecise — browsers don't reset to a default; rather, the event dispatch behavior differs. The effect of `0ms` is essentially instantaneous anyway, so the practical difference is the event preservation. This is a minor accuracy issue but could mislead someone trying to understand why.

**8. Vercel Hobby SSE reconnect framing needs updating.**

Related to issue #2: the SSE reconnect rationale ("handles Vercel Hobby's 300s cap") is still valid since Hobby caps at 300s, but the framing that "raising to 900 covers Pro" is wrong. With current limits, the correct framing is: "raising `maxDuration` to 800 (or 1800 under beta) covers Pro/Enterprise; the client-side reconnect handles Hobby's 300s cap gracefully."

**9. `next-auth: 5.0.0-beta.31` is a pinned older beta.**

Auth.js v5 has had many additional beta releases. Pinning to `5.0.0-beta.31` is a deliberately conservative choice (valid for stability), but the skill doesn't note this as a deliberate pin with awareness of newer betas. Any developer following this skill who runs `pnpm install` from scratch would get exactly this version — which may have known bugs fixed in later betas. Worth a comment.

---

### 🟢 Minor Issues and Observations

**10. Tailwind v4 `@source` directives are likely unnecessary.**

The globals.css includes explicit `@source` directives for `../components/**/*.{ts,tsx}` and `../lib/**/*.{ts,tsx}`. Tailwind v4's automatic content detection handles these paths without explicit `@source` entries, since they're typical project directories. The skill describes these as "Tailwind v4 best practice" but they're actually optional and their omission is fine. Keeping them is harmless but may set a misleading precedent for newer v4 projects.

**11. Vitest v4 mock module behavior changed subtly.**

In Vitest v4, `vi.restoreAllMocks` no longer resets the state of spies and only restores spies created manually with `vi.spyOn`; automocks are no longer affected. The skill's anti-pattern examples are correct but don't document this Vitest v4 behavioral shift, which could affect tests that relied on `restoreAllMocks` resetting automock state.

**12. Drizzle ORM version currency.**

`drizzle-orm: ^0.45.2` and `drizzle-kit: ^0.31.10` look plausible for a late 2025/early 2026 project, though Drizzle has been versioning rapidly. These are unverified but appear within the right range.

**13. WCAG AAA contrast claim is stated as fact but not tested.**

Section 8 claims "zinc-300 on zinc-950 = 12.6:1 (WCAG AAA)." While this seems plausible (12.6:1 far exceeds the 7:1 AAA threshold), the claim should cite a verified source or note it was measured with a specific tool. More importantly, claiming "WCAG AAA" applies to the whole site when some text uses `text-zinc-400` (listed as 8.4:1 — still above AAA 7:1 but closer to the edge) and some uses `text-muted-foreground: #8e8e95` would need separate verification. The claim as written overstates the blanket guarantee.

**14. SSE `maxDuration` export missing from document.**

The Debugging Guide says to check `grep maxDuration src/app/api/projects/[id]/progress/route.ts`. But the CI workflow doesn't run E2E tests, and the `maxDuration` value is buried in a single route file. A validation matrix entry explicitly checking that `maxDuration` is set to the correct value (and correctly flagging the current 900 → should be 800) would strengthen the pre-ship checklist.

---

### ✅ What the Skill Gets Demonstrably Right

For balance, a number of complex, non-obvious technical claims are validated by research:

Next.js 16 introduced `proxy.ts` as a replacement for `middleware.ts`, and the skill correctly documents this rename and the new exported function name. Tailwind v4 moved to CSS-first `@theme` configuration eliminating `tailwind.config.js` — the entire design system section is accurate. Defining `@keyframes` inside `@theme` is the documented Tailwind v4 approach for tying keyframes to `--animate-*` variables. The `@utility` directive is correctly characterized. Inngest v4 moved triggers into the config object of `createFunction` — accurately documented. Auth.js v5 `trustHost: true` causes the library to trust `X-Forwarded-Host` headers from a proxy — the P0 outage analysis is sound. The `vi.hoisted()` Vitest pattern, the `vi.fn()` constructor issue, and the `.test.tsx` extension requirement are all confirmed correct. The `0.01ms` practice is an established accessibility pattern.

---

### Summary Table

| # | Severity | Issue |
|---|---|---|
| 1 | 🔴 Critical | Stripe SDK v22 camelCase claim — completely wrong; field was removed, not renamed |
| 2 | 🔴 Critical | `maxDuration = 900` incorrect for Vercel Pro (GA limit is 800s, not 900s) |
| 3 | 🟠 Significant | `pnpm-workspace.yaml` has both deprecated and new build-approval syntax with inconsistent lists |
| 4 | 🟠 Significant | `@ffmpeg-installer/linux-x64` in `allowBuilds` after package removal |
| 5 | 🟠 Significant | Zod v4 `.url()` now accepts `postgresql://`; the `.refine()` workaround is obsolete |
| 6 | 🟠 Significant | React `^19.2.0` allows CVE-2025-55182 (RCE) — should be `^19.2.3` |
| 7 | 🟡 Moderate | `0.01ms` rationale slightly wrong (event preservation, not "use default") |
| 8 | 🟡 Moderate | Vercel SSE reconnect framing still references stale 900s Pro claim |
| 9 | 🟡 Moderate | `next-auth: 5.0.0-beta.31` is an old beta with no note about intentional pinning |
| 10 | 🟢 Minor | Explicit `@source` directives unnecessary in Tailwind v4 auto-detection |
| 11 | 🟢 Minor | Vitest v4 automock reset behavior change undocumented |
| 12 | 🟢 Minor | WCAG AAA blanket claim unverified for all color combinations |

https://claude.ai/share/7d397bdd-584b-4276-a8da-848153d42114 
