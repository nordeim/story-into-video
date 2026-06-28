# E2E Remediation Validation Plan

**Purpose:** Validate all remediation sprint code changes and feature enhancements via browser CLI tools against `http://localhost:3000/`

**Tools:** `agent-browser` (v0.29.1) for stateful auth flows + compact snapshots; `playwright-cli` (v0.1.14) for deep DOM inspection + network; `curl` for API endpoints

**Dev credentials:** `dev@storyintovideo.com` / `password123`

**Seeded data:**
- Project 1: "The Dragon's Quest" (anime/portrait/completed, has video+subtitle keys)
- Project 2: "Ocean Mystery" (realistic/landscape/pending, no video)

---

## Test Matrix

Tests are ordered by risk priority. Each test validates specific remediation fixes.

| # | Priority | Test | Validates Fixes | Tool |
|---|---|---|---|---|
| A1 | 🔴 P0 | Sign-in → /dashboard redirect | Auth flow baseline | agent-browser |
| A2 | 🔴 P0 | Sign-up page renders + form fields | C1 (signUpAction) | agent-browser |
| A3 | 🔴 P0 | Sign-up → new user creation | C1 (signUpAction end-to-end) | agent-browser |
| A4 | 🟠 P1 | Invalid credentials error | Auth error handling | agent-browser |
| A5 | 🟠 P1 | Unauthenticated /dashboard → /sign-in redirect | Proxy protection | agent-browser |
| D1 | 🟠 P1 | /dashboard renders seeded projects | Database schema + queries | agent-browser |
| D2 | 🟠 P1 | /projects/[id] completed project → download button | H4 (click-time signing) | agent-browser |
| D3 | 🟠 P1 | /projects/[id] pending project → progress panel | SSE progress stream | agent-browser |
| D4 | 🟠 P1 | /create wizard renders all style chips | H3 (medieval, japanese-animation) | agent-browser |
| D5 | 🟠 P1 | /billing page renders 4 tiers | Billing page | agent-browser |
| M1 | 🟡 P2 | / marketing page 10 sections | Marketing page integrity | agent-browser |
| M2 | 🟡 P2 | /privacy page renders legal content | Legal pages | agent-browser |
| M3 | 🟡 P2 | /terms page renders legal content | Legal pages | agent-browser |
| M4 | 🟡 P2 | Hero style chip marquee has 8 chips | H3 + content drift guard | agent-browser |
| M5 | 🟡 P2 | FAQ accordion expand/collapse | Interaction inventory | agent-browser |
| M6 | 🟡 P2 | Navbar scroll-aware background change | Interaction inventory | agent-browser |
| API1 | 🟠 P1 | /api/health returns status | H9 (DB+FFmpeg health) | curl |
| API2 | 🟠 P1 | /api/projects/[id]/download signed URL | H4 (click-time signing) | curl |
| API3 | 🟡 P2 | /api/auth/providers includes credentials | Auth config | curl |
| SEC1 | 🟠 P1 | /api/stripe/webhook rejects invalid signature | H7 (idempotent webhook) | curl |
| SEC2 | 🟠 P1 | Host header validation | H6 (proxy host check) | curl |
| E1 | 🟢 P3 | 404 page renders | Error boundary | agent-browser |
| E2 | 🟢 P3 | Mobile viewport → hamburger menu | Responsive layout | agent-browser |
| V1 | 🟡 P2 | Core Web Vitals on marketing page | Performance budget | agent-browser vitals |

---

## Execution Plan

### Phase 1: Auth Critical Path (P0)
1. Open `/sign-in` → verify page renders with correct elements
2. Fill valid credentials → click Sign in → verify redirect to `/dashboard`
3. Open `/sign-up` → verify page renders with name/email/password fields
4. Test sign-up flow (use throwaway email to avoid polluting DB — or just verify form structure)

### Phase 2: App Routes (P1)
5. Snapshot dashboard → verify seeded project cards
6. Navigate to completed project → verify download button present
7. Navigate to pending project → verify progress panel
8. Open `/create` → verify all 9 style chips including "Medieval" and "Japanese animation"
9. Open `/billing` → verify 4 plan tiers

### Phase 3: Marketing + Legal (P2)
10. Open `/` → verify all 10 sections render
11. Open `/privacy` → verify AI-specific legal content
12. Open `/terms` → verify billing/legal terms
13. Verify hero marquee style chips
14. Test FAQ accordion interaction
15. Test navbar scroll behavior

### Phase 4: API + Security (P1-P2)
16. curl `/api/health` → verify DB+FFmpeg check
17. curl `/api/projects/[id]/download` (authenticated) → verify signed URL
18. curl `/api/auth/providers` → verify credentials provider
19. curl POST `/api/stripe/webhook` (no signature) → verify 400
20. curl with spoofed Host header → verify rejection

### Phase 5: Edge Cases + Performance (P3-P2)
21. Open `/nonexistent` → verify 404
22. Mobile viewport test
23. Core Web Vitals measurement

---

## Success Criteria

- All 24 tests PASS
- No console errors on any page (except expected CredentialsSignin from A4)
- All remediation fixes (C1, C3, C4, C5, C6, H1, H3, H4, H6, H7, H9, M2, M4) validated at E2E level
- Screenshots captured for visual verification
