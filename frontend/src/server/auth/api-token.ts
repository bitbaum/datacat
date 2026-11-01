import { SignJWT } from 'jose';
import { resolveApiTokenSecret } from './secret';

/**
 * The inner access token the `/api/v1/*` routes (src/lib/auth.ts) and the
 * Express backend (middleware/auth.js, middleware/trpc.js) verify with
 * JWT_SECRET. Carries `sub` for the first and a nested `user` claim for the
 * second, as it did when next-auth minted it. Short-lived: the page asks for
 * a fresh one with every load (`/api/account`).
 */
export async function mintApiToken(user: { id: string; email: string | null; role: string }) {
  const key = new TextEncoder().encode(resolveApiTokenSecret() ?? '');
  return new SignJWT({
    sub: user.id,
    email: user.email,
    user: { id: user.id, email: user.email, role: user.role },
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d')
    .sign(key);
}
