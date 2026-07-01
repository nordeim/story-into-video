import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, ArrowRight } from 'lucide-react';

import { TIER_LIMITS, FULL_PIPELINE_COST } from '@/features/billing/domain/tier-limits';

export const metadata: Metadata = {
  title: 'Pricing — StoryIntoVideo',
  description:
    'Simple credit-based pricing. Start free with 50 credits per month. Upgrade when you need more.',
};

/**
 * Pricing page — Server Component.
 *
 * Renders the 4-tier plan table (Free / Creator / Pro / Studio) using the
 * same TIER_LIMITS constants the billing feature uses (single source of truth).
 *
 * Paid tiers show a "Coming soon" badge — Stripe Checkout is wired but the
 * upgrade flow is still being validated. The Free tier CTA routes to /create
 * (the working conversion path).
 */

interface PlanCard {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: { label: string; href: string };
  highlight: boolean;
  badge?: string;
}

const PLANS: PlanCard[] = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Try the full pipeline with a monthly credit allowance.',
    features: [
      `${TIER_LIMITS.free.monthlyCredits} credits / month`,
      `~${Math.floor(TIER_LIMITS.free.monthlyCredits / FULL_PIPELINE_COST)} full videos / month`,
      `${TIER_LIMITS.free.maxResolution} max resolution`,
      `${Math.floor(TIER_LIMITS.free.maxVideoDurationSec / 60)} min max video duration`,
      'Watermark on output',
      'Standard queue',
    ],
    cta: { label: 'Start creating', href: '/create' },
    highlight: true,
  },
  {
    name: 'Creator',
    price: '$19',
    period: 'per month',
    description: 'For hobbyists producing videos regularly.',
    features: [
      `${TIER_LIMITS.creator.monthlyCredits} credits / month`,
      `~${Math.floor(TIER_LIMITS.creator.monthlyCredits / FULL_PIPELINE_COST)} full videos / month`,
      `${TIER_LIMITS.creator.maxResolution} max resolution`,
      `${Math.floor(TIER_LIMITS.creator.maxVideoDurationSec / 60)} min max video duration`,
      'No watermark',
      'Standard queue',
    ],
    cta: { label: 'Coming soon', href: '/create' },
    highlight: false,
    badge: 'Coming soon',
  },
  {
    name: 'Pro',
    price: '$49',
    period: 'per month',
    description: 'For creators who need priority + 4K output.',
    features: [
      `${TIER_LIMITS.pro.monthlyCredits} credits / month`,
      `~${Math.floor(TIER_LIMITS.pro.monthlyCredits / FULL_PIPELINE_COST)} full videos / month`,
      `${TIER_LIMITS.pro.maxResolution} max resolution`,
      `${Math.floor(TIER_LIMITS.pro.maxVideoDurationSec / 60)} min max video duration`,
      'No watermark',
      'Priority queue',
    ],
    cta: { label: 'Coming soon', href: '/create' },
    highlight: false,
    badge: 'Coming soon',
  },
  {
    name: 'Studio',
    price: '$199',
    period: 'per month',
    description: 'For studios producing videos at scale.',
    features: [
      `${TIER_LIMITS.studio.monthlyCredits} credits / month`,
      `~${Math.floor(TIER_LIMITS.studio.monthlyCredits / FULL_PIPELINE_COST)} full videos / month`,
      `${TIER_LIMITS.studio.maxResolution} max resolution`,
      `${Math.floor(TIER_LIMITS.studio.maxVideoDurationSec / 60)} min max video duration`,
      'No watermark',
      'Priority queue',
    ],
    cta: { label: 'Coming soon', href: '/create' },
    highlight: false,
    badge: 'Coming soon',
  },
];

export default function PricingPage() {
  return (
    <main className="bg-background min-h-screen px-6 py-16">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-16 text-center">
          <h1 className="font-heading mb-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Simple, credit-based pricing
          </h1>
          <p className="mx-auto max-w-2xl text-base text-zinc-400 sm:text-lg">
            Every video costs {FULL_PIPELINE_COST} credits (3 characters + 6 scenes). Start free
            with 50 credits per month — upgrade only when you need more.
          </p>
        </div>

        {/* Plan grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={
                plan.highlight
                  ? 'hover:border-primary/40 focus-within:border-primary/40 border-primary/30 bg-card relative flex flex-col rounded-2xl border p-6 transition-colors'
                  : 'hover:border-primary/40 focus-within:border-primary/40 bg-card relative flex flex-col rounded-2xl border border-white/[0.06] p-6 transition-colors'
              }
            >
              {plan.badge && (
                <span className="text-primary border-primary/30 bg-background absolute -top-3 right-4 rounded-full border px-3 py-1 text-[10px] font-semibold tracking-wider uppercase">
                  {plan.badge}
                </span>
              )}
              <h2 className="font-heading mb-1 text-xl font-bold text-white">{plan.name}</h2>
              <p className="mb-4 text-xs text-zinc-500">{plan.description}</p>
              <div className="mb-6 flex items-baseline gap-1">
                <span className="font-heading text-3xl font-bold text-white">{plan.price}</span>
                <span className="text-xs text-zinc-500">/ {plan.period}</span>
              </div>
              <ul className="mb-6 flex-1 space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-zinc-300">
                    <Check
                      className="text-primary mt-0.5 h-4 w-4 shrink-0"
                      aria-hidden="true"
                      strokeWidth={2.5}
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={plan.cta.href}
                className={
                  plan.highlight
                    ? 'bg-primary hover:bg-primary focus-visible:outline-primary inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-zinc-950 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2'
                    : 'hover:border-primary/40 focus-visible:outline-primary inline-flex items-center justify-center gap-2 rounded-full border border-white/10 px-5 py-2.5 text-sm font-medium text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2'
                }
              >
                {plan.cta.label}
                {plan.highlight && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
              </Link>
            </div>
          ))}
        </div>

        {/* Footnote */}
        <p className="mt-12 text-center text-xs text-zinc-500">
          Credits reset monthly and do not roll over. Paid tiers launch soon — the Free tier is
          fully functional today.
        </p>
      </div>
    </main>
  );
}
