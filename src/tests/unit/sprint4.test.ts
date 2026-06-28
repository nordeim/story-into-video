import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

vi.mock('@/lib/ai/elevenlabs', () => ({
  elevenlabs: {
    textToSpeech: {
      convert: vi.fn(),
    },
  },
  DEFAULT_VOICE_ID: 'default-voice',
}));

vi.mock('@/lib/ai/openai', () => ({
  openai: {
    audio: {
      transcriptions: {
        create: vi.fn(),
      },
    },
    moderations: { create: vi.fn() },
    chat: { completions: { create: vi.fn() } },
  },
  GPT_MODEL: 'gpt-4o',
}));

vi.mock('@/lib/stripe/client', () => ({
  stripe: {
    checkout: { sessions: { create: vi.fn() } },
    billingPortal: { sessions: { create: vi.fn() } },
    webhooks: { constructEvent: vi.fn() },
  },
  PRICE_IDS: { creator: 'price_1', pro: 'price_2', studio: 'price_3' },
}));

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn().mockResolvedValue([]),
        })),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn().mockResolvedValue(undefined),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn().mockResolvedValue(undefined),
    })),
  },
}));

import { elevenlabs } from '@/lib/ai/elevenlabs';
import { openai } from '@/lib/ai/openai';
import { synthesizeVoice } from '@/features/pipeline/domain/synthesize-voice';
import { alignSubtitles } from '@/features/pipeline/domain/align-subtitles';

describe('Sprint 4: Voiceover, Subtitles, Billing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('S4-01: ElevenLabs TTS', () => {
    it('synthesizeVoice returns an audio buffer + estimated duration', async () => {
      const mockAudioStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array([0x49, 0x44, 0x33])); // MP3 header bytes
          controller.close();
        },
      });
      vi.mocked(elevenlabs.textToSpeech.convert).mockResolvedValue(mockAudioStream as never);

      const result = await synthesizeVoice({
        text: 'Hello world.',
        voiceId: 'voice-1',
      });

      expect(result.audioBuffer).toBeInstanceOf(Buffer);
      expect(result.duration).toBeGreaterThan(0);
    });

    it('chunks long text into multiple requests', async () => {
      // Return a fresh stream for each call (streams are single-use)
      const convertMock = elevenlabs.textToSpeech.convert as unknown as ReturnType<typeof vi.fn>;
      convertMock.mockImplementation(async () => {
        return new ReadableStream({
          start(controller) {
            controller.enqueue(new Uint8Array([0x49, 0x44, 0x33]));
            controller.close();
          },
        }) as never;
      });

      const longText = 'A sentence. '.repeat(500); // ~6500 chars
      await synthesizeVoice({ text: longText });

      // Should have been called multiple times (chunked)
      expect(convertMock.mock.calls.length).toBeGreaterThan(1);
    });

    it('uses the default voice when no voiceId provided', async () => {
      const mockAudioStream = new ReadableStream({
        start(controller) {
          controller.close();
        },
      });
      vi.mocked(elevenlabs.textToSpeech.convert).mockResolvedValue(mockAudioStream as never);

      await synthesizeVoice({ text: 'Test.' });
      expect(elevenlabs.textToSpeech.convert).toHaveBeenCalledWith(
        'default-voice',
        expect.anything(),
      );
    });
  });

  describe('S4-02: Whisper ASR subtitle alignment', () => {
    it('alignSubtitles returns cues + SRT format', async () => {
      vi.mocked(openai.audio.transcriptions.create).mockResolvedValue({
        words: [
          { word: 'Hello', start: 0, end: 0.5 },
          { word: 'world', start: 0.5, end: 1.0 },
          { word: 'this', start: 1.0, end: 1.5 },
          { word: 'is', start: 1.5, end: 2.0 },
          { word: 'a', start: 2.0, end: 2.2 },
          { word: 'test', start: 2.2, end: 2.7 },
          { word: 'of', start: 2.7, end: 3.0 },
          { word: 'subtitles', start: 3.0, end: 3.8 },
        ],
      } as never);

      const result = await alignSubtitles({ audioBuffer: Buffer.from('audio') });

      expect(result.cues.length).toBeGreaterThan(0);
      expect(result.cues[0]?.text).toContain('Hello');
      expect(result.srt).toContain('-->');
      expect(result.srt).toContain('1\n');
    });

    it('throws when Whisper returns no words', async () => {
      vi.mocked(openai.audio.transcriptions.create).mockResolvedValue({ words: [] } as never);

      await expect(alignSubtitles({ audioBuffer: Buffer.from('audio') })).rejects.toThrow(
        /no word/i,
      );
    });

    it('groups words into cues of max 7 words', async () => {
      const words = Array.from({ length: 15 }, (_, i) => ({
        word: `word${i}`,
        start: i * 0.5,
        end: i * 0.5 + 0.5,
      }));
      vi.mocked(openai.audio.transcriptions.create).mockResolvedValue({ words } as never);

      const result = await alignSubtitles({ audioBuffer: Buffer.from('audio') });
      // 15 words / 7 per cue = 3 cues (7 + 7 + 1)
      expect(result.cues).toHaveLength(3);
    });
  });

  describe('S4-05: Stripe configuration', () => {
    it('stripe client is configured', () => {
      const stripeClientPath = resolve(__dirname, '../../lib/stripe/client.ts');
      const source = readFileSync(stripeClientPath, 'utf-8');
      expect(source).toMatch(/export const stripe/);
      expect(source).toMatch(/STRIPE_SECRET_KEY/);
    });

    it('webhook route verifies signature', () => {
      const webhookPath = resolve(__dirname, '../../app/api/stripe/webhook/route.ts');
      const source = readFileSync(webhookPath, 'utf-8');
      expect(source).toMatch(/constructEvent/);
      expect(source).toMatch(/stripe-signature/);
    });

    it('webhook route handles checkout.session.completed', () => {
      const webhookPath = resolve(__dirname, '../../app/api/stripe/webhook/route.ts');
      const source = readFileSync(webhookPath, 'utf-8');
      expect(source).toMatch(/checkout\.session\.completed/);
      expect(source).toMatch(/customer\.subscription\.updated/);
      expect(source).toMatch(/customer\.subscription\.deleted/);
      expect(source).toMatch(/invoice\.payment_failed/);
    });

    it('webhook route is idempotent (uses ON CONFLICT DO NOTHING, H7)', () => {
      const webhookPath = resolve(__dirname, '../../app/api/stripe/webhook/route.ts');
      const source = readFileSync(webhookPath, 'utf-8');
      // H7: idempotency now via ON CONFLICT (idempotency_key) DO NOTHING,
      // not the old TOCTOU SELECT-then-INSERT pattern.
      expect(source).toMatch(/onConflictDoNothing/);
      expect(source).toMatch(/duplicate/);
    });

    it('billing page renders the 4 tier plans', () => {
      const billingPath = resolve(__dirname, '../../app/(app)/billing/page.tsx');
      const source = readFileSync(billingPath, 'utf-8');
      expect(source).toMatch(/free/);
      expect(source).toMatch(/creator/);
      expect(source).toMatch(/pro/);
      expect(source).toMatch(/studio/);
    });

    it('checkoutAction is a Server Action with auth-first', () => {
      const actionsPath = resolve(__dirname, '../../features/billing/actions.ts');
      const source = readFileSync(actionsPath, 'utf-8');
      expect(source).toMatch(/^'use server'/m);
      expect(source).toMatch(/verifySession/);
    });
  });
});
