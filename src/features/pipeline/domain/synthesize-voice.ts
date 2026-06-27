import { elevenlabs, DEFAULT_VOICE_ID } from '@/lib/ai/elevenlabs';

/**
 * Voice synthesis — converts text to speech via ElevenLabs TTS.
 *
 * Chunks long text by sentence boundaries (ElevenLabs recommends <5000 chars
 * per request), concatenates audio buffers, and returns a single MP3.
 *
 * Pure domain function (no Next.js, no DB). The caller uploads to R2.
 */

export interface SynthesizeVoiceInput {
  text: string;
  voiceId?: string;
}

export interface SynthesizeVoiceOutput {
  audioBuffer: Buffer;
  duration: number; // seconds (estimated)
}

const MAX_CHUNK_LENGTH = 4500;

function chunkText(text: string): string[] {
  if (text.length <= MAX_CHUNK_LENGTH) return [text];

  const chunks: string[] = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  let current = '';

  for (const sentence of sentences) {
    if ((current + ' ' + sentence).length > MAX_CHUNK_LENGTH) {
      if (current) chunks.push(current.trim());
      current = sentence;
    } else {
      current = current ? `${current} ${sentence}` : sentence;
    }
  }
  if (current) chunks.push(current.trim());
  return chunks;
}

export async function synthesizeVoice(input: SynthesizeVoiceInput): Promise<SynthesizeVoiceOutput> {
  const voiceId = input.voiceId ?? DEFAULT_VOICE_ID;
  const chunks = chunkText(input.text);
  const buffers: Buffer[] = [];

  for (const chunk of chunks) {
    const audio = await elevenlabs.textToSpeech.convert(voiceId, {
      text: chunk,
      model_id: 'eleven_multilingual_v2',
      output_format: 'mp3_44100_128',
    });
    // Collect the stream into a buffer
    const chunkBuffer = await streamToBuffer(audio);
    buffers.push(chunkBuffer);
  }

  const audioBuffer = Buffer.concat(buffers);
  // Estimate duration: MP3 at 128kbps ≈ 16KB/sec
  const duration = audioBuffer.length / 16000;

  return { audioBuffer, duration };
}

async function streamToBuffer(stream: unknown): Promise<Buffer> {
  // ElevenLabs SDK returns a Readable (Node stream) or ReadableStream
  // Handle both by checking for getReader vs. async iteration
  const s = stream as {
    getReader?: () => { read: () => Promise<{ done?: boolean; value?: Uint8Array }> };
  };
  if (typeof s.getReader === 'function') {
    const reader = s.getReader();
    const chunks: Buffer[] = [];
    let done = false;
    while (!done) {
      const result = await reader.read();
      done = result.done ?? false;
      if (result.value) {
        chunks.push(Buffer.from(result.value));
      }
    }
    return Buffer.concat(chunks);
  }
  // Fallback for Node Readable
  const chunks: Buffer[] = [];
  for await (const chunk of stream as AsyncIterable<Buffer>) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}
