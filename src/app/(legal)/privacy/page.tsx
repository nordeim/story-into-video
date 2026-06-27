import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — StoryIntoVideo',
  description: 'How StoryIntoVideo collects, uses, and protects your data.',
};

/**
 * Privacy Policy — Server Component.
 *
 * Covers: data collection, use of data, data retention, user rights,
 * third-party AI providers (OpenAI, Replicate, ElevenLabs), and contact.
 *
 * Tailored for an AI video generation SaaS. Review with legal counsel
 * before production launch — this is a starting template, not legal advice.
 */

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-16">
      <article className="mx-auto max-w-3xl text-zinc-300">
        <h1 className="font-heading mb-2 text-4xl font-bold tracking-tight text-white">
          Privacy Policy
        </h1>
        <p className="mb-8 text-xs text-zinc-500">Last updated: June 27, 2026</p>

        <div className="space-y-8 leading-relaxed">
          <section>
            <h2 className="font-heading mb-3 text-xl font-bold text-white">1. Introduction</h2>
            <p className="text-sm">
              StoryIntoVideo (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) operates a
              service that transforms user-submitted stories into AI-generated videos. This Privacy
              Policy explains what data we collect, how we use it, and the choices you have. By
              using our service, you agree to the practices described here.
            </p>
          </section>

          <section>
            <h2 className="font-heading mb-3 text-xl font-bold text-white">2. Data We Collect</h2>
            <h3 className="mb-2 text-sm font-semibold text-zinc-200">2.1 Account data</h3>
            <p className="mb-3 text-sm">
              When you create an account, we collect your email address and (if you sign up with
              email/password) a bcrypt-hashed password. OAuth sign-ups receive only your name and
              email from the provider (Google).
            </p>
            <h3 className="mb-2 text-sm font-semibold text-zinc-200">2.2 Story content</h3>
            <p className="mb-3 text-sm">
              Stories you submit for video generation are stored in our database and processed by
              third-party AI providers (see §5). You retain ownership of your story content; we
              receive a limited license to process it through the pipeline (see Terms of Service).
            </p>
            <h3 className="mb-2 text-sm font-semibold text-zinc-200">2.3 Generated media</h3>
            <p className="mb-3 text-sm">
              AI-generated character portraits, scene images, voiceover audio, subtitle files, and
              final rendered videos are stored in Cloudflare R2 storage under your account. These
              are private to your account unless you explicitly share them.
            </p>
            <h3 className="mb-2 text-sm font-semibold text-zinc-200">2.4 Usage data</h3>
            <p className="text-sm">
              We log usage events (credits debited, operation type, timestamp) for billing and audit
              purposes. Webhook events from Stripe are also logged for idempotency.
            </p>
          </section>

          <section>
            <h2 className="font-heading mb-3 text-xl font-bold text-white">
              3. How We Use Your Data
            </h2>
            <ul className="ml-6 list-disc space-y-2 text-sm">
              <li>
                To provide the core service: analyze your story, generate
                characters/scenes/voiceover, and assemble a final video.
              </li>
              <li>
                To enforce content moderation policies (stories and generated images are checked
                against OpenAI&apos;s Moderation API and Replicate&apos;s safety filters).
              </li>
              <li>
                To meter usage against your subscription plan and process billing through Stripe.
              </li>
              <li>
                To send transactional emails (welcome, password reset, billing receipts) via Resend.
              </li>
              <li>To diagnose bugs and abuse. We do not sell your data to third parties.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading mb-3 text-xl font-bold text-white">4. Data Retention</h2>
            <p className="text-sm">
              We retain your account data and generated media for as long as your account is active.
              You may delete your account at any time, which triggers a CASCADE deletion of all your
              projects, characters, scenes, voiceovers, videos, and usage events from our database.
              R2-stored media files are deleted within 30 days of account deletion. Stripe customer
              records are retained per Stripe&apos;s own policies — contact Stripe directly to
              delete your billing history.
            </p>
          </section>

          <section>
            <h2 className="font-heading mb-3 text-xl font-bold text-white">
              5. Third-Party AI Providers
            </h2>
            <p className="mb-3 text-sm">
              Your story text is sent to the following providers during pipeline processing:
            </p>
            <ul className="ml-6 list-disc space-y-2 text-sm">
              <li>
                <strong>OpenAI</strong> — for story analysis (GPT-4o), content moderation
                (Moderation API), and subtitle alignment (Whisper ASR). OpenAI retains API inputs
                per their data retention policy (typically 30 days) unless you have a zero-retention
                enterprise agreement.
              </li>
              <li>
                <strong>Replicate</strong> — for character portrait generation and scene image
                generation (SDXL + IP-Adapter). Generated images are returned to us and stored in
                R2; Replicate&apos;s retention is governed by their API terms.
              </li>
              <li>
                <strong>ElevenLabs</strong> — for voiceover synthesis (TTS). The synthesized audio
                is returned to us; ElevenLabs&apos;s retention is governed by their API terms.
              </li>
            </ul>
            <p className="mt-3 text-sm">
              We do not use your data to train AI models. The providers above may use API inputs per
              their own policies — review each provider&apos;s terms if this matters to you.
            </p>
          </section>

          <section>
            <h2 className="font-heading mb-3 text-xl font-bold text-white">6. Your Rights</h2>
            <p className="mb-3 text-sm">
              Depending on your jurisdiction (GDPR, CCPA, and similar laws), you have the right to:
            </p>
            <ul className="ml-6 list-disc space-y-2 text-sm">
              <li>
                <strong>Access</strong> — request a copy of your personal data.
              </li>
              <li>
                <strong>Rectification</strong> — correct inaccurate data.
              </li>
              <li>
                <strong>Erasure</strong> — request deletion of your account and associated data.
              </li>
              <li>
                <strong>Portability</strong> — receive your data in a machine-readable format.
              </li>
              <li>
                <strong>Objection</strong> — object to certain processing activities.
              </li>
            </ul>
            <p className="mt-3 text-sm">
              To exercise these rights, contact us at{' '}
              <a href="mailto:privacy@storyintovideo.com" className="text-amber-400 underline">
                privacy@storyintovideo.com
              </a>
              . We respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="font-heading mb-3 text-xl font-bold text-white">7. Security</h2>
            <p className="text-sm">
              We use industry-standard security practices: TLS for all traffic, bcrypt password
              hashing, signed URLs for R2 media (1-hour expiry, never public buckets), Stripe
              webhook signature verification, and Zod-validated environment variables. No system is
              perfectly secure — we recommend using a unique password for your account.
            </p>
          </section>

          <section>
            <h2 className="font-heading mb-3 text-xl font-bold text-white">8. Contact</h2>
            <p className="text-sm">
              Questions about this policy? Email{' '}
              <a href="mailto:privacy@storyintovideo.com" className="text-amber-400 underline">
                privacy@storyintovideo.com
              </a>{' '}
              and we&apos;ll respond within 5 business days.
            </p>
          </section>

          <section>
            <h2 className="font-heading mb-3 text-xl font-bold text-white">9. Changes</h2>
            <p className="text-sm">
              We may update this policy as our service evolves. Material changes will be announced
              via email to verified account holders at least 14 days before taking effect.
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
