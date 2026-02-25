# DataCat

Universal AI-powered data capture, analysis, and delivery platform.

## What is DataCat?

DataCat is a customizable data ingestion platform that adapts to any domain. Feed it data through custom forms, APIs, or multi-modal capture — it analyzes with domain-specific AI and delivers results to humans or machines.

**Data Ingestion → AI Analysis → Information/Action Delivery**

## Use Cases

- **Healthcare**: Patient intake → AI diagnosis support → treatment recommendations
- **Legal**: Case data → legal analysis → automated document generation
- **Manufacturing**: Quality data → defect detection → quality control actions
- **Research**: Sample data → AI analysis → automated lab reporting

## Tech Stack

### Frontend
- Next.js 15 with App Router, React 19, TypeScript
- Tailwind CSS, Zustand for state management

### Backend
- Node.js with Express.js
- Prisma ORM with PostgreSQL, Redis for caching
- tRPC for type-safe APIs
- Multi-LLM integration (OpenAI, Claude)

## Quick Start

```bash
git clone https://github.com/g-but/datacat.git
cd datacat

npm install
cd frontend && npm install --legacy-peer-deps
cd ../backend && npm install

cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

npm run dev
```

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001
- **Form Builder**: http://localhost:3000/builder

## Rebranding

DataCat includes a configuration-driven branding system for white-labeling:

```bash
./scripts/dev/rebrand.sh datacat       # Default
./scripts/dev/rebrand.sh medical       # Healthcare
./scripts/dev/rebrand.sh legal         # Legal services
./scripts/dev/rebrand.sh custom "MyApp" "Data Capture"
```

Branding is controlled through environment variables — no code changes needed. See [docs/development/rebranding.md](docs/development/rebranding.md).

## Current Status

- Phase 1: Frontend MVP with form builder (complete)
- Phase 2: Backend integration and authentication (in progress)
- Phase 3: AI integration and advanced features (planned)

## License

MIT
