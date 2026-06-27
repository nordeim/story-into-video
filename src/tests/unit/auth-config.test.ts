import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Mock the db module — Auth.js config imports db, but jsdom can't reach Postgres
vi.mock('@/lib/db', () => ({
  db: {
    select: () => ({ from: () => ({ where: () => ({ limit: () => [] }) }) }),
  },
}));

// Mock next-auth to avoid loading next/server in jsdom
vi.mock('next-auth', () => ({
  default: vi.fn(() => ({
    auth: vi.fn(),
    handlers: { GET: vi.fn(), POST: vi.fn() },
    signIn: vi.fn(),
    signOut: vi.fn(),
  })),
}));

vi.mock('next-auth/providers/google', () => ({
  default: vi.fn(() => ({ id: 'google' })),
}));

vi.mock('next-auth/providers/credentials', () => ({
  default: vi.fn(() => ({ id: 'credentials' })),
}));

vi.mock('@auth/drizzle-adapter', () => ({
  DrizzleAdapter: vi.fn(() => ({})),
}));

const CONFIG_PATH = resolve(__dirname, '../../lib/auth/config.ts');
const configSource = readFileSync(CONFIG_PATH, 'utf-8');

describe('Auth.js v5 configuration', () => {
  it('config source exports auth, handlers, signIn, signOut via NextAuth()', () => {
    expect(configSource).toMatch(/export const \{ auth, handlers, signIn, signOut \}/);
    expect(configSource).toContain('NextAuth(');
  });

  it('config uses Google + Credentials providers', () => {
    expect(configSource).toContain("from 'next-auth/providers/google'");
    expect(configSource).toContain("from 'next-auth/providers/credentials'");
    expect(configSource).toMatch(/Google\(/);
    expect(configSource).toMatch(/Credentials\(/);
  });

  it('config wires the Drizzle adapter', () => {
    expect(configSource).toContain('DrizzleAdapter(db)');
  });

  it('reads AUTH_SECRET from the validated env module (not process.env)', () => {
    expect(configSource).toContain('env.AUTH_SECRET');
    expect(configSource).not.toMatch(/process\.env\.AUTH_SECRET/);
  });

  it('conditionionally enables Google OAuth only when both ID + SECRET are set', () => {
    expect(configSource).toContain('env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET');
  });

  it('uses JWT session strategy (stateless, works on Edge runtime)', () => {
    expect(configSource).toMatch(/session:\s*\{\s*strategy:\s*['"]jwt['"]/);
  });

  // T2 (remediation): trustHost must be true so Auth.js v5 uses the incoming
  // request's Host header instead of AUTH_URL. Without this, a deployment
  // behind a reverse proxy that doesn't forward X-Forwarded-Host will redirect
  // auth callbacks to whatever AUTH_URL is set to (often http://localhost:3000
  // in dev), completely breaking authentication in production.
  it('sets trustHost: true (defensive against reverse-proxy misconfiguration)', () => {
    expect(configSource).toMatch(/trustHost:\s*true/);
  });

  it('persists user id from token into session.user.id', () => {
    expect(configSource).toContain('session.user.id = token.sub');
  });

  it('route handler exports GET and POST from handlers', () => {
    const routeSource = readFileSync(
      resolve(__dirname, '../../app/api/auth/[...nextauth]/route.ts'),
      'utf-8',
    );
    expect(routeSource).toContain("from '@/lib/auth'");
    expect(routeSource).toMatch(/export const \{ GET, POST \}/);
  });

  it('re-export barrel exports auth, handlers, signIn, signOut', () => {
    const indexSource = readFileSync(resolve(__dirname, '../../lib/auth/index.ts'), 'utf-8');
    expect(indexSource).toMatch(/export \{ auth, handlers, signIn, signOut \}/);
  });
});
