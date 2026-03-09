# DataCat

@~/.claude/CLAUDE.md

---

## Overview

**DataCat** is a universal data ingestion platform with AI analysis. Custom forms capture any data type, AI processes it, and actions are delivered to humans or machines.

**Workflow**: Data Ingestion → AI Analysis → Action Delivery

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15.3, React 19, TypeScript, Tailwind, Zustand |
| Backend | Node.js, Express.js, tRPC |
| Database | PostgreSQL (Prisma ORM), Redis |
| AI | Multi-LLM (OpenAI, Claude, custom) |
| Testing | Playwright |

---

## Project Structure (Monorepo)

```
datacat/
├── frontend/            # Next.js 15 (port 3000)
│   ├── src/app/        # App Router pages
│   ├── src/components/ # React components
│   └── src/stores/     # Zustand state
├── backend/             # Express.js (port 5001)
│   ├── src/routes/     # API routes
│   ├── prisma/         # Database schema
│   └── src/trpc/       # tRPC routers
└── docker-compose.yml   # Infrastructure
```

---

## Quick Start

```bash
# Start both servers
npm run dev
# Frontend: http://localhost:3000
# Backend: http://localhost:5001

# Or individually
npm run dev:frontend
npm run dev:backend

# Docker
npm run docker:dev
```

---

## Critical: Monorepo Rules

- `frontend/` - React components, pages, Zustand state
- `backend/` - API routes, database, business logic
- Root `package.json` - orchestration scripts only
- **Never mix** frontend/backend code

---

## Rebranding System

DataCat supports white-labeling via environment variables:

```bash
# Apply preset
./scripts/dev/rebrand.sh medical

# Custom brand
./scripts/dev/rebrand.sh custom "MyApp" "Data Capture"
```

**Presets**: `datacat`, `hr`, `medical`, `legal`, `government`, `generic`

---

## Environment Variables

**Frontend** (`frontend/.env.local`):
```bash
NEXT_PUBLIC_API_URL=http://localhost:5001
NEXT_PUBLIC_BRAND_NAME=DataCat
```

**Backend** (`backend/.env`):
```bash
DATABASE_URL=postgresql://...
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=...
```

---

## Don't

- Mix frontend/backend code
- Hardcode brand names (use env vars)
- Skip Prisma migrations
- Commit API keys

---

**Last Updated**: 2026-01-23
