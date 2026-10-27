import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './browser-tests',
  workers: 1,
  timeout: 45_000,
  use: {
    baseURL: 'http://127.0.0.1:3918',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'phone', use: { viewport: { width: 390, height: 844 } } },
    { name: 'desktop', use: { viewport: { width: 1280, height: 900 } } },
  ],
  webServer: {
    command: 'pnpm exec next dev --webpack --hostname 127.0.0.1 --port 3918',
    url: 'http://127.0.0.1:3918/blog/intake-engine',
    timeout: 180_000,
    reuseExistingServer: !process.env.CI,
  },
});
