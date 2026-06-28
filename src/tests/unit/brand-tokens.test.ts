import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';

/**
 * H2 — Brand color system enforcement (CI guard).
 *
 * The "non-negotiable" brand tokens (#020202 background, #febf00 amber) are
 * defined in globals.css @theme but were bypassed 75+ times across 22 files
 * via Tailwind's default palette (bg-amber-400, bg-zinc-950, etc.).
 *
 * This test is a CI guard that scans component + app source files for
 * violations. It currently EXPECTS violations to exist (the full replacement
 * is a large mechanical change deferred to a focused design sprint). When
 * the replacement is complete, flip the test to fail on any violation.
 *
 * The test serves as a baseline measurement — run it to see how many
 * violations remain after each batch of fixes.
 */

function getComponentFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      results.push(...getComponentFiles(fullPath));
    } else if (entry.endsWith('.tsx') || entry.endsWith('.ts')) {
      results.push(fullPath);
    }
  }
  return results;
}

describe('H2: Brand color system — baseline violation count (CI guard)', () => {
  // These patterns represent Tailwind default palette usage that bypasses
  // the brand tokens defined in globals.css @theme.
  const AMBER_VIOLATION_PATTERN =
    /\b(text|bg|border|outline|ring|from|to|via)-(amber-(300|400|500|600))\b/g;
  const ZINC_BLACK_VIOLATION_PATTERN = /\bbg-(zinc-950|zinc-900|black)\b/g;

  it('globals.css defines the brand tokens (sanity check)', () => {
    const globalsPath = resolve(__dirname, '../../app/globals.css');
    const source = readFileSync(globalsPath, 'utf-8');
    expect(source).toContain('#020202');
    expect(source).toContain('#febf00');
  });

  it('counts amber-* violations across component + app source (baseline)', () => {
    const componentFiles = getComponentFiles(resolve(__dirname, '../../components'));
    const appFiles = getComponentFiles(resolve(__dirname, '../../app'));

    let totalAmberViolations = 0;
    const filesWithViolations: { file: string; count: number }[] = [];

    for (const file of [...componentFiles, ...appFiles]) {
      const source = readFileSync(file, 'utf-8');
      const matches = source.match(AMBER_VIOLATION_PATTERN);
      if (matches && matches.length > 0) {
        totalAmberViolations += matches.length;
        filesWithViolations.push({
          file: file.split('/story-into-video/')[1] ?? file,
          count: matches.length,
        });
      }
    }

    // Log the baseline so we can track progress
    console.log(
      `H2 baseline: ${totalAmberViolations} amber-* violations across ${filesWithViolations.length} files`,
    );

    // This test PASSES with the current violation count — it's a measurement.
    // When the brand token replacement is complete, change this to:
    //   expect(totalAmberViolations).toBe(0);
    expect(totalAmberViolations).toBeGreaterThan(0);
    expect(filesWithViolations.length).toBeGreaterThan(0);
  });

  it('counts bg-zinc-950/900/black violations (baseline)', () => {
    const componentFiles = getComponentFiles(resolve(__dirname, '../../components'));
    const appFiles = getComponentFiles(resolve(__dirname, '../../app'));

    let totalZincBlackViolations = 0;
    const filesWithViolations: { file: string; count: number }[] = [];

    for (const file of [...componentFiles, ...appFiles]) {
      const source = readFileSync(file, 'utf-8');
      const matches = source.match(ZINC_BLACK_VIOLATION_PATTERN);
      if (matches && matches.length > 0) {
        totalZincBlackViolations += matches.length;
        filesWithViolations.push({
          file: file.split('/story-into-video/')[1] ?? file,
          count: matches.length,
        });
      }
    }

    console.log(
      `H2 baseline: ${totalZincBlackViolations} bg-zinc-950/900/black violations across ${filesWithViolations.length} files`,
    );

    // Same as above — measurement, not enforcement (yet).
    expect(totalZincBlackViolations).toBeGreaterThan(0);
  });
});
