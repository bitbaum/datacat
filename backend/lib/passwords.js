// The one password rule and the one way to hash, both from @bitbaum/accountkit.
// Every place that sets, checks or hashes a password in the backend goes
// through this file.
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const { passwordProblem } = require('@bitbaum/accountkit/auth/password');
const { createPasswordHasher } = require('@bitbaum/accountkit/auth/hash');

const passwords = createPasswordHasher(bcrypt, 12);

// Not empty, at most 128 characters. Nothing else.
const passwordSchema = z.string().refine((value) => passwordProblem(value) === null, {
  message: 'Enter a password of at most 128 characters.',
});

module.exports = { passwords, passwordSchema, passwordProblem };
