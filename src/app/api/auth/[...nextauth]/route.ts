import { handlers } from '@/lib/auth';

// Auth.js route handler — must be dynamic (handles POST form submissions)
export const dynamic = 'force-dynamic';

export const { GET, POST } = handlers;
