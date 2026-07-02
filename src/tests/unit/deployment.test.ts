import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * NF-1 — Production deployment configuration.
 *
 * The live site at https://storyintovideo.jesspete.shop/ runs `next dev --turbopack`
 * (confirmed by HMR client chunks, dev-mode console messages, unhashed chunk names,
 * and `cache-control: no-cache` headers). The repo only has `Dockerfile.dev` (which
 * runs `pnpm dev`). There is no production Dockerfile, no production docker-compose,
 * and no deployment runbook.
 *
 * These tests verify the production deployment artifacts exist and are correctly
 * configured to run `next start` (not `next dev`).
 */

const REPO_ROOT = resolve(__dirname, '../../..');
const DOCKERFILE_PROD_PATH = resolve(REPO_ROOT, 'Dockerfile');
const DOCKERFILE_DEV_PATH = resolve(REPO_ROOT, 'Dockerfile.dev');
const DOCKER_COMPOSE_PROD_PATH = resolve(REPO_ROOT, 'docker-compose.prod.yml');
const CI_WORKFLOW_PATH = resolve(REPO_ROOT, '.github/workflows/ci.yml');
const RUNBOOK_PATH = resolve(REPO_ROOT, 'docs/DEPLOYMENT_RUNBOOK.md');

describe('NF-1: Production Dockerfile exists and runs next start (not next dev)', () => {
  it('a production Dockerfile exists at repo root (separate from Dockerfile.dev)', () => {
    expect(existsSync(DOCKERFILE_PROD_PATH)).toBe(true);
    expect(existsSync(DOCKERFILE_DEV_PATH)).toBe(true);
  });

  it('production Dockerfile uses multi-stage build (at least 2 FROM statements)', () => {
    const source = readFileSync(DOCKERFILE_PROD_PATH, 'utf-8');
    const fromMatches = source.match(/^FROM\s/gm) ?? [];
    expect(fromMatches.length).toBeGreaterThanOrEqual(2);
  });

  it('production Dockerfile runs `next start` (via pnpm start), NOT `next dev`', () => {
    const source = readFileSync(DOCKERFILE_PROD_PATH, 'utf-8');
    // The CMD or ENTRYPOINT must invoke `next start` or `pnpm start` (which runs `next start`)
    expect(source).toMatch(/(?:next start|pnpm start)/);
    // Must NOT run `next dev` or `pnpm dev`
    expect(source).not.toMatch(/(?:next dev|pnpm dev)/);
  });

  it('production Dockerfile sets NODE_ENV=production', () => {
    const source = readFileSync(DOCKERFILE_PROD_PATH, 'utf-8');
    expect(source).toMatch(/NODE_ENV=production/);
  });

  it('production Dockerfile runs `pnpm build` in a build stage', () => {
    const source = readFileSync(DOCKERFILE_PROD_PATH, 'utf-8');
    expect(source).toMatch(/pnpm build/);
  });

  it('production Dockerfile installs ffmpeg (required for video assembly Step 6)', () => {
    const source = readFileSync(DOCKERFILE_PROD_PATH, 'utf-8');
    expect(source).toMatch(/ffmpeg/);
  });

  it('production Dockerfile uses a non-root user (security best practice)', () => {
    const source = readFileSync(DOCKERFILE_PROD_PATH, 'utf-8');
    expect(source).toMatch(/USER\s+\w+/);
  });

  it('production Dockerfile has a healthcheck', () => {
    const source = readFileSync(DOCKERFILE_PROD_PATH, 'utf-8');
    expect(source).toMatch(/HEALTHCHECK/);
  });

  it('production Dockerfile is based on node:24-alpine (matches Dockerfile.dev + engines.node >=20)', () => {
    const source = readFileSync(DOCKERFILE_PROD_PATH, 'utf-8');
    expect(source).toMatch(/node:24-alpine/);
  });
});

describe('NF-1: Production docker-compose exists (no managed services duplicated)', () => {
  it('docker-compose.prod.yml exists', () => {
    expect(existsSync(DOCKER_COMPOSE_PROD_PATH)).toBe(true);
  });

  it('docker-compose.prod.yml does NOT define a postgres service (Neon is managed)', () => {
    const source = readFileSync(DOCKER_COMPOSE_PROD_PATH, 'utf-8');
    // The prod compose should only define the web service (Neon + Upstash are external)
    expect(source).not.toMatch(/^\s+postgres:/m);
  });

  it('docker-compose.prod.yml does NOT define a redis service (Upstash is managed)', () => {
    const source = readFileSync(DOCKER_COMPOSE_PROD_PATH, 'utf-8');
    expect(source).not.toMatch(/^\s+redis:/m);
  });

  it('docker-compose.prod.yml defines a web service that builds from the production Dockerfile', () => {
    const source = readFileSync(DOCKER_COMPOSE_PROD_PATH, 'utf-8');
    expect(source).toMatch(/^\s+web:/m);
    expect(source).toMatch(/build:\s*\n\s*(?:context:\s*\.)?/);
  });
});

describe('NF-1: CI guard against dev-only chunks in production build', () => {
  it('CI workflow exists', () => {
    expect(existsSync(CI_WORKFLOW_PATH)).toBe(true);
  });

  it('CI workflow has a step that checks build output for dev-only hmr-client chunks', () => {
    const source = readFileSync(CI_WORKFLOW_PATH, 'utf-8');
    // The CI must have a step that greps the build output for hmr-client (dev-only)
    // This prevents a future regression where the production build accidentally
    // includes dev-only chunks.
    expect(source).toMatch(/hmr-client/);
  });
});

describe('NF-1: Deployment runbook exists', () => {
  it('docs/DEPLOYMENT_RUNBOOK.md exists', () => {
    expect(existsSync(RUNBOOK_PATH)).toBe(true);
  });

  it('runbook documents the production Dockerfile (recommends next start, not pnpm dev as deployment command)', () => {
    const source = readFileSync(RUNBOOK_PATH, 'utf-8');
    // The runbook must recommend `next start` as the production command
    expect(source).toMatch(/next start/i);
    // The runbook must NOT instruct users to run `pnpm dev` as a deployment step.
    // (Mentioning `next dev` in prose to explain what NOT to do is acceptable —
    // we only forbid the actual dev command `pnpm dev` in deployment instructions.)
    // Look for `pnpm dev` NOT preceded by "not" / "don't" / "never".
    const devCommandMatches = source.match(/pnpm dev/g) ?? [];
    expect(devCommandMatches.length).toBe(0);
  });

  it('runbook documents the env var requirements (NEXT_PUBLIC_APP_URL must match AUTH_URL)', () => {
    const source = readFileSync(RUNBOOK_PATH, 'utf-8');
    expect(source).toMatch(/NEXT_PUBLIC_APP_URL/);
    expect(source).toMatch(/AUTH_URL/);
  });
});
