/**
 * The account-takeover guard: an OrangeCat sign-in is keyed on `sub` alone.
 * A new sub must never resolve to an existing user because the emails match —
 * OrangeCat's email_verified is not trustworthy while GoTrue auto-confirms.
 */
import { describe, expect, it } from 'vitest';
import { Prisma } from '@prisma/client';
import { resolveOrangecatUser } from './orangecat-user';

interface Row {
  id: string;
  email: string | null;
  orangecatSub: string | null;
  name: string | null;
  avatar: string | null;
  role: string;
}

/** An in-memory `users` table that enforces the two unique indexes like Postgres. */
function fakeDb(seed: Partial<Row>[] = [], opts: { raceEmail?: string } = {}) {
  const rows: Row[] = seed.map((r, i) => ({
    id: `u${i}`,
    email: null,
    orangecatSub: null,
    name: null,
    avatar: null,
    role: 'USER',
    ...r,
  }));
  let next = rows.length;
  const unique = () =>
    new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: 'test',
    });
  const user = {
    findUnique: async ({ where }: { where: { email?: string; orangecatSub?: string } }) =>
      rows.find((r) =>
        where.orangecatSub !== undefined
          ? r.orangecatSub === where.orangecatSub
          : r.email === where.email,
      ) ?? null,
    create: async ({ data }: { data: Partial<Row> }) => {
      if (opts.raceEmail && data.email === opts.raceEmail) {
        // Someone registered this email between our check and our insert.
        rows.push({
          id: `u${next++}`,
          email: opts.raceEmail,
          orangecatSub: null,
          name: null,
          avatar: null,
          role: 'USER',
        });
        opts.raceEmail = undefined;
      }
      if (data.email && rows.some((r) => r.email === data.email)) throw unique();
      if (data.orangecatSub && rows.some((r) => r.orangecatSub === data.orangecatSub))
        throw unique();
      const row: Row = {
        id: `u${next++}`,
        email: null,
        orangecatSub: null,
        name: null,
        avatar: null,
        role: 'USER',
        ...data,
      };
      rows.push(row);
      return row;
    },
  };
  return { db: { user } as never, rows };
}

describe('resolveOrangecatUser', () => {
  it('never resolves a NEW sub to an existing user by email', async () => {
    const { db, rows } = fakeDb([{ email: 'victim@example.com', name: 'Victim' }]);

    const user = await resolveOrangecatUser(db, {
      sub: 'actor-new',
      contactEmail: 'victim@example.com',
    });

    expect(user.id).not.toBe('u0');
    expect(user.orangecatSub).toBe('actor-new');
    // The existing account is untouched: no sub was attached to it.
    expect(rows[0]).toMatchObject({ id: 'u0', orangecatSub: null, email: 'victim@example.com' });
    // Email is profile data; it stays with the account that already held it.
    // (accountkit would store a .invalid placeholder; datacat stores null.)
    expect(user.email).toBeNull();
  });

  it('creates a user for a new sub, copying the free email as profile data', async () => {
    const { db } = fakeDb();
    const user = await resolveOrangecatUser(db, {
      sub: 'actor-1',
      contactEmail: 'New@Example.com',
      name: 'N',
    });
    expect(user).toMatchObject({ orangecatSub: 'actor-1', email: 'new@example.com', name: 'N' });
  });

  it('returns the same user for a known sub, whatever email OrangeCat now reports', async () => {
    const { db, rows } = fakeDb([{ orangecatSub: 'actor-1', email: 'old@example.com' }]);
    const user = await resolveOrangecatUser(db, {
      sub: 'actor-1',
      contactEmail: 'changed@example.com',
    });
    expect(user.id).toBe('u0');
    expect(rows).toHaveLength(1);
  });

  it('still creates a separate user when the email is claimed mid-insert', async () => {
    const { db, rows } = fakeDb([], { raceEmail: 'race@example.com' });
    const user = await resolveOrangecatUser(db, {
      sub: 'actor-2',
      contactEmail: 'race@example.com',
    });
    expect(user).toMatchObject({ orangecatSub: 'actor-2', email: null });
    expect(rows.filter((r) => r.email === 'race@example.com')).toHaveLength(1);
  });

  it('refuses an identity without a sub', async () => {
    const { db } = fakeDb();
    await expect(resolveOrangecatUser(db, { sub: '' })).rejects.toThrow(/sub/);
  });
});
