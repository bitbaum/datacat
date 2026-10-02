-- Sign in with OrangeCat. Additive only: a new nullable column plus its unique
-- index, and email relaxed to nullable (no rows change, no type change).
--
-- The user is keyed on OrangeCat's OIDC `sub` (its actor_id), never on email:
-- OrangeCat's email_verified is not trustworthy while GoTrue auto-confirms, so
-- linking by email would hand an existing account to whoever registers its
-- address on OrangeCat. A new sub whose email is already taken by another
-- account is created with email NULL instead of being linked to it.
ALTER TABLE "users" ADD COLUMN "orangecatSub" TEXT;
CREATE UNIQUE INDEX "users_orangecatSub_key" ON "users"("orangecatSub");
ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;
