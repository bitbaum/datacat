/**
 * The resolution rules behind `authOptions.secret`, tested against explicit env
 * objects so no case depends on the ambient environment of the runner.
 */
import { describe, expect, it } from 'vitest';
import {
  API_TOKEN_SECRET_ENV_VAR,
  AUTH_SECRET_ENV_VARS,
  DEV_FALLBACK_SECRET,
  MissingAuthSecretError,
  assertProductionAuthSecrets,
  resolveApiTokenSecret,
  resolveAuthSecret,
} from './secret';

const prod = (env: Record<string, string> = {}) => ({ NODE_ENV: 'production', ...env });

describe('resolveAuthSecret', () => {
  it('prefers NEXTAUTH_SECRET over JWT_SECRET', () => {
    expect(resolveAuthSecret(prod({ NEXTAUTH_SECRET: 'a', JWT_SECRET: 'b' }))).toBe('a');
  });

  it('falls back to JWT_SECRET, which is what the box deploys', () => {
    expect(resolveAuthSecret(prod({ JWT_SECRET: 'b' }))).toBe('b');
  });

  it('treats a blank value as absent', () => {
    expect(resolveAuthSecret(prod({ NEXTAUTH_SECRET: '   ', JWT_SECRET: 'b' }))).toBe('b');
  });

  it('returns undefined in production when nothing supplies one', () => {
    expect(resolveAuthSecret(prod())).toBeUndefined();
  });

  it('keeps the throwaway fallback outside production', () => {
    expect(resolveAuthSecret({ NODE_ENV: 'development' })).toBe(DEV_FALLBACK_SECRET);
  });
});

describe('resolveApiTokenSecret', () => {
  it('reads JWT_SECRET only — the name every verifier hardcodes', () => {
    expect(resolveApiTokenSecret(prod({ NEXTAUTH_SECRET: 'a' }))).toBeUndefined();
    expect(resolveApiTokenSecret(prod({ JWT_SECRET: 'b' }))).toBe('b');
  });
});

describe('assertProductionAuthSecrets', () => {
  it('passes on the environment production actually has', () => {
    expect(() => assertProductionAuthSecrets(prod({ JWT_SECRET: 'b' }))).not.toThrow();
  });

  it('names both acceptable env vars when the session secret is missing', () => {
    expect(() => assertProductionAuthSecrets(prod())).toThrow(MissingAuthSecretError);
    try {
      assertProductionAuthSecrets(prod());
    } catch (error) {
      // The whole cost of the outage was a value living under a name nothing
      // read; the failure has to say which names would be read.
      for (const name of AUTH_SECRET_ENV_VARS) expect((error as Error).message).toContain(name);
    }
  });

  it('still refuses a production env that has only NEXTAUTH_SECRET', () => {
    // next-auth would be happy; the inner access token would silently fall back
    // to a throwaway key that no verifier accepts.
    expect(() => assertProductionAuthSecrets(prod({ NEXTAUTH_SECRET: 'a' }))).toThrow(
      API_TOKEN_SECRET_ENV_VAR,
    );
  });
});
