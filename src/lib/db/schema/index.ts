/**
 * Drizzle schema barrel — re-exports all tables for easy import.
 *
 * Usage: `import { users, projects } from '@/lib/db/schema'`
 *
 * The Drizzle client (src/lib/db/index.ts) imports from this file to build
 * the schema object passed to `drizzle()` and to enable `db.query.*` relations.
 */

export { users, accounts, sessions, verificationTokens } from './auth';
export {
  projects,
  characters,
  scenes,
  projectStatusEnum,
  visualStyleEnum,
  aspectRatioEnum,
} from './projects';
export { videos, voiceovers, videoStatusEnum, videoResolutionEnum } from './media';
export {
  subscriptions,
  usageEvents,
  planEnum,
  subscriptionStatusEnum,
  usageEventTypeEnum,
} from './billing';
