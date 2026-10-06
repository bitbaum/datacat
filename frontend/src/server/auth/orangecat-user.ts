/**
 * OrangeCat identity -> datacat user, keyed on the OIDC `sub` and nothing else.
 *
 * The rule is @bitbaum/accountkit/orangecat's `resolveOrangecatUser`, shared by
 * every bitbaum app: a known sub returns its user; an unknown sub ALWAYS
 * creates a new one and is never linked to an existing account by email
 * (OrangeCat's GoTrue auto-confirms addresses, so "same email" would let anyone
 * who registers someone's address on OrangeCat walk into their datacat
 * account). It also survives the insert race: a concurrent sign-in of the same
 * sub returns that row, an address claimed mid-insert falls back.
 *
 * What is datacat's own is this store. users.email is nullable, so where the
 * shared rule would store a `.invalid` placeholder, datacat stores null — no
 * made-up address ever reaches the UI or the API token.
 */
import type { PrismaClient, User } from '@prisma/client';
import {
  isPlaceholderEmail,
  resolveOrangecatUser as resolveBySub,
  type OrangecatUserStore,
} from '@bitbaum/accountkit/orangecat';

type UserStore = Pick<PrismaClient, 'user'>;

export function prismaOrangecatStore(db: UserStore): OrangecatUserStore<User> {
  return {
    findBySub: (sub) => db.user.findUnique({ where: { orangecatSub: sub } }),
    emailTaken: async (email) => Boolean(await db.user.findUnique({ where: { email } })),
    insert: ({ orangecatSub, email, name, image }) =>
      db.user.create({
        data: {
          orangecatSub,
          email: isPlaceholderEmail(email) ? null : email,
          name,
          avatar: image,
        },
      }),
    attachSub: async (userId, sub) => {
      const { count } = await db.user.updateMany({
        where: { id: userId, OR: [{ orangecatSub: null }, { orangecatSub: sub }] },
        data: { orangecatSub: sub },
      });
      return count > 0;
    },
  };
}

export interface OrangecatIdentity {
  sub: string;
  contactEmail?: string | null;
  name?: string | null;
  image?: string | null;
}

export function resolveOrangecatUser(db: UserStore, identity: OrangecatIdentity) {
  return resolveBySub(prismaOrangecatStore(db), identity);
}
