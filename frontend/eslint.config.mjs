import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // `next lint` applied these ignores implicitly. Next 16 removed the
  // `next lint` subcommand entirely, so running `eslint .` directly needs
  // them spelled out or it lints build output that was never meant to be
  // linted. (`.contentlayer/**` used to be in this list; posts are read from
  // disk now, so there is no generated content package to skip.)
  {
    ignores: ['.next/**', 'next-env.d.ts', 'node_modules/**'],
  },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      // The next/core-web-vitals + next/typescript defaults apply unchanged.
      // Several of them (no-unused-vars, exhaustive-deps, no-img-element) are
      // "warn" upstream; `lint` runs with --max-warnings 0, so a warning fails
      // the gate exactly like an error. The 2026-09 cleanup took the tree from
      // 147 warnings to 0 — a downgrade block here would let them creep back.
      'react/jsx-no-undef': 'error',
      // console.log is a debugging leftover; warn/error are what a browser
      // console is for. Operator scripts are exempted below.
      'no-console': ['error', { allow: ['warn', 'error'] }],
      // Route params are a Promise in Next 15+. A dev server hides that behind
      // a proxy that still answers sync reads, so `ctx.params.id` works
      // locally and is `undefined` in production — where Prisma reads it as
      // "no filter" and happily returns someone else's row. Four route
      // handlers shipped that way before anyone noticed; use
      // `getRouteParam(ctx, 'id')` from @/lib/routeParams instead.
      'no-restricted-syntax': [
        'error',
        {
          selector: 'MemberExpression[object.property.name="params"]',
          message:
            'Route params are async in Next 15+: use `await getRouteParam(ctx, ...)` from @/lib/routeParams, not a sync read.',
        },
        {
          selector: 'TSAsExpression > MemberExpression[property.name="params"]',
          message:
            'Route params are async in Next 15+: use `await getRouteParam(ctx, ...)` from @/lib/routeParams, not a sync cast.',
        },
      ],
    },
  },
  {
    // Node scripts that print their findings for a human — that is their output.
    files: ['scripts/**'],
    rules: { 'no-console': 'off' },
  },
];

export default eslintConfig;
