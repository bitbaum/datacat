import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { compare, hash } from 'bcryptjs';
import { Pool } from 'pg';
import { createHash } from 'node:crypto';
import { createAuthTables } from '@bitbaum/accountkit/auth/schema';
import { createAuthMailer } from '@bitbaum/accountkit/auth/mail';
import { createAuthRuntime } from '@bitbaum/accountkit/auth/next';
import { isDeliverable } from '@bitbaum/accountkit/auth';
import { prisma } from '@/lib/db';
import { resolveAuthSecret } from './secret';

/**
 * Accounts on DataCat — the fleet's one account system
 * (@bitbaum/accountkit/auth): email and password, the emailed sign-in link,
 * passkeys, two-step codes, recovery, "Continue with OrangeCat" and the shared
 * sign-in, each shown once it is configured.
 *
 * Everyone from before was imported by the Prisma migration
 * 20261101120000_accountkit_accounts under the same id: their bcrypt / $bs1$
 * hash (verified by `legacyBcrypt`) and their OrangeCat link (keyed on the
 * sub). AccountKit talks to its own `auth_*` tables through Drizzle; the
 * product's tables stay Prisma's.
 */
export const authTables = createAuthTables('auth_');

const site = {
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://datacat.orangecat.ch',
  title: process.env.NEXT_PUBLIC_BRAND_NAME || 'DataCat',
  slug: 'datacat',
};

/** Account mail through the fleet transport (RESEND_*). Off without a key. */
export const authMailer = createAuthMailer({ site });

/**
 * The session key: BETTER_AUTH_SECRET / AUTH_SECRET when set, otherwise
 * derived from the secret the box already holds (NEXTAUTH_SECRET or
 * JWT_SECRET, src/server/auth/secret.ts), so the cutover needs no new value.
 * Hashed, because AccountKit wants 32+ characters; as secret as its source
 * and the same on every start.
 */
function authEnv(): NodeJS.ProcessEnv {
  const env = process.env;
  if (env.BETTER_AUTH_SECRET?.trim() || env.AUTH_SECRET?.trim()) return env;
  const legacy = resolveAuthSecret(env);
  if (!legacy) return env;
  const derived = createHash('sha256').update(`datacat accounts:${legacy}`).digest('hex');
  return { ...env, BETTER_AUTH_SECRET: derived };
}

const globalForAuth = globalThis as unknown as { authPool?: Pool };
function database() {
  globalForAuth.authPool ??= new Pool({ connectionString: process.env.DATABASE_URL });
  return drizzle(globalForAuth.authPool);
}

export const { GET, POST, getSession, authStatus, getAuth } = createAuthRuntime({
  site,
  mail: authMailer,
  env: authEnv(),
  isDatabaseConfigured: (env) => Boolean(env.DATABASE_URL),
  getDatabase: database,
  schema: authTables,
  legacyBcrypt: { hash, compare },
  onAccountCreated: async ({ userId, providerId, accountId }) => {
    await ensureProductUser(userId, providerId === 'orangecat' ? accountId : null);
  },
});

/**
 * The product row (forms, submissions, the organisation) for a shared
 * account, under the same id, created on first sight. Its address is profile
 * data only: null when it cannot receive mail or another row holds it.
 */
export async function ensureProductUser(userId: string, orangecatSub: string | null = null) {
  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (existing) return existing;
  const [shared] = await database()
    .select()
    .from(authTables.user)
    .where(eq(authTables.user.id, userId))
    .limit(1);
  if (!shared) return null;
  const email = isDeliverable(shared.email) ? shared.email.toLowerCase() : null;
  const taken = email ? await prisma.user.findUnique({ where: { email } }) : null;
  try {
    return await prisma.user.create({
      data: {
        id: userId,
        email: taken ? null : email,
        name: shared.name || null,
        avatar: shared.image ?? null,
        orangecatSub,
      },
    });
  } catch {
    // A concurrent first request created it.
    return prisma.user.findUnique({ where: { id: userId } });
  }
}
