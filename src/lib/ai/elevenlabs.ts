import { ElevenLabsClient } from 'elevenlabs';

import { env } from '@/lib/env';

/**
 * ElevenLabs client — used for TTS voiceover generation.
 *
 * Per ADR-006, ElevenLabs is the named TTS provider (the marketing copy
 * references them). Used for both character voices and narration.
 */

export const elevenlabs = new ElevenLabsClient({
  apiKey: env.ELEVENLABS_API_KEY,
});

// Default narration voice (can be overridden per project)
export const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel — clear, neutral
