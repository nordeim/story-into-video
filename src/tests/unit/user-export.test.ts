import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * T3 (status_11.md) — GDPR data export endpoint GET /api/user/export.
 *
 * The Privacy Policy §6 publicly promises "Portability — receive your data
 * in a machine-readable format." This endpoint fulfills that promise.
 *
 * Pattern (mirrors /api/projects/[id]/download/route.ts):
 *   - Uses `auth()` (NOT verifySession — API routes return 401 JSON, not redirects)
 *   - Delegates DB access to features/auth/queries.ts (queries.ts boundary)
 *   - Returns JSON with user profile + projects + subscription + usage events
 */

const ROUTE_PATH = resolve(__dirname, '../../app/api/user/export/route.ts');
const QUERIES_PATH = resolve(__dirname, '../../features/auth/queries.ts');

describe('T3: GDPR data export endpoint GET /api/user/export', () => {
  function stripComments(src: string): string {
    return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  }

  it('route file exists at src/app/api/user/export/route.ts', () => {
    expect(() => readFileSync(ROUTE_PATH, 'utf-8')).not.toThrow();
  });

  it('queries.ts file exists at src/features/auth/queries.ts', () => {
    expect(() => readFileSync(QUERIES_PATH, 'utf-8')).not.toThrow();
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

  it('route imports getUserExportData from @/features/auth/queries (queries.ts boundary)', () => {
    const source = stripComments(readFileSync(ROUTE_PATH, 'utf-8'));
    expect(source).toMatch(/from ['"]@\/features\/auth\/queries['"]/);
    expect(source).toMatch(/getUserExportData/);
  });

  it('route exports GET handler with force-dynamic', () => {
    const source = stripComments(readFileSync(ROUTE_PATH, 'utf-8'));
    expect(source).toMatch(/export\s+const\s+dynamic\s*=\s*['"]force-dynamic['"]/);
    expect(source).toMatch(/export\s+async\s+function\s+GET/);
  });

  it('queries.ts exports getUserExportData function', () => {
    const source = stripComments(readFileSync(QUERIES_PATH, 'utf-8'));
    expect(source).toMatch(/export\s+async\s+function\s+getUserExportData/);
  });

  it('queries.ts imports from @/lib/db (queries.ts boundary — no raw db in route)', () => {
    const source = stripComments(readFileSync(QUERIES_PATH, 'utf-8'));
    expect(source).toMatch(/from ['"]@\/lib\/db['"]/);
  });

  it('queries.ts queries users, projects, subscriptions, and usageEvents (full export)', () => {
    const source = stripComments(readFileSync(QUERIES_PATH, 'utf-8'));
    expect(source).toMatch(/\busers\b/);
    expect(source).toMatch(/\bprojects\b/);
    expect(source).toMatch(/\bsubscriptions\b/);
    expect(source).toMatch(/\busageEvents\b/);
  });

  it('route returns 200 JSON with the export data on success', () => {
    const source = stripComments(readFileSync(ROUTE_PATH, 'utf-8'));
    expect(source).toMatch(/200/);
  });
});
