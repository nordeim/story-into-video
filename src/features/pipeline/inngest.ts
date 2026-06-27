import { inngest, PIPELINE_EVENT } from '@/lib/inngest/client';
import { analyzeStory } from '@/features/pipeline/domain/analyze-story';
import { moderateContent } from '@/features/pipeline/domain/moderate-content';
import { generateCharacter } from '@/features/pipeline/domain/generate-character';
import { generateScene } from '@/features/pipeline/domain/generate-scene';
import {
  appendCharacter,
  appendScene,
  updateProjectProgress,
  setProjectFailed,
  getProjectCharacters,
} from '@/features/pipeline/queries';
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
 *   4. Voiceover (ElevenLabs) — Sprint 4
 *   5. Subtitle alignment (Whisper) — Sprint 4
 *   6. Video assembly (FFmpeg) — Sprint 4
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

    // Step 2: Character generation
    await step.run('generate-characters', async () => {
      await updateProjectProgress(projectId, 'generating_characters', 'Generating characters…', 25);
      for (let i = 0; i < analysis.characters.length; i++) {
        const char = analysis.characters[i]!;
        const result = await generateCharacter({
          name: char.name,
          description: char.description,
          style: project.style,
        });
        // Store the Replicate CDN URL as the reference image key
        // (In Sprint 4 we'd upload to R2 for persistent storage)
        await appendCharacter(projectId, char.name, char.description, result.imageUrl);
      }
    });

    // Step 3: Scene generation with IP-Adapter
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
        await appendScene(
          projectId,
          scene.order,
          scene.description,
          result.imageUrl,
          scene.duration_sec,
        );
      }
    });

    // Steps 4-6 are implemented in Sprint 4 (voiceover, subtitles, assembly)
    await step.run('complete-phase-3', async () => {
      await updateProjectProgress(
        projectId,
        'completed',
        'Storyboard ready (Sprint 4 will add video)',
        75,
      );
    });

    return { success: true, projectId };
  },
);
