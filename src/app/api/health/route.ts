import { NextResponse } from 'next/server';

/**
 * Health check endpoint — used by Docker HEALTHCHECK and container
 * orchestration. Returns 200 when the app is responsive.
 */
export async function GET() {
  return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
}
