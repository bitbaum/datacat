# DataCat

Universal AI-powered data ingestion and form builder platform.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)

---

## The Pipeline

Every domain — hardware inventory, medical intake, legal discovery, HR onboarding — reduces to three stages:

```
  Ingest              Analyze             Deliver
  ─────────────────   ─────────────────   ─────────────────
  Forms, photos,      Domain-specific     Dashboards for
  documents, audio,   AI engines with     humans. Direct
  APIs, custom UIs    multi-modal         commands for
                      processing          machines & robots
```

Data in. Intelligence applied. Action out. The rest is implementation detail.

---

## Architecture

### Universal Pipeline

The pipeline is domain-agnostic by design. Each stage is independently replaceable.

**1. Data Ingestion** — Custom forms, multi-modal capture (photos, documents, audio), external APIs, and purpose-built interfaces. The system doesn't care where data comes from; it normalizes everything into a unified schema.

**2. AI Analysis** — Text analysis (sentiment, classification, extraction, summaries) runs on a multi-vendor chain from [`@bitbaum/ai-kit`](https://www.npmjs.com/package/@bitbaum/ai-kit) — Groq, then OpenRouter — with automatic failover (`backend/lib/aiChain.js`). Image and video-frame analysis use OpenAI vision models and audio uses Whisper; those have no second vendor yet.

**3. Action Delivery** — Humans get dashboards and reports. Machines get direct commands. The same analysis pipeline feeds both without translation layers.

### Form Builder

Drag-and-drop form construction built on `@dnd-kit/core`. Multi-step forms with per-step validation. 13 field types, from text, email and date to file upload and range (`FieldConfig['type']` in `frontend/src/app/types/form.ts`).

A template library provides starting points. When a form's fields change, the previous schema is kept in the `form_versions` table.

### Multi-Modal Ingestion (Erfassung)

Each analyzed field carries a confidence score: title, manufacturer, dimensions, weight, categories, OCR text.

Bull queues handle async processing backed by Redis. WebSocket connections push real-time updates when analysis completes.

### White-Label System

One command rebrands the entire platform:

```bash
./scripts/dev/rebrand.sh medical    # Healthcare vertical
./scripts/dev/rebrand.sh legal      # Legal services
./scripts/dev/rebrand.sh custom "MyApp" "Data Capture"
```

Environment variables control all branding. Zero code changes required. Presets ship for: default, HR, medical, legal, government, and generic verticals.

### Data Integrity

Each layer catches what the previous one missed:

1. **Client-side validation** — Immediate UX feedback
2. **Server validation** — Zod schemas on tRPC inputs and the auth routes
3. **Prisma constraints** — Database-level guarantees

### API Architecture

tRPC provides end-to-end type safety from frontend to backend — no generated clients, no schema drift.

Current structure: monorepo with Next.js 16 frontend (port 3000) and Express 5.1 backend (port 5001). Consolidating toward a unified Next.js App Router + tRPC architecture.

Bull job queues manage async processing. Socket.io handles real-time updates. Redis backs both.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript 5, Tailwind 4 |
| State | Zustand, @dnd-kit (drag-and-drop) |
| Backend | Express.js 5.1, tRPC 11.4 |
| Database | PostgreSQL 14+ (Prisma 6), Redis |
| AI | `@bitbaum/ai-kit` chain (Groq, OpenRouter) for text; OpenAI for vision and Whisper audio |
| Jobs | Bull 4.16 (Redis-backed queues) |
| Real-time | Socket.io 4.8 |
| Testing | Vitest (unit), Playwright (E2E) |
| Deployment | Docker, GitHub Actions (self-hosted on the Hetzner box behind Caddy) |

---

<details>
<summary>Quick Start</summary>

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- Redis 7+
- Docker (optional, for containerized setup)

### Setup

```bash
git clone https://github.com/bitbaum/datacat.git
cd datacat
cp backend/.env.example backend/.env      # Configure database, Redis, API keys
cp frontend/env.example frontend/.env.local
pnpm install                              # Also run in frontend/ and backend/
cd backend && pnpm run migrate && cd ..   # Run Prisma migrations
pnpm run dev                              # Starts frontend (3000) + backend (5001)
```

### Environment Variables

Configure at minimum:

```
DATABASE_URL=postgresql://user:pass@localhost:5432/datacat
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=sk-...
```

### Docker

```bash
docker compose up -d         # PostgreSQL, Redis, app
```

</details>

---

## Project Structure

```
datacat/
  frontend/                  # Next.js 16 app (App Router, Zustand, Tailwind)
  backend/                   # Express 5.1 + tRPC backend (flat layout)
    prisma/
      schema.prisma          # Database schema (SSOT for types)
      migrations/            # Version-controlled migrations
  scripts/
    dev/
      rebrand.sh             # White-label rebranding
  tests/                     # Playwright E2E suites
```

---

## Design Principles

**Fail gracefully, fail loudly.** Every AI provider will go down. For text analysis the failover chain handles it without user intervention. When all providers fail, the system tells you exactly what happened — no silent data loss.

**Configuration over code.** Adding a new white-label vertical is a config file, not a fork. Adding a new form field type is a registry entry, not a component rewrite.

**Validate at every boundary.** User input is hostile. API input is hostile. Several layers exist because no single layer is sufficient.

---

## License

MIT
