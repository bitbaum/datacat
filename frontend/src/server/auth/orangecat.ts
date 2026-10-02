/**
 * "Sign in with OrangeCat" — the OIDC provider, for next-auth v4.
 *
 * Every bitbaum product signs in with OrangeCat; this is datacat's copy of the
 * provider heidi ships for Auth.js v5 (heidi lib/auth/provider.ts), translated
 * to v4 options. Two settings are load-bearing, each paid for once already:
 *
 *  - OrangeCat's token endpoint accepts ONLY `client_secret_post`. The default
 *    `client_secret_basic` is rejected at the code exchange with a 400 reading
 *    "client_id is required" — a message that points at the wrong problem.
 *  - PKCE (and state) is required even for this confidential client.
 *
 * A silent revert of either surfaces as an opaque failure at the code exchange,
 * the least debuggable place for it; orangecat.test.ts pins both.
 *
 * Identity only: the scope is "openid profile email" (also the ceiling
 * OrangeCat registers for the client), and there is no token refresh — datacat
 * never acts on OrangeCat's behalf.
 */
import type { OAuthConfig } from 'next-auth/providers/oauth';

export const ORANGECAT_PROVIDER_ID = 'orangecat';

/** The same env names heidi and skif read, so one box recipe serves every app. */
export const ORANGECAT_ENV = {
  clientId: 'ORANGECAT_OAUTH_CLIENT_ID',
  clientSecret: 'ORANGECAT_OAUTH_CLIENT_SECRET',
  issuer: 'ORANGECAT_OAUTH_ISSUER',
} as const;

type Env = Record<string, string | undefined>;

/** The OIDC claims datacat reads. `sub` is OrangeCat's actor_id. */
export interface OrangecatProfile {
  sub: string;
  email?: string | null;
  name?: string | null;
  preferred_username?: string | null;
  picture?: string | null;
}

export function orangecatIssuer(env: Env = process.env): string {
  return (env[ORANGECAT_ENV.issuer]?.trim() || 'https://orangecat.ch').replace(/\/+$/, '');
}

export function orangecatProvider(
  clientId: string,
  clientSecret: string,
  issuer: string = orangecatIssuer(),
): OAuthConfig<OrangecatProfile> {
  return {
    id: ORANGECAT_PROVIDER_ID,
    name: 'OrangeCat',
    type: 'oauth',
    wellKnown: `${issuer}/.well-known/openid-configuration`,
    issuer,
    idToken: true,
    clientId,
    clientSecret,
    client: { token_endpoint_auth_method: 'client_secret_post' },
    checks: ['pkce', 'state'],
    authorization: { params: { scope: 'openid profile email' } },
    // `id` is the OrangeCat sub, NOT a datacat user id — the jwt callback
    // resolves it to one (orangecat-user.ts) before anything downstream sees it.
    profile(profile) {
      return {
        id: profile.sub,
        email: profile.email ?? null,
        name: profile.name ?? profile.preferred_username ?? null,
        image: profile.picture ?? null,
      };
    },
  };
}

/**
 * The provider when the box supplies its client credentials, otherwise null —
 * absent rather than broken, so build and CI pass before the secret exists and
 * the sign-in page simply does not offer it.
 */
export function orangecatProviderFromEnv(env: Env = process.env) {
  const id = env[ORANGECAT_ENV.clientId]?.trim();
  const secret = env[ORANGECAT_ENV.clientSecret]?.trim();
  if (!id || !secret) return null;
  return orangecatProvider(id, secret, orangecatIssuer(env));
}
