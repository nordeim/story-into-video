import Replicate from 'replicate';

import { env } from '@/lib/env';

/**
 * Replicate client — used for SDXL image generation (characters + scenes).
 *
 * Character consistency uses IP-Adapter: a reference portrait is passed as
 * an input to scene generation, conditioning the model to preserve the face.
 */

export const replicate = new Replicate({
  auth: env.REPLICATE_API_TOKEN,
});

// SDXL model for character portraits + scene images
export const SDXL_MODEL =
  'stability-ai/sdxl:39ed52f2a788939d832ec6675557c771a6b0f9b6ce8bcd3ff0f4e4f3f1e0a6e3';

// SDXL + IP-Adapter for scene generation with character consistency
export const SDXL_IPADAPTER_MODEL = 'lucataco/sdxl-ipadapter:6f288a8d-7e5e-4f0c-8b3f-3e1f3e6e3e3e';
