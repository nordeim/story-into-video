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

  it('redirects unauthenticated users to /sign-in (via explicit redirect logic)', () => {
    // The middleware now uses explicit redirect logic with NextResponse.redirect
    // instead of relying on Auth.js default behavior.
    expect(middlewareSource).toMatch(/NextResponse\.redirect/);
    expect(middlewareSource).toMatch(/\/sign-in/);
  });

  it('config.matcher lists only protected routes (no catch-all)', () => {
    // The matcher should ONLY list specific protected paths.
    // A catch-all pattern would shadow the specific matchers and
    // cause auth checks to be bypassed on protected routes.
    expect(middlewareSource).toMatch(/matcher/);
    expect(middlewareSource).toMatch(/\/dashboard/);
    expect(middlewareSource).toMatch(/\/create/);
    expect(middlewareSource).toMatch(/\/billing/);
    // Should NOT have a catch-all negative-lookahead regex pattern
    // (that was the bug that allowed /create to bypass auth)
    expect(middlewareSource).not.toMatch(/\(\?!.*_next/);
  });

  it('does NOT access the database (Edge runtime constraint)', () => {
    // Middleware runs on Edge — no Node.js APIs, no DB
    expect(middlewareSource).not.toMatch(/from ['"]@\/lib\/db/);
    expect(middlewareSource).not.toMatch(/from ['"]@\/lib\/drizzle/);
    expect(middlewareSource).not.toMatch(/drizzle-orm/);
  });
});
