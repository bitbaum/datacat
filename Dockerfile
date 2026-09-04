# Multi-stage Dockerfile for Formular Universal AI-Powered Form Intelligence Platform

# Stage 1: Base Node.js image
# node:24 — pnpm 11 needs Node >= 22.13, and 24 is the fleet default.
FROM node:24-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat
# corepack reads the packageManager pin from package.json
RUN corepack enable pnpm

# Stage 2: Dependencies installer
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
COPY frontend/package.json frontend/pnpm-lock.yaml frontend/pnpm-workspace.yaml ./frontend/
COPY backend/package.json backend/pnpm-lock.yaml backend/pnpm-workspace.yaml ./backend/
ENV SKIP_CONTENTLAYER=true
RUN pnpm install --frozen-lockfile
RUN cd frontend && pnpm install --frozen-lockfile
RUN cd backend && pnpm install --frozen-lockfile

# Stage 3: Frontend builder
FROM base AS frontend-builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/frontend/node_modules ./frontend/node_modules
COPY frontend ./frontend
COPY package.json pnpm-lock.yaml ./

# Build frontend
WORKDIR /app/frontend
RUN pnpm run build

# Stage 4: Backend builder
FROM base AS backend-builder
COPY --from=deps /app/backend/node_modules ./backend/node_modules
COPY backend ./backend
COPY package.json pnpm-lock.yaml ./

# Generate Prisma client
WORKDIR /app/backend
RUN pnpm exec prisma generate

# Stage 5: Production runner
FROM node:24-alpine AS runner
WORKDIR /app

# Install production dependencies
RUN apk add --no-cache postgresql-client
RUN corepack enable pnpm

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built applications
COPY --from=frontend-builder --chown=nextjs:nodejs /app/frontend/.next ./frontend/.next
COPY --from=frontend-builder --chown=nextjs:nodejs /app/frontend/public ./frontend/public
COPY --from=frontend-builder /app/frontend/package.json ./frontend/
COPY --from=backend-builder /app/backend ./backend
COPY --from=deps /app/frontend/node_modules ./frontend/node_modules
COPY --from=deps /app/backend/node_modules ./backend/node_modules

# Copy root package.json for scripts
COPY package.json pnpm-lock.yaml ./

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Expose ports
EXPOSE 3000 5001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5001/health || exit 1

# Switch to non-root user
USER nextjs

# Start application
CMD ["pnpm", "run", "start"]
