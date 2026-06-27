'use client';

import { SessionProvider } from 'next-auth/react';

/**
 * Providers — client-side context providers for the app.
 * Wrapped around the body in the root layout so all routes have access.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
