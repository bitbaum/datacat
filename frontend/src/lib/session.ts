import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth/options';

export async function getSessionUser() {
  const session = await getServerSession(authOptions).catch(() => null);
  return session?.user
    ? { id: (session.user as any).id as string, email: session.user.email, name: session.user.name }
    : null;
}
