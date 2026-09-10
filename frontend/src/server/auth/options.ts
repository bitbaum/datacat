import type { NextAuthOptions } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from '@/lib/db';
import { compare } from 'bcryptjs';
import { SignJWT } from 'jose';
import { resolveApiTokenSecret, resolveAuthSecret } from './secret';

// Signs the inner access token only. Stays JWT_SECRET-specific on purpose:
// frontend/src/lib/auth.ts and the Express backend both verify with that exact
// env var, so this key may not follow next-auth's NEXTAUTH_SECRET preference.
const apiTokenKey = new TextEncoder().encode(resolveApiTokenSecret() ?? '');

export const authOptions: NextAuthOptions = {
  // next-auth v4 refuses to run in production without this, and it was absent:
  // the key above was used ONLY for the inner token, so next-auth itself had no
  // secret and /api/auth/session 500'd on every page load. `undefined` here is
  // reachable only in a build with no runtime env — a production server without
  // a secret never gets this far (src/instrumentation.ts).
  secret: resolveAuthSecret(),
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!user || !user.passwordHash) return null;
        const ok = await compare(credentials.password, user.passwordHash);
        if (!ok) return null;
        return { id: user.id, email: user.email, name: user.name, role: user.role } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const authUser = user as { id: string; email?: string | null; role?: string };
        token.id = authUser.id;
        // Payload carries both `sub` (read by the local jose-verified /api/v1/* routes,
        // see frontend/src/lib/auth.ts) and a nested `user` claim (read by the real
        // Express backend's jsonwebtoken-verified middleware/auth.js) so the one token
        // issued at sign-in works against both API surfaces.
        token.accessToken = await new SignJWT({
          sub: authUser.id,
          email: authUser.email,
          user: { id: authUser.id, email: authUser.email, role: authUser.role },
        })
          .setProtectedHeader({ alg: 'HS256' })
          .setIssuedAt()
          .setExpirationTime('7d')
          .sign(apiTokenKey);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) (session.user as any).id = token.id as string;
      session.accessToken = token.accessToken;
      return session;
    },
  },
};
