import type { NextAuthOptions } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from '@/lib/db';
import { compare } from 'bcryptjs';
import { SignJWT } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret');

export const authOptions: NextAuthOptions = {
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
          .sign(secret);
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


