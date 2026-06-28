import ffmpeg from 'fluent-ffmpeg';
import { writeFile, readFile, unlink } from 'fs/promises';
import { env } from '@/lib/env';

/**
 * Resolve the FFmpeg binary path.
 *
 * H1 fix: Reads from the validated env module (env.FFMPEG_PATH), NOT
 * process.env.FFMPEG_PATH directly. The previous code violated the project's
 * central "never process.env.*" rule — a typo like FFMPEG_PAHT would silently
 * fall back to /usr/bin/ffmpeg with no warning.
 *
 * Defaults to /usr/bin/ffmpeg (standard on Ubuntu/Debian/macOS Homebrew).
 *
 * This replaces the old @ffmpeg-installer/ffmpeg package which used dynamic
 * require() calls that Turbopack cannot resolve. System FFmpeg is preferred
 * because:
 *   - Zero npm dependencies → zero bundling issues
 *   - Smaller deploy footprint (~0 vs ~80MB)
 *   - The project controls its environment (Docker, self-hosted Inngest)
 *
 * Pattern source: ADR-006 (FFmpeg on server, fall back to Shotstack)
 */
export function getFfmpegPath(): string {
  return env.FFMPEG_PATH;
}

/**
 * Video assembly — composites scene images + voiceover audio + subtitles
 * into a final MP4 using FFmpeg.
 *
 * Per ADR-006, FFmpeg runs on the server (Inngest function, bypassing Vercel's
 * 300s limit). If FFmpeg proves unreliable on serverless, fall back to Shotstack.
 *
 * REWRITE (T3): The original implementation had 4 critical defects:
 *   1. Returned `Buffer.from('placeholder')` instead of reading the output file
 *   2. SRT file never written to disk (FFmpeg subtitles filter requires a path)
 *   3. `-loop 1 -t <duration>` input options built but never passed to ffmpeg()
 *   4. Filter extraction via `.find(arg => arg.includes('concat'))` was brittle
 *
 * This rewrite fixes all four by:
 *   - Writing the SRT to /tmp/siv-srt-<ts>.srt before invoking FFmpeg
 *   - Using fluent-ffmpeg's inputOptions API per image input
 *   - Reading the output file from disk into a Buffer before resolving
 *   - Passing the full filter string directly to complexFilter()
 *   - Cleaning up temp files (SRT + output MP4) after reading
 */

// Configure fluent-ffmpeg to use the system binary
ffmpeg.setFfmpegPath(getFfmpegPath());

export interface AssembleVideoInput {
  sceneImageUrls: string[];
  sceneDurations: number[]; // seconds per scene
  audioUrl: string;
  subtitlesSrt: string;
  aspectRatio: 'portrait' | 'landscape';
  resolution: '720p' | '1080p' | '4k';
}

export interface AssembleVideoOutput {
  videoBuffer: Buffer;
  duration: number;
}

const RESOLUTION_MAP = {
  '720p': { width: 720, height: 1280 },
  '1080p': { width: 1080, height: 1920 },
  '4k': { width: 2160, height: 3840 },
} as const;

function buildFilterString(
  sceneCount: number,
  dims: { width: number; height: number },
  srtPath: string,
): string {
  const concatInputs = Array.from({ length: sceneCount }, (_, i) => `[${i}:v]`).join('');
  return (
    `${concatInputs}concat=n=${sceneCount}:v=1:a=0[v0];` +
    `[v0]scale=${dims.width}:${dims.height}:force_original_aspect_ratio=decrease,` +
    `pad=${dims.width}:${dims.height}:(ow-iw)/2:(oh-ih)/2,` +
    `subtitles=${srtPath}[v]`
  );
}

/**
 * Build the full FFmpeg command-line args array.
 *
 * Exposed for unit testing — verifies the filter string contains concat, scale,
 * and subtitles in a single coherent expression (not extracted via `.find()`).
 */
export function buildFfmpegCommand(input: AssembleVideoInput, outputPath: string): string[] {
  const baseDims = RESOLUTION_MAP[input.resolution];
  const dims =
    input.aspectRatio === 'landscape'
      ? { width: baseDims.height, height: baseDims.width }
      : baseDims;

  const srtPath = `/tmp/siv-srt-${Date.now()}.srt`;
  const filterString = buildFilterString(input.sceneImageUrls.length, dims, srtPath);

  const args: string[] = ['-y'];
  // Image inputs (loop + duration applied via inputOptions on the fluent-ffmpeg chain)
  for (const url of input.sceneImageUrls) {
    args.push('-i', url);
  }
  // Audio input
  args.push('-i', input.audioUrl);
  // Filter + maps + encoding
  args.push('-filter_complex', filterString);
  args.push('-map', '[v]', '-map', `${input.sceneImageUrls.length}:a`);
  args.push('-c:v', 'libx264', '-preset', 'medium', '-crf', '23');
  args.push('-c:a', 'aac', '-b:a', '128k');
  args.push('-pix_fmt', 'yuv420p', '-movflags', '+faststart');
  args.push(outputPath);

  return args;
}

async function writeSrtFile(srtContent: string): Promise<string> {
  const srtPath = `/tmp/siv-srt-${Date.now()}.srt`;
  await writeFile(srtPath, srtContent, 'utf-8');
  return srtPath;
}

async function cleanupTempFiles(...paths: string[]): Promise<void> {
  await Promise.all(
    paths.map(async (p) => {
      try {
        await unlink(p);
      } catch {
        // Ignore cleanup errors — best-effort
      }
    }),
  );
}

export async function assembleVideo(input: AssembleVideoInput): Promise<AssembleVideoOutput> {
  const totalDuration = input.sceneDurations.reduce((sum, d) => sum + d, 0);
  const outputPath = `/tmp/siv-video-${Date.now()}.mp4`;
  const srtPath = await writeSrtFile(input.subtitlesSrt);

  const baseDims = RESOLUTION_MAP[input.resolution];
  const dims =
    input.aspectRatio === 'landscape'
      ? { width: baseDims.height, height: baseDims.width }
      : baseDims;
  const filterString = buildFilterString(input.sceneImageUrls.length, dims, srtPath);

  return new Promise((resolve, reject) => {
    const cmd = ffmpeg();

    // Add image inputs WITH their loop + duration options
    input.sceneImageUrls.forEach((url, i) => {
      const duration = input.sceneDurations[i] ?? 8;
      cmd.input(url).inputOptions(['-loop', '1', '-t', String(duration)]);
    });

    // Audio input (no loop)
    cmd.input(input.audioUrl);

    cmd
      .complexFilter(filterString)
      .outputOptions([
        '-map [v]',
        `-map ${input.sceneImageUrls.length}:a`,
        '-c:v libx264',
        '-preset medium',
        '-crf 23',
        '-c:a aac',
        '-b:a 128k',
        '-pix_fmt yuv420p',
        '-movflags +faststart',
      ])
      .save(outputPath)
      .on('end', async () => {
        try {
          const videoBuffer = await readFile(outputPath);
          await cleanupTempFiles(srtPath, outputPath);
          resolve({ videoBuffer, duration: totalDuration });
        } catch (err) {
          await cleanupTempFiles(srtPath, outputPath);
          reject(new Error(`Failed to read assembled video: ${(err as Error).message}`));
        }
      })
      .on('error', async (err) => {
        await cleanupTempFiles(srtPath, outputPath);
        reject(new Error(`FFmpeg failed: ${err.message}`));
      });
  });
}
