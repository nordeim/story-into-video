import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * T4+T5+T7 — Wire Steps 4-6 (voiceover, subtitles, video assembly) into Inngest.
 *
 * The original pipeline terminated at Step 3 (scenes) with a `complete-phase-3`
 * step that set status='completed' with progressDetail='Storyboard ready
 * (Sprint 4 will add video)'. This test verifies the pipeline now invokes:
 *   - synthesizeVoice (Step 4)
 *   - alignSubtitles (Step 5)
 *   - assembleVideo (Step 6)
 * And replaces `complete-phase-3` with a real completion step.
 */

// ── Mocks ───────────────────────────────────────────────────────────────────
vi.mock('@/lib/ai/elevenlabs', () => ({
  elevenlabs: {
    textToSpeech: { convert: vi.fn() },
  },
  DEFAULT_VOICE_ID: 'default-voice',
}));

vi.mock('@/lib/ai/openai', () => ({
  openai: {
    audio: { transcriptions: { create: vi.fn() } },
    moderations: { create: vi.fn() },
    chat: { completions: { create: vi.fn() } },
  },
  GPT_MODEL: 'gpt-4o',
}));

vi.mock('@/lib/ai/replicate', () => ({
  replicate: { run: vi.fn() },
  SDXL_MODEL: 'sdxl-model-id',
  SDXL_IPADAPTER_MODEL: 'sdxl-ipadapter-model-id',
}));

vi.mock('@/lib/storage/r2', () => ({
  putObject: vi.fn().mockResolvedValue(undefined),
  getSignedDownloadUrl: vi.fn().mockResolvedValue('https://r2.example.com/signed'),
  buildObjectKey: vi.fn((projectId: string, filename: string) => `${projectId}/${filename}`),
  getSignedUploadUrl: vi.fn(),
}));

vi.mock('@/lib/inngest/client', () => ({
  inngest: {
    createFunction: vi.fn((config, handler) => ({ config, handler })),
  },
  PIPELINE_EVENT: 'pipeline.started',
}));

// Mock the domain functions so we can assert they were called
vi.mock('@/features/pipeline/domain/analyze-story', () => ({
  analyzeStory: vi.fn().mockResolvedValue({
    title: 'Test',
    summary: 'A test story summary.',
    characters: [{ name: 'Hero', description: 'A brave warrior' }],
    scenes: [{ order: 1, description: 'Scene 1', characters: ['Hero'], duration_sec: 8 }],
  }),
}));

vi.mock('@/features/pipeline/domain/moderate-content', () => ({
  moderateContent: vi.fn().mockResolvedValue({ flagged: false, categories: [] }),
}));

vi.mock('@/features/pipeline/domain/generate-character', () => ({
  generateCharacter: vi.fn().mockResolvedValue({
    imageUrl: 'https://r2.example.com/char-1.png',
    prompt: 'A brave warrior',
    raw: { output: ['https://r2.example.com/char-1.png'] },
  }),
}));

vi.mock('@/features/pipeline/domain/generate-scene', () => ({
  generateScene: vi.fn().mockResolvedValue({
    imageUrl: 'https://r2.example.com/scene-1.png',
    prompt: 'Scene 1',
    raw: { output: ['https://r2.example.com/scene-1.png'] },
  }),
}));

// Mock moderateImage — returns safe by default (no NSFW)
vi.mock('@/features/pipeline/domain/moderate-image', () => ({
  moderateImage: vi.fn().mockResolvedValue({ flagged: false, categories: [] }),
}));

vi.mock('@/features/pipeline/domain/synthesize-voice', () => ({
  synthesizeVoice: vi.fn().mockResolvedValue({
    audioBuffer: Buffer.from('fake-audio'),
    duration: 42.5,
  }),
}));

vi.mock('@/features/pipeline/domain/align-subtitles', () => ({
  alignSubtitles: vi.fn().mockResolvedValue({
    cues: [{ index: 1, start: 0, end: 5, text: 'Hello' }],
    srt: '1\n00:00:00,000 --> 00:00:05,000\nHello\n',
  }),
}));

// Mock assembleVideo directly — its real implementation spawns FFmpeg which
// can't run in jsdom. The assemble-video.test.ts file tests it in isolation
// with mocked fluent-ffmpeg; here we just need it to return a buffer.
vi.mock('@/features/pipeline/domain/assemble-video', () => ({
  assembleVideo: vi.fn().mockResolvedValue({
    videoBuffer: Buffer.from('fake-mp4-bytes'),
    duration: 20,
  }),
  buildFfmpegCommand: vi.fn().mockReturnValue([]),
}));

// Mock fluent-ffmpeg so assemble-video can be imported without crashing
vi.mock('fluent-ffmpeg', () => {
  const ffmpegMock = vi.fn(() => ({
    input: vi.fn().mockReturnThis(),
    inputOptions: vi.fn().mockReturnThis(),
    complexFilter: vi.fn().mockReturnThis(),
    outputOptions: vi.fn().mockReturnThis(),
    save: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
  }));
  (ffmpegMock as unknown as { setFfmpegPath: typeof vi.fn }).setFfmpegPath = vi.fn();
  return { default: ffmpegMock };
});

// No @ffmpeg-installer/ffmpeg mock needed — assemble-video uses system ffmpeg via getFfmpegPath()

vi.mock('fs/promises', () => ({
  default: {
    writeFile: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn().mockResolvedValue(Buffer.from('fake-mp4')),
    unlink: vi.fn().mockResolvedValue(undefined),
  },
  writeFile: vi.fn().mockResolvedValue(undefined),
  readFile: vi.fn().mockResolvedValue(Buffer.from('fake-mp4')),
  unlink: vi.fn().mockResolvedValue(undefined),
}));

// Mock the pipeline queries — capture all calls
vi.mock('@/features/pipeline/queries', () => ({
  appendCharacter: vi.fn().mockResolvedValue({ id: 'c1', name: 'Hero' }),
  appendScene: vi.fn().mockResolvedValue({ id: 's1', order: 1 }),
  appendVoiceover: vi.fn().mockResolvedValue({
    id: 'vo1',
    projectId: 'p1',
    audioKey: 'p1/voiceover.mp3',
  }),
  appendVideo: vi.fn().mockResolvedValue({
    id: 'v1',
    projectId: 'p1',
    videoKey: 'p1/final.mp4',
  }),
  updateVideo: vi.fn().mockResolvedValue(undefined),
  updateVideoSubtitle: vi.fn().mockResolvedValue(undefined),
  updateProjectProgress: vi.fn().mockResolvedValue(undefined),
  setProjectFailed: vi.fn().mockResolvedValue(undefined),
  getProjectCharacters: vi
    .fn()
    .mockResolvedValue([{ id: 'c1', name: 'Hero', referenceImageKey: 'p1/char-1.png' }]),
  getProjectScenes: vi
    .fn()
    .mockResolvedValue([{ id: 's1', order: 1, generatedImageKey: 'p1/scene-1.png', duration: 8 }]),
  getProjectVoiceover: vi.fn().mockResolvedValue({
    id: 'vo1',
    audioKey: 'p1/voiceover.mp3',
    transcript: 'A test story summary.',
  }),
  getProjectVideo: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn().mockResolvedValue([
            {
              id: 'p1',
              story: 'A test story.',
              style: 'anime',
              aspectRatio: 'portrait',
              userId: 'u1',
            },
          ]),
        })),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({ where: vi.fn().mockResolvedValue(undefined) })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({ returning: vi.fn().mockResolvedValue([{ id: 'p1' }]) })),
    })),
  },
}));

vi.mock('@/features/billing/queries', () => ({
  // C5/C6: debitCredits now returns DebitResult { idempotent, eventId, creditsRemaining }
  // Default mock returns { idempotent: false } so the pipeline proceeds normally.
  debitCredits: vi.fn().mockResolvedValue({
    idempotent: false,
    eventId: 'evt-test',
    creditsRemaining: 100,
  }),
  getOrCreateSubscription: vi.fn(),
  InsufficientCreditsError: class extends Error {
    constructor(
      public readonly required: number,
      public readonly available: number,
    ) {
      super(`Insufficient credits: need ${required}, have ${available}`);
      this.name = 'InsufficientCreditsError';
    }
  },
}));

import { synthesizeVoice } from '@/features/pipeline/domain/synthesize-voice';
import { alignSubtitles } from '@/features/pipeline/domain/align-subtitles';
import { putObject, getSignedDownloadUrl } from '@/lib/storage/r2';
import {
  appendVoiceover,
  appendVideo,
  updateVideo,
  updateVideoSubtitle,
  updateProjectProgress,
} from '@/features/pipeline/queries';
import { debitCredits } from '@/features/billing/queries';
import { CREDIT_COSTS } from '@/features/billing/domain/tier-limits';
import { pipelineFunction } from '@/features/pipeline/inngest';

// Stub global fetch — Steps 5 and 6 download audio + SRT from R2 via fetch()
const fetchMock = vi.fn().mockResolvedValue({
  arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
  text: () => Promise.resolve('1\n00:00:00,000 --> 00:00:05,000\nHello\n'),
});
vi.stubGlobal('fetch', fetchMock);

describe('T4+T5+T7: Inngest pipeline wires Steps 4-6', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock.mockResolvedValue({
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
      text: () => Promise.resolve('1\n00:00:00,000 --> 00:00:05,000\nHello\n'),
    });
  });

  it('pipelineFunction is registered with the correct event trigger', () => {
    // The pipelineFunction is created via inngest.createFunction — our mock
    // returns { config, handler }. Verify the config has the right trigger.
    expect(pipelineFunction).toBeDefined();
    const fn = pipelineFunction as unknown as {
      config: { id: string; triggers: { event: string }[] };
    };
    expect(fn.config.id).toBe('story-to-video-pipeline');
    expect(fn.config.triggers[0]?.event).toBe('pipeline.started');
  });

  it('Step 4: calls synthesizeVoice with the analyzed story + uploads to R2 + inserts voiceover row + debits voiceover credits', async () => {
    const fn = pipelineFunction as unknown as { handler: (ctx: unknown) => Promise<unknown> };
    const mockStep = {
      run: vi.fn(async (_name: string, cb: () => Promise<unknown>) => cb()),
    };
    const mockEvent = { data: { projectId: 'p1' } };

    await fn.handler({ event: mockEvent, step: mockStep });

    // synthesizeVoice called
    expect(synthesizeVoice).toHaveBeenCalled();

    // R2 putObject called with the audio buffer
    expect(putObject).toHaveBeenCalledWith(
      'generated',
      expect.stringMatching(/^p1\/voiceover/),
      expect.any(Buffer),
      'audio/mpeg',
    );

    // appendVoiceover called with projectId + audioKey + transcript
    expect(appendVoiceover).toHaveBeenCalledWith(
      'p1',
      expect.any(String),
      expect.any(String),
      expect.stringMatching(/^p1\/voiceover/),
      expect.any(Number),
      expect.any(String),
    );

    // voiceover credits debited — idempotent via ON CONFLICT (C5)
    expect(debitCredits).toHaveBeenCalledWith(
      'u1',
      CREDIT_COSTS.voiceover,
      'voiceover',
      'p1:voiceover',
      'p1',
    );
  });

  it('Step 5: calls alignSubtitles + uploads SRT to R2 + updates video subtitle', async () => {
    const fn = pipelineFunction as unknown as { handler: (ctx: unknown) => Promise<unknown> };
    const mockStep = {
      run: vi.fn(async (_name: string, cb: () => Promise<unknown>) => cb()),
    };
    const mockEvent = { data: { projectId: 'p1' } };

    await fn.handler({ event: mockEvent, step: mockStep });

    expect(alignSubtitles).toHaveBeenCalled();
    // putObject is called multiple times (voiceover in Step 4, SRT in Step 5, video in Step 6)
    // Find the SRT call specifically
    const putObjectCalls = vi.mocked(putObject).mock.calls;
    const srtCall = putObjectCalls.find(
      (call) =>
        call[0] === 'generated' && typeof call[2] !== 'undefined' && call[3] === 'text/plain',
    );
    expect(srtCall).toBeDefined();
    expect(srtCall?.[1]).toMatch(/^p1\/subtitles/);
    expect(updateVideoSubtitle).toHaveBeenCalledWith('p1', expect.stringMatching(/^p1\/subtitles/));
    expect(debitCredits).toHaveBeenCalledWith(
      'u1',
      CREDIT_COSTS.subtitle_alignment,
      'subtitle_alignment',
      'p1:subtitle_alignment',
      'p1',
    );
  });

  it('Step 6: assembles the video via FFmpeg + uploads MP4 to R2 videos bucket + inserts video row + debits video_assembly credits', async () => {
    const fn = pipelineFunction as unknown as { handler: (ctx: unknown) => Promise<unknown> };
    const mockStep = {
      run: vi.fn(async (_name: string, cb: () => Promise<unknown>) => cb()),
    };
    const mockEvent = { data: { projectId: 'p1' } };

    await fn.handler({ event: mockEvent, step: mockStep });

    // Video uploaded to the 'videos' bucket (not 'generated')
    expect(putObject).toHaveBeenCalledWith(
      'videos',
      expect.stringMatching(/^p1\/final/),
      expect.any(Buffer),
      'video/mp4',
    );

    // appendVideo called ONCE (in Step 5 to create the row with subtitleKey)
    expect(appendVideo).toHaveBeenCalledTimes(1);
    expect(appendVideo).toHaveBeenCalledWith(
      'p1',
      null,
      expect.stringMatching(/^p1\/subtitles/),
      null,
      '720p',
    );

    // updateVideo called in Step 6 to fill in the final videoKey + duration
    expect(updateVideo).toHaveBeenCalledWith(
      'p1',
      expect.stringMatching(/^p1\/final/),
      expect.any(Number),
    );

    // video_assembly credits debited — idempotent via ON CONFLICT (C5)
    expect(debitCredits).toHaveBeenCalledWith(
      'u1',
      CREDIT_COSTS.video_assembly,
      'video_assembly',
      'p1:video_assembly',
      'p1',
    );
  });

  it('T2: Step 6 signs scene image URLs before passing to assembleVideo (not raw R2 keys)', async () => {
    const fn = pipelineFunction as unknown as { handler: (ctx: unknown) => Promise<unknown> };
    const mockStep = {
      run: vi.fn(async (_name: string, cb: () => Promise<unknown>) => cb()),
    };
    const mockEvent = { data: { projectId: 'p1' } };

    await fn.handler({ event: mockEvent, step: mockStep });

    // getSignedDownloadUrl must be called for the scene image key
    // (not just for audio + SRT). FFmpeg needs signed URLs, not R2 keys.
    const signedUrlCalls = vi.mocked(getSignedDownloadUrl).mock.calls;
    const sceneImageCall = signedUrlCalls.find(
      (call) =>
        call[0] === 'generated' && typeof call[1] === 'string' && call[1].includes('scene-1.png'),
    );
    expect(sceneImageCall).toBeDefined();
  });

  it('final step sets status=completed with progressPercent=100', async () => {
    const fn = pipelineFunction as unknown as { handler: (ctx: unknown) => Promise<unknown> };
    const mockStep = {
      run: vi.fn(async (_name: string, cb: () => Promise<unknown>) => cb()),
    };
    const mockEvent = { data: { projectId: 'p1' } };

    await fn.handler({ event: mockEvent, step: mockStep });

    // The LAST updateProjectProgress call should set status=completed, progressPercent=100
    const progressCalls = vi.mocked(updateProjectProgress).mock.calls;
    const lastCall = progressCalls[progressCalls.length - 1];
    expect(lastCall?.[1]).toBe('completed');
    expect(lastCall?.[3]).toBe(100);
  });
});

// Source-reading tests — verify the OLD placeholder step is gone
describe('T4+T5+T7: pipeline source-level guarantees', () => {
  function stripComments(src: string): string {
    return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  }

  it('does not contain the "Sprint 4 will add video" placeholder text', () => {
    const source = readFileSync(resolve(__dirname, '../../features/pipeline/inngest.ts'), 'utf-8');
    expect(source).not.toMatch(/Sprint 4 will add video/);
  });

  it('imports synthesizeVoice, alignSubtitles, and assembleVideo', () => {
    const source = readFileSync(resolve(__dirname, '../../features/pipeline/inngest.ts'), 'utf-8');
    const codeOnly = stripComments(source);
    expect(codeOnly).toMatch(/import.*synthesizeVoice.*from.*synthesize-voice/);
    expect(codeOnly).toMatch(/import.*alignSubtitles.*from.*align-subtitles/);
    expect(codeOnly).toMatch(/import.*assembleVideo.*from.*assemble-video/);
  });

  it('does not have a step named "complete-phase-3" in executable code', () => {
    const source = readFileSync(resolve(__dirname, '../../features/pipeline/inngest.ts'), 'utf-8');
    const codeOnly = stripComments(source);
    expect(codeOnly).not.toMatch(/complete-phase-3/);
  });
});
