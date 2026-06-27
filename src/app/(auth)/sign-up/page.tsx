import Link from 'next/link';

import { AuthForm } from '@/components/app/auth-form';

export const metadata = {
  title: 'Sign Up — StoryIntoVideo',
  description: 'Create your free StoryIntoVideo account and start turning stories into videos.',
};

/**
 * Sign-up page — server component wrapping the AuthForm client component.
 * Uses the luxury-dark design system (bg-zinc-950, amber accents).
 */
export default function SignUpPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-6 py-16">
      <div className="mb-8 text-center">
        <Link
          href="/"
          className="font-heading text-base font-medium tracking-tight text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
        >
          StoryIntoVideo
        </Link>
        <h1 className="font-heading mt-6 text-3xl font-bold tracking-tight text-white">
          Create your account
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Start turning your stories into cinematic videos with AI.
        </p>
      </div>
      <AuthForm mode="sign-up" />
      <p className="mt-6 text-xs text-zinc-500">
        Already have an account?{' '}
        <Link
          href="/sign-in"
          className="text-amber-400 hover:text-amber-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
        >
          Sign in
        </Link>
      </p>
    </main>
  );
}
