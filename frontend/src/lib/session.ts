import { isDeliverable } from '@bitbaum/accountkit/auth';
import { authStatus, ensureProductUser, getSession } from '@/server/auth/runtime';

export interface SessionUser {
  id: string;
  email: string | null;
  name: string | null;
}

/** The signed-in person, or null. Their product row is created on first sight. */
export async function getSessionUser(): Promise<SessionUser | null> {
  if (!authStatus().ready) return null;
  const session = await getSession().catch(() => null);
  if (!session) return null;
  const row = await ensureProductUser(session.user.id).catch(() => null);
  if (!row) return null;
  return {
    id: row.id,
    email: row.email ?? (isDeliverable(session.user.email) ? session.user.email : null),
    name: row.name ?? (session.user.name || null),
  };
}
