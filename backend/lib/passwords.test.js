import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';

// The backend is CommonJS: this proves it can require the shared rule and hasher.
const require = createRequire(import.meta.url);
const bcrypt = require('bcryptjs');
const { passwords, passwordSchema } = require('./passwords');

describe('one password rule (accountkit)', () => {
  it('accepts any non-empty password up to 128 characters', () => {
    expect(passwordSchema.safeParse('a').success).toBe(true);
    expect(passwordSchema.safeParse('x'.repeat(128)).success).toBe(true);
    expect(passwordSchema.safeParse('').success).toBe(false);
    expect(passwordSchema.safeParse('x'.repeat(129)).success).toBe(false);
  });
});

describe('password hashing (accountkit)', () => {
  it('counts every character of a long password', async () => {
    const stored = await passwords.hash('a'.repeat(100) + 'X');
    expect((await passwords.verify('a'.repeat(100) + 'X', stored)).valid).toBe(true);
    expect((await passwords.verify('a'.repeat(100) + 'Y', stored)).valid).toBe(false);
  });

  it('still verifies an existing plain bcrypt hash and asks for the new form', async () => {
    const legacy = await bcrypt.hash('old password', 4);
    expect(await passwords.verify('old password', legacy)).toEqual({ valid: true, rehash: true });
    expect((await passwords.verify('nope', legacy)).valid).toBe(false);
  });
});
