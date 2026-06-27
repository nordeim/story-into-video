import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const DASHBOARD_PATH = resolve(__dirname, '../../app/(app)/dashboard/page.tsx');
const EMPTY_STATE_PATH = resolve(__dirname, '../../components/app/empty-state.tsx');
const QUERIES_PATH = resolve(__dirname, '../../features/projects/queries.ts');

describe('S1-08: Dashboard shell + empty state', () => {
  it('dashboard page exists as a server component', () => {
    const source = readFileSync(DASHBOARD_PATH, 'utf-8');
    expect(source).toBeDefined();
    expect(source).not.toMatch(/^'use client'/m);
  });

  it('dashboard page uses Suspense with a skeleton fallback', () => {
    const source = readFileSync(DASHBOARD_PATH, 'utf-8');
    expect(source).toMatch(/Suspense/);
    expect(source).toMatch(/[Ss]keleton/);
  });

  it('dashboard page calls verifySession (auth-first)', () => {
    const source = readFileSync(DASHBOARD_PATH, 'utf-8');
    expect(source).toMatch(/verifySession/);
  });

  it('dashboard page renders EmptyState when no projects', () => {
    const source = readFileSync(DASHBOARD_PATH, 'utf-8');
    expect(source).toMatch(/EmptyState/);
  });

  it('EmptyState component exists with CTA prop', () => {
    const source = readFileSync(EMPTY_STATE_PATH, 'utf-8');
    expect(source).toMatch(/export function EmptyState/);
    expect(source).toMatch(/interface EmptyStateProps/);
  });

  it('queries.ts exports getUserProjects', () => {
    const source = readFileSync(QUERIES_PATH, 'utf-8');
    expect(source).toMatch(/export async function getUserProjects/);
  });

  it('queries.ts uses the db client (queries.ts boundary)', () => {
    const source = readFileSync(QUERIES_PATH, 'utf-8');
    expect(source).toMatch(/from ['"]@\/lib\/db['"]/);
    // db is used (either db.method or db on its own line followed by .method)
    expect(source).toMatch(/\bdb\b/);
  });

  it('dashboard uses the luxury-dark design system', () => {
    const source = readFileSync(DASHBOARD_PATH, 'utf-8');
    expect(source).toMatch(/bg-(background|zinc-950)/);
  });
});
