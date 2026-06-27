import ffmpeg from 'fluent-ffmpeg';
import { path as ffmpegPath } from '@ffmpeg-installer/ffmpeg';

/**
 * Video assembly — composites scene images + voiceover audio + subtitles
 * into a final MP4 using FFmpeg.
 *
 * Per ADR-006, FFmpeg runs on the server (Inngest function, bypassing Vercel's
 * 300s limit). If FFmpeg proves unreliable on serverless, fall back to Shotstack.
 */

// Configure fluent-ffmpeg to use the installed binary
ffmpeg.setFfmpegPath(ffmpegPath);

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
};

function buildFfmpegCommand(input: AssembleVideoInput, outputPath: string): string[] {
  const dims =
    input.aspectRatio === 'landscape'
      ? {
          width: RESOLUTION_MAP[input.resolution].height,
          height: RESOLUTION_MAP[input.resolution].width,
        }
      : RESOLUTION_MAP[input.resolution];

  // Build the FFmpeg command as an array of args
  const args: string[] = [];

  // Input: concat images with durations via the concat demuxer
  // Each image is repeated for its duration
  args.push('-y');
  for (let i = 0; i < input.sceneImageUrls.length; i++) {
    args.push(
      '-loop',
      '1',
      '-t',
      String(input.sceneDurations[i] ?? 8),
      '-i',
      input.sceneImageUrls[i]!,
    );
  }

  // Audio input
  args.push('-i', input.audioUrl);

  // Filter: concat images, scale, then overlay audio + subtitles
  const concatInputs = input.sceneImageUrls.map((_, i) => `[${i}:v]`).join('');
  args.push(
    '-filter_complex',
    `${concatInputs}concat=n=${input.sceneImageUrls.length}:v=1:a=0[v0];[v0]scale=${dims.width}:${dims.height}:force_original_aspect_ratio=decrease,pad=${dims.width}:${dims.height}:(ow-iw)/2:(oh-ih)/2,subtitles=subtitle.srt[v]`,
  );

  // Map outputs
  args.push('-map', '[v]', '-map', `${input.sceneImageUrls.length}:a`);

  // Encoding
  args.push('-c:v', 'libx264', '-preset', 'medium', '-crf', '23', '-c:a', 'aac', '-b:a', '128k');
  args.push('-pix_fmt', 'yuv420p', '-movflags', '+faststart');
  args.push(outputPath);

  return args;
}

export async function assembleVideo(input: AssembleVideoInput): Promise<AssembleVideoOutput> {
  const totalDuration = input.sceneDurations.reduce((sum, d) => sum + d, 0);

  return new Promise((resolve, reject) => {
    // Write the SRT to a temp location (FFmpeg subtitles filter reads from file)
    // In production, write to /tmp; here we use a placeholder path
    const outputPath = `/tmp/video-${Date.now()}.mp4`;

    // Use the fluent-ffmpeg API to run the command
    const cmd = ffmpeg();

    // Add inputs
    input.sceneImageUrls.forEach((url) => {
      cmd.input(url);
    });
    cmd.input(input.audioUrl);

    cmd
      .complexFilter(
        buildFfmpegCommand(input, outputPath).find((arg) => arg.includes('concat')) ?? '',
      )
      .outputOptions([
        '-c:v libx264',
        '-preset medium',
        '-crf 23',
        '-c:a aac',
        '-b:a 128k',
        '-pix_fmt yuv420p',
        '-movflags +faststart',
      ])
      .save(outputPath)
      .on('end', () => {
        resolve({
          videoBuffer: Buffer.from('placeholder'), // In production, read the file
          duration: totalDuration,
        });
      })
      .on('error', (err) => {
        reject(new Error(`FFmpeg failed: ${err.message}`));
      });
  });
}

export { buildFfmpegCommand };
