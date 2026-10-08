import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Liveness for the deploy check and the box watchdog (fleet convention:
 * `curl https://<app>.orangecat.ch/api/health`). 200 = the process is up AND
 * its database answers; 503 otherwise. The status code is the contract; the
 * body says nothing about internals — the detail goes to the log.
 *
 * datacat had no such route, so every post-deploy check read 404 and could not
 * tell a live release from a dead one.
 */
export async function GET() {
  try {
    await prisma.$queryRaw`select 1`;
  } catch (err) {
    console.error('[api/health] database unreachable:', err instanceof Error ? err.message : err);
    return NextResponse.json({ ok: false, db: false }, { status: 503 });
  }
  return NextResponse.json({ ok: true, db: true });
}
