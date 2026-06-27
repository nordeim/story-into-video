import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { eq } from 'drizzle-orm';

import { env } from '@/lib/env';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';

/**
 * Auth.js v5 configuration.
 *
 * Providers:
 *   - Google OAuth (optional — enabled when GOOGLE_CLIENT_ID + SECRET are set)
 *   - Credentials (email + password via bcryptjs)
 *
 * Adapter: @auth/drizzle-adapter wired to our Drizzle schema (users, accounts,
 * sessions, verificationTokens).
 *
 * Pattern source: skills/nextjs16-react19-postgres17/SKILL.md §5, §6
 *
 * CRITICAL: AUTH_SECRET is read from the validated `env` module, never
 * process.env directly. This prevents typos from silently disabling auth.
 */

const providers = [
  // Google OAuth — conditionally enabled (both ID + SECRET required)
  ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
    ? [Google({ clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET })]
    : []),
  // Credentials — email + password
  Credentials({
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      if (!credentials?.email || typeof credentials.email !== 'string') return null;
      if (!credentials?.password || typeof credentials.password !== 'string') return null;

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, credentials.email))
        .limit(1);

      if (!user) return null;

      // Password hash is null for OAuth-only users (Google signups) — they
      // cannot log in via credentials.
      if (!user.passwordHash) return null;

      const valid = await bcrypt.compare(credentials.password, user.passwordHash);
      if (!valid) return null;

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      };
    },
  }),
];

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  session: { strategy: 'jwt' },
  providers,
  secret: env.AUTH_SECRET,
  pages: {
    signIn: '/sign-in',
  },
  callbacks: {
    async session({ session, token }) {
      // Persist the user id from the token into the session
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
