# AGENTS.md - DataCat

> Universal guide for AI coding agents (Claude, Codex, Gemini, Cursor)

## Project Overview

**DataCat** is a universal AI-powered data capture platform. Custom forms → AI analysis → Action delivery.

| Aspect | Details |
|--------|---------|
| Type | Full-stack web application |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind, Zustand |
| Backend | Express.js, tRPC, Prisma |
| Database | PostgreSQL, Redis |
| AI | Multi-LLM (OpenAI, Claude) |
| Deployment | Docker (self-hosted on the Hetzner box behind Caddy) |

## Quick Commands

```bash
# Development (both servers)
pnpm run dev
# Frontend: http://localhost:3000
# Backend: http://localhost:5001

# Individual services
pnpm run dev:frontend
pnpm run dev:backend

# Testing
pnpm test              # Vitest unit suite (frontend + backend)
pnpm run test:e2e      # Playwright E2E (needs both servers + DB)
pnpm run test:e2e:ui   # Playwright interactive mode

# Docker
pnpm run docker:dev    # Full stack
pnpm run docker:down   # Stop

# Rebranding
./scripts/dev/rebrand.sh medical
./scripts/dev/rebrand.sh custom "MyApp" "tagline"
```

## Project Structure

```
datacat/
├── frontend/               # Next.js application
│   ├── src/
│   │   ├── app/           # App Router pages
│   │   ├── components/    # React components
│   │   ├── stores/        # Zustand state
│   │   └── lib/           # Utilities
│   └── package.json
├── backend/                # Express API (flat layout — no src/)
│   ├── routes/            # API endpoints
│   ├── services/          # Business logic
│   ├── middleware/        # Auth, validation
│   ├── prisma/            # Database schema
│   └── package.json
├── docs/                   # Documentation
├── scripts/                # Dev tools, rebranding
└── package.json            # Root orchestration
```

## Code Style Guidelines

### Frontend (TypeScript/React)
```typescript
// Zustand store pattern
import { create } from 'zustand';

interface FormStore {
  forms: Form[];
  addForm: (form: Form) => void;
}

export const useFormStore = create<FormStore>((set) => ({
  forms: [],
  addForm: (form) => set((state) => ({ 
    forms: [...state.forms, form] 
  })),
}));
```

### Backend (Express/tRPC)
```typescript
// tRPC router pattern
import { router, publicProcedure } from '../trpc';
import { z } from 'zod';

export const formRouter = router({
  create: publicProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.form.create({ data: input });
    }),
});
```

## Key Patterns

### 1. White-Label Rebranding
All brand references use environment variables:
```typescript
// Use this pattern
const brandName = process.env.NEXT_PUBLIC_BRAND_NAME || 'DataCat';

// NOT this
const brandName = 'DataCat'; // Hardcoded = bad
```

### 2. Type-Safe API (tRPC)
Types are shared automatically between frontend/backend.

### 3. Form Builder
Dynamic form creation with validation schemas.

## Design System

**File**: `frontend/src/app/globals.css` — SSOT for all design tokens.
**Tailwind config**: `frontend/tailwind.config.ts`
**UI library**: No component library (no shadcn, no Radix UI). Plain Tailwind + custom CSS utilities.

### CSS Custom Properties (from `globals.css`)

```css
:root {
  --background: #ffffff;   /* light mode */
  --foreground: #171717;   /* light mode */
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}
```

Only two semantic tokens are currently defined. `body` also uses `var(--font-geist-sans)` (set via Next.js font loader).

### Tailwind Config

The two CSS vars are correctly mapped — no literal hex values in config:
```ts
colors: {
  background: 'var(--background)',
  foreground: 'var(--foreground)',
},
fontFamily: {
  sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
  mono: ['var(--font-geist-mono)', 'monospace'],
},
```

### Known Violations in `globals.css` (fix when touching UI)

Several utility classes in `globals.css` contain hardcoded hex values that should become CSS vars:

| Class | Hardcoded value | Should become |
|-------|----------------|---------------|
| `.focus-enhanced:focus-visible` | `#6366f1` | `--color-focus-ring` |
| `.gradient-mesh` | `#667eea`, `#764ba2` | `--color-gradient-start`, `--color-gradient-end` |
| `.gradient-mesh-alt` | `#f093fb`, `#f5576c` | `--color-gradient-alt-start`, `--color-gradient-alt-end` |
| `.skeleton` (light) | `#f0f0f0`, `#e0e0e0` | `--color-skeleton-base`, `--color-skeleton-shine` |
| `.skeleton` (dark) | `#374151`, `#4b5563` | `--color-skeleton-base-dark`, `--color-skeleton-shine-dark` |

### SSOT Rule

All design tokens live in the main CSS file only. Tailwind config MUST reference CSS vars (`'var(--name)'`), never literal values. Components MUST use semantic Tailwind classes, never arbitrary values like `bg-[#hex]`.

**Violations to fix when touching UI:**
- `bg-[#hex]` / `text-[#hex]` in className → CSS var + semantic class
- `style={{ color: '#hex' }}` → CSS var + className
- Literal hex in tailwind.config → `'var(--color-name)'`
- Same token defined in 2+ files → consolidate to main CSS file

**Audit:** `grep -r '\[#' src/` — every result is a violation.

## Don't

- Hardcode brand names or colors
- Mix Prisma queries in route handlers (use services)
- Skip database migrations
- Commit .env files or API keys
- Add frontend deps to backend or vice versa

## Pre-Commit Checklist

- [ ] `pnpm run lint` passes
- [ ] `pnpm test` passes
- [ ] Database migrations applied if schema changed
- [ ] Brand names use environment variables
- [ ] No hardcoded credentials

---

**Last Updated**: 2026-09-04
