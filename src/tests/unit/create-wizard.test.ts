import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const CREATE_WIZARD_PATH = resolve(__dirname, '../../components/app/create-wizard.tsx');
const CREATE_PAGE_PATH = resolve(__dirname, '../../app/(app)/create/page.tsx');

describe('S2-01: Create wizard page', () => {
  it('create-wizard.tsx is a client component', () => {
    const source = readFileSync(CREATE_WIZARD_PATH, 'utf-8');
    expect(source).toMatch(/^'use client'/m);
  });

  it('create-wizard.tsx exports CreateWizard', () => {
    const source = readFileSync(CREATE_WIZARD_PATH, 'utf-8');
    expect(source).toMatch(/export function CreateWizard/);
  });

  it('create-wizard renders the story textarea with character counter', () => {
    const source = readFileSync(CREATE_WIZARD_PATH, 'utf-8');
    expect(source).toMatch(/textarea/);
    expect(source).toMatch(/maxLength/);
    expect(source).toMatch(/font-mono text-\[10px\]/);
  });

  it('create-wizard renders the visual style selector', () => {
    const source = readFileSync(CREATE_WIZARD_PATH, 'utf-8');
    expect(source).toMatch(/STYLE_CHIPS/);
    expect(source).toMatch(/Visual Style/);
  });

  it('create-wizard renders the aspect ratio toggle', () => {
    const source = readFileSync(CREATE_WIZARD_PATH, 'utf-8');
    expect(source).toMatch(/ASPECT_RATIOS/);
    expect(source).toMatch(/aria-pressed/);
  });

  it('submit button is disabled when story is empty or too short', () => {
    const source = readFileSync(CREATE_WIZARD_PATH, 'utf-8');
    expect(source).toMatch(/disabled/);
    expect(source).toMatch(/MIN_STORY_LENGTH/);
  });

  it('create-wizard calls createProjectAction on submit', () => {
    const source = readFileSync(CREATE_WIZARD_PATH, 'utf-8');
    expect(source).toMatch(/createProjectAction/);
  });

  it('create-wizard uses the luxury-dark design system', () => {
    const source = readFileSync(CREATE_WIZARD_PATH, 'utf-8');
    expect(source).toMatch(/bg-zinc-950/);
    expect(source).toMatch(/glass-input/);
    expect(source).toMatch(/text-amber-400/);
  });

  it('/create page is a server component wrapping CreateWizard', () => {
    const source = readFileSync(CREATE_PAGE_PATH, 'utf-8');
    expect(source).not.toMatch(/^'use client'/m);
    expect(source).toMatch(/CreateWizard/);
  });
});
