// The one way to hash and check a password, from @bitbaum/accountkit. The
// backend (backend/lib/passwords.js) uses the same module, so a hash written by
// one is read by the other.
import { compare, hash } from 'bcryptjs';
import { createPasswordHasher } from '@bitbaum/accountkit/auth/hash';

export const passwords = createPasswordHasher({ hash, compare }, 12);
