import { openai } from '@/lib/ai/openai';

/**
 * Subtitle alignment — uses OpenAI Whisper API to get word-level timestamps,
 * then groups words into subtitle cues (max 7 words / 2 lines).
 *
 * Pure domain function (no Next.js, no DB).
 */

export interface WordTimestamp {
  word: string;
  start: number; // seconds
  end: number; // seconds
}

export interface SubtitleCue {
  index: number;
  start: number;
  end: number;
  text: string;
}

export interface AlignSubtitlesInput {
  audioBuffer: Buffer;
  /** Optional language hint (ISO 639-1, e.g. 'en', 'ja', 'es'). Defaults to 'en'. */
  language?: string;
}

export interface AlignSubtitlesOutput {
  cues: SubtitleCue[];
  srt: string;
}

const MAX_WORDS_PER_CUE = 7;

/**
 * M4 fix: The Whisper API call now accepts an optional `language` param.
 * Without it, Whisper auto-detects — accuracy drops significantly for
 * non-English audio (especially non-Latin scripts). The caller (Inngest
 * Step 5) passes the language hint, defaulting to 'en' for backward compat.
 */
export async function alignSubtitles(input: AlignSubtitlesInput): Promise<AlignSubtitlesOutput> {
  const language = input.language ?? 'en';
  // Whisper API accepts audio file uploads
  const transcription = await openai.audio.transcriptions.create({
    file: new File([new Uint8Array(input.audioBuffer)], 'voiceover.mp3', { type: 'audio/mp3' }),
    model: 'whisper-1',
    language,
    response_format: 'verbose_json',
    timestamp_granularities: ['word'],
  });

  const words = (transcription as unknown as { words?: WordTimestamp[] }).words ?? [];
  if (words.length === 0) {
    throw new Error('Whisper returned no word timestamps');
  }

  // Group words into subtitle cues
  const cues: SubtitleCue[] = [];
  for (let i = 0; i < words.length; i += MAX_WORDS_PER_CUE) {
    const chunk = words.slice(i, i + MAX_WORDS_PER_CUE);
    const cueText = chunk.map((w) => w.word).join(' ');
    cues.push({
      index: cues.length + 1,
      start: chunk[0]!.start,
      end: chunk[chunk.length - 1]!.end,
      text: cueText,
    });
  }

  return {
    cues,
    srt: generateSrt(cues),
  };
}

function formatTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

function generateSrt(cues: SubtitleCue[]): string {
  return cues
    .map((cue) => {
      return `${cue.index}\n${formatTimestamp(cue.start)} --> ${formatTimestamp(cue.end)}\n${cue.text}\n`;
    })
    .join('\n');
}
