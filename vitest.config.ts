import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    // One runner for both packages. The alternative — a suite per package —
    // means two configs, two installs and two ways for `verify` to forget one.
    include: ['frontend/src/**/*.test.ts', 'backend/**/*.test.js'],
    exclude: ['**/node_modules/**', '**/.next/**', 'tests/**'],
  },
})
