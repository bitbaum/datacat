import { jwtVerify } from 'jose';
import { getSessionUser } from './session';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret');

export type AuthUser = { id: string; email?: string | null };

/**
 * The caller of an `/api/v1/*` route: the inner API token when one is sent
 * (the Express backend's format, minted by /api/account), otherwise the
 * signed-in account's session cookie.
 */
export async function getAuthUserFromRequest(req: Request): Promise<AuthUser | null> {
  const fromToken = await fromApiToken(req);
  if (fromToken) return fromToken;
  const user = await getSessionUser().catch(() => null);
  return user ? { id: user.id, email: user.email } : null;
}

async function fromApiToken(req: Request): Promise<AuthUser | null> {
  const headerAuth = req.headers.get('authorization');
  const xToken = req.headers.get('x-auth-token');
  const raw = headerAuth?.startsWith('Bearer ') ? headerAuth.slice(7) : headerAuth || xToken || '';
  if (!raw) return null;
  try {
    const { payload } = await jwtVerify(raw, secret);
    // `email` is a private claim (signed in src/server/auth/options.ts), so jose types it as unknown.
    return {
      id: String(payload.sub || ''),
      email: typeof payload.email === 'string' ? payload.email : null,
    };
  } catch {
    return null;
  }
}
