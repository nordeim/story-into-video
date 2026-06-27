import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const NAV_LINKS_PATH = resolve(__dirname, '../../lib/data/nav-links.ts');
const NAV_LINKS_SOURCE = readFileSync(NAV_LINKS_PATH, 'utf-8');

const NAVBAR_PATH = resolve(__dirname, '../../components/sections/navbar.tsx');
const NAVBAR_SOURCE = readFileSync(NAVBAR_PATH, 'utf-8');

const HERO_PATH = resolve(__dirname, '../../components/sections/hero.tsx');
const HERO_SOURCE = readFileSync(HERO_PATH, 'utf-8');

const FINAL_CTA_PATH = resolve(__dirname, '../../components/sections/final-cta.tsx');
const FINAL_CTA_SOURCE = readFileSync(FINAL_CTA_PATH, 'utf-8');

const FEATURES_PATH = resolve(__dirname, '../../components/sections/features.tsx');
const FEATURES_SOURCE = readFileSync(FEATURES_PATH, 'utf-8');

const TESTIMONIALS_PATH = resolve(__dirname, '../../components/sections/testimonials.tsx');
const TESTIMONIALS_SOURCE = readFileSync(TESTIMONIALS_PATH, 'utf-8');

const USE_CASES_PATH = resolve(__dirname, '../../components/sections/use-cases.tsx');
const USE_CASES_SOURCE = readFileSync(USE_CASES_PATH, 'utf-8');

const FOOTER_LINKS_PATH = resolve(__dirname, '../../lib/data/footer-links.ts');
const FOOTER_LINKS_SOURCE = readFileSync(FOOTER_LINKS_PATH, 'utf-8');

describe('S1-09: Marketing CTAs wired to real routes', () => {
  it('nav-links.ts: Pricing → /pricing, Blog → /blog, Contact → /contact', () => {
    expect(NAV_LINKS_SOURCE).toMatch(/label:\s*['"]Pricing['"],\s*href:\s*['"]\/pricing['"]/);
    expect(NAV_LINKS_SOURCE).toMatch(/label:\s*['"]Blog['"],\s*href:\s*['"]\/blog['"]/);
    expect(NAV_LINKS_SOURCE).toMatch(/label:\s*['"]Contact['"],\s*href:\s*['"]\/contact['"]/);
  });

  it('navbar.tsx: Sign in → /sign-in (not #)', () => {
    expect(NAVBAR_SOURCE).toMatch(/href=['"]\/sign-in['"]/);
    expect(NAVBAR_SOURCE).not.toMatch(/Sign in[\s\S]*href=['"]#['"]/);
  });

  it('navbar.tsx: Get Started → /sign-up (not /auth/sign-up)', () => {
    expect(NAVBAR_SOURCE).toMatch(/href=['"]\/sign-up['"]/);
    expect(NAVBAR_SOURCE).not.toMatch(/\/auth\/sign-up/);
  });

  it('hero.tsx: Start Creating → /create (not /auth/sign-up)', () => {
    expect(HERO_SOURCE).toMatch(/href=['"]\/create['"]/);
    expect(HERO_SOURCE).not.toMatch(/\/auth\/sign-up/);
  });

  it('final-cta.tsx: CTA → /create', () => {
    expect(FINAL_CTA_SOURCE).toMatch(/href=['"]\/create['"]/);
  });

  it('features.tsx: CTA → /create (not #)', () => {
    expect(FEATURES_SOURCE).toMatch(/href=['"]\/create['"]/);
  });

  it('testimonials.tsx: CTA → /create (not #)', () => {
    expect(TESTIMONIALS_SOURCE).toMatch(/href=['"]\/create['"]/);
  });

  it('use-cases.ts: card links → /create (not #)', () => {
    const useCasesDataPath = resolve(__dirname, '../../lib/data/use-cases.ts');
    const useCasesDataSource = readFileSync(useCasesDataPath, 'utf-8');
    expect(useCasesDataSource).toMatch(/href:\s*['"]\/create['"]/);
    expect(useCasesDataSource).not.toMatch(/href:\s*['"]#['"]/);
  });

  it('workflow.tsx: step CTAs route to /create (defined in workflow-steps.ts)', () => {
    const workflowStepsPath = resolve(__dirname, '../../lib/data/workflow-steps.ts');
    const workflowStepsSource = readFileSync(workflowStepsPath, 'utf-8');
    // All 4 ctaHref should be /create, not #
    expect(workflowStepsSource).toMatch(/ctaHref:\s*['"]\/create['"]/g);
    expect(workflowStepsSource).not.toMatch(/ctaHref:\s*['"]#['"]/);
  });

  it('footer-links.ts: Privacy/Terms/Contact link to real routes (not #)', () => {
    expect(FOOTER_LINKS_SOURCE).toMatch(
      /label:\s*['"]Privacy Policy['"],\s*href:\s*['"]\/privacy['"]/,
    );
    expect(FOOTER_LINKS_SOURCE).toMatch(
      /label:\s*['"]Terms of Service['"],\s*href:\s*['"]\/terms['"]/,
    );
    expect(FOOTER_LINKS_SOURCE).toMatch(/label:\s*['"]Contact Us['"],\s*href:\s*['"]\/contact['"]/);
  });

  it('no remaining href="#" placeholders in section components', () => {
    const SECTION_FILES = [
      NAVBAR_SOURCE,
      HERO_SOURCE,
      FINAL_CTA_SOURCE,
      FEATURES_SOURCE,
      TESTIMONIALS_SOURCE,
      USE_CASES_SOURCE,
    ];
    // Allow href="#" only in mobile nav (Sign in link in Sheet uses href)
    // The CTA components must not have href="#"
    for (const source of SECTION_FILES) {
      // features.tsx, testimonials.tsx had CtaGhost href="#" before — now should be /create
      if (source === NAVBAR_SOURCE) continue; // navbar has mobile sheet links
      expect(source).not.toMatch(/href=['"]#['"]/);
    }
  });
});
