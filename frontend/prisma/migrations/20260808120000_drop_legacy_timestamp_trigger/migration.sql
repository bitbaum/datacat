-- Any database provisioned before commit 9449719 (2026-08-03) was seeded via
-- the now-removed backend/db/init.sql, which created a `trigger_set_timestamp()`
-- trigger on "users" and "forms". Prisma's `@updatedAt` already sets updatedAt
-- at the application level for every write this app makes, so the DB-level
-- trigger is redundant; on databases still carrying it, its buggy pre-860a589
-- form (`NEW.updated_at` against a camelCase `updatedAt` column) makes every
-- UPDATE on these tables fail with P2022, independent of the app-level fix.
--
-- dbe2084 shipped this same DROP as a migration under backend/prisma/migrations,
-- but per scripts/hetzner/apps.conf the deployed app for datacat-web is
-- `frontend` — "the express backend/ dir is local-dev legacy and is not
-- deployed" — so `prisma migrate deploy` on the real deploy pipeline never
-- picks up a migration filed under backend/. That copy fixes only a
-- standalone backend/ dev DB; it never reached the production database this
-- app actually writes to. This migration is the one the deploy pipeline
-- (scripts/hetzner/apply-schema.sh) will actually run.
--
-- init.sql no longer runs on new databases, so this is a no-op there; on any
-- pre-existing database it removes the stale trigger/function outright.
DROP TRIGGER IF EXISTS set_timestamp ON "users";
DROP TRIGGER IF EXISTS set_timestamp_forms ON "forms";
DROP FUNCTION IF EXISTS trigger_set_timestamp();
