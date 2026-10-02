/**
 * OrangeCat identity -> datacat user. Keyed on the OIDC `sub` and nothing else.
 *
 * A known sub returns its user. An unknown sub ALWAYS creates a new user — it is
 * never linked to an existing account by email. OrangeCat's `email_verified` is
 * not trustworthy while its GoTrue auto-confirms addresses, so "same email"
 * would let anyone who registers someone's address on OrangeCat walk into that
 * person's datacat account. Email is profile data: copied when free, left null
 * when another account already holds it (users.email is unique).
 */
import { Prisma, type PrismaClient } from '@prisma/client';

export interface OrangecatIdentity {
  sub: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
}

type UserStore = Pick<PrismaClient, 'user'>;

const isUniqueViolation = (err: unknown) =>
  err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002';

export async function resolveOrangecatUser(db: UserStore, identity: OrangecatIdentity) {
  const sub = identity.sub?.trim();
  if (!sub) throw new Error('OrangeCat identity has no sub');

  const existing = await db.user.findUnique({ where: { orangecatSub: sub } });
  if (existing) return existing;

  const email = identity.email?.trim().toLowerCase() || null;
  const emailTaken = email ? Boolean(await db.user.findUnique({ where: { email } })) : false;

  try {
    return await db.user.create({
      data: {
        orangecatSub: sub,
        email: emailTaken ? null : email,
        name: identity.name ?? null,
        avatar: identity.image ?? null,
      },
    });
  } catch (err) {
    if (!isUniqueViolation(err)) throw err;
    // Lost a race: either the same sub was created concurrently (return it),
    // or the email was claimed between the check and the insert (retry without it).
    const raced = await db.user.findUnique({ where: { orangecatSub: sub } });
    if (raced) return raced;
    return db.user.create({
      data: {
        orangecatSub: sub,
        email: null,
        name: identity.name ?? null,
        avatar: identity.image ?? null,
      },
    });
  }
}
