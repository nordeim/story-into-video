import OpenAI from 'openai';

import { env } from '@/lib/env';

/**
 * OpenAI client — used for GPT-4o (story analysis), Whisper (ASR),
 * and Moderation API.
 *
 * Single shared instance (the SDK is designed for reuse).
 */

export const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

export const GPT_MODEL = 'gpt-4o';
export const WHISPER_MODEL = 'whisper-1';
