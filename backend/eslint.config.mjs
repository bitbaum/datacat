// The backend had no linter at all until 2026-09-14. This config deliberately
// enables ONE rule rather than a recommended set: `no-console`, so that log
// output goes through lib/logger.js (pino, shared with the request logger)
// and cannot drift back to bare console.log. Widen it on purpose, not by
// accident — a recommended preset on an unlinted codebase is a wall of
// findings nobody reads.
export default [
  {
    ignores: ['node_modules/**', 'generated/**'],
  },
  {
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    rules: {
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
];
