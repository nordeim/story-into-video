/**
 * Database seed script — populates the local dev database with test data.
 *
 * Run with: pnpm db:seed
 * Reset + seed: pnpm db:reset
 *
 * Idempotent: TRUNCATE ... CASCADE clears all data before seeding.
 */

import bcrypt from 'bcryptjs';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { env } from '@/lib/env';
import {
  users,
  subscriptions,
  projects,
  characters,
  scenes,
  videos,
  voiceovers,
  usageEvents,
} from '@/lib/db/schema';
import * as schema from '@/lib/db/schema';

async function seed() {
  console.log('🌱 Seeding database...');

  // ── 0. Clear all tables (idempotent) ──
  // Use a raw postgres client for TRUNCATE CASCADE (drizzle has no truncate helper)
  console.log('  Clearing existing data...');
  const sql = postgres(env.DATABASE_URL, { prepare: false });
  await sql`TRUNCATE TABLE
    usage_events,
    voiceovers,
    videos,
    scenes,
    characters,
    projects,
    subscriptions,
    sessions,
    accounts,
    verification_tokens,
    users
    RESTART IDENTITY CASCADE`;
  await sql.end();

  // Create a drizzle instance for ORM inserts
  const client = postgres(env.DATABASE_URL, { prepare: false });
  const db = drizzle(client, { schema });

  console.log('  ✅ All tables cleared');

  // ── 1. Create dev user ──
  console.log('  Creating dev user...');
  const passwordHash = await bcrypt.hash('password123', 10);
  const [devUser] = await db
    .insert(users)
    .values({
      name: 'Dev User',
      email: 'dev@storyintovideo.com',
      emailVerified: new Date(),
      passwordHash,
      image: null,
    })
    .returning();

  if (!devUser) throw new Error('Failed to create dev user');
  console.log(`  ✅ User: ${devUser.email} (id: ${devUser.id})`);

  // ── 2. Create free-tier subscription ──
  console.log('  Creating subscription...');
  const [sub] = await db
    .insert(subscriptions)
    .values({
      userId: devUser.id,
      plan: 'free',
      status: 'active',
      creditsRemaining: 50,
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    })
    .returning();

  if (!sub) throw new Error('Failed to create subscription');
  console.log(`  ✅ Subscription: ${sub.plan} plan, ${sub.creditsRemaining} credits`);

  // ── 3. Create demo project 1: "The Dragon's Quest" (completed) ──
  console.log('  Creating demo project 1: The Dragon\'s Quest...');
  const [project1] = await db
    .insert(projects)
    .values({
      userId: devUser.id,
      title: "The Dragon's Quest",
      story:
        'Young Aria discovers a dragon egg in the forbidden forest. As the egg hatches, she bonds with the creature and must protect it from the kingdom\'s dragon hunters. Together, they embark on a journey to find the legendary Dragon Sanctuary, facing treacherous mountains, enchanted storms, and the hunter\'s relentless pursuit. In the end, Aria must choose between the human world and her dragon companion.',
      style: 'anime',
      aspectRatio: 'portrait',
      status: 'completed',
      progressDetail: 'Video ready',
      progressPercent: 100,
      creditsCost: 131,
    })
    .returning();

  if (!project1) throw new Error('Failed to create project 1');
  console.log(`  ✅ Project 1: ${project1.title} (id: ${project1.id})`);

  // ── 4. Create characters for project 1 ──
  console.log('  Creating characters...');
  const characterData = [
    {
      name: 'Aria',
      description:
        'A brave young woman with long silver hair and emerald eyes. Wears a forest-green cloak over leather armor. Carries a wooden staff with a crystal orb.',
    },
    {
      name: 'Ember',
      description:
        'A juvenile dragon with iridescent ruby scales and golden eyes. Small wings relative to body size. Curious and playful personality.',
    },
    {
      name: 'Captain Voss',
      description:
        'A stern dragon hunter with a weathered face and a mechanical arm. Wears dark plate armor with dragon-tooth trophies. Missing his left eye.',
    },
  ];

  const insertedCharacters = [];
  for (const char of characterData) {
    const [inserted] = await db
      .insert(characters)
      .values({
        projectId: project1.id,
        name: char.name,
        description: char.description,
        referenceImageKey: `characters/${project1.id}/${char.name.toLowerCase()}.webp`,
      })
      .returning();
    if (!inserted) throw new Error(`Failed to create character: ${char.name}`);
    insertedCharacters.push(inserted);
  }
  console.log(`  ✅ ${insertedCharacters.length} characters created`);

  // ── 5. Create scenes for project 1 ──
  console.log('  Creating scenes...');
  const sceneData = [
    {
      order: 1,
      description:
        'Aria discovers a glowing dragon egg nestled in ancient roots of a massive oak tree. Morning mist swirls around her as she reaches out with wonder.',
      characters: ['Aria'],
      duration: 8,
    },
    {
      order: 2,
      description:
        'The egg cracks open, revealing baby Ember with shimmering scales. Aria holds the tiny dragon as golden light radiates from their bond.',
      characters: ['Aria', 'Ember'],
      duration: 7,
    },
    {
      order: 3,
      description:
        'Captain Voss and his hunters surround Aria in the forest clearing. Torches flicker as Voss demands she surrender the dragon.',
      characters: ['Aria', 'Ember', 'Captain Voss'],
      duration: 9,
    },
    {
      order: 4,
      description:
        'Ember breathes its first fire, creating a wall of flames that lets Aria escape. They soar above the mountain range as the sun sets.',
      characters: ['Aria', 'Ember'],
      duration: 10,
    },
    {
      order: 5,
      description:
        'An enchanted storm with lightning and magical wind spirits attacks them mid-flight. Aria clings to Ember as they navigate through the tempest.',
      characters: ['Aria', 'Ember'],
      duration: 8,
    },
    {
      order: 6,
      description:
        'Aria and Ember arrive at the Dragon Sanctuary — a hidden valley filled with dragons of all sizes. They land together as the community welcomes them home.',
      characters: ['Aria', 'Ember'],
      duration: 10,
    },
  ];

  for (const scene of sceneData) {
    await db.insert(scenes).values({
      projectId: project1.id,
      order: scene.order,
      description: scene.description,
      generatedImageKey: `scenes/${project1.id}/scene-${scene.order}.webp`,
      duration: scene.duration,
    });
  }
  console.log(`  ✅ ${sceneData.length} scenes created`);

  // ── 6. Create video for project 1 ──
  console.log('  Creating video...');
  const [video] = await db
    .insert(videos)
    .values({
      projectId: project1.id,
      videoKey: `videos/${project1.id}/final.mp4`,
      duration: 51,
      resolution: '720p',
      status: 'completed',
      subtitleKey: `videos/${project1.id}/subtitles.srt`,
    })
    .returning();

  if (!video) throw new Error('Failed to create video');
  console.log(`  ✅ Video: ${video.duration}s, ${video.resolution}`);

  // ── 7. Create voiceover for project 1 ──
  console.log('  Creating voiceover...');
  const [voiceover] = await db
    .insert(voiceovers)
    .values({
      projectId: project1.id,
      voiceId: '21m00Tcm4TlvDq8ikWAM',
      voiceName: 'Rachel',
      audioKey: `voiceovers/${project1.id}/narration.mp3`,
      duration: 51,
      transcript:
        'Young Aria discovers a dragon egg in the forbidden forest. As the egg hatches, she bonds with the creature and must protect it from the kingdom\'s dragon hunters...',
    })
    .returning();

  if (!voiceover) throw new Error('Failed to create voiceover');
  console.log(`  ✅ Voiceover: ${voiceover.voiceName}, ${voiceover.duration}s`);

  // ── 8. Create usage events for project 1 ──
  console.log('  Creating usage events...');
  const usageEventData = [
    { type: 'moderation_check' as const, cost: 0, metadata: 'passed' },
    { type: 'analysis' as const, cost: 5, metadata: 'gpt-4o' },
    { type: 'character_generation' as const, cost: 10, metadata: 'Aria portrait' },
    { type: 'character_generation' as const, cost: 10, metadata: 'Ember portrait' },
    { type: 'character_generation' as const, cost: 10, metadata: 'Captain Voss portrait' },
    { type: 'scene_generation' as const, cost: 8, metadata: 'Scene 1' },
    { type: 'scene_generation' as const, cost: 8, metadata: 'Scene 2' },
    { type: 'scene_generation' as const, cost: 8, metadata: 'Scene 3' },
    { type: 'scene_generation' as const, cost: 8, metadata: 'Scene 4' },
    { type: 'scene_generation' as const, cost: 8, metadata: 'Scene 5' },
    { type: 'scene_generation' as const, cost: 8, metadata: 'Scene 6' },
    { type: 'voiceover' as const, cost: 15, metadata: 'Rachel narration' },
    { type: 'subtitle_alignment' as const, cost: 3, metadata: 'whisper-1' },
    { type: 'video_assembly' as const, cost: 30, metadata: 'ffmpeg 720p' },
  ];

  for (const event of usageEventData) {
    await db.insert(usageEvents).values({
      userId: devUser.id,
      projectId: project1.id,
      type: event.type,
      cost: event.cost,
      metadata: event.metadata,
    });
  }
  console.log(`  ✅ ${usageEventData.length} usage events created`);

  // ── 9. Create demo project 2: "Ocean Mystery" (pending) ──
  console.log('  Creating demo project 2: Ocean Mystery...');
  const [project2] = await db
    .insert(projects)
    .values({
      userId: devUser.id,
      title: 'Ocean Mystery',
      story:
        'Marine biologist Dr. Lena Park discovers an ancient underwater structure beneath the Mariana Trench. As she investigates, she encounters bioluminescent creatures and a hidden civilization that has existed for millennia. The civilization possesses technology that could revolutionize human energy, but extracting it would destroy their ecosystem.',
      style: 'realistic',
      aspectRatio: 'landscape',
      status: 'pending',
      progressDetail: 'Pipeline queued',
      progressPercent: 0,
      creditsCost: 0,
    })
    .returning();

  if (!project2) throw new Error('Failed to create project 2');
  console.log(`  ✅ Project 2: ${project2.title} (id: ${project2.id})`);

  // ── 10. Create usage events for project 2 (just moderation) ──
  await db.insert(usageEvents).values({
    userId: devUser.id,
    projectId: project2.id,
    type: 'moderation_check',
    cost: 0,
    metadata: 'passed',
  });
  console.log('  ✅ 1 usage event for project 2');

  // Close the drizzle client connection
  await client.end();

  // ── Summary ──
  console.log('');
  console.log('🎉 Seed complete!');
  console.log('');
  console.log('Dev login:');
  console.log('  Email: dev@storyintovideo.com');
  console.log('  Password: password123');
  console.log('');
  console.log('Projects:');
  console.log(`  1. ${project1.title} (${project1.style}, ${project1.aspectRatio}) — ${project1.status}`);
  console.log(`  2. ${project2.title} (${project2.style}, ${project2.aspectRatio}) — ${project2.status}`);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
