/**
 * The wiring guard for the login outage of 2026-09-10.
 *
 * `authOptions` had every ingredient of a working next-auth config except the
 * one next-auth v4 refuses to start without: `secret`. A secret was read from
 * the environment and used only to sign the inner access token, so the config
 * looked secret-aware while next-auth had nothing — and production answered
 * every `/api/auth/session` call with a 500, four console errors per page load,
 * for as long as nobody read the journal.
 *
 * These tests assert the WIRING, never a value: that whenever the environment
 * supplies a secret, it reaches `authOptions.secret`. Deleting the `secret:`
 * line from options.ts must turn this file red — that mutation was run.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { NextAuthOptions } from 'next-auth';

// options.ts instantiates PrismaClient through this module; the wiring under
// test has nothing to do with a database.
vi.mock('@/lib/db', () => ({ prisma: {} }));

/** options.ts reads env at import time, so each case needs a fresh module. */
async function loadAuthOptions(env: Record<string, string>): Promise<NextAuthOptions> {
  for (const [name, value] of Object.entries(env)) vi.stubEnv(name, value);
  vi.resetModules();
  return (await import('./options')).authOptions;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('authOptions.secret', () => {
  it('is set from JWT_SECRET — the name production actually deploys with', async () => {
    const authOptions = await loadAuthOptions({ JWT_SECRET: 'from-jwt-secret' });

    expect(authOptions.secret).toBe('from-jwt-secret');
  });

  it('is set from NEXTAUTH_SECRET, next-auth’s canonical name', async () => {
    const authOptions = await loadAuthOptions({ NEXTAUTH_SECRET: 'from-nextauth-secret' });

    expect(authOptions.secret).toBe('from-nextauth-secret');
  });

  it('prefers NEXTAUTH_SECRET when both are present', async () => {
    const authOptions = await loadAuthOptions({
      NEXTAUTH_SECRET: 'canonical',
      JWT_SECRET: 'legacy',
    });

    expect(authOptions.secret).toBe('canonical');
  });

  it('is never left undefined while the environment supplies a secret', async () => {
    // The regression itself: a secret present in the environment but absent
    // from the options object is exactly the 500 loop this test forbids.
    const authOptions = await loadAuthOptions({ JWT_SECRET: 'present' });

    expect(authOptions.secret).toBeDefined();
    expect(authOptions.secret).not.toBe('');
  });

  it('ignores a present-but-empty NEXTAUTH_SECRET instead of passing it on', async () => {
    // `NEXTAUTH_SECRET=` is an ordinary line to leave in a .env, and an empty
    // string is not a secret — next-auth would fail on it just the same.
    const authOptions = await loadAuthOptions({ NEXTAUTH_SECRET: '  ', JWT_SECRET: 'real' });

    expect(authOptions.secret).toBe('real');
  });
});

describe('the inner access token', () => {
  it('is signed with JWT_SECRET even when NEXTAUTH_SECRET differs', async () => {
    // frontend/src/lib/auth.ts and the Express backend both verify with
    // JWT_SECRET. If this key ever followed the NEXTAUTH_SECRET preference,
    // every authenticated API call would break the day the two values differ.
    const authOptions = await loadAuthOptions({
      NEXTAUTH_SECRET: 'session-secret',
      JWT_SECRET: 'api-token-secret',
    });

    const token = await authOptions.callbacks!.jwt!({
      token: {},
      user: { id: 'user-1', email: 'a@b.test' },
    } as never);

    const { jwtVerify } = await import('jose');
    const { payload } = await jwtVerify(
      String((token as { accessToken?: string }).accessToken),
      new TextEncoder().encode('api-token-secret'),
    );
    expect(payload.sub).toBe('user-1');
  });
});
