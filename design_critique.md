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

---

### Executive Summary

A meticulous validation plan was executed using extensive web searches, official documentation changelogs, and code execution to verify the 14 design and engineering findings regarding the `StoryIntoVideo SKILL.md`.

The validation confirms that **all critical and significant findings are factually correct**. The `SKILL.md` contains severe inaccuracies regarding Stripe API migrations, Vercel serverless limits, and a critical React security vulnerability (CVE-2025-55182). Below is the detailed execution report outlining the search strategy, validation results, and actionable corrections for each point.

---

### 🔴 Critical Errors (Validated)

#### 1. Stripe SDK v22 camelCase claim is factually wrong
*   **Search Strategy:** Searched Stripe API changelogs for "Basil" (2025-03-31), `current_period_end`, and Stripe Node SDK v22 migration guides.
*   **Validation Result:** **Confirmed.** On March 31, 2025, Stripe shipped the "Basil" API version, which removed `current_period_start` and `current_period_end` from the top-level Subscription object and moved them to `items.data.current_period_end` [[7], [11], [14]]. The Stripe Node SDK has always mirrored the REST API’s snake_case convention; it never switched to camelCase for API responses [[22]]. The SKILL.md’s claim about a camelCase fallback is entirely fictional.
*   **Actionable Correction:** Remove the camelCase claim entirely. Update the webhook handler documentation to read from `subscription.items.data[0].current_period_end` per the Basil API migration.

#### 2. Vercel `maxDuration = 900` is incorrect for Vercel Pro
*   **Search Strategy:** Searched Vercel documentation for "Fluid compute" and "maxDuration" limits across Hobby, Pro, and Enterprise plans.
*   **Validation Result:** **Confirmed.** With Fluid compute enabled, Vercel Hobby caps at 300s [[44], [45]]. Vercel Pro/Enterprise GA limit is 800s, with an extended beta up to 1800s [[33], [40], [44]]. Setting `maxDuration = 900` exceeds the GA limit for Pro and would only work in the extended beta [[33]].
*   **Actionable Correction:** Change `maxDuration = 900` to `800` (for GA stability) or `300` (for Hobby compatibility). Update the text to reflect current Fluid compute limits.

---

### 🟠 Significant Issues (Validated)

#### 3. `pnpm-workspace.yaml` mixes deprecated and current syntax
*   **Search Strategy:** Searched pnpm release notes for `allowBuilds`, `onlyBuiltDependencies`, and pnpm v11 breaking changes.
*   **Validation Result:** **Confirmed.** `allowBuilds` was introduced in pnpm v10.26.0 to replace `onlyBuiltDependencies` [[51], [56]]. In pnpm v11, `onlyBuiltDependencies` was completely removed and replaced by `allowBuilds` [[55], [60]]. Having both is contradictory, and `onlyBuiltDependencies` is ignored in v11.
*   **Actionable Correction:** Pick one syntax. Since the engine requirement is `>=9.0.0`, either use `onlyBuiltDependencies` (for v9 compatibility) or bump the engine to `>=10.26.0` and use only `allowBuilds`.

#### 4. `@ffmpeg-installer/linux-x64` in `allowBuilds` contradicts removal
*   **Search Strategy:** Cross-referenced the package removal note with the `allowBuilds` list.
*   **Validation Result:** **Confirmed.** If `@ffmpeg-installer/ffmpeg` was removed due to Turbopack incompatibility, its sub-package `@ffmpeg-installer/linux-x64` is no longer in the dependency tree and doesn't need build approval.
*   **Actionable Correction:** Remove `@ffmpeg-installer/linux-x64` from the `allowBuilds` / `onlyBuiltDependencies` list.

#### 5. Zod v4's `.url()` no longer rejects `postgresql://`
*   **Search Strategy:** Searched Zod v4 changelog for URL validation changes.
*   **Validation Result:** **Confirmed.** Zod v4 switched from regex-based URL validation to using the native `new URL()` constructor [[73], [80]]. The native `URL` constructor accepts custom schemes like `postgresql://`. Therefore, `.url()` in Zod v4 will happily pass a Postgres connection string, making the `.refine()` workaround obsolete.
*   **Actionable Correction:** Remove the `.refine()` workaround for `DATABASE_URL` in Zod v4 contexts.

#### 6. React security vulnerability not acknowledged
*   **Search Strategy:** Searched NVD and React security advisories for "CVE-2025-55182".
*   **Validation Result:** **Confirmed.** CVE-2025-55182 ("React2Shell") is a critical (CVSS 10.0) pre-auth RCE vulnerability affecting React Server Components in versions 19.0.0 through 19.2.2 [[87], [91], [92], [100]]. The patched version for the 19.2.x line is 19.2.3 [[96], [101]]. Pinning `^19.2.0` allows vulnerable versions to be installed.
*   **Actionable Correction:** Update `react` and `react-dom` versions to `^19.2.3` (or higher). Add a security note about CVE-2025-55182.

---

### 🟡 Moderate Issues (Validated)

#### 7. `animation-duration: 0.01ms` explanation is slightly inaccurate
*   **Search Strategy:** Searched CSS accessibility best practices for `0.01ms` vs `0ms` and `animationend` events.
*   **Validation Result:** **Confirmed.** The primary reason for using `0.01ms` instead of `0ms` in `prefers-reduced-motion` overrides is to preserve `animationend` and `transitionend` events, ensuring JavaScript listeners still fire [[107], [108], [113]]. The "use default" framing is inaccurate.
*   **Actionable Correction:** Update the explanation to mention event preservation rather than "use default".

#### 8. Vercel Hobby SSE reconnect framing needs updating
*   **Search Strategy:** Tied to Point 2 (Vercel Fluid Compute limits).
*   **Validation Result:** **Confirmed.** The framing that "raising to 900 covers Pro" is wrong based on current Fluid compute limits (800s GA).
*   **Actionable Correction:** Reframe to: "raising `maxDuration` to 800 covers Pro/Enterprise GA; the client-side reconnect gracefully handles Hobby's 300s cap."

#### 9. `next-auth: 5.0.0-beta.31` is a pinned older beta
*   **Search Strategy:** Checked Auth.js v5 release history.
*   **Validation Result:** **Nuanced.** Pinning to a specific beta is a valid stability choice, but the SKILL.md fails to document this as a deliberate pin, which could confuse developers who see newer betas available.
*   **Actionable Correction:** Add a comment noting this is a deliberate stability pin and acknowledge newer betas exist.

---

### 🟢 Minor Issues and Observations (Validated)

#### 10. Tailwind v4 `@source` directives are likely unnecessary
*   **Search Strategy:** Searched Tailwind CSS v4 documentation for "automatic content detection" and `@source`.
*   **Validation Result:** **Confirmed.** Tailwind v4 features automatic content detection that scans project files without manual configuration [[115], [116], [123]]. Explicit `@source` directives for standard directories like `components/` and `lib/` are unnecessary unless automatic detection is disabled [[117], [119]].
*   **Actionable Correction:** Note that `@source` directives are optional in Tailwind v4 due to automatic detection, or remove them to avoid setting a misleading precedent.

#### 11. Vitest v4 mock module behavior changed subtly
*   **Search Strategy:** Searched Vitest v4 migration guide for `restoreAllMocks` behavior.
*   **Validation Result:** **Confirmed.** The Vitest v4 migration guide explicitly states that `vi.restoreAllMocks` no longer resets the state of spies and only restores manually created spies; automocks are no longer affected [[129]].
*   **Actionable Correction:** Document this Vitest v4 behavioral shift in the testing anti-patterns or lessons learned section.

#### 12. Drizzle ORM version currency
*   **Search Strategy:** Searched npm for latest `drizzle-orm` and `drizzle-kit` versions.
*   **Validation Result:** **Refuted (as an issue).** The versions listed (`drizzle-orm: ^0.45.2` and `drizzle-kit: ^0.31.10`) are current and accurate for the mid-2026 timeframe [[134], [141]].
*   **Actionable Correction:** No correction needed; the versions are up-to-date.

#### 13. WCAG AAA contrast claim is stated as fact but not tested
*   **Search Strategy:** Used Python code execution to calculate exact WCAG contrast ratios for the specified hex codes.
*   **Validation Result:** **Nuanced.** While `zinc-300` (`#d4d4d8`) on `zinc-950` (`#020202` or `#09090b`) yields a contrast ratio of ~13.46:1 to 14.04:1 (well above the 7:1 AAA threshold), the blanket "WCAG AAA" claim for the whole site is false. The `muted-foreground` color (`#8e8e95`) on `zinc-950` (`#09090b`) yields a ratio of approximately **6.11:1**, which passes AA (4.5:1) but **fails AAA (7:1)** for normal text.
*   **Actionable Correction:** Remove the blanket "WCAG AAA" claim. Specify that primary body text meets AAA, but muted/secondary text meets AA.

#### 14. SSE `maxDuration` export missing from document
*   **Search Strategy:** Reviewed SKILL.md Validation Matrix (Section 21).
*   **Validation Result:** **Confirmed.** The validation matrix lacks a check for the critical `maxDuration` export in the SSE route, which is currently documented incorrectly (900 vs 800).
*   **Actionable Correction:** Add a validation step to Section 21: `grep maxDuration src/app/api/projects/\[id\]/progress/route.ts` to ensure it matches the target Vercel plan limit (e.g., 800).

---

### Conclusion

The design critique is **highly accurate and rigorously justified**. The web searches confirm that the SKILL.md contains outdated information regarding Vercel's Fluid Compute limits, fictional claims about Stripe SDK camelCase conversions, and a critical security oversight regarding React CVE-2025-55182. Implementing the actionable corrections above will bring the SKILL.md in line with the actual state of the web ecosystem in mid-2026.

https://claude.ai/share/7d397bdd-584b-4276-a8da-848153d42114 
https://chat.qwen.ai/s/ffa7f051-aed7-44d4-ad50-772b85aed3f2?fev=0.2.67 

