/**
 * Pins the two OrangeCat settings whose silent revert fails only at the code
 * exchange, with a misleading message: client_secret_post and PKCE. Plus the
 * "absent, not broken" rule — no env, no provider.
 */
import { describe, expect, it } from 'vitest';
import { orangecatIssuer, orangecatProvider, orangecatProviderFromEnv } from './orangecat';

describe('orangecatProvider', () => {
  const provider = orangecatProvider('datacat', 'shh', 'https://orangecat.ch');

  it('authenticates at the token endpoint with client_secret_post — the only method OrangeCat accepts', () => {
    expect(provider.client?.token_endpoint_auth_method).toBe('client_secret_post');
  });

  it('uses PKCE and state, even as a confidential client', () => {
    expect(provider.checks).toEqual(expect.arrayContaining(['pkce', 'state']));
  });

  it('is the "orangecat" OIDC provider, so the callback is /api/auth/callback/orangecat', () => {
    expect(provider.id).toBe('orangecat');
    expect(provider.idToken).toBe(true);
    expect(provider.wellKnown).toBe('https://orangecat.ch/.well-known/openid-configuration');
    expect(provider.issuer).toBe('https://orangecat.ch');
  });

  it('asks for identity only', () => {
    expect(provider.authorization).toEqual({ params: { scope: 'openid profile email' } });
  });

  it('maps the OIDC sub to the profile id (resolved to a datacat user later)', async () => {
    const profile = await provider.profile!(
      { sub: 'actor-1', email: 'a@b.test', name: 'A', picture: 'https://x/p.png' },
      {},
    );
    expect(profile).toMatchObject({ id: 'actor-1', email: 'a@b.test', name: 'A' });
  });
});

describe('orangecatProviderFromEnv', () => {
  it('is null — absent, not broken — while the client credentials are unset', () => {
    expect(orangecatProviderFromEnv({})).toBeNull();
    expect(orangecatProviderFromEnv({ ORANGECAT_OAUTH_CLIENT_ID: 'datacat' })).toBeNull();
    expect(orangecatProviderFromEnv({ ORANGECAT_OAUTH_CLIENT_SECRET: 's' })).toBeNull();
    expect(
      orangecatProviderFromEnv({
        ORANGECAT_OAUTH_CLIENT_ID: ' ',
        ORANGECAT_OAUTH_CLIENT_SECRET: 's',
      }),
    ).toBeNull();
  });

  it('builds the provider from the same env names heidi and skif read', () => {
    const provider = orangecatProviderFromEnv({
      ORANGECAT_OAUTH_CLIENT_ID: 'datacat',
      ORANGECAT_OAUTH_CLIENT_SECRET: 'shh',
    });
    expect(provider?.clientId).toBe('datacat');
    expect(provider?.clientSecret).toBe('shh');
    expect(provider?.issuer).toBe('https://orangecat.ch');
  });

  it('honours ORANGECAT_OAUTH_ISSUER', () => {
    expect(orangecatIssuer({ ORANGECAT_OAUTH_ISSUER: 'https://staging.example/' })).toBe(
      'https://staging.example',
    );
    expect(orangecatIssuer({})).toBe('https://orangecat.ch');
  });
});
