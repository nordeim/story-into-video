import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const SIGN_IN_PATH = resolve(__dirname, '../../app/(auth)/sign-in/page.tsx');
const SIGN_UP_PATH = resolve(__dirname, '../../app/(auth)/sign-up/page.tsx');

describe('S1-06: Auth pages', () => {
  it('sign-in page exists and is a server component', () => {
    const source = readFileSync(SIGN_IN_PATH, 'utf-8');
    expect(source).toBeDefined();
    // Server component (no 'use client' at top)
    expect(source).not.toMatch(/^'use client'/m);
  });

  it('sign-up page exists and is a server component', () => {
    const source = readFileSync(SIGN_UP_PATH, 'utf-8');
    expect(source).toBeDefined();
    expect(source).not.toMatch(/^'use client'/m);
  });

  it('sign-in page renders an AuthForm with mode="sign-in"', () => {
    const source = readFileSync(SIGN_IN_PATH, 'utf-8');
    expect(source).toMatch(/AuthForm/);
    expect(source).toMatch(/mode=['"]sign-in['"]/);
  });

  it('sign-up page renders an AuthForm with mode="sign-up"', () => {
    const source = readFileSync(SIGN_UP_PATH, 'utf-8');
    expect(source).toMatch(/AuthForm/);
    expect(source).toMatch(/mode=['"]sign-up['"]/);
  });

  it('sign-in page uses the luxury-dark design system', () => {
    const source = readFileSync(SIGN_IN_PATH, 'utf-8');
    // Should use bg-background or bg-zinc-950 (the near-black bg)
    expect(source).toMatch(/bg-(background|zinc-950)/);
  });

  it('AuthForm component exists and is a client component', () => {
    const authFormPath = resolve(__dirname, '../../components/app/auth-form.tsx');
    const source = readFileSync(authFormPath, 'utf-8');
    expect(source).toMatch(/^'use client'/m);
    expect(source).toMatch(/export function AuthForm/);
  });

  it('AuthForm supports sign-in and sign-up modes via prop', () => {
    const authFormPath = resolve(__dirname, '../../components/app/auth-form.tsx');
    const source = readFileSync(authFormPath, 'utf-8');
    expect(source).toMatch(/mode:\s*['"]sign-in['"]\s*\|\s*['"]sign-up['"]/);
  });

  it('AuthForm includes a Google OAuth button', () => {
    const authFormPath = resolve(__dirname, '../../components/app/auth-form.tsx');
    const source = readFileSync(authFormPath, 'utf-8');
    expect(source).toMatch(/Google/i);
  });

  it('AuthForm includes email + password fields', () => {
    const authFormPath = resolve(__dirname, '../../components/app/auth-form.tsx');
    const source = readFileSync(authFormPath, 'utf-8');
    expect(source).toMatch(/type=['"]email['"]/);
    expect(source).toMatch(/type=['"]password['"]/);
  });
});
