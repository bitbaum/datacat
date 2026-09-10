/**
 * Resolution of the secrets the auth path needs — and the loud failure when
 * production has none.
 *
 * The outage this file exists for: `authOptions` signed its own inner access
 * token with `process.env.JWT_SECRET` but never set `secret:` on the options
 * object, so next-auth v4 itself had no secret. In production it refuses to run
 * without one, so every page load hit `/api/auth/session` and got a 500
 * (`MissingSecretError` in the journal, four console errors per page). The
 * value was on the box the whole time, under a name next-auth does not read.
 *
 * Two secrets, deliberately resolved apart:
 *
 * - next-auth's own `secret` accepts `NEXTAUTH_SECRET` (its canonical name)
 *   and falls back to `JWT_SECRET`, which is what this app actually deploys
 *   with. Both are accepted so the fix works against the environment that
 *   already exists, without anyone minting a new value.
 * - the inner access token must stay signed with `JWT_SECRET` alone, because
 *   three verifiers hardcode that name — frontend/src/lib/auth.ts and the
 *   Express backend's middleware/auth.js + middleware/trpc.js. Signing it with
 *   `NEXTAUTH_SECRET` would make every API call fail the day the two differ.
 *
 * Empty is absent: `NEXTAUTH_SECRET=` is an ordinary line to leave in a .env,
 * and `??` would happily hand that empty string to next-auth.
 */

/** Names that can supply next-auth's session secret, in consultation order. */
export const AUTH_SECRET_ENV_VARS = ['NEXTAUTH_SECRET', 'JWT_SECRET'] as const;

/** The only name that can supply the inner API access-token secret. */
export const API_TOKEN_SECRET_ENV_VAR = 'JWT_SECRET';

/** Only ever used outside production, where a stable throwaway is legitimate. */
export const DEV_FALLBACK_SECRET = 'dev-secret';

type Env = Record<string, string | undefined>;

function firstNonEmpty(env: Env, names: readonly string[]): string | undefined {
  for (const name of names) {
    const value = env[name]?.trim();
    if (value) return value;
  }
  return undefined;
}

export class MissingAuthSecretError extends Error {
  constructor(missing: readonly string[]) {
    super(
      `Missing auth secret: set ${missing.join(' or ')} in the production environment. ` +
        'Without it next-auth cannot sign or verify sessions, and every request to ' +
        '/api/auth/* fails with a 500.',
    );
    this.name = 'MissingAuthSecretError';
  }
}

/**
 * next-auth's session secret, or `undefined` when production supplies none.
 * Never throws, so importing the auth options during `next build` — where no
 * runtime env exists — stays safe.
 */
export function resolveAuthSecret(env: Env = process.env): string | undefined {
  return (
    firstNonEmpty(env, AUTH_SECRET_ENV_VARS) ??
    (env.NODE_ENV === 'production' ? undefined : DEV_FALLBACK_SECRET)
  );
}

/** The inner access-token secret. `JWT_SECRET` only — see the note above. */
export function resolveApiTokenSecret(env: Env = process.env): string | undefined {
  return (
    firstNonEmpty(env, [API_TOKEN_SECRET_ENV_VAR]) ??
    (env.NODE_ENV === 'production' ? undefined : DEV_FALLBACK_SECRET)
  );
}

/**
 * Fail hard, once, at server startup rather than per request forever. The
 * message names every env var that would satisfy the check, because the whole
 * cost of this outage was a value that existed under a name nothing read.
 */
export function assertProductionAuthSecrets(env: Env = process.env): void {
  if (!resolveAuthSecret(env)) throw new MissingAuthSecretError(AUTH_SECRET_ENV_VARS);
  if (!resolveApiTokenSecret(env)) throw new MissingAuthSecretError([API_TOKEN_SECRET_ENV_VAR]);
}
