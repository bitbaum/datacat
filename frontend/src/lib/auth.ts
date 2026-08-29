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
    return { id: String(payload.sub || ''), email: (payload as any).email };
  } catch {
    return null;
  }
}
