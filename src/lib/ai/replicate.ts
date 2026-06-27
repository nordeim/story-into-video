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
 */

export const replicate = new Replicate({
  auth: env.REPLICATE_API_TOKEN,
});

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
