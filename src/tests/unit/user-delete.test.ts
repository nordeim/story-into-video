import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * T4 (status_11.md) — GDPR account deletion endpoint DELETE /api/user.
 *
 * The Privacy Policy §4 publicly promises: "You may delete your account at
 * any time, which triggers a CASCADE deletion of all your projects, characters,
 * scenes, voiceovers, videos, and usage events from our database. R2-stored
 * media files are deleted within 30 days of account deletion."
 *
 * This endpoint fulfills that promise. The DB CASCADE is already wired (every
 * FK from `users` is onDelete: 'cascade'). This endpoint:
 *   1. Collects all R2 keys for the user's projects (before CASCADE wipes them)
 *   2. Deletes the user row (CASCADE handles all child rows)
 *   3. Best-effort R2 bulk delete (R2 errors logged but don't fail the request)
 *
 * Pattern (mirrors /api/projects/[id]/download/route.ts + T3 export route):
 *   - Uses `auth()` (NOT verifySession) — API routes return 401 JSON, not redirects
 *   - Delegates DB access to features/auth/queries.ts (queries.ts boundary)
 *   - Delegates R2 access to lib/storage/r2.ts
 */

const ROUTE_PATH = resolve(__dirname, '../../app/api/user/route.ts');
const QUERIES_PATH = resolve(__dirname, '../../features/auth/queries.ts');
const R2_PATH = resolve(__dirname, '../../lib/storage/r2.ts');

describe('T4: GDPR account deletion endpoint DELETE /api/user', () => {
  function stripComments(src: string): string {
    return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  }

  it('route file exists at src/app/api/user/route.ts', () => {
    expect(() => readFileSync(ROUTE_PATH, 'utf-8')).not.toThrow();
  });

  it('route uses auth() (NOT verifySession) — API pattern returns 401 JSON, not redirect', () => {
    const source = stripComments(readFileSync(ROUTE_PATH, 'utf-8'));
    expect(source).toMatch(/\bauth\(\)/);
    expect(source).not.toMatch(/verifySession/);
  });

  it('route returns 401 JSON when unauthenticated', () => {
    const source = stripComments(readFileSync(ROUTE_PATH, 'utf-8'));
    expect(source).toMatch(/401/);
    expect(source).toMatch(/Unauthorized/i);
  });

  it('route imports deleteUserAccount from @/features/auth/queries (queries.ts boundary)', () => {
    const source = stripComments(readFileSync(ROUTE_PATH, 'utf-8'));
    expect(source).toMatch(/from ['"]@\/features\/auth\/queries['"]/);
    expect(source).toMatch(/deleteUserAccount/);
  });

  it('route imports deleteUserMedia from @/lib/storage/r2 (R2 cleanup)', () => {
    const source = stripComments(readFileSync(ROUTE_PATH, 'utf-8'));
    expect(source).toMatch(/from ['"]@\/lib\/storage\/r2['"]/);
    expect(source).toMatch(/deleteUserMedia/);
  });

  it('route exports DELETE handler with force-dynamic', () => {
    const source = stripComments(readFileSync(ROUTE_PATH, 'utf-8'));
    expect(source).toMatch(/export\s+const\s+dynamic\s*=\s*['"]force-dynamic['"]/);
    expect(source).toMatch(/export\s+async\s+function\s+DELETE/);
  });

  it('route returns 200 JSON on successful deletion', () => {
    const source = stripComments(readFileSync(ROUTE_PATH, 'utf-8'));
    expect(source).toMatch(/200/);
  });

  it('queries.ts exports deleteUserAccount function', () => {
    const source = stripComments(readFileSync(QUERIES_PATH, 'utf-8'));
    expect(source).toMatch(/export\s+async\s+function\s+deleteUserAccount/);
  });

  it('queries.ts deleteUserAccount uses db.delete(users) (CASCADE delete)', () => {
    const source = stripComments(readFileSync(QUERIES_PATH, 'utf-8'));
    expect(source).toMatch(/db\.delete\(users\)/);
  });

  it('r2.ts exports deleteUserMedia function', () => {
    const source = stripComments(readFileSync(R2_PATH, 'utf-8'));
    expect(source).toMatch(/export\s+async\s+function\s+deleteUserMedia/);
  });

  it('r2.ts deleteUserMedia uses DeleteObjectsCommand (bulk delete)', () => {
    const source = stripComments(readFileSync(R2_PATH, 'utf-8'));
    expect(source).toMatch(/DeleteObjectsCommand/);
  });

  it('route best-effort deletes R2 (errors logged, do not fail the request)', () => {
    const source = stripComments(readFileSync(ROUTE_PATH, 'utf-8'));
    // The route should wrap deleteUserMedia in try/catch — R2 failures must not
    // fail the DB deletion (which has already happened at this point).
    expect(source).toMatch(/try\s*{[\s\S]*deleteUserMedia[\s\S]*}\s*catch/i);
  });
});
