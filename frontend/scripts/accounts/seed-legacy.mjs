#!/usr/bin/env node
/**
 * People as the NextAuth-era server stored them, so CI can prove each kind
 * still gets in after the import (prisma/migrations/20261101120000_accountkit_accounts):
 *   - LEGACY_EMAIL / LEGACY_PASSWORD: a password in today's $bs1$ format
 *     (createPasswordHasher, as src/server/auth/passwords.ts wrote it);
 *   - with SEED_ALL=1 also a plain bcrypt hash (older rows), an OrangeCat
 *     person with an address, and one whose address another account held.
 *
 * Synthetic people only. Prints counts, never an address or a hash.
 */
import bcrypt from 'bcryptjs';
import pg from 'pg';
import { createPasswordHasher } from '@bitbaum/accountkit/auth/hash';

const { DATABASE_URL, LEGACY_EMAIL, LEGACY_PASSWORD, SEED_ALL } = process.env;
if (!DATABASE_URL || !LEGACY_EMAIL || !LEGACY_PASSWORD) {
  console.error('DATABASE_URL, LEGACY_EMAIL and LEGACY_PASSWORD are required');
  process.exit(2);
}
const passwords = createPasswordHasher(bcrypt, 12);
const db = new pg.Client({ connectionString: DATABASE_URL });
await db.connect();
const run = Date.now().toString(36);
const insert = (id, email, hash, sub, name) =>
  db.query(
    `INSERT INTO "users" ("id", "email", "passwordHash", "orangecatSub", "name", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, now())`,
    [id, email, hash, sub, name],
  );

let n = 0;
await insert(`legacy-${run}`, LEGACY_EMAIL, await passwords.hash(LEGACY_PASSWORD), null, 'Legacy');
n++;
if (SEED_ALL === '1') {
  await insert(
    `plain-${run}`,
    `plain-${run}@example.test`,
    await bcrypt.hash('plain bcrypt', 12),
    null,
    null,
  );
  await insert(`oc-${run}`, `oc-${run}@example.test`, null, `sub-${run}-a`, 'OrangeCat person');
  await insert(`ocnull-${run}`, null, null, `sub-${run}-b`, null);
  n += 3;
}
await db.end();
console.log(`seeded ${n} legacy account(s)`);
