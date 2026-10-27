# Shared article browser coverage

The `browser-smoke.yml` workflow runs the actual frontend blog and article at
phone and desktop widths. It checks server-rendered content with JavaScript
disabled, table headers, index-to-article navigation, contents links, horizontal
overflow, and browser exceptions. It uses the frontend's locked Playwright
version and a local Next.js server; no production account or model is involved.

After installing the frontend dependencies and Chromium, run:

```sh
pnpm -C frontend run prisma:generate
pnpm -C frontend exec playwright test --config=playwright.shared.config.ts
```

Local development auth settings must be configured as for the frontend. CI
supplies synthetic local fixture values in the workflow. This test needs no
backend because it exercises the public article renderer. It does not certify
registration, password recovery, tenant authorization, the form submission
backend, or AI analysis; those need separate seeded full-stack journeys.

The shared-package rollout gate requires this workflow and the regular CI
workflow on the same candidate commit. Do not replace either result with a
production page check: production still serves the previous artifact before
that candidate is merged and deployed.
