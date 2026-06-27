/**
 * Tier limits + credit costs per AI operation.
 *
 * Credit model: users buy/prepaid credits; each AI operation debits credits.
 * See ADR-007 in the Production Readiness Plan.
 *
 * These constants are pure (no side effects) — safe to import from domain,
 * features, and tests.
 */

export type Plan = 'free' | 'creator' | 'pro' | 'studio';

export interface TierLimit {
  plan: Plan;
  monthlyCredits: number;
  maxResolution: '720p' | '1080p' | '4k';
  maxVideoDurationSec: number;
  watermark: boolean;
  priorityQueue: boolean;
}

export const TIER_LIMITS: Record<Plan, TierLimit> = {
  free: {
    plan: 'free',
    monthlyCredits: 50,
    maxResolution: '720p',
    maxVideoDurationSec: 120,
    watermark: true,
    priorityQueue: false,
  },
  creator: {
    plan: 'creator',
    monthlyCredits: 500,
    maxResolution: '1080p',
    maxVideoDurationSec: 600,
    watermark: false,
    priorityQueue: false,
  },
  pro: {
    plan: 'pro',
    monthlyCredits: 2000,
    maxResolution: '4k',
    maxVideoDurationSec: 1800,
    watermark: false,
    priorityQueue: true,
  },
  studio: {
    plan: 'studio',
    monthlyCredits: 10000,
    maxResolution: '4k',
    maxVideoDurationSec: 1800,
    watermark: false,
    priorityQueue: true,
  },
};

/** Credit cost per AI operation type */
export const CREDIT_COSTS = {
  analysis: 5,
  character_generation: 10,
  scene_generation: 8,
  voiceover: 15,
  subtitle_alignment: 3,
  video_assembly: 30,
  moderation_check: 0,
  stripe_webhook: 0,
} as const;

export type CreditOperation = keyof typeof CREDIT_COSTS;

/** Total cost of a full pipeline run (one complete video) */
export const FULL_PIPELINE_COST =
  CREDIT_COSTS.analysis +
  CREDIT_COSTS.moderation_check + // free, but logged
  CREDIT_COSTS.character_generation * 3 + // assume 3 characters avg
  CREDIT_COSTS.scene_generation * 6 + // assume 6 scenes avg
  CREDIT_COSTS.voiceover +
  CREDIT_COSTS.subtitle_alignment +
  CREDIT_COSTS.video_assembly; // = 5 + 0 + 30 + 48 + 15 + 3 + 30 = 131 credits
