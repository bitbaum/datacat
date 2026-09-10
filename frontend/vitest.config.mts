import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { defineConfig } from 'vitest/config';

// The config lives in frontend/ because that is the ONLY place CI installs
// dependencies (.github/workflows/ci.yml installs with `working-directory:
// frontend`), so it is the only place `vitest/config` resolves from. The suite
// itself spans both packages, so `root` points back up at the repo.
const frontendDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(frontendDir, '..');

export default defineConfig({
  root: repoRoot,
  // Mirrors tsconfig's `"@/*": ["./src/*"]`. Without it, any module that
  // imports through `@/` is unresolvable here, which silently confined the
  // suite to leaf files — the app's own server modules could not be tested at
  // all. Absolute, because `root` is the repo and not frontend/.
  resolve: {
    alias: { '@': path.resolve(frontendDir, 'src') },
  },
  test: {
    environment: 'node',
    // One runner for both packages. A suite per package would mean two
    // configs, two installs, and two ways for `verify` to forget one.
    include: ['frontend/src/**/*.test.ts', 'backend/**/*.test.js'],
    exclude: ['**/node_modules/**', '**/.next/**', 'tests/**'],
  },
});
