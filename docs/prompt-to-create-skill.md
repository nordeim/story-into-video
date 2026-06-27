lease meticulously plan to distill all your knowledge and know-how about the current project into a skill with a filename `storyintovideo_SKILL.md`

create a comprehensive, detailed skill file for this project. This document will serve as a complete guide for other coding agents to replicate the design, architecture, and quality of this codebase.  
use the sample skill file attached as a structure reference while ensuring that every section is deeply informed by the project's actual code, design decisions, and the issues you've resolved. This document will be a concrete reference—containing exact className patterns, color values, the reasoning behind custom hooks, and the debugging of the import.meta.glob paths.

Skill document structure:

1. Project Identity & Design Philosophy: The exact design tokens, typography hierarchy, and brutalist constraints.
2. Tech Stack & Environment: Exact versions and the critical erasableSyntaxOnly flag.
3. Bootstrapping & Configuration: How to set up the Vite/Tailwind v4 environment from scratch to match.
4. The Design System (Code-First): Exact CSS variables, Tailwind v4 @theme implementation, and brutalist rules.
5. Component Architecture & Patterns: The "Engineered Soul" component philosophy, data flow, and specific component breakdowns (HeroKinetic, BentoGrid, etc.).
6. Custom Hooks Deep Dive: useWeightedScroll and useRouteHash implementation details.
7. Content Management: How import.meta.glob works and the exact file structure for content ingestion.
8. Accessibility (WCAG AAA) Implementation: The useReducedMotion hook and global CSS overrides.
9. Anti-Patterns & Common Bugs: A compilation of every issue found (rounded corners, empty alt, key stability, glob paths) and their exact fixes.
10. Debugging Guide: Step-by-step verification for common issues (broken images, type errors, build failures).
11. Pre-Ship Checklist: Exact commands (pnpm typecheck, pnpm build) and what to verify.

Plan first and then create the new SKILL.md, ensuring that it's comprehensive and directly references the codebase.

For example, captures extensive project knowledge, including:

1. Design Philosophy: The "Tactile Brutalism" vs "High-End Editorial" thesis
2. Exact Design Tokens: The 28px grid, brutalist borders, typography hierarchy
3. Bootstrapping from Zero: How to recreate this project from npm create vite@latest
4. Component Architecture: How each major piece (HeroKinetic, BentoGrid, etc.) is built
5. The import.meta.glob Bug: Detailed documentation of the path resolution issue that broke all content loading
6. Content Ingestion Pattern: How to add new media and the critical path fix
7. Anti-Patterns & Common Bugs: All issues found with root causes and exact fixes
8. Pre-Ship Checklist: Every item an agent must verify before claiming completion
9. WCAG AAA Accessibility Rules: Specific checks for alt text, reduced motion, and contrast
10. Meticulous Approach: The mandatory six-phase workflow for all changes
11. Lessons learnt and how to avoid or workaround them
12. Pitfalls to avoid
13. Best practices
14. Coding patterns and anti-patterns

Ensure that the new SKILL.md covers:

1. Project Identity & Design Philosophy
2. Tech Stack & Environment
3. Bootstrapping & Configuration
4. The Design System (Code-First)
5. Component Architecture & Patterns
6. Custom Hooks Deep Dive
7. Content Management: import.meta.glob
8. Accessibility (WCAG AAA) Implementation
9. Anti-Patterns & Common Bugs
10. Debugging Guide
11. Pre-Ship Checklist
12. Lessons Learnt & How to Avoid Them
13. Pitfalls to Avoid
14. Best Practices
15. Coding Patterns
16. Coding Anti-Patterns
17. Responsive Breakpoint Reference
18. Z-Index Layer Map
19. Color Reference (Complete)
20. The Complete TypeScript Interface Reference

Need to validate:

1. Tech stack versions match
2. Configuration files match
3. Design system tokens match
4. Component architecture matches
5. Hooks implementation matches
6. Content ingestion patterns match
7. Accessibility implementation matches
8. Anti-patterns are documented correctly
9. Color references match
10. TypeScript interfaces match
