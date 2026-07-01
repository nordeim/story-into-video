import type { Metadata } from 'next';
import Link from 'next/link';
import { Mail, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact — StoryIntoVideo',
  description:
    'Get in touch with the StoryIntoVideo team. We respond to all inquiries within 5 business days.',
};

/**
 * Contact page — Server Component.
 *
 * Surfaces the support email + sets expectations (5 business day response
 * window). Routes product questions to /create (try the product first) and
 * legal/privacy questions to /privacy.
 */

export default function ContactPage() {
  return (
    <main className="bg-background min-h-screen px-6 py-16">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-16 text-center">
          <h1 className="font-heading mb-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Get in touch
          </h1>
          <p className="mx-auto max-w-2xl text-base text-zinc-400 sm:text-lg">
            Questions, feedback, or just want to say hi? We read every message and respond within 5
            business days.
          </p>
        </div>

        {/* Contact options */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Support card */}
          <div className="bg-card rounded-2xl border border-white/[0.06] p-8">
            <div className="text-primary mb-4">
              <Mail className="h-6 w-6" aria-hidden="true" strokeWidth={1.5} />
            </div>
            <h2 className="font-heading mb-2 text-lg font-bold text-white">General support</h2>
            <p className="mb-4 text-sm text-zinc-400">
              Bug reports, account issues, billing questions, or anything else.
            </p>
            <a
              href="mailto:support@storyintovideo.com"
              className="text-primary hover:text-primary focus-visible:outline-primary inline-flex items-center gap-1.5 text-sm font-medium underline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              support@storyintovideo.com
            </a>
          </div>

          {/* Privacy card */}
          <div className="bg-card rounded-2xl border border-white/[0.06] p-8">
            <div className="text-primary mb-4">
              <Mail className="h-6 w-6" aria-hidden="true" strokeWidth={1.5} />
            </div>
            <h2 className="font-heading mb-2 text-lg font-bold text-white">Privacy &amp; legal</h2>
            <p className="mb-4 text-sm text-zinc-400">
              Data export, account deletion, or privacy policy questions.
            </p>
            <a
              href="mailto:privacy@storyintovideo.com"
              className="text-primary hover:text-primary focus-visible:outline-primary inline-flex items-center gap-1.5 text-sm font-medium underline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              privacy@storyintovideo.com
            </a>
          </div>
        </div>

        {/* Conversion CTA */}
        <div className="bg-card mt-12 rounded-2xl border border-white/[0.06] p-8 text-center">
          <h2 className="font-heading mb-2 text-xl font-bold text-white">Product question?</h2>
          <p className="mx-auto mb-6 max-w-md text-sm text-zinc-400">
            The fastest way to answer &quot;can it do X?&quot; is to try it — the free tier includes
            50 credits per month, enough for a full short video.
          </p>
          <Link
            href="/create"
            className="bg-primary hover:bg-primary focus-visible:outline-primary inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-zinc-950 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            Start creating
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </main>
  );
}
