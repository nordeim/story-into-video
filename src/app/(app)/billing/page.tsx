import Link from 'next/link';
import { Check } from 'lucide-react';

import type { Plan as TierPlan } from '@/features/billing/domain/tier-limits';
import { billingCheckoutAction } from '@/features/billing/actions';

type BillingPlan = TierPlan | 'free';

/**
 * /billing — shows current plan + credits + upgrade options.
 *
 * Server Component. Protected by proxy (Layer 0).
 */

const PLANS: Array<{
  plan: BillingPlan;
  price: string;
  features: string[];
}> = [
  {
    plan: 'free',
    price: '$0',
    features: ['50 credits/month', '720p resolution', 'Watermarked videos', '2 min max'],
  },
  {
    plan: 'creator',
    price: '$19/mo',
    features: ['500 credits/month', '1080p resolution', 'No watermark', '10 min max'],
  },
  {
    plan: 'pro',
    price: '$49/mo',
    features: [
      '2,000 credits/month',
      '4K resolution',
      'No watermark',
      '30 min max',
      'Priority queue',
    ],
  },
  {
    plan: 'studio',
    price: '$199/mo',
    features: [
      '10,000 credits/month',
      '4K resolution',
      'Team seats',
      'API access',
      'Custom voices',
    ],
  },
];

export const metadata = {
  title: 'Billing — StoryIntoVideo',
  description: 'Manage your StoryIntoVideo subscription and credits.',
};

export default function BillingPage() {
  return (
    <main className="bg-background min-h-screen px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <h1 className="font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Choose your plan
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Credits are used per AI operation. Unused credits don&apos;t roll over.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {PLANS.map(({ plan, price, features }) => {
            return (
              <div
                key={plan}
                className="relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6"
              >
                <h2 className="font-heading text-lg font-bold text-white capitalize">{plan}</h2>
                <p className="font-heading mt-2 text-3xl font-bold text-white">{price}</p>
                <ul className="mt-6 space-y-2">
                  {features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-xs text-zinc-400">
                      <Check className="text-primary mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
                      {feature}
                    </li>
                  ))}
                </ul>
                {plan === 'free' ? (
                  <p className="mt-6 text-center text-xs text-zinc-500">Current plan</p>
                ) : (
                  <form action={billingCheckoutAction} className="mt-6">
                    <button
                      type="submit"
                      name="plan"
                      value={plan}
                      className="bg-primary hover:bg-primary focus-visible:outline-primary w-full rounded-full px-4 py-2 text-sm font-bold text-zinc-950 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
                    >
                      Upgrade to {plan}
                    </button>
                  </form>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/dashboard"
            className="hover:text-primary focus-visible:outline-primary text-sm text-zinc-400 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            ← Back to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
