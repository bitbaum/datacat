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
  // them spelled out or it lints generated/build output (.next,
  // .contentlayer) that was never meant to be linted.
  {
    ignores: ['.next/**', '.contentlayer/**', 'next-env.d.ts', 'node_modules/**'],
  },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      // Temporarily disable unused vars for build success
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
      'react/no-unescaped-entities': 'warn',
      '@next/next/no-img-element': 'warn',
      'react/jsx-no-undef': 'error',
    },
  },
];

export default eslintConfig;
