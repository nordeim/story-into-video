import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { env } from '@/lib/env';
import * as schema from './schema';

/**
 * Drizzle database client — uses Neon's pooled connection string for the app.
 *
 * The pooled connection (`-pooler` host) reuses connections across requests,
 * avoiding connection exhaustion under load. Migrations should use the
 * UNPOOLED connection (in drizzle.config.ts) — pooling + DDL is unreliable.
 *
 * Note: `postgres()` creates a client object but does NOT connect until a
 * query is actually executed. This allows the module to be imported during
 * Next.js build (page-data collection) without a live DB connection — the
 * connection is established only when the first query runs at request time.
 *
 * Pattern source: skills/nextjs16-react19-postgres17/SKILL.md §2, §5
 */

type Database = PostgresJsDatabase<typeof schema>;

const queryClient = postgres(env.DATABASE_URL, {
  prepare: false,
  connect_timeout: 10,
  idle_timeout: 20,
  max_lifetime: 60 * 30,
});

export const db: Database = drizzle(queryClient, { schema });

export type { Database };
export { schema };
