import type { DefaultSession } from 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    // Set by the `session` callback in src/server/auth/options.ts from the JWT's `id` claim.
    user: { id: string } & DefaultSession['user'];
  }
  interface User {
    role?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
  }
}
