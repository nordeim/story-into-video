diff --git a/.github/workflows/ci.yml b/.github/workflows/ci.yml
index 9ed19d0..464f7ce 100644
--- a/.github/workflows/ci.yml
+++ b/.github/workflows/ci.yml
@@ -77,6 +77,23 @@ jobs:
           NEXT_PHASE: phase-production-build
           NODE_ENV: production
 
+      # NF-1: Guard against dev-only chunks leaking into the production build.
+      # The live site was previously running `next dev` in production (confirmed
+      # by hmr-client chunks in the HTML). This step greps the .next/ output for
+      # the dev-only HMR client and fails the build if found.
+      - name: Verify build output contains no dev-only chunks (hmr-client)
+        run: |
+          if grep -rl "hmr-client" .next/ 2>/dev/null; then
+            echo "❌ FAIL: dev-only hmr-client chunks found in production build output"
+            echo "This indicates the build is running in dev mode. Check:"
+            echo "  - NODE_ENV is set to 'production'"
+            echo "  - NEXT_PHASE is set to 'phase-production-build'"
+            echo "  - No `next dev` invocation in the build step"
+            exit 1
+          else
+            echo "✅ PASS: no dev-only hmr-client chunks in build output"
+          fi
+
   # T9: Playwright E2E tests against a live dev server + seeded Postgres.
   # Runs only after the quality-gate job passes (needs: quality-gate) to
   # avoid wasting CI minutes on E2E when lint/typecheck/test/build already
diff --git a/CLAUDE.md b/CLAUDE.md
index 1ed382f..06c35fb 100644
--- a/CLAUDE.md
+++ b/CLAUDE.md
@@ -725,10 +725,10 @@ Final: Mark project status='completed', progressPercent=100
 ### High (degrades UX)
 9. **No visual regression testing** — pixel-perfect verification against the live marketing site is manual.
 10. ~~**No rate limiting**~~ → **FIXED (C3)** — Upstash Ratelimit on auth (10/15min/IP), pipeline (5/min/user), SSE (1/user/project). New deps: `@upstash/ratelimit`, `@upstash/redis`.
-11. **No monitoring** — Sentry, Vercel Analytics, Axiom are not yet integrated. Env var `SENTRY_DSN` is in the schema.
+11. **No monitoring** — Sentry, Vercel Analytics, Axiom are not yet integrated. `SENTRY_DSN` is in the env schema but `@sentry/nextjs` is NOT installed (run `pnpm add @sentry/nextjs` + wire `sentry.{client,server,edge}.config.ts` + wrap `next.config.ts` with `withSentryConfig`).
 12. ~~**E2E tests not in CI**~~ → **FIXED (Sprint 3 T9)** — `.github/workflows/ci.yml` now has a second `e2e` job that runs Playwright against a live dev server + seeded Postgres 17 service container. `continue-on-error: true` initially so flakiness doesn't block PRs — flip to required once stable. The job installs FFmpeg, runs `pnpm drizzle:migrate` + `pnpm db:seed`, installs Playwright Chromium with deps, and uploads the report as an artifact.
 13. ~~**H2 — Brand color violations**~~ → **FIXED (T11)** — full replacement across 45 files; `brand-tokens.test.ts` now enforces 0 violations.
-14. **H5 — FFmpeg `/tmp` OOM risk** — `assemble-video.ts` writes to `/tmp` + reads into Buffer (**T12: temp files now use `crypto.randomUUID()` instead of `Date.now()`**). For large 4K videos, this can OOM. Stream-to-R2 via `@aws-sdk/lib-storage` deferred (dep installed but refactor not done).
+14. **H5 — FFmpeg `/tmp` OOM risk** — `assemble-video.ts` writes to `/tmp` + reads into Buffer (**T12: temp files now use `crypto.randomUUID()` instead of `Date.now()`**). For large 4K videos, this can OOM. Stream-to-R2 via `@aws-sdk/lib-storage` deferred (**NOTE: the dep is NOT yet installed — `@aws-sdk/lib-storage` is not in `package.json`; the refactor requires both `pnpm add @aws-sdk/lib-storage` and rewriting `assemble-video.ts` to use the `Upload` class instead of `putObject`**).
 15. **M3 — Character image R2 upload** — `referenceImageKey` stores Replicate CDN URLs, not R2 keys. Uploading to R2 requires pipeline Step 2 refactor.
 16. ~~**Navbar + dashboard + hero use raw `<a href>` instead of `next/link`**~~ → **FIXED (Sprint 3 T5)** — all 9 affected files (navbar, hero, dashboard/page, examples, use-cases, footer, cta-amber, cta-gradient, cta-ghost) now use `<Link>` from `next/link`. `mailto:` and hash anchors (`#main`, `#` placeholder in examples.tsx) intentionally kept as `<a>` per Next.js conventions.
 17. ~~**No custom `not-found.tsx` page**~~ → **FIXED (Sprint 3 T7)** — `src/app/not-found.tsx` is a Server Component with proper metadata, on-brand 404 UX, and `<Link>` CTAs to `/` and `/create`. Dead links now show a real 404 instead of the marketing page title.
@@ -816,7 +816,7 @@ Final: Mark project status='completed', progressPercent=100
 11. ~~**Implement `/pricing`, `/blog`, `/contact`** pages~~ → **DONE (Sprint 3 T6 + T7)** — all 3 pages implemented as Server Components with metadata (T6). Custom `not-found.tsx` (T7) covers any future dead links.
 12. ~~**Add cookie consent banner**~~ → **DONE (Sprint 3 T8)** — `src/components/app/cookie-banner.tsx` mounted in `src/app/layout.tsx`. Uses `useSyncExternalStore` (SSR-safe — server snapshot returns false to avoid hydration mismatch). Dismissible informational banner (NOT a consent gate — the app uses only essential cookies: session + CSRF). Persists acknowledgement to `localStorage` under `siv-cookie-consent`.
 13. ~~**H2 — Brand color full replacement**~~ → **DONE (T11)** — `sed` sweep across 45 files replaced `amber-300/400/500/600` → `primary`, `bg-zinc-950` → `bg-background`, `bg-zinc-900` → `bg-card`, `bg-black` → `bg-background`. `brand-tokens.test.ts` now enforces 0 violations.
-14. **H5 — FFmpeg stream-to-R2** — refactor `assemble-video.ts` to pipe FFmpeg output directly to R2 via `@aws-sdk/lib-storage` `Upload` class. Eliminates `/tmp` OOM risk. Dep installed.
+14. **H5 — FFmpeg stream-to-R2** — refactor `assemble-video.ts` to pipe FFmpeg output directly to R2 via `@aws-sdk/lib-storage` `Upload` class. Eliminates `/tmp` OOM risk. **Dep NOT yet installed — run `pnpm add @aws-sdk/lib-storage` before starting the refactor.**
 15. ~~**Replace internal `<a href>` with `<Link>`**~~ → **DONE (Sprint 3 T5)** — all 9 affected files now use `<Link>`. `mailto:` + hash anchors intentionally kept as `<a>`.
 16. ~~**Promote env host-mismatch warning to a thrown error in production**~~ → **DONE (Sprint 3 T1 + T2)** — `src/lib/env/index.ts` now throws at boot when `AUTH_URL` and `NEXT_PUBLIC_APP_URL` hosts differ in production runtime (dev/test keep the warn-only behavior). `/api/health` also surfaces the mismatch via `config` + `configErrors` (T2).
 
diff --git a/next.config.ts b/next.config.ts
index 808d591..700b746 100644
--- a/next.config.ts
+++ b/next.config.ts
@@ -1,5 +1,41 @@
 import type { NextConfig } from 'next';
 
+/**
+ * Content-Security-Policy for StoryIntoVideo.
+ *
+ * Directives:
+ *   - default-src 'self'                 — deny everything not explicitly allowed
+ *   - script-src 'self' 'unsafe-inline'  — Next.js inline runtime scripts require 'unsafe-inline'
+ *                                           (a future hardening pass can switch to nonce-based)
+ *   - style-src 'self' 'unsafe-inline'   — Tailwind v4 + Next.js inject inline styles
+ *   - img-src 'self' data: https:        — self-hosted examples + og:image + R2 signed URLs (https)
+ *   - font-src 'self'                    — self-hosted Geist + Outfit (no CDN)
+ *   - connect-src 'self'                 — all AI calls are server-side; browser only talks to origin
+ *   - media-src 'self'                   — workflow showcase MP4s are self-hosted
+ *   - frame-ancestors 'none'             — equivalent to X-Frame-Options: DENY (clickjacking)
+ *   - base-uri 'self'                    — prevent <base> injection
+ *   - form-action 'self'                 — forms may only submit to origin
+ *   - object-src 'none'                  — no Flash/Java/plugins
+ *
+ * Note: 'unsafe-inline' is required for Next.js App Router (inline <script> chunks
+ * for the router state). A nonce-based CSP is the production-hardened alternative
+ * but requires per-request nonce generation via Next.js 16's built-in support —
+ * deferred to a future hardening sprint.
+ */
+const CSP_POLICY = [
+  "default-src 'self'",
+  "script-src 'self' 'unsafe-inline'",
+  "style-src 'self' 'unsafe-inline'",
+  "img-src 'self' data: https:",
+  "font-src 'self'",
+  "connect-src 'self'",
+  "media-src 'self'",
+  "frame-ancestors 'none'",
+  "base-uri 'self'",
+  "form-action 'self'",
+  "object-src 'none'",
+].join('; ');
+
 const nextConfig: NextConfig = {
   reactStrictMode: true,
   poweredByHeader: false,
@@ -19,6 +55,17 @@ const nextConfig: NextConfig = {
             key: 'Permissions-Policy',
             value: 'camera=(), microphone=(), geolocation=()',
           },
+          // NF-2: Content-Security-Policy — browser-level XSS mitigation.
+          // Without this, an injected inline script (compromised dependency,
+          // stored XSS in user content) executes freely.
+          { key: 'Content-Security-Policy', value: CSP_POLICY },
+          // NF-2: Strict-Transport-Security — origin-level HSTS (defense-in-depth
+          // behind Cloudflare's edge HSTS). max-age=63072000 (2 years) is the
+          // OWASP-recommended minimum for preload-list eligibility.
+          {
+            key: 'Strict-Transport-Security',
+            value: 'max-age=63072000; includeSubDomains; preload',
+          },
         ],
       },
     ];
diff --git a/src/features/pipeline/domain/align-subtitles.ts b/src/features/pipeline/domain/align-subtitles.ts
index 04b4f74..ff81a23 100644
--- a/src/features/pipeline/domain/align-subtitles.ts
+++ b/src/features/pipeline/domain/align-subtitles.ts
@@ -1,4 +1,4 @@
-import { openai } from '@/lib/ai/openai';
+import { openai, WHISPER_MODEL } from '@/lib/ai/openai';
 
 /**
  * Subtitle alignment — uses OpenAI Whisper API to get word-level timestamps,
@@ -44,7 +44,7 @@ export async function alignSubtitles(input: AlignSubtitlesInput): Promise<AlignS
   // Whisper API accepts audio file uploads
   const transcription = await openai.audio.transcriptions.create({
     file: new File([new Uint8Array(input.audioBuffer)], 'voiceover.mp3', { type: 'audio/mp3' }),
-    model: 'whisper-1',
+    model: WHISPER_MODEL,
     language,
     response_format: 'verbose_json',
     timestamp_granularities: ['word'],
diff --git a/src/features/pipeline/inngest.ts b/src/features/pipeline/inngest.ts
index 18a5b2e..4d4050d 100644
--- a/src/features/pipeline/inngest.ts
+++ b/src/features/pipeline/inngest.ts
@@ -89,7 +89,17 @@ export const pipelineFunction = inngest.createFunction(
     // Step 1: Story analysis
     const analysis = await step.run('analyze-story', async () => {
       await updateProjectProgress(projectId, 'analyzing', 'Analyzing story…', 10);
-      return analyzeStory(project.story);
+      try {
+        return await analyzeStory(project.story);
+      } catch (err) {
+        // NF-6: Mark the project failed so users see a clear error state
+        // instead of a ghost "Analyzing… 10%" that never resolves.
+        // Re-throw so Inngest still retries — if the retry succeeds, the
+        // project status will be updated to the next step's progress.
+        const message = err instanceof Error ? err.message : String(err);
+        await setProjectFailed(projectId, `Story analysis failed: ${message}`);
+        throw err;
+      }
     });
 
     // Step 2: Character generation (with image moderation per ADR-011)
@@ -200,133 +210,165 @@ export const pipelineFunction = inngest.createFunction(
     // Step 4: Voiceover synthesis (ElevenLabs TTS, chunked)
     await step.run('synthesize-voiceover', async () => {
       await updateProjectProgress(projectId, 'synthesizing_voice', 'Synthesizing voiceover…', 65);
+      try {
+        const narrationText = buildNarrationText(analysis);
+        const voiceResult = await synthesizeVoice({
+          text: narrationText,
+          voiceId: DEFAULT_VOICE_ID,
+        });
+
+        // Upload the audio buffer to R2 (generated bucket)
+        const audioKey = buildObjectKey(projectId, 'voiceover.mp3');
+        await putObject('generated', audioKey, voiceResult.audioBuffer, 'audio/mpeg');
 
-      const narrationText = buildNarrationText(analysis);
-      const voiceResult = await synthesizeVoice({
-        text: narrationText,
-        voiceId: DEFAULT_VOICE_ID,
-      });
-
-      // Upload the audio buffer to R2 (generated bucket)
-      const audioKey = buildObjectKey(projectId, 'voiceover.mp3');
-      await putObject('generated', audioKey, voiceResult.audioBuffer, 'audio/mpeg');
-
-      // Insert the voiceover row
-      await appendVoiceover(
-        projectId,
-        DEFAULT_VOICE_ID,
-        'Rachel',
-        audioKey,
-        voiceResult.duration,
-        narrationText,
-      );
-
-      // Debit voiceover credits — idempotent via ON CONFLICT (C5)
-      await debitCredits(
-        project.userId,
-        CREDIT_COSTS.voiceover,
-        'voiceover',
-        `${projectId}:voiceover`,
-        projectId,
-      );
+        // Insert the voiceover row
+        await appendVoiceover(
+          projectId,
+          DEFAULT_VOICE_ID,
+          'Rachel',
+          audioKey,
+          voiceResult.duration,
+          narrationText,
+        );
+
+        // Debit voiceover credits — idempotent via ON CONFLICT (C5)
+        await debitCredits(
+          project.userId,
+          CREDIT_COSTS.voiceover,
+          'voiceover',
+          `${projectId}:voiceover`,
+          projectId,
+        );
+      } catch (err) {
+        // NF-6: Mark failed so users see the error instead of a stuck 65%.
+        const message = err instanceof Error ? err.message : String(err);
+        await setProjectFailed(projectId, `Voiceover synthesis failed: ${message}`);
+        throw err;
+      }
     });
 
     // Step 5: Subtitle alignment (Whisper ASR → SRT)
     await step.run('align-subtitles', async () => {
       await updateProjectProgress(projectId, 'aligning_subtitles', 'Aligning subtitles…', 80);
+      try {
+        // Fetch the voiceover we just created
+        const voiceover = await getProjectVoiceover(projectId);
+        if (!voiceover?.audioKey) {
+          throw new Error('Voiceover not found for subtitle alignment');
+        }
 
-      // Fetch the voiceover we just created
-      const voiceover = await getProjectVoiceover(projectId);
-      if (!voiceover?.audioKey) {
-        throw new Error('Voiceover not found for subtitle alignment');
-      }
+        // Download the audio from R2 to feed Whisper
+        const audioDownloadUrl = await getSignedDownloadUrl('generated', voiceover.audioKey);
+        const audioResponse = await fetch(audioDownloadUrl);
+        const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
+
+        // Run Whisper ASR (M4: default language 'en' for now — future: detect
+        // from the story analysis or accept user input)
+        const subtitleResult = await alignSubtitles({ audioBuffer });
+
+        // Upload the SRT to R2
+        const subtitleKey = buildObjectKey(projectId, 'subtitles.srt');
+        await putObject(
+          'generated',
+          subtitleKey,
+          Buffer.from(subtitleResult.srt, 'utf-8'),
+          'text/plain',
+        );
 
-      // Download the audio from R2 to feed Whisper
-      const audioDownloadUrl = await getSignedDownloadUrl('generated', voiceover.audioKey);
-      const audioResponse = await fetch(audioDownloadUrl);
-      const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
-
-      // Run Whisper ASR (M4: default language 'en' for now — future: detect
-      // from the story analysis or accept user input)
-      const subtitleResult = await alignSubtitles({ audioBuffer });
-
-      // Upload the SRT to R2
-      const subtitleKey = buildObjectKey(projectId, 'subtitles.srt');
-      await putObject(
-        'generated',
-        subtitleKey,
-        Buffer.from(subtitleResult.srt, 'utf-8'),
-        'text/plain',
-      );
-
-      // Create the video row (so we can attach the subtitle to it)
-      await appendVideo(projectId, null, subtitleKey, null, '720p');
-      await updateVideoSubtitle(projectId, subtitleKey);
-
-      // Debit subtitle alignment credits — idempotent via ON CONFLICT (C5)
-      await debitCredits(
-        project.userId,
-        CREDIT_COSTS.subtitle_alignment,
-        'subtitle_alignment',
-        `${projectId}:subtitle_alignment`,
-        projectId,
-      );
+        // Create the video row (so we can attach the subtitle to it)
+        await appendVideo(projectId, null, subtitleKey, null, '720p');
+        await updateVideoSubtitle(projectId, subtitleKey);
+
+        // Debit subtitle alignment credits — idempotent via ON CONFLICT (C5)
+        await debitCredits(
+          project.userId,
+          CREDIT_COSTS.subtitle_alignment,
+          'subtitle_alignment',
+          `${projectId}:subtitle_alignment`,
+          projectId,
+        );
+      } catch (err) {
+        // NF-6: Mark failed so users see the error instead of a stuck 80%.
+        const message = err instanceof Error ? err.message : String(err);
+        await setProjectFailed(projectId, `Subtitle alignment failed: ${message}`);
+        throw err;
+      }
     });
 
     // Step 6: Video assembly (FFmpeg → MP4)
     await step.run('assemble-video', async () => {
       await updateProjectProgress(projectId, 'assembling_video', 'Assembling your video…', 90);
+      try {
+        // Gather inputs for FFmpeg
+        const scenes = await getProjectScenes(projectId);
+        const voiceover = await getProjectVoiceover(projectId);
+        if (!voiceover?.audioKey) {
+          throw new Error('Voiceover not found for video assembly');
+        }
 
-      // Gather inputs for FFmpeg
-      const scenes = await getProjectScenes(projectId);
-      const voiceover = await getProjectVoiceover(projectId);
-      if (!voiceover?.audioKey) {
-        throw new Error('Voiceover not found for video assembly');
-      }
+        const audioUrl = await getSignedDownloadUrl('generated', voiceover.audioKey);
+
+        // Fetch the SRT content (we wrote it in Step 5)
+        const subtitleKey = buildObjectKey(projectId, 'subtitles.srt');
+        const srtDownloadUrl = await getSignedDownloadUrl('generated', subtitleKey);
+        const srtResponse = await fetch(srtDownloadUrl);
+        const subtitlesSrt = await srtResponse.text();
+
+        // Sign scene image URLs — FFmpeg needs accessible URLs, not R2 keys
+        const sceneImageUrls = await Promise.all(
+          scenes.map((s) => getSignedDownloadUrl('generated', s.generatedImageKey!)),
+        );
+
+        // Assemble the video
+        const assembleResult = await assembleVideo({
+          sceneImageUrls,
+          sceneDurations: scenes.map((s) => s.duration ?? 8),
+          audioUrl,
+          subtitlesSrt,
+          aspectRatio: project.aspectRatio,
+          resolution: '720p',
+        });
 
-      const audioUrl = await getSignedDownloadUrl('generated', voiceover.audioKey);
-
-      // Fetch the SRT content (we wrote it in Step 5)
-      const subtitleKey = buildObjectKey(projectId, 'subtitles.srt');
-      const srtDownloadUrl = await getSignedDownloadUrl('generated', subtitleKey);
-      const srtResponse = await fetch(srtDownloadUrl);
-      const subtitlesSrt = await srtResponse.text();
-
-      // Sign scene image URLs — FFmpeg needs accessible URLs, not R2 keys
-      const sceneImageUrls = await Promise.all(
-        scenes.map((s) => getSignedDownloadUrl('generated', s.generatedImageKey!)),
-      );
-
-      // Assemble the video
-      const assembleResult = await assembleVideo({
-        sceneImageUrls,
-        sceneDurations: scenes.map((s) => s.duration ?? 8),
-        audioUrl,
-        subtitlesSrt,
-        aspectRatio: project.aspectRatio,
-        resolution: '720p',
-      });
-
-      // Upload the final MP4 to R2 (videos bucket)
-      const videoKey = buildObjectKey(projectId, 'final.mp4');
-      await putObject('videos', videoKey, assembleResult.videoBuffer, 'video/mp4');
-
-      // Update the video row (created in Step 5) with the actual video key + duration
-      await updateVideo(projectId, videoKey, assembleResult.duration);
-
-      // Debit video assembly credits — idempotent via ON CONFLICT (C5)
-      await debitCredits(
-        project.userId,
-        CREDIT_COSTS.video_assembly,
-        'video_assembly',
-        `${projectId}:video_assembly`,
-        projectId,
-      );
+        // Upload the final MP4 to R2 (videos bucket)
+        const videoKey = buildObjectKey(projectId, 'final.mp4');
+        await putObject('videos', videoKey, assembleResult.videoBuffer, 'video/mp4');
+
+        // Update the video row (created in Step 5) with the actual video key + duration
+        await updateVideo(projectId, videoKey, assembleResult.duration);
+
+        // Debit video assembly credits — idempotent via ON CONFLICT (C5)
+        await debitCredits(
+          project.userId,
+          CREDIT_COSTS.video_assembly,
+          'video_assembly',
+          `${projectId}:video_assembly`,
+          projectId,
+        );
+      } catch (err) {
+        // NF-6: Mark failed so users see the error instead of a stuck 90%.
+        const message = err instanceof Error ? err.message : String(err);
+        await setProjectFailed(projectId, `Video assembly failed: ${message}`);
+        throw err;
+      }
     });
 
     // Final step: mark project as completed
     await step.run('complete', async () => {
-      await updateProjectProgress(projectId, 'completed', 'Your video is ready!', 100);
+      // NF-6: The complete step is special. By the time we reach it, the MP4 is
+      // already in R2 and the video row has status='completed' (set by updateVideo
+      // in Step 6). If this final updateProjectProgress call fails (e.g., DB blip),
+      // we do NOT mark the project failed — the user can still download the video
+      // via /api/projects/[id]/download (which checks videoKey presence, not
+      // status === 'completed'). We log the error and let the pipeline return
+      // success so Inngest doesn't retry (which would re-run Step 6 needlessly).
+      try {
+        await updateProjectProgress(projectId, 'completed', 'Your video is ready!', 100);
+      } catch (err) {
+        console.error(
+          `[pipeline] Failed to mark project ${projectId} as completed (video is in R2; user can still download):`,
+          err,
+        );
+      }
     });
 
     return { success: true, projectId };
diff --git a/src/features/pipeline/queries.ts b/src/features/pipeline/queries.ts
index 716aefb..05910ae 100644
--- a/src/features/pipeline/queries.ts
+++ b/src/features/pipeline/queries.ts
@@ -196,8 +196,3 @@ export async function updateVideo(
     .set({ videoKey, duration, status: 'completed' })
     .where(eq(videos.projectId, projectId));
 }
-
-export async function getProjectVideo(projectId: string) {
-  const [video] = await db.select().from(videos).where(eq(videos.projectId, projectId)).limit(1);
-  return video;
-}
diff --git a/src/lib/data/faq-items.ts b/src/lib/data/faq-items.ts
index 7cd6d6d..bc3506b 100644
--- a/src/lib/data/faq-items.ts
+++ b/src/lib/data/faq-items.ts
@@ -23,7 +23,7 @@ export const FAQ_ITEMS: FAQItem[] = [
     id: 'visual-style',
     question: 'Can I customize the visual style?',
     answer:
-      'Absolutely. Choose from 7+ visual styles including Ghibli, Oil Painting, Anime, Realistic, Cyberpunk, Watercolor, and Comic — or describe a custom style and the AI will adapt.',
+      'Absolutely. Choose from 8 visual styles including Ghibli, Medieval, Oil Painting, Anime, Japanese animation, Realistic, Cyberpunk, and Watercolor — or describe a custom style and the AI will adapt.',
   },
   {
     id: 'generation-time',
diff --git a/src/lib/storage/r2.ts b/src/lib/storage/r2.ts
index a63ad3e..afec2f1 100644
--- a/src/lib/storage/r2.ts
+++ b/src/lib/storage/r2.ts
@@ -192,5 +192,4 @@ export async function deleteUserMedia(keys: string[]): Promise<number> {
   return deletedCount;
 }
 
-export { r2Client, BUCKET_MAP };
 export type { BucketName };
diff --git a/src/tests/unit/analyze-story.test.ts b/src/tests/unit/analyze-story.test.ts
index d49d1e1..111eb34 100644
--- a/src/tests/unit/analyze-story.test.ts
+++ b/src/tests/unit/analyze-story.test.ts
@@ -13,6 +13,7 @@ vi.mock('@/lib/ai/openai', () => ({
     },
   },
   GPT_MODEL: 'gpt-4o',
+  WHISPER_MODEL: 'whisper-1',
 }));
 
 import { openai } from '@/lib/ai/openai';
diff --git a/src/tests/unit/pipeline-sprint5.test.ts b/src/tests/unit/pipeline-sprint5.test.ts
index 8330b32..5833092 100644
--- a/src/tests/unit/pipeline-sprint5.test.ts
+++ b/src/tests/unit/pipeline-sprint5.test.ts
@@ -29,6 +29,7 @@ vi.mock('@/lib/ai/openai', () => ({
     chat: { completions: { create: vi.fn() } },
   },
   GPT_MODEL: 'gpt-4o',
+  WHISPER_MODEL: 'whisper-1',
 }));
 
 vi.mock('@/lib/ai/replicate', () => ({
@@ -167,7 +168,6 @@ vi.mock('@/features/pipeline/queries', () => ({
     audioKey: 'p1/voiceover.mp3',
     transcript: 'A test story summary.',
   }),
-  getProjectVideo: vi.fn().mockResolvedValue(null),
 }));
 
 vi.mock('@/lib/db', () => ({
diff --git a/src/tests/unit/sprint4.test.ts b/src/tests/unit/sprint4.test.ts
index 6b84bcf..0a400fb 100644
--- a/src/tests/unit/sprint4.test.ts
+++ b/src/tests/unit/sprint4.test.ts
@@ -22,6 +22,7 @@ vi.mock('@/lib/ai/openai', () => ({
     chat: { completions: { create: vi.fn() } },
   },
   GPT_MODEL: 'gpt-4o',
+  WHISPER_MODEL: 'whisper-1',
 }));
 
 vi.mock('@/lib/stripe/client', () => ({
