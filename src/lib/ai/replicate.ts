import Replicate from 'replicate';

import { env } from '@/lib/env';

/**
 * Replicate client — used for SDXL image generation (characters + scenes).
 *
 * Character consistency uses IP-Adapter: a reference portrait is passed as
 * an input to scene generation, conditioning the model to preserve the face.
 *
 * T4 (remediation): Model IDs are read from the validated `env` module so
 * operators can rotate them without code changes. Both are optional with
 * sensible defaults (defined in src/lib/env/index.ts). The env schema
 * validates that any user-provided value matches Replicate's
 * `owner/model:sha` format.
 * C2 fix: The default IP-Adapter model is the SDXL base model (a placeholder).
 * This means character consistency (the core product feature) silently does
 * NOT work unless the operator sets REPLICATE_SDXL_IPADAPTER_MODEL to a real
 * IP-Adapter model hash. We emit a loud console.warn in production so this
 * misconfiguration is visible in server logs.
 */

export const replicate = new Replicate({
  auth: env.REPLICATE_API_TOKEN,
});

/**
 * The SDXL base model hash — used as the default placeholder for
 * REPLICATE_SDXL_IPADAPTER_MODEL. When this value is detected, the IP-Adapter
 * is NOT actually configured (the SDXL base doesn't accept ip_adapter_images).
 * Character consistency will silently not work.
 */
const SDXL_BASE_HASH =
  'stability-ai/sdxl:39ed52f2a788939d832ec6675557c771a6b0f9b6ce8bcd3ff0f4e4f3f1e0a6e3';

// SDXL model for character portraits + scene images.
// Override via REPLICATE_SDXL_MODEL env var (format: owner/model:sha).
// Cast to Replicate's template-literal model identifier type — env gives us
// a `string` (Zod can't narrow to `${string}/${string}:${string}`), but the
// regex in the env schema guarantees the format.
export const SDXL_MODEL = env.REPLICATE_SDXL_MODEL as `${string}/${string}:${string}`;

// SDXL + IP-Adapter for scene generation with character consistency.
// Override via REPLICATE_SDXL_IPADAPTER_MODEL env var (format: owner/model:sha).
//
// ⚠️ OPERATORS: The default is the SDXL base model (not IP-Adapter) — it's a
// placeholder that lets the app boot but scene generation won't apply
// character consistency. Set REPLICATE_SDXL_IPADAPTER_MODEL to a real
// lucataco/sdxl-ipadapter version hash before relying on consistency.
export const SDXL_IPADAPTER_MODEL =
  env.REPLICATE_SDXL_IPADAPTER_MODEL as `${string}/${string}:${string}`;

// C2: Emit a loud warning if the IP-Adapter is still the placeholder in production.
// This is the ONLY way operators will know character consistency is broken —
// the app boots fine, scenes generate, but faces won't be consistent.
if (env.REPLICATE_SDXL_IPADAPTER_MODEL === SDXL_BASE_HASH && env.NODE_ENV === 'production') {
  console.warn(
    '[replicate] ⚠️ REPLICATE_SDXL_IPADAPTER_MODEL is the SDXL base placeholder. ' +
      'Character consistency will NOT work — scenes will have inconsistent faces. ' +
      'Set REPLICATE_SDXL_IPADAPTER_MODEL to a real IP-Adapter model hash ' +
      '(e.g., lucataco/ip-adapter-faceid:<sha>) in your .env.local.',
  );
}
