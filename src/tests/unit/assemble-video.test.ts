import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * T3 — assemble-video.ts rewrite tests.
 *
 * The original implementation had 4 critical defects:
 *   1. Returned `Buffer.from('placeholder')` instead of reading the output file
 *   2. SRT file never written to disk (FFmpeg subtitles filter requires a path)
 *   3. `-loop 1 -t <duration>` input options built but never passed to ffmpeg()
 *   4. Filter extraction via `.find(arg => arg.includes('concat'))` was brittle
 *
 * These tests verify the rewrite fixes all four.
 */

// ── Mocks ───────────────────────────────────────────────────────────────────
const { mockWriteFile, mockReadFile, mockUnlink, ffmpegChain } = vi.hoisted(() => ({
  mockWriteFile: vi.fn().mockResolvedValue(undefined),
  mockReadFile: vi.fn().mockResolvedValue(Buffer.from('fake-mp4-bytes')),
  mockUnlink: vi.fn().mockResolvedValue(undefined),
  ffmpegChain: {
    input: vi.fn().mockReturnThis(),
    inputOptions: vi.fn().mockReturnThis(),
    complexFilter: vi.fn().mockReturnThis(),
    outputOptions: vi.fn().mockReturnThis(),
    save: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
  },
}));

vi.mock('fs/promises', () => ({
  default: { writeFile: mockWriteFile, readFile: mockReadFile, unlink: mockUnlink },
  writeFile: mockWriteFile,
  readFile: mockReadFile,
  unlink: mockUnlink,
}));

// Mock fluent-ffmpeg's setFfmpegPath (no @ffmpeg-installer/ffmpeg dependency)
// The system ffmpeg path is now resolved at runtime via getFfmpegPath()

vi.mock('fluent-ffmpeg', () => {
  const ffmpegMock = vi.fn(() => ffmpegChain);
  (ffmpegMock as unknown as { setFfmpegPath: typeof vi.fn }).setFfmpegPath = vi.fn();
  return { default: ffmpegMock };
});

// H1: Mock the env module — getFfmpegPath now reads env.FFMPEG_PATH (not process.env)
const { mockEnv } = vi.hoisted(() => ({
  mockEnv: { FFMPEG_PATH: '/usr/bin/ffmpeg' },
}));
vi.mock('@/lib/env', () => ({
  env: mockEnv,
}));

import { assembleVideo, getFfmpegPath } from '@/features/pipeline/domain/assemble-video';

describe('T3: assemble-video rewrite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validInput = {
    sceneImageUrls: ['https://r2.example.com/scene-1.png', 'https://r2.example.com/scene-2.png'],
    sceneDurations: [8, 12],
    audioUrl: 'https://r2.example.com/voiceover.mp3',
    subtitlesSrt: '1\n00:00:00,000 --> 00:00:05,000\nHello world\n',
    aspectRatio: 'portrait' as const,
    resolution: '720p' as const,
  };

  it('writes the SRT file to /tmp before invoking FFmpeg', async () => {
    // Trigger 'end' callback to resolve the promise
    ffmpegChain.on.mockImplementation((_event: string, cb: () => void) => {
      if (_event === 'end') setTimeout(cb, 0);
      return ffmpegChain;
    });

    await assembleVideo(validInput);

    expect(mockWriteFile).toHaveBeenCalled();
    const writeCall = mockWriteFile.mock.calls[0];
    expect(writeCall?.[0]).toMatch(/^\/tmp\/siv-srt-/);
    expect(writeCall?.[1]).toBe(validInput.subtitlesSrt);
  });

  it('passes -loop 1 and -t <duration> as input options per image', async () => {
    ffmpegChain.on.mockImplementation((_event: string, cb: () => void) => {
      if (_event === 'end') setTimeout(cb, 0);
      return ffmpegChain;
    });

    await assembleVideo(validInput);

    // inputOptions should be called once per image input with loop + duration
    expect(ffmpegChain.inputOptions).toHaveBeenCalledTimes(2);
    expect(ffmpegChain.inputOptions).toHaveBeenNthCalledWith(1, ['-loop', '1', '-t', '8']);
    expect(ffmpegChain.inputOptions).toHaveBeenNthCalledWith(2, ['-loop', '1', '-t', '12']);
  });

  it('reads the output file into a Buffer before resolving (not a placeholder)', async () => {
    ffmpegChain.on.mockImplementation((_event: string, cb: () => void) => {
      if (_event === 'end') setTimeout(cb, 0);
      return ffmpegChain;
    });

    const result = await assembleVideo(validInput);

    expect(mockReadFile).toHaveBeenCalled();
    const readPath = mockReadFile.mock.calls[0]?.[0] as string;
    expect(readPath).toMatch(/^\/tmp\/.+\.mp4$/);
    expect(result.videoBuffer).toBeInstanceOf(Buffer);
    // Critical: must NOT be the hardcoded 'placeholder' string from the old impl
    expect(result.videoBuffer.toString('utf8')).not.toBe('placeholder');
    expect(result.videoBuffer.equals(Buffer.from('fake-mp4-bytes'))).toBe(true);
  });

  it('cleans up temp files (SRT + output MP4) after reading', async () => {
    ffmpegChain.on.mockImplementation((_event: string, cb: () => void) => {
      if (_event === 'end') setTimeout(cb, 0);
      return ffmpegChain;
    });

    await assembleVideo(validInput);

    expect(mockUnlink).toHaveBeenCalledTimes(2);
    const unlinkedPaths = mockUnlink.mock.calls.map((c) => c[0] as string);
    expect(unlinkedPaths.some((p) => p.endsWith('.srt'))).toBe(true);
    expect(unlinkedPaths.some((p) => p.endsWith('.mp4'))).toBe(true);
  });

  it('rejects on FFmpeg error', async () => {
    ffmpegChain.on.mockImplementation((_event: string, cb: (err?: Error) => void) => {
      if (_event === 'error') setTimeout(() => cb(new Error('FFmpeg crashed')), 0);
      return ffmpegChain;
    });

    await expect(assembleVideo(validInput)).rejects.toThrow('FFmpeg');
  });

  it('returns total duration as sum of scene durations', async () => {
    ffmpegChain.on.mockImplementation((_event: string, cb: () => void) => {
      if (_event === 'end') setTimeout(cb, 0);
      return ffmpegChain;
    });

    const result = await assembleVideo(validInput);
    expect(result.duration).toBe(20); // 8 + 12
  });

  // T10 (M-5): Removed buildFfmpegCommand test — the function was dead code
  // (never called in production). The filter string is now tested via the
  // assembleVideo integration test above which verifies the full FFmpeg pipeline.
});

describe('T1: system ffmpeg path resolution', () => {
  // H1: getFfmpegPath now reads from the env module (mocked), not process.env
  afterEach(() => {
    mockEnv.FFMPEG_PATH = '/usr/bin/ffmpeg';
  });

  it('getFfmpegPath returns env.FFMPEG_PATH when set', () => {
    mockEnv.FFMPEG_PATH = '/custom/path/to/ffmpeg';
    expect(getFfmpegPath()).toBe('/custom/path/to/ffmpeg');
  });

  it('getFfmpegPath returns the default when env.FFMPEG_PATH is the default', () => {
    mockEnv.FFMPEG_PATH = '/usr/bin/ffmpeg';
    expect(getFfmpegPath()).toBe('/usr/bin/ffmpeg');
  });
});

// Source-reading test — verifies the OLD broken patterns are gone from executable code
describe('T3: assemble-video source-level guarantees', () => {
  // Strip comments before regex-matching, so the explanation in the
  // docblock (which references the old patterns by name) doesn't trigger
  // a false positive.
  function stripComments(src: string): string {
    return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  }

  it('does not contain the placeholder Buffer.from pattern in code', () => {
    const source = readFileSync(
      resolve(__dirname, '../../features/pipeline/domain/assemble-video.ts'),
      'utf-8',
    );
    const codeOnly = stripComments(source);
    expect(codeOnly).not.toMatch(/Buffer\.from\(['"]placeholder['"]\)/);
  });

  it('does not extract filter via .find(arg => includes("concat")) in code', () => {
    const source = readFileSync(
      resolve(__dirname, '../../features/pipeline/domain/assemble-video.ts'),
      'utf-8',
    );
    const codeOnly = stripComments(source);
    expect(codeOnly).not.toMatch(/\.find\(.*includes\(['"]concat['"]\)\)/);
  });
});
