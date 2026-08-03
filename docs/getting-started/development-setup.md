# Development Environment Setup

---
created_date: 2025-07-28
last_modified_date: 2025-07-28
last_modified_summary: "Initial creation of development setup guide"
---

## Prerequisites

### Required Software

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 18+ | Runtime for frontend and backend |
| npm | 8+ | Package manager |
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
cd formular
```

### 2. Install Dependencies

```bash
# Root dependencies (concurrently for dev servers)
npm install

# Frontend dependencies
cd frontend
npm install --legacy-peer-deps
cd ..

# Backend dependencies
cd backend
npm install
cd ..
```

> **Note**: We use `--legacy-peer-deps` for frontend due to Next.js 15 and contentlayer compatibility issues.

### 3. Database Setup

Prisma migrations (`backend/prisma/migrations/`) are the single source of truth for
the schema — there is no standalone SQL script to load.

#### Option A: Docker Compose (Recommended)

```bash
# Start PostgreSQL, Redis, backend, frontend
npm run docker:dev

# In a separate terminal, once postgres is healthy: apply Prisma migrations
npm run docker:migrate
```

#### Option B: Local PostgreSQL

1. Install PostgreSQL locally
2. Create database and user:
   ```sql
   CREATE DATABASE formbuilder;
   CREATE USER formbuilder WITH PASSWORD 'devpassword';
   GRANT ALL PRIVILEGES ON DATABASE formbuilder TO formbuilder;
   ```
3. Apply the schema: `cd backend && npm run migrate` (runs `prisma migrate dev`)

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
PORT=5000
NODE_ENV=development
```

#### Frontend Environment

Create `frontend/.env.local`:
```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000

# Branding (using default)
NEXT_PUBLIC_BRAND_PRESET=generic
```

### 5. Verify Setup

```bash
# Start both servers
npm run d

# Check endpoints
curl http://localhost:5000  # Should return "Form Builder Backend is running!"
curl http://localhost:3000  # Should load the Next.js app
```

## Development Workflow

### Starting Development

```bash
# Start both frontend and backend
npm run d

# Or start individually
npm run dev           # Both servers with concurrently
cd frontend && npm run dev  # Frontend only
cd backend && npm run start # Backend only
```

### Available Scripts

From root directory:

| Command | Description |
|---------|-------------|
| `npm run d` | Start both dev servers (shortcut) |
| `npm run dev` | Start both dev servers |
| `npm run build` | Build frontend for production |
| `npm run lint` | Lint frontend code |

### Ports

| Service | Port | URL |
|---------|------|-----|
| Frontend | 3000 | http://localhost:3000 |
| Backend | 5000 | http://localhost:5000 |
| Database | 5432 | localhost:5432 |

## Common Issues

### Frontend Won't Start

**Issue**: `Cannot find module 'next-contentlayer'`
**Solution**: Run `npm install --legacy-peer-deps` in frontend directory

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

## Testing Setup (Planned)

Currently manual testing only. Automated testing setup planned for Phase 2:

- **Frontend**: Jest + React Testing Library
- **Backend**: Jest + Supertest
- **E2E**: Playwright (planned)

## Next Steps

1. **Explore the Codebase**: Start with `frontend/src/app/page.tsx`
2. **Read Architecture**: [System Architecture](../architecture/README.md)
3. **Check Development Workflow**: [Development Workflow](../development/workflow.md)
4. **Try Rebranding**: [Rebranding System](../development/rebranding.md)

---

Having issues? Check the [troubleshooting section](#common-issues) or create an issue with your specific problem.