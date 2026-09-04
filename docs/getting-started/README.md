# Getting Started with DataCat

---
created_date: 2025-07-28
last_modified_date: 2026-09-04
last_modified_summary: "Synced commands and stack claims with the actual repo (pnpm, Node 20+, port 5001, Vitest/Playwright, Prisma)."
---

## Overview

DataCat is a universal AI-powered data capture system designed to collect and structure information from any domain via a beautiful, dynamic frontend and feed that data to AI pipelines for downstream automation and analysis.

**Current Status**: Phase 1 (Frontend MVP) with backend integration in development.

## Quick Start

### Prerequisites

- Node.js 20+ (`.nvmrc` pins 24) and pnpm
- Git
- (Optional) Docker for database setup

### 1. Clone and Setup

```bash
git clone <repository-url>
cd datacat

# Install root dependencies
pnpm install

# Install frontend dependencies
cd frontend && pnpm install
cd ..
```

### 2. Start Development Servers

```bash
# Start both frontend and backend
pnpm run d
```

This will start:
- **Frontend** (Next.js): http://localhost:3000
- **Backend** (Express): http://localhost:5001

### 3. Access the Application

- **Form Builder**: http://localhost:3000/builder
- **Forms List**: http://localhost:3000/forms
- **API Health**: http://localhost:5001

## Project Structure

```
/
├── frontend/                 # Next.js application
│   ├── src/app/             # App Router pages and components
│   └── src/components/      # Shared components
├── backend/                 # Express.js API
│   ├── controllers/         # Route handlers
│   ├── middleware/          # Auth and validation
│   ├── routes/             # API routes
│   └── db/                 # Database setup
├── docs/                   # Documentation (you are here)
├── scripts/                # Development scripts
└── CLAUDE.md               # AI assistant context
```

## Key Features

### ✅ Current Features (Phase 1)
### 🔐 Authentication & Profiles

The app ships with a minimal JWT-based authentication flow wired to the backend (Express + tRPC + Prisma + PostgreSQL):

- Frontend auth context: `frontend/src/app/context/AuthContext.tsx`
- Login form: `frontend/src/app/components/LoginForm.tsx`
- Registration page: `frontend/src/app/register/page.tsx`
- Profile page (view/update name): `frontend/src/app/profile/page.tsx`

Environment configuration:

- Set the backend base URL in `frontend/.env.local`:

```
NEXT_PUBLIC_API_URL="http://localhost:5001"
```

Backend endpoints used:

- `POST /api/v1/auth/register` → returns `{ token, user }`
- `POST /api/v1/auth/login` → returns `{ token, user }`
- `GET /api/v1/user/me` (Bearer token) → returns `{ user }`
- `PUT /api/v1/user/me` (Bearer token) → update profile

Notes:

- Tokens are stored in `localStorage` for simplicity during development.
- In production, prefer secure HTTP-only cookies or token rotation.
- **Dynamic Form Builder**: Create forms with drag-and-drop interface
- **Multi-step Forms**: Support for complex, multi-page forms
- **Field Types**: Text, textarea, number, date, select, checkbox, radio
- **Template System**: Pre-built form templates
- **Rebranding System**: Configuration-driven branding for different use cases
- **Real-time Preview**: See changes immediately
- **Local Storage**: Auto-save progress

### 🚧 In Development (Phase 2)
- **Backend Integration**: Full API connectivity
- **Database Persistence**: PostgreSQL with migrations
- **User Authentication**: Secure login system
- **Form Publishing**: Share forms publicly
- **Submission Management**: View and manage form responses

### 🔮 Planned (Phase 3)
- **AI Integration**: LLM-powered form analysis and suggestions
- **Advanced Analytics**: Form performance insights
- **Collaboration**: Multi-user form editing
- **Integrations**: Connect with external services

## Next Steps

1. **Read the Architecture**: [System Architecture](../architecture/README.md)
2. **Set up Development Environment**: [Development Setup](development-setup.md)
3. **Understand the Rearchitecture Plan**: [Rearchitecture Plan](../development/rearchitecture-plan.md)

## Getting Help

- **Documentation**: Browse the `/docs` directory
- **Issues**: Check existing issues or create new ones
- **AI Assistant**: Refer to `CLAUDE.md` for AI context

## Tech Stack

### Frontend
- **Framework**: Next.js 16 with App Router
- **Styling**: Tailwind CSS v4
- **State Management**: Zustand
- **Drag & Drop**: @dnd-kit
- **Forms**: React Hook Form (planned)
- **Validation**: Zod

### Backend
- **Runtime**: Node.js with Express
- **Database**: PostgreSQL
- **Authentication**: JWT
- **ORM**: Prisma (migrations in `backend/prisma/migrations/`)

### Development
- **Package Manager**: pnpm
- **Linting**: ESLint with Next.js config
- **Git Hooks**: Planned (Husky)
- **Testing**: Vitest (unit), Playwright (E2E)

---

Ready to build? Let's start with [Development Setup](development-setup.md)!