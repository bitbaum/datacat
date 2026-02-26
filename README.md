# DataCat

Universal AI-powered data ingestion and form builder platform.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)
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

**2. AI Analysis** — Domain-specific engines with multi-modal processing. GPT-4 Vision handles primary analysis, Google Vision API and AWS Textract serve as fallbacks, Tesseract.js provides offline OCR. Every provider can fail; the system chains them with automatic failover.

**3. Action Delivery** — Humans get dashboards and reports. Machines get direct commands. The same analysis pipeline feeds both without translation layers.

### Form Builder

Drag-and-drop form construction built on `@dnd-kit/core`. Multi-step forms with per-step validation. Field types: text, textarea, number, date, select, checkbox, radio.

A template library provides starting points. Schema versioning (`FormVersions` table) ensures backward compatibility — old submissions remain valid when forms evolve. AI-powered schema generation produces Zod validation rules from natural language descriptions.

### Multi-Modal Ingestion (Erfassung)

A hybrid service abstraction manages provider failover transparently. Each analyzed field carries a confidence score: title, manufacturer, dimensions, weight, categories, OCR text.

Bull queues handle async processing backed by Redis. WebSocket connections push real-time updates when analysis completes. A 24-hour TTL cache prevents redundant processing of identical photos.

### White-Label System

One command rebrands the entire platform:

```bash
./scripts/dev/rebrand.sh medical    # Healthcare vertical
./scripts/dev/rebrand.sh legal      # Legal services
./scripts/dev/rebrand.sh custom "MyApp" "Data Capture"
```

Environment variables control all branding. Zero code changes required. Presets ship for: default, HR, medical, legal, government, and generic verticals.

### 5-Layer Data Integrity

Each layer catches what the previous one missed:

1. **Client-side Zod validation** — Immediate UX feedback
2. **Server route validation** — Schema enforcement at the boundary
3. **Prisma constraints** — Database-level guarantees
4. **Property-based tests** — Playwright and Vitest verify invariants
5. **Post-ingest checks** — Background jobs catch drift

### API Architecture

tRPC provides end-to-end type safety from frontend to backend — no generated clients, no schema drift.

Current structure: monorepo with Next.js 15 frontend (port 3000) and Express 5.1 backend (port 5001). Consolidating toward a unified Next.js App Router + tRPC architecture.

Bull job queues manage async processing. Socket.io handles real-time updates. Redis backs both.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React 19, TypeScript 5, Tailwind 4 |
| State | Zustand, @dnd-kit (drag-and-drop) |
| Backend | Express.js 5.1, tRPC 11.4 |
| Database | PostgreSQL 14+ (Prisma 6.12), Redis |
| AI | OpenAI GPT-4 Vision, Google Vision API, Tesseract.js |
| Jobs | Bull 4.16 (Redis-backed queues) |
| Real-time | Socket.io 4.8 |
| Testing | Playwright (478 test files) |
| Deployment | Docker, GitHub Actions |

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
git clone https://github.com/your-org/datacat.git
cd datacat
cp .env.example .env        # Configure database, Redis, API keys
npm install
npm run db:migrate           # Run Prisma migrations
npm run dev                  # Starts frontend (3000) + backend (5001)
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
  apps/
    web/                     # Next.js 15 frontend
    api/                     # Express 5.1 + tRPC backend
  packages/
    shared/                  # Shared types, Zod schemas, utilities
    ui/                      # Component library
  prisma/
    schema.prisma            # Database schema (SSOT for types)
    migrations/              # Version-controlled migrations
  scripts/
    dev/
      rebrand.sh             # White-label rebranding
  tests/
    e2e/                     # Playwright test suites
```

---

## Design Principles

**Single source of truth.** Prisma schema defines the data model. Zod schemas derive from it. Types flow from schemas. Nothing is defined twice.

**Fail gracefully, fail loudly.** Every AI provider will go down. The failover chain handles it without user intervention. When all providers fail, the system tells you exactly what happened — no silent data loss.

**Configuration over code.** Adding a new white-label vertical is a config file, not a fork. Adding a new form field type is a registry entry, not a component rewrite.

**Validate at every boundary.** User input is hostile. API input is hostile. Even internal service communication validates. Five layers exist because no single layer is sufficient.

---

## License

MIT
