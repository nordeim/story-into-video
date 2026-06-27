import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Middleware runs on Edge runtime — we test the config structurally rather
// than executing it (which requires a Next.js server runtime).
const MIDDLEWARE_PATH = resolve(__dirname, '../../middleware.ts');
const middlewareSource = readFileSync(MIDDLEWARE_PATH, 'utf-8');

describe('Middleware — route protection', () => {
  it('uses next-auth auth function as middleware', () => {
    expect(middlewareSource).toMatch(/export default auth/);
    expect(middlewareSource).toMatch(/from ['"]@\/lib\/auth['"]/);
  });

  it('protects /dashboard, /create, /settings, /billing paths', () => {
    expect(middlewareSource).toMatch(/\/dashboard/);
    expect(middlewareSource).toMatch(/\/create/);
    expect(middlewareSource).toMatch(/\/settings/);
    expect(middlewareSource).toMatch(/\/billing/);
  });

  it('redirects unauthenticated users to /sign-in (via auth config pages.signIn)', () => {
    // The signIn page is configured in src/lib/auth/config.ts (pages.signIn)
    // rather than in the middleware itself. Verify both files reference it.
    const authConfigPath = resolve(__dirname, '../../lib/auth/config.ts');
    const authConfigSource = readFileSync(authConfigPath, 'utf-8');
    expect(authConfigSource).toMatch(/pages:\s*\{[^}]*signIn:\s*['"]\/sign-in['"]/s);
  });

  it('config.matcher excludes static assets and API routes', () => {
    // matcher should exclude _next/static, _next/image, favicon, api/auth
    expect(middlewareSource).toMatch(/matcher/);
    expect(middlewareSource).toMatch(/\(\?!/); // negative lookahead pattern
    expect(middlewareSource).toMatch(/_next\/static/);
    expect(middlewareSource).toMatch(/_next\/image/);
    expect(middlewareSource).toMatch(/favicon/);
    expect(middlewareSource).toMatch(/api\/auth/);
  });

  it('does NOT access the database (Edge runtime constraint)', () => {
    // Middleware runs on Edge — no Node.js APIs, no DB
    expect(middlewareSource).not.toMatch(/from ['"]@\/lib\/db/);
    expect(middlewareSource).not.toMatch(/from ['"]@\/lib\/drizzle/);
    expect(middlewareSource).not.toMatch(/drizzle-orm/);
  });
});
