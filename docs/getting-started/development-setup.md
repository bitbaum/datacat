# Development Environment Setup

---
created_date: 2025-07-28
last_modified_date: 2026-09-04
last_modified_summary: "Synced with the actual repo: pnpm, Node 20+, backend port 5001, Vitest/Playwright testing status."
---

## Prerequisites

### Required Software

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 20+ (`.nvmrc` pins 24) | Runtime for frontend and backend |
| pnpm | 11+ (see `packageManager` in `package.json`) | Package manager |
| Git | Latest | Version control |
| Docker | Latest | Database and containerization (recommended) |
| PostgreSQL | 14+ | Database (if not using Docker) |

### Optional Tools

- **VS Code**: Recommended editor with extensions:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - TypeScript and JavaScript Language Features
- **Postman**: API testing
- **pgAdmin**: Database administration

## Installation Steps

### 1. Clone Repository

```bash
git clone <repository-url>
cd datacat
```

### 2. Install Dependencies

```bash
# Root dependencies (concurrently for dev servers)
pnpm install

# Frontend dependencies
cd frontend
pnpm install
cd ..

# Backend dependencies
cd backend
pnpm install
cd ..
```

### 3. Database Setup

Prisma migrations (`backend/prisma/migrations/`) are the single source of truth for
the schema — there is no standalone SQL script to load.

#### Option A: Docker Compose (Recommended)

```bash
# Start PostgreSQL, Redis, backend, frontend
pnpm run docker:dev

# In a separate terminal, once postgres is healthy: apply Prisma migrations
pnpm run docker:migrate
```

#### Option B: Local PostgreSQL

1. Install PostgreSQL locally
2. Create database and user:
   ```sql
   CREATE DATABASE formbuilder;
   CREATE USER formbuilder WITH PASSWORD 'devpassword';
   GRANT ALL PRIVILEGES ON DATABASE formbuilder TO formbuilder;
   ```
3. Apply the schema: `cd backend && pnpm run migrate` (runs `prisma migrate dev`)

### 4. Environment Configuration

#### Backend Environment

Create `backend/.env`:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=formbuilder
DB_USER=formbuilder
DB_PASSWORD=devpassword

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Server
PORT=5001
NODE_ENV=development
```

#### Frontend Environment

Create `frontend/.env.local`:
```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5001

# Branding (using default)
NEXT_PUBLIC_BRAND_PRESET=generic
```

### 5. Verify Setup

```bash
# Start both servers
pnpm run d

# Check endpoints
curl http://localhost:5001  # Backend API
curl http://localhost:3000  # Should load the Next.js app
```

## Development Workflow

### Starting Development

```bash
# Start both frontend and backend
pnpm run d

# Or start individually
pnpm run dev           # Both servers with concurrently
cd frontend && pnpm run dev  # Frontend only
cd backend && pnpm run start # Backend only
```

### Available Scripts

From root directory:

| Command | Description |
|---------|-------------|
| `pnpm run d` | Start both dev servers (shortcut) |
| `pnpm run dev` | Start both dev servers |
| `pnpm run build` | Build frontend for production |
| `pnpm run lint` | Lint frontend code |
| `pnpm run verify` | Full gate: format check + lint + typecheck + unit tests + build |

### Ports

| Service | Port | URL |
|---------|------|-----|
| Frontend | 3000 | http://localhost:3000 |
| Backend | 5001 | http://localhost:5001 |
| Database | 5432 | localhost:5432 |

## Common Issues

### Frontend Won't Start

**Issue**: `Cannot find module 'next-contentlayer'`
**Solution**: Run `pnpm install` in frontend directory

### Database Connection Failed

**Issue**: Backend can't connect to PostgreSQL
**Solutions**:
1. Ensure PostgreSQL is running
2. Check `.env` credentials
3. Verify database exists
4. For Docker: `docker ps` to check container status

### Port Already in Use

**Issue**: `EADDRINUSE: address already in use`
**Solutions**:
1. Kill existing processes: `lsof -ti:3000 | xargs kill` (replace 3000 with port)
2. Use different ports in configuration

### ESLint Warnings

**Issue**: Many warnings during development
**Current Status**: Warnings are set to non-blocking for development
**Solution**: Address gradually as per coding standards

## IDE Configuration

### VS Code Settings

Create `.vscode/settings.json`:
```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "tailwindCSS.includeLanguages": {
    "typescript": "javascript",
    "typescriptreact": "javascript"
  }
}
```

### VS Code Extensions

Install recommended extensions:
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

## Testing Setup

- **Unit tests**: Vitest (`pnpm test` from the repo root; covers `frontend/src/**/*.test.ts` and `backend/**/*.test.js`)
- **E2E**: Playwright (`pnpm run test:e2e`; needs both servers plus a database running — not part of CI yet)

## Next Steps

1. **Explore the Codebase**: Start with `frontend/src/app/page.tsx`
2. **Read Architecture**: [System Architecture](../architecture/README.md)
3. **Check the Rearchitecture Plan**: [Rearchitecture Plan](../development/rearchitecture-plan.md)
4. **Try Rebranding**: `./scripts/dev/rebrand.sh medical`

---

Having issues? Check the [troubleshooting section](#common-issues) or create an issue with your specific problem.