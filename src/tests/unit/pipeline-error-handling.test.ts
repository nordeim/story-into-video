import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * NF-6 — Pipeline error handling: every step must call setProjectFailed on error.
 *
 * Before this fix, only the `moderate` step and the image-moderation branches
 * called setProjectFailed(). Steps 1 (analyze-story), 4 (synthesize-voiceover),
 * 5 (align-subtitles), 6 (assemble-video) did NOT wrap their work in try/catch.
 * If Inngest exhausted its 3 retries, the project row stayed in a non-terminal
 * status (e.g., 'synthesizing_voice' at 65%) forever — a silent user-trust bug.
 *
 * The `complete` step is special: if it fails, the video IS already in R2 —
 * the user can still download it. So `complete` logs but does NOT call
 * setProjectFailed (marking it failed would hide a working video).
 *
 * These tests mock each step's domain function to throw, run the pipeline
 * handler, and assert setProjectFailed was called with the error message
 * (except for the `complete` step, which asserts it was NOT called).
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
  WHISPER_MODEL: 'whisper-1',
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

// Default mocks for domain functions (happy path) — individual tests override
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

vi.mock('@/features/pipeline/domain/assemble-video', () => ({
  assembleVideo: vi.fn().mockResolvedValue({
    videoBuffer: Buffer.from('fake-mp4-bytes'),
    duration: 20,
  }),
}));

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

// Pipeline queries — capture setProjectFailed calls
vi.mock('@/features/pipeline/queries', () => ({
  appendCharacter: vi.fn().mockResolvedValue({ id: 'c1', name: 'Hero' }),
  appendScene: vi.fn().mockResolvedValue({ id: 's1', order: 1 }),
  appendVoiceover: vi.fn().mockResolvedValue({ id: 'vo1', audioKey: 'p1/voiceover.mp3' }),
  appendVideo: vi.fn().mockResolvedValue({ id: 'v1', videoKey: 'p1/final.mp4' }),
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

import { analyzeStory } from '@/features/pipeline/domain/analyze-story';
import { synthesizeVoice } from '@/features/pipeline/domain/synthesize-voice';
import { alignSubtitles } from '@/features/pipeline/domain/align-subtitles';
import { assembleVideo } from '@/features/pipeline/domain/assemble-video';
import { setProjectFailed, updateProjectProgress } from '@/features/pipeline/queries';
import { pipelineFunction } from '@/features/pipeline/inngest';

// Stub global fetch — Steps 5 and 6 download audio + SRT from R2 via fetch()
const fetchMock = vi.fn().mockResolvedValue({
  arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
  text: () => Promise.resolve('1\n00:00:00,000 --> 00:00:05,000\nHello\n'),
});
vi.stubGlobal('fetch', fetchMock);

/**
 * Helper: run the pipeline handler with a mock step that just invokes the
 * callback (so step.run is transparent). Returns void; tests assert on the
 * mocked setProjectFailed / updateProjectProgress calls.
 */
async function runPipeline() {
  const fn = pipelineFunction as unknown as { handler: (ctx: unknown) => Promise<unknown> };
  const mockStep = {
    run: vi.fn(async (_name: string, cb: () => Promise<unknown>) => cb()),
  };
  const mockEvent = { data: { projectId: 'p1' } };
  await fn.handler({ event: mockEvent, step: mockStep });
}

describe('NF-6: Pipeline error handling — every step calls setProjectFailed on error', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Restore default mock implementations (clearAllMocks does NOT reset
    // implementations set via mockImplementation/mockRejectedValueOnce).
    vi.mocked(updateProjectProgress).mockResolvedValue(undefined);
    vi.mocked(analyzeStory).mockResolvedValue({
      title: 'Test',
      summary: 'A test story summary.',
      characters: [{ name: 'Hero', description: 'A brave warrior' }],
      scenes: [{ order: 1, description: 'Scene 1', characters: ['Hero'], duration_sec: 8 }],
    });
    vi.mocked(synthesizeVoice).mockResolvedValue({
      audioBuffer: Buffer.from('fake-audio'),
      duration: 42.5,
    });
    vi.mocked(alignSubtitles).mockResolvedValue({
      cues: [{ index: 1, start: 0, end: 5, text: 'Hello' }],
      srt: '1\n00:00:00,000 --> 00:00:05,000\nHello\n',
    });
    vi.mocked(assembleVideo).mockResolvedValue({
      videoBuffer: Buffer.from('fake-mp4-bytes'),
      duration: 20,
    });
    fetchMock.mockResolvedValue({
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
      text: () => Promise.resolve('1\n00:00:00,000 --> 00:00:05,000\nHello\n'),
    });
  });

  it('Step 1 (analyze-story): calls setProjectFailed when analyzeStory throws', async () => {
    vi.mocked(analyzeStory).mockRejectedValueOnce(new Error('GPT-4o rate limit exceeded'));

    // The pipeline will throw — catch it so the test doesn't fail
    await expect(runPipeline()).rejects.toThrow('GPT-4o rate limit exceeded');

    expect(setProjectFailed).toHaveBeenCalledWith(
      'p1',
      expect.stringContaining('GPT-4o rate limit exceeded'),
    );
  });

  it('Step 4 (synthesize-voiceover): calls setProjectFailed when synthesizeVoice throws', async () => {
    vi.mocked(synthesizeVoice).mockRejectedValueOnce(new Error('ElevenLabs API timeout'));

    await expect(runPipeline()).rejects.toThrow('ElevenLabs API timeout');

    expect(setProjectFailed).toHaveBeenCalledWith(
      'p1',
      expect.stringContaining('ElevenLabs API timeout'),
    );
  });

  it('Step 5 (align-subtitles): calls setProjectFailed when alignSubtitles throws', async () => {
    vi.mocked(alignSubtitles).mockRejectedValueOnce(new Error('Whisper returned no words'));

    await expect(runPipeline()).rejects.toThrow('Whisper returned no words');

    expect(setProjectFailed).toHaveBeenCalledWith(
      'p1',
      expect.stringContaining('Whisper returned no words'),
    );
  });

  it('Step 6 (assemble-video): calls setProjectFailed when assembleVideo throws', async () => {
    vi.mocked(assembleVideo).mockRejectedValueOnce(new Error('FFmpeg exited with code 1'));

    await expect(runPipeline()).rejects.toThrow('FFmpeg exited with code 1');

    expect(setProjectFailed).toHaveBeenCalledWith(
      'p1',
      expect.stringContaining('FFmpeg exited with code 1'),
    );
  });

  it('Final step (complete): does NOT call setProjectFailed when updateProjectProgress throws (video is already in R2)', async () => {
    // The complete step is the LAST updateProjectProgress call. We need all
    // prior calls to succeed (steps 0-6 set progress) and only the final call
    // (step "complete") to throw. Use a counter to throw on the 8th call.
    let callCount = 0;
    vi.mocked(updateProjectProgress).mockImplementation(async () => {
      callCount++;
      // The complete step is the 8th call (7 progress updates from steps 1-6
      // + 1 final "completed" update). Throw on the 8th.
      if (callCount === 8) {
        throw new Error('DB connection lost during complete step');
      }
      return undefined;
    });

    // The pipeline should NOT reject — the complete step swallows the error
    // (logs it but doesn't re-throw, because the video is already in R2).
    await expect(runPipeline()).resolves.not.toThrow();

    // setProjectFailed must NOT be called for the complete-step failure
    expect(setProjectFailed).not.toHaveBeenCalled();
  });

  it('Happy path: no setProjectFailed calls when all steps succeed', async () => {
    await runPipeline();
    expect(setProjectFailed).not.toHaveBeenCalled();
  });
});
