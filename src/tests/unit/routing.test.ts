import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const PAGE_PATH = resolve(__dirname, '../../app/page.tsx');
const pageSource = readFileSync(PAGE_PATH, 'utf-8');

describe('Routing — force-static removal (ADR: hybrid rendering)', () => {
  it('page.tsx does NOT export dynamic = "force-static"', () => {
    // The marketing page must not be force-static. Per the Production Readiness
    // Plan, the app becomes hybrid: the marketing page can still be statically
    // prerendered (it has no dynamic data), but the app routes (dashboard, create,
    // etc.) are dynamic. Removing force-static allows Next.js to choose per-route.
    expect(pageSource).not.toContain("dynamic = 'force-static'");
    expect(pageSource).not.toContain('dynamic = "force-static"');
  });

  it('page.tsx still composes all 10 sections in the correct order', () => {
    // Regression guard: restructuring must not change the section composition.
    expect(pageSource).toContain('Navbar');
    expect(pageSource).toContain('Hero');
    expect(pageSource).toContain('Examples');
    expect(pageSource).toContain('Workflow');
    expect(pageSource).toContain('Features');
    expect(pageSource).toContain('Testimonials');
    expect(pageSource).toContain('UseCases');
    expect(pageSource).toContain('Faq');
    expect(pageSource).toContain('FinalCTA');
    expect(pageSource).toContain('Footer');
  });
});
