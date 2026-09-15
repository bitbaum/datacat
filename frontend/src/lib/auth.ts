import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret');

export type AuthUser = { id: string; email?: string | null };

export async function getAuthUserFromRequest(req: Request): Promise<AuthUser | null> {
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
