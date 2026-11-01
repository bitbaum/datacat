import { authLabelsFor, signInMethods } from '@bitbaum/accountkit/auth';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/session';
import { mintApiToken } from '@/server/auth/api-token';
import { authMailer, authStatus } from '@/server/auth/runtime';

export const dynamic = 'force-dynamic';

/**
 * Who is signed in, the API token for their requests, and which ways in this
 * deployment offers (booleans only), with the sign-in words — what AuthContext and the sign-in modal read.
 */
export async function GET() {
  const methods = signInMethods(process.env, authMailer.configured);
  const ready = authStatus().ready;
  const user = await getSessionUser().catch(() => null);
  const row = user ? await prisma.user.findUnique({ where: { id: user.id } }) : null;
  const token = row ? await mintApiToken({ id: row.id, email: row.email, role: row.role }) : null;
  return Response.json(
    { user, token, methods, ready, labels: authLabelsFor('de') },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
