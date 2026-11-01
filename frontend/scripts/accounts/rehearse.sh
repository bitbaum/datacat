#!/usr/bin/env bash
# The AccountKit import, rehearsed on a throwaway database the way the deploy
# runs it: every earlier migration, a NextAuth-era snapshot (passwords in both
# hash formats, OrangeCat people with and without an address), then the
# import twice. Then Prisma must see no drift between its schema and the
# database. Prints counts only.
#
#   DATABASE_URL=postgres://…/scratch bash scripts/accounts/rehearse.sh   (from frontend/)
set -euo pipefail
: "${DATABASE_URL:?DATABASE_URL is required (a throwaway database)}"
q() { psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -qtA "$@"; }
NEW=prisma/migrations/20261101120000_accountkit_accounts/migration.sql

for m in prisma/migrations/*/migration.sql; do
  [ "$m" = "$NEW" ] && continue
  q -f "$m"
done
LEGACY_EMAIL="Rehearsal@Example.test" LEGACY_PASSWORD="rehearsal" SEED_ALL=1 \
  node scripts/accounts/seed-legacy.mjs >/dev/null

for run in first second; do
  q --single-transaction -f "$NEW" 2>/dev/null
  echo "after the $run apply: $(q -c 'SELECT count(*) FROM users') people," \
    "$(q -c 'SELECT count(*) FROM auth_users') shared accounts," \
    "$(q -c "SELECT count(*) FROM auth_accounts WHERE provider_id = 'credential'") passwords," \
    "$(q -c "SELECT count(*) FROM auth_accounts WHERE provider_id = 'orangecat'") OrangeCat links"
done

missing=$(q -c 'SELECT count(*) FROM users u LEFT JOIN auth_users a ON a.id = u.id WHERE a.id IS NULL')
drift=$(q -c "SELECT count(*) FROM users u LEFT JOIN auth_accounts c ON c.user_id = u.id AND c.provider_id = 'credential' WHERE u.\"passwordHash\" IS NOT NULL AND c.password IS DISTINCT FROM u.\"passwordHash\"")
links=$(q -c "SELECT count(*) FROM users u LEFT JOIN auth_accounts c ON c.user_id = u.id AND c.provider_id = 'orangecat' WHERE u.\"orangecatSub\" IS NOT NULL AND c.account_id IS DISTINCT FROM u.\"orangecatSub\"")
placeholder=$(q -c "SELECT count(*) FROM users u JOIN auth_users a ON a.id = u.id WHERE u.email IS NULL AND a.email NOT LIKE '%@orangecat.invalid'")
echo "not imported: $missing, hash changed: $drift, OrangeCat link lost: $links, unreachable address not a placeholder: $placeholder"
[ "$missing" = 0 ] && [ "$drift" = 0 ] && [ "$links" = 0 ] && [ "$placeholder" = 0 ]

# The cutover mirror: someone the old server creates after the import ran.
LEGACY_EMAIL="late@example.test" LEGACY_PASSWORD="late" node scripts/accounts/seed-legacy.mjs >/dev/null
late=$(q -c "SELECT count(*) FROM auth_users a JOIN auth_accounts c ON c.user_id = a.id AND c.provider_id = 'credential' WHERE a.email = 'late@example.test'")
echo "created during the cutover and mirrored: $late"
[ "$late" = 1 ]

# Prisma's schema describes the database exactly (no drop proposed later).
if ! pnpm exec prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel prisma/schema.prisma --exit-code >/dev/null; then
  echo "FAIL: prisma/schema.prisma and the migrated database differ:" >&2
  pnpm exec prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel prisma/schema.prisma --script >&2
  exit 1
fi
echo "prisma schema matches the database: ok"
