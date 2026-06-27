import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * T12 — Legal pages (/privacy, /terms).
 *
 * Mandatory for production launch (Stripe + GDPR + CCPA requirements).
 * Both must be Server Components (no client-side state needed).
 */

describe('T12: Legal pages source-level guarantees', () => {
  function stripComments(src: string): string {
    return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  }

  describe('/privacy page', () => {
    const privacyPath = resolve(__dirname, '../../app/(legal)/privacy/page.tsx');

    it('file exists', () => {
      expect(() => readFileSync(privacyPath, 'utf-8')).not.toThrow();
    });

    it('is a server component (no "use client")', () => {
      const source = readFileSync(privacyPath, 'utf-8');
      expect(source).not.toMatch(/^['"]use client['"]/m);
    });

    it('contains "Privacy Policy" heading', () => {
      const source = readFileSync(privacyPath, 'utf-8');
      expect(source).toMatch(/Privacy Policy/i);
    });

    it('covers required sections: data collection, use, retention, user rights, contact', () => {
      const source = readFileSync(privacyPath, 'utf-8');
      expect(source).toMatch(/Data (We |)Collect/i);
      expect(source).toMatch(/How We Use/i);
      expect(source).toMatch(/Data Retention|Retention/i);
      expect(source).toMatch(/Your Rights|User Rights/i);
      expect(source).toMatch(/Contact/i);
    });

    it('mentions AI-generated content + third-party AI providers', () => {
      const source = readFileSync(privacyPath, 'utf-8');
      expect(source).toMatch(/AI|artificial intelligence/i);
      expect(source).toMatch(/OpenAI|Replicate|ElevenLabs/i);
    });
  });

  describe('/terms page', () => {
    const termsPath = resolve(__dirname, '../../app/(legal)/terms/page.tsx');

    it('file exists', () => {
      expect(() => readFileSync(termsPath, 'utf-8')).not.toThrow();
    });

    it('is a server component (no "use client")', () => {
      const source = readFileSync(termsPath, 'utf-8');
      expect(source).not.toMatch(/^['"]use client['"]/m);
    });

    it('contains "Terms of Service" heading', () => {
      const source = readFileSync(termsPath, 'utf-8');
      expect(source).toMatch(/Terms of Service/i);
    });

    it('covers required sections: acceptance, use, IP, liability, termination', () => {
      const source = readFileSync(termsPath, 'utf-8');
      expect(source).toMatch(/Acceptance/i);
      expect(source).toMatch(/Use of (the )?Service/i);
      expect(source).toMatch(/Intellectual Property|Content Ownership/i);
      expect(source).toMatch(/Limitation of Liability/i);
      expect(source).toMatch(/Termination/i);
    });

    it('addresses user content + AI-generated output ownership', () => {
      const source = readFileSync(termsPath, 'utf-8');
      const codeOnly = stripComments(source);
      expect(codeOnly).toMatch(/user content|your content|User Content/i);
      expect(codeOnly).toMatch(/AI-generated|generated content/i);
    });
  });
});
