import Link from 'next/link';

import { AuthForm } from '@/components/app/auth-form';

export const metadata = {
  title: 'Sign In — StoryIntoVideo',
  description: 'Sign in to your StoryIntoVideo account to continue creating videos.',
};

/**
 * Sign-in page — server component wrapping the AuthForm client component.
 * Uses the luxury-dark design system (bg-background, amber accents).
 */
export default function SignInPage() {
  return (
    <main className="bg-background flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="mb-8 text-center">
        <Link
          href="/"
          className="font-heading focus-visible:outline-primary text-base font-medium tracking-tight text-white focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          StoryIntoVideo
        </Link>
        <h1 className="font-heading mt-6 text-3xl font-bold tracking-tight text-white">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Sign in to continue turning your stories into videos.
        </p>
      </div>
      <AuthForm mode="sign-in" />
      <p className="mt-6 text-xs text-zinc-500">
        Don&apos;t have an account?{' '}
        <Link
          href="/sign-up"
          className="text-primary hover:text-primary focus-visible:outline-primary focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Sign up
        </Link>
      </p>
    </main>
  );
}
