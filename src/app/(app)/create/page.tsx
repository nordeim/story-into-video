import { CreateWizard } from '@/components/app/create-wizard';

export const metadata = {
  title: 'Create — StoryIntoVideo',
  description: 'Paste your story and generate a cinematic video with AI.',
};

/**
 * /create — the project creation wizard.
 *
 * Server component wrapping the CreateWizard client component.
 * Protected by middleware (Layer 0).
 */
export default function CreatePage() {
  return <CreateWizard />;
}
