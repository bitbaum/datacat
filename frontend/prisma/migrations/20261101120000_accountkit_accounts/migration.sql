-- Accounts on @bitbaum/accountkit: email and password, the emailed sign-in
-- link, passkeys, two-step codes, recovery, "Continue with OrangeCat" and the
-- shared sign-in. The tables match @bitbaum/accountkit/auth/schema column for
-- column, under the auth_ prefix because "users", "accounts" and "sessions"
-- are this product's own (the NextAuth-era models in schema.prisma).
--
-- Re-runnable from top to bottom (IF NOT EXISTS, existing constraints
-- skipped, ON CONFLICT DO NOTHING), and additive: no row of the product's own
-- tables changes. Applied by `prisma migrate deploy` on deploy (loki
-- apply-schema.sh); scripts/rehearse-accountkit.sh replays it twice in CI.

CREATE TABLE IF NOT EXISTS "auth_accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS "auth_passkeys" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"public_key" text NOT NULL,
	"user_id" text NOT NULL,
	"credential_id" text NOT NULL,
	"counter" integer NOT NULL,
	"device_type" text NOT NULL,
	"backed_up" boolean NOT NULL,
	"transports" text,
	"aaguid" text,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "auth_passkeys_credential_id_unique" UNIQUE("credential_id")
);
CREATE TABLE IF NOT EXISTS "auth_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "auth_sessions_token_unique" UNIQUE("token")
);
CREATE TABLE IF NOT EXISTS "auth_two_factors" (
	"id" text PRIMARY KEY NOT NULL,
	"secret" text NOT NULL,
	"backup_codes" text NOT NULL,
	"user_id" text NOT NULL,
	"verified" boolean DEFAULT true,
	"failed_verification_count" integer DEFAULT 0,
	"locked_until" timestamp with time zone
);
CREATE TABLE IF NOT EXISTS "auth_users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" text DEFAULT 'customer' NOT NULL,
	"two_factor_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "auth_users_email_unique" UNIQUE("email")
);
CREATE TABLE IF NOT EXISTS "auth_verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

DO $$ BEGIN
  ALTER TABLE "auth_accounts" ADD CONSTRAINT "auth_accounts_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "auth_passkeys" ADD CONSTRAINT "auth_passkeys_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "auth_two_factors" ADD CONSTRAINT "auth_two_factors_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "auth_accounts_user_id_idx" ON "auth_accounts" USING btree ("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "auth_accounts_provider_account_uidx" ON "auth_accounts" USING btree ("provider_id","account_id");
CREATE INDEX IF NOT EXISTS "auth_passkeys_user_id_idx" ON "auth_passkeys" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "auth_sessions_user_id_idx" ON "auth_sessions" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "auth_two_factors_user_id_idx" ON "auth_two_factors" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "auth_two_factors_secret_idx" ON "auth_two_factors" USING btree ("secret");
CREATE INDEX IF NOT EXISTS "auth_verifications_identifier_idx" ON "auth_verifications" USING btree ("identifier");

-- Every existing person, imported under the SAME id, so forms, submissions and
-- organisations stay theirs.
--   - Passwords: the bcrypt / $bs1$ hash byte for byte; the runtime's
--     legacyBcrypt verifies both and re-hashes on first use.
--   - OrangeCat: the link keyed on OrangeCat's sub, so "Continue with
--     OrangeCat" lands on the same person. An address is never an identity.
--   - A person without an address (OrangeCat, address taken) gets the same
--     unreachable placeholder AccountKit gives a first OIDC sign-in.
-- Two addresses that collide once lower-cased abort the whole deploy rather
-- than give one person's account to another.
DO $$ BEGIN
  IF EXISTS (
    SELECT lower(trim("email")) FROM "users" WHERE "email" IS NOT NULL GROUP BY 1 HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'accountkit import: addresses need reconciling first';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION "accountkit_legacy_email"(u "users") RETURNS text AS $$
  SELECT CASE
    WHEN u."email" IS NOT NULL AND trim(u."email") <> '' THEN lower(trim(u."email"))
    WHEN u."orangecatSub" IS NOT NULL
      THEN left(encode(sha256(convert_to('orangecat:' || u."orangecatSub", 'UTF8')), 'hex'), 32) || '@orangecat.invalid'
    ELSE 'datacat-' || u."id" || '@users.invalid'
  END
$$ LANGUAGE sql IMMUTABLE;

-- One person into the shared tables; does nothing for what is already there.
CREATE OR REPLACE FUNCTION "accountkit_import_user"(u "users") RETURNS void AS $$
BEGIN
  INSERT INTO "auth_users" ("id", "name", "email", "email_verified", "image", "created_at", "updated_at")
  VALUES (u."id", coalesce(u."name", ''), "accountkit_legacy_email"(u), u."emailVerified" IS NOT NULL,
          u."avatar", u."createdAt", u."updatedAt")
  ON CONFLICT DO NOTHING;
  -- Only where the shared account is this person's own.
  IF NOT EXISTS (SELECT 1 FROM "auth_users" WHERE "id" = u."id") THEN RETURN; END IF;
  IF u."passwordHash" IS NOT NULL AND u."passwordHash" <> '' THEN
    INSERT INTO "auth_accounts" ("id", "account_id", "provider_id", "user_id", "password")
    VALUES ('legacy-credential:' || u."id", u."id", 'credential', u."id", u."passwordHash")
    ON CONFLICT DO NOTHING;
  END IF;
  IF u."orangecatSub" IS NOT NULL THEN
    INSERT INTO "auth_accounts" ("id", "account_id", "provider_id", "user_id")
    VALUES ('legacy-orangecat:' || u."id", u."orangecatSub", 'orangecat', u."id")
    ON CONFLICT DO NOTHING;
  END IF;
END $$ LANGUAGE plpgsql;

DO $$ BEGIN
  PERFORM "accountkit_import_user"(u) FROM "users" u;
END $$;

-- The cutover window: between this migration and the new server starting,
-- the old one may still create someone (a sign-up, a first OrangeCat
-- sign-in). This gives them the same import. Under the new server every
-- insert into "users" follows a shared account that already exists, so the
-- mirror finds it and does nothing.
CREATE OR REPLACE FUNCTION "accountkit_mirror_legacy_user"() RETURNS trigger AS $$
BEGIN
  PERFORM "accountkit_import_user"(NEW);
  RETURN NEW;
END $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "users_accountkit_mirror" ON "users";
CREATE TRIGGER "users_accountkit_mirror" AFTER INSERT ON "users"
FOR EACH ROW EXECUTE FUNCTION "accountkit_mirror_legacy_user"();
