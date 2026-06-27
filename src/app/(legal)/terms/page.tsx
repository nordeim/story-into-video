import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service — StoryIntoVideo',
  description: 'The terms under which you may use StoryIntoVideo.',
};

/**
 * Terms of Service — Server Component.
 *
 * Covers: acceptance, use of service, user content ownership, AI-generated
 * output ownership, intellectual property, limitation of liability,
 * termination, and disputes.
 *
 * Review with legal counsel before production launch — this is a starting
 * template, not legal advice.
 */

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-16">
      <article className="mx-auto max-w-3xl text-zinc-300">
        <h1 className="font-heading mb-2 text-4xl font-bold tracking-tight text-white">
          Terms of Service
        </h1>
        <p className="mb-8 text-xs text-zinc-500">Last updated: June 27, 2026</p>

        <div className="space-y-8 leading-relaxed">
          <section>
            <h2 className="font-heading mb-3 text-xl font-bold text-white">1. Acceptance of Terms</h2>
            <p className="text-sm">
              By creating an account or using the StoryIntoVideo service (&ldquo;the Service&rdquo;),
              you agree to be bound by these Terms of Service and our Privacy Policy. If you do not
              agree, do not use the Service. You must be at least 13 years old (or the age of
              digital consent in your jurisdiction) to use the Service.
            </p>
          </section>

          <section>
            <h2 className="font-heading mb-3 text-xl font-bold text-white">2. Use of the Service</h2>
            <h3 className="mb-2 text-sm font-semibold text-zinc-200">2.1 Permitted use</h3>
            <p className="mb-3 text-sm">
              You may use the Service to generate videos from stories you own or have the right to
              use. You agree to comply with all applicable laws and not to:
            </p>
            <ul className="ml-6 list-disc space-y-2 text-sm">
              <li>Submit content that is illegal, infringing, harassing, or that you do not have rights to.</li>
              <li>Attempt to reverse-engineer, scrape, or overload the Service.</li>
              <li>Resell or sublicense access to the Service without our written permission.</li>
              <li>Use the Service to generate content that impersonates real people without consent.</li>
            </ul>
            <h3 className="mb-2 mt-4 text-sm font-semibold text-zinc-200">2.2 Content moderation</h3>
            <p className="text-sm">
              All story inputs are screened by OpenAI&apos;s Moderation API before processing. All
              AI-generated images are screened by Replicate&apos;s safety filters. Flagged content
              is rejected and the project is marked as failed. Repeated violations may result in
              account suspension without refund.
            </p>
          </section>

          <section>
            <h2 className="font-heading mb-3 text-xl font-bold text-white">3. User Content</h2>
            <p className="mb-3 text-sm">
              &ldquo;User Content&rdquo; means the story text you submit for video generation. You
              retain all ownership rights in your User Content. By submitting it, you grant us a
              limited, worldwide, non-exclusive, royalty-free license to process your User Content
              through the AI pipeline (analysis, character generation, scene generation, voiceover,
              subtitle alignment, video assembly) for the sole purpose of providing the Service to
              you.
            </p>
            <p className="text-sm">
              You represent that you have all necessary rights to submit your User Content and that
              doing so does not violate any third-party rights. You are solely responsible for your
              User Content.
            </p>
          </section>

          <section>
            <h2 className="font-heading mb-3 text-xl font-bold text-white">4. AI-Generated Content Ownership</h2>
            <p className="mb-3 text-sm">
              &ldquo;Generated Content&rdquo; means the characters, scenes, voiceover audio,
              subtitles, and final videos produced by the pipeline from your User Content.
            </p>
            <p className="mb-3 text-sm">
              To the extent permitted by applicable law, you own the Generated Content produced
              from your User Content. You may use it for personal or commercial purposes subject to
              these Terms. Note that AI-generated content may be subject to limitations on
              intellectual property protection in some jurisdictions (e.g., the U.S. Copyright
              Office&apos;s guidance on AI-generated works). We make no representation that
              Generated Content is copyrightable in your jurisdiction.
            </p>
            <p className="text-sm">
              You acknowledge that AI-generated content may be imperfect, biased, or factually
              incorrect. You are responsible for reviewing Generated Content before publishing or
              distributing it.
            </p>
          </section>

          <section>
            <h2 className="font-heading mb-3 text-xl font-bold text-white">5. Intellectual Property</h2>
            <p className="text-sm">
              The Service, including its software, design, marketing copy, and documentation, is
              owned by StoryIntoVideo and protected by copyright, trademark, and other laws. These
              Terms do not grant you any right to use our trademarks, logos, or brand assets. The
              AI models used (OpenAI GPT-4o, Replicate SDXL, ElevenLabs TTS) are licensed from
              their respective providers — your use of Generated Content is subject to each
              provider&apos;s output terms.
            </p>
          </section>

          <section>
            <h2 className="font-heading mb-3 text-xl font-bold text-white">6. Credits and Billing</h2>
            <p className="text-sm">
              The Service uses a prepaid credit model. Each AI operation debits credits from your
              subscription: story analysis (5 credits), character generation (10/char), scene
              generation (8/scene), voiceover (15), subtitle alignment (3), video assembly (30). A
              full pipeline run averages 131 credits. Free tier users receive 50 credits/month.
              Paid tiers (Creator, Pro, Studio) receive more — see the billing page for current
              pricing. Credits do not roll over month-to-month. Refunds are governed by Stripe&apos;s
              dispute process.
            </p>
          </section>

          <section>
            <h2 className="font-heading mb-3 text-xl font-bold text-white">7. Limitation of Liability</h2>
            <p className="text-sm">
              The Service is provided &ldquo;as is&rdquo; without warranties of any kind. To the
              maximum extent permitted by law, StoryIntoVideo shall not be liable for any
              indirect, incidental, special, consequential, or punitive damages, or any loss of
              profits or revenues, arising from your use of the Service. Our total liability for
              any claim arising from these Terms shall not exceed the amount you paid us in the 12
              months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="font-heading mb-3 text-xl font-bold text-white">8. Termination</h2>
            <p className="text-sm">
              You may delete your account at any time, which immediately terminates these Terms
              with respect to your account. We may suspend or terminate your account if you
              violate these Terms, fail to pay applicable fees, or engage in abusive behavior.
              Upon termination, your right to use the Service ceases, and we may delete your User
              Content and Generated Content per our Privacy Policy&apos;s retention schedule.
            </p>
          </section>

          <section>
            <h2 className="font-heading mb-3 text-xl font-bold text-white">9. Disputes</h2>
            <p className="text-sm">
              These Terms are governed by the laws of the State of Delaware, without regard to
              conflict-of-law principles. Any dispute arising from these Terms will be resolved by
              binding arbitration in Delaware. You waive any right to participate in a class action.
            </p>
          </section>

          <section>
            <h2 className="font-heading mb-3 text-xl font-bold text-white">10. Changes to These Terms</h2>
            <p className="text-sm">
              We may update these Terms as our Service evolves. Material changes will be announced
              via email to verified account holders at least 14 days before taking effect. Continued
              use of the Service after the effective date constitutes acceptance of the updated
              Terms.
            </p>
          </section>

          <section>
            <h2 className="font-heading mb-3 text-xl font-bold text-white">11. Contact</h2>
            <p className="text-sm">
              Questions about these Terms? Email{' '}
              <a href="mailto:legal@storyintovideo.com" className="text-amber-400 underline">legal@storyintovideo.com</a>.
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
