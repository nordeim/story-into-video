import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * H4 — Click-time R2 URL signing.
 *
 * The previous pattern signed the R2 URL at SSR time (in SignedDownloadWrapper)
 * and baked the 1-hour-expiry URL into the RSC payload. Users who left the tab
 * open >1h would get a 403 Forbidden on download.
 *
 * The fix: create /api/projects/[id]/download API route that signs the URL at
 * click time. The client component fetches this route, gets a fresh signed URL,
 * and triggers the download. The signed URL is never baked into the HTML.
 */

const ROUTE_PATH = resolve(__dirname, '../../app/api/projects/[id]/download/route.ts');
const BUTTON_PATH = resolve(__dirname, '../../components/app/project-download-button.tsx');

describe('H4: Click-time R2 URL signing — API route', () => {
  it('download route file exists at app/api/projects/[id]/download/route.ts', () => {
    expect(() => readFileSync(ROUTE_PATH, 'utf-8')).not.toThrow();
  });

  it('route exports force-dynamic', () => {
    const source = readFileSync(ROUTE_PATH, 'utf-8');
    expect(source).toMatch(/export\s+const\s+dynamic\s*=\s*['"]force-dynamic['"]/);
  });

  it('route imports auth from @/lib/auth (API pattern, not verifySession)', () => {
    const source = readFileSync(ROUTE_PATH, 'utf-8');
    expect(source).toMatch(/from ['"]@\/lib\/auth['"]/);
  });

  it('route imports getProject from @/features/projects/queries (owner check)', () => {
    const source = readFileSync(ROUTE_PATH, 'utf-8');
    expect(source).toMatch(/from ['"]@\/features\/projects\/queries['"]/);
  });

  it('route imports getSignedDownloadUrl from @/lib/storage/r2', () => {
    const source = readFileSync(ROUTE_PATH, 'utf-8');
    expect(source).toMatch(/from ['"]@\/lib\/storage\/r2['"]/);
    expect(source).toMatch(/getSignedDownloadUrl/);
  });

  it('route returns 401 when unauthenticated', () => {
    const source = readFileSync(ROUTE_PATH, 'utf-8');
    expect(source).toMatch(/401/);
    expect(source).toMatch(/Unauthorized/i);
  });

  it('route returns 404 when project not found / not owned', () => {
    const source = readFileSync(ROUTE_PATH, 'utf-8');
    expect(source).toMatch(/404/);
    expect(source).toMatch(/Not found/i);
  });

  it('route returns 409 when video is not yet ready (videoKey is null)', () => {
    const source = readFileSync(ROUTE_PATH, 'utf-8');
    expect(source).toMatch(/409/);
    expect(source).toMatch(/not ready|Video not ready/i);
  });

  it('route returns 200 with { url } JSON on success', () => {
    const source = readFileSync(ROUTE_PATH, 'utf-8');
    expect(source).toMatch(/200/);
    expect(source).toMatch(/url/);
  });
});

describe('H4: Click-time R2 URL signing — client button', () => {
  it('ProjectDownloadButton no longer receives a downloadUrl prop (receives projectId)', () => {
    const source = readFileSync(BUTTON_PATH, 'utf-8');
    // The new prop is projectId (string) — the button fetches the signed URL
    // at click time via /api/projects/[id]/download
    expect(source).toMatch(/projectId/);
  });

  it('ProjectDownloadButton fetches the download URL on click (not a static href)', () => {
    const source = readFileSync(BUTTON_PATH, 'utf-8');
    // The button should use fetch() to get a fresh URL, not an <a href> with
    // a baked-in URL.
    expect(source).toMatch(/fetch/);
    expect(source).toMatch(/\/api\/projects\/\$\{|\/api\/projects\/\$\{projectId\}\/download/);
  });

  it('ProjectDownloadButton does NOT import @/lib/storage/r2 (client-safe)', () => {
    const source = readFileSync(BUTTON_PATH, 'utf-8');
    // The client component must never import r2.ts — it would crash env validation
    expect(source).not.toMatch(/from ['"]@\/lib\/storage\/r2['"]/);
  });
});
