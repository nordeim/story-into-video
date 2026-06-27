import { CreateWizard } from '@/components/app/create-wizard';

export const metadata = {
  title: 'Create — StoryIntoVideo',
  description: 'Paste your story and generate a cinematic video with AI.',
};

/**
 * /create — the project creation wizard.
 *
 * Server component wrapping the CreateWizard client component.
 * Protected by proxy (Layer 0).
 *
 * CRITICAL: force-dynamic prevents Next.js from prerendering this page
 * at build time, ensuring the proxy auth check always runs.
 */
export const dynamic = 'force-dynamic';

export default function CreatePage() {
  return <CreateWizard />;
}
