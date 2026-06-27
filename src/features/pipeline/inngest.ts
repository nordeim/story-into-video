import { inngest, PIPELINE_EVENT } from '@/lib/inngest/client';
import { analyzeStory } from '@/features/pipeline/domain/analyze-story';
import { moderateContent } from '@/features/pipeline/domain/moderate-content';
import { moderateImage } from '@/features/pipeline/domain/moderate-image';
import { generateCharacter } from '@/features/pipeline/domain/generate-character';
import { generateScene } from '@/features/pipeline/domain/generate-scene';
import { synthesizeVoice } from '@/features/pipeline/domain/synthesize-voice';
import { alignSubtitles } from '@/features/pipeline/domain/align-subtitles';
import { assembleVideo } from '@/features/pipeline/domain/assemble-video';
import {
  appendCharacter,
  appendScene,
  appendVoiceover,
  appendVideo,
  updateVideoSubtitle,
  updateProjectProgress,
  setProjectFailed,
  getProjectCharacters,
  getProjectScenes,
  getProjectVoiceover,
} from '@/features/pipeline/queries';
import { debitCredits } from '@/features/billing/queries';
import { CREDIT_COSTS } from '@/features/billing/domain/tier-limits';
import { putObject, getSignedDownloadUrl, buildObjectKey } from '@/lib/storage/r2';
import { DEFAULT_VOICE_ID } from '@/lib/ai/elevenlabs';
import { db } from '@/lib/db';
import { projects } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * The pipeline function — orchestrates the 6-step story-into-video generation.
 *
 * Steps:
 *   0. Moderation (re-check on pipeline start)
 *   1. Story analysis (GPT-4o → characters + scenes)
 *   2. Character generation (Replicate SDXL)
 *   3. Scene generation (Replicate SDXL + IP-Adapter)
 *   4. Voiceover (ElevenLabs TTS, chunked) — Sprint 4+5 wiring
 *   5. Subtitle alignment (Whisper ASR word timestamps → SRT) — Sprint 4+5 wiring
 *   6. Video assembly (FFmpeg → MP4) — Sprint 4+5 wiring
 *
 * Each step is idempotent (Inngest may retry). Failed steps set the project
 * to 'failed' state with an error message.
 *
 * Pattern source: skills/nextjs16-react19-postgres17/SKILL.md §7
 */

async function getProjectStory(projectId: string) {
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!project) throw new Error(`Project ${projectId} not found`);
  return project;
}

/**
 * Build the narration text from the analysis.
 * Concatenates the summary + each scene description for the voiceover.
 */
function buildNarrationText(analysis: {
  summary: string;
  scenes: { description: string }[];
}): string {
  const sceneNarrations = analysis.scenes.map((s) => s.description).join('. ');
  return `${analysis.summary}. ${sceneNarrations}`;
}

export const pipelineFunction = inngest.createFunction(
  { id: 'story-to-video-pipeline', retries: 3, triggers: [{ event: PIPELINE_EVENT }] },
  async ({ event, step }) => {
    const projectId = event.data.projectId as string;

    // Step 0: Fetch project + re-moderate
    const project = await step.run('fetch-project', async () => {
      return getProjectStory(projectId);
    });

    await step.run('moderate', async () => {
      const moderation = await moderateContent(project.story);
      if (moderation.flagged) {
        await setProjectFailed(
          projectId,
          `Content moderation flagged: ${moderation.categories.join(', ')}`,
        );
        throw new Error('Content moderation blocked the pipeline');
      }
      return moderation;
    });

    // Step 1: Story analysis
    const analysis = await step.run('analyze-story', async () => {
      await updateProjectProgress(projectId, 'analyzing', 'Analyzing story…', 10);
      return analyzeStory(project.story);
    });

    // Step 2: Character generation (with image moderation per ADR-011)
    await step.run('generate-characters', async () => {
      await updateProjectProgress(projectId, 'generating_characters', 'Generating characters…', 25);
      for (let i = 0; i < analysis.characters.length; i++) {
        const char = analysis.characters[i]!;
        const result = await generateCharacter({
          name: char.name,
          description: char.description,
          style: project.style,
        });

        // Moderate the generated image (ADR-011)
        const imageModeration = await moderateImage({
          imageUrl: result.imageUrl,
          rawOutput: result.raw,
        });
        if (imageModeration.flagged) {
          await setProjectFailed(
            projectId,
            `Character image flagged by moderation: ${imageModeration.categories.join(', ')}`,
          );
          throw new Error(`Character image moderation blocked: ${imageModeration.categories.join(', ')}`);
        }

        await appendCharacter(projectId, char.name, char.description, result.imageUrl);
      }
    });

    // Step 3: Scene generation with IP-Adapter (with image moderation per ADR-011)
    await step.run('generate-scenes', async () => {
      await updateProjectProgress(projectId, 'generating_scenes', 'Generating scenes…', 50);
      const characters = await getProjectCharacters(projectId);
      for (let i = 0; i < analysis.scenes.length; i++) {
        const scene = analysis.scenes[i]!;
        const sceneCharacters = characters.filter((c) => scene.characters.includes(c.name));
        const result = await generateScene({
          description: scene.description,
          style: project.style,
          characterReferences: sceneCharacters.map((c) => ({
            imageUrl: c.referenceImageKey!,
            name: c.name,
          })),
          aspectRatio: project.aspectRatio,
        });

        // Moderate the generated scene image (ADR-011)
        const imageModeration = await moderateImage({
          imageUrl: result.imageUrl,
          rawOutput: result.raw,
        });
        if (imageModeration.flagged) {
          await setProjectFailed(
            projectId,
            `Scene image flagged by moderation: ${imageModeration.categories.join(', ')}`,
          );
          throw new Error(`Scene image moderation blocked: ${imageModeration.categories.join(', ')}`);
        }

        await appendScene(
          projectId,
          scene.order,
          scene.description,
          result.imageUrl,
          scene.duration_sec,
        );
      }
    });

    // Step 4: Voiceover synthesis (ElevenLabs TTS, chunked)
    await step.run('synthesize-voiceover', async () => {
      await updateProjectProgress(
        projectId,
        'synthesizing_voice',
        'Synthesizing voiceover…',
        65,
      );

      const narrationText = buildNarrationText(analysis);
      const voiceResult = await synthesizeVoice({
        text: narrationText,
        voiceId: DEFAULT_VOICE_ID,
      });

      // Upload the audio buffer to R2 (generated bucket)
      const audioKey = buildObjectKey(projectId, 'voiceover.mp3');
      await putObject('generated', audioKey, voiceResult.audioBuffer, 'audio/mpeg');

      // Insert the voiceover row
      await appendVoiceover(
        projectId,
        DEFAULT_VOICE_ID,
        'Rachel',
        audioKey,
        voiceResult.duration,
        narrationText,
      );

      // Debit voiceover credits
      await debitCredits(project.userId, CREDIT_COSTS.voiceover, 'voiceover', projectId);
    });

    // Step 5: Subtitle alignment (Whisper ASR → SRT)
    await step.run('align-subtitles', async () => {
      await updateProjectProgress(
        projectId,
        'aligning_subtitles',
        'Aligning subtitles…',
        80,
      );

      // Fetch the voiceover we just created
      const voiceover = await getProjectVoiceover(projectId);
      if (!voiceover?.audioKey) {
        throw new Error('Voiceover not found for subtitle alignment');
      }

      // Download the audio from R2 to feed Whisper
      const audioDownloadUrl = await getSignedDownloadUrl('generated', voiceover.audioKey);
      const audioResponse = await fetch(audioDownloadUrl);
      const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());

      // Run Whisper ASR
      const subtitleResult = await alignSubtitles(audioBuffer);

      // Upload the SRT to R2
      const subtitleKey = buildObjectKey(projectId, 'subtitles.srt');
      await putObject(
        'generated',
        subtitleKey,
        Buffer.from(subtitleResult.srt, 'utf-8'),
        'text/plain',
      );

      // Create the video row (so we can attach the subtitle to it)
      await appendVideo(projectId, null, subtitleKey, null, '720p');
      await updateVideoSubtitle(projectId, subtitleKey);

      // Debit subtitle alignment credits
      await debitCredits(
        project.userId,
        CREDIT_COSTS.subtitle_alignment,
        'subtitle_alignment',
        projectId,
      );
    });

    // Step 6: Video assembly (FFmpeg → MP4)
    await step.run('assemble-video', async () => {
      await updateProjectProgress(
        projectId,
        'assembling_video',
        'Assembling your video…',
        90,
      );

      // Gather inputs for FFmpeg
      const scenes = await getProjectScenes(projectId);
      const voiceover = await getProjectVoiceover(projectId);
      if (!voiceover?.audioKey) {
        throw new Error('Voiceover not found for video assembly');
      }

      const audioUrl = await getSignedDownloadUrl('generated', voiceover.audioKey);

      // Fetch the SRT content (we wrote it in Step 5)
      const subtitleKey = buildObjectKey(projectId, 'subtitles.srt');
      const srtDownloadUrl = await getSignedDownloadUrl('generated', subtitleKey);
      const srtResponse = await fetch(srtDownloadUrl);
      const subtitlesSrt = await srtResponse.text();

      // Assemble the video
      const assembleResult = await assembleVideo({
        sceneImageUrls: scenes.map((s) => s.generatedImageKey!),
        sceneDurations: scenes.map((s) => s.duration ?? 8),
        audioUrl,
        subtitlesSrt,
        aspectRatio: project.aspectRatio,
        resolution: '720p',
      });

      // Upload the final MP4 to R2 (videos bucket)
      const videoKey = buildObjectKey(projectId, 'final.mp4');
      await putObject('videos', videoKey, assembleResult.videoBuffer, 'video/mp4');

      // Update the video row with the actual video key + duration
      await appendVideo(projectId, videoKey, subtitleKey, assembleResult.duration, '720p');

      // Debit video assembly credits
      await debitCredits(
        project.userId,
        CREDIT_COSTS.video_assembly,
        'video_assembly',
        projectId,
      );
    });

    // Final step: mark project as completed
    await step.run('complete', async () => {
      await updateProjectProgress(
        projectId,
        'completed',
        'Your video is ready!',
        100,
      );
    });

    return { success: true, projectId };
  },
);
