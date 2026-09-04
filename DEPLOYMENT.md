# 🚀 Deployment Guide - Formular Platform
## Enterprise-Grade Deployment with Docker & CI/CD

---

## ✅ DEPLOYMENT FIXES COMPLETED

### Issues Resolved:
1. **Dynamic Tailwind CSS classes** - Fixed in `MDXComponents.tsx`
2. **Missing health endpoint** - Added to backend API
3. **Contentlayer build errors** - Made conditional with `SKIP_CONTENTLAYER`
4. **Production environment configuration** - Complete
5. **Docker deployment pipeline** - Automated with best practices

---

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   Next.js 16    │    │   Node.js +     │    │   PostgreSQL    │
│   Port: 3000    │◄──►│   Express       │◄──►│   Port: 5432    │
│                 │    │   Port: 5001    │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         ▲                       ▲                       ▲
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx         │    │   Redis         │    │   Docker        │
│   Load Balancer │    │   Cache & Jobs  │    │   Orchestration │
│   Port: 80/443  │    │   Port: 6379    │    │   Multi-stage   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 🚀 Quick Deployment

### Production Deployment (Single Command):
```bash
# Set required environment variables
export DB_PASSWORD="your-secure-password"
export JWT_SECRET="your-jwt-secret-key"
export OPENAI_API_KEY="your-openai-key"
export NEXT_PUBLIC_API_URL="https://your-domain.com:5001"

# Deploy everything
./scripts/deploy.sh
```

### Development Mode:
```bash
# Start all services
docker-compose up --build -d

# Or use the pnpm shortcut
pnpm run docker:dev
```

---

## 📋 Prerequisites

### System Requirements:
- **Docker**: >= 20.10.0
- **Docker Compose**: >= 2.0.0
- **Node.js**: >= 20.0.0 (for local development; `.nvmrc` pins 24)
- **Memory**: >= 4GB RAM
- **Storage**: >= 10GB free space

### Environment Variables (Required):
```bash
# Core Application
DB_PASSWORD="your-secure-database-password"
JWT_SECRET="your-secret-key-at-least-32-characters"

# AI Integration (Optional)
OPENAI_API_KEY="sk-your-openai-key"

# Frontend Configuration
NEXT_PUBLIC_API_URL="http://your-backend-url:5001"
```

---

## 🐳 Docker Deployment Options

### Option 1: Production Stack (Recommended)
```bash
# Full production deployment
docker-compose -f docker-compose.prod.yml up --build -d

# Services included:
# - PostgreSQL Database (persistent)
# - Redis Cache & Job Queue
# - Full-stack Application (Frontend + Backend)
# - Nginx Load Balancer (optional)
```

### Option 2: Development Stack
```bash
# Development with hot reload
docker-compose up --build -d

# Services included:
# - PostgreSQL Database
# - Redis Cache
# - Backend API (development mode)
# - Frontend (development mode with Turbopack)
```

### Option 3: Individual Services
```bash
# Database only
docker-compose up postgres redis -d

# Application only
docker-compose up app -d
```

---

## 🔧 Configuration Management

### Environment Files:
```
.env.production     # Production environment
.env.local         # Local development overrides
env.docker.example # Template with all variables
```

### Key Configuration Options:

#### Database:
```env
DATABASE_URL=postgresql://user:password@host:port/database
DB_HOST=postgres
DB_PORT=5432
DB_DATABASE=formbuilder
DB_USER=formbuilder
DB_PASSWORD=your-secure-password
```

#### Security:
```env
JWT_SECRET=your-super-secret-key-minimum-32-characters
NODE_ENV=production
CORS_ORIGIN=https://your-domain.com
```

#### AI & Features:
```env
OPENAI_API_KEY=sk-your-key
SKIP_CONTENTLAYER=false
NEXT_TELEMETRY_DISABLED=1
```

---

## 🎯 Deployment Strategies

### Blue-Green Deployment:
```bash
# Start new version alongside current
docker-compose -f docker-compose.prod.yml up -d --scale app=2

# Health check new version
curl http://localhost:5001/health

# Switch traffic (update load balancer)
# Stop old version after verification
```

### Rolling Update:
```bash
# Update one service at a time
docker-compose -f docker-compose.prod.yml up -d --no-deps app
docker-compose -f docker-compose.prod.yml up -d --no-deps frontend
```

### Canary Deployment:
```bash
# Deploy to small percentage of users
# Monitor metrics and errors
# Gradually increase traffic
```

---

## 📊 Monitoring & Health Checks

### Health Endpoints:
- **Backend**: `http://localhost:5001/health`
- **Frontend**: `http://localhost:3000`
- **Database**: Docker health check (automatic)
- **Redis**: Docker health check (automatic)

### Monitoring Commands:
```bash
# Check all container status
docker-compose ps

# View real-time logs
docker-compose logs -f

# Monitor resource usage
docker stats

# Database health
docker exec formular-postgres-prod pg_isready -U formbuilder -d formbuilder
```

---

## 🔒 Security Best Practices

### 1. Environment Variables:
```bash
# Never commit secrets to git
echo ".env*" >> .gitignore

# Use strong passwords
export DB_PASSWORD=$(openssl rand -base64 32)
export JWT_SECRET=$(openssl rand -base64 64)
```

### 2. Network Security:
```yaml
# docker-compose.prod.yml
networks:
  formular-network:
    driver: bridge
    internal: true  # No external access to internal services
```

### 3. Container Security:
- Non-root users in containers
- Read-only file systems where possible
- Minimal base images (Alpine Linux)
- Regular security updates

---

## 🚦 CI/CD Pipeline

### GitHub Actions Workflows (actual):
- **CI** (`.github/workflows/ci.yml`): frontend `verify` — Prettier format check, ESLint, TypeScript, Vitest unit suite, production build
- **Auto-merge** (`.github/workflows/auto-merge.yml`): merges green, ready PRs via `scripts/ci/auto-merge-sweep.sh` (the policy lives in that script)
- **Deploy** (`.github/workflows/deploy.yml`): push to `main` → the fleet's `selfhost-deploy` workflow ships the app to the Hetzner box (bitbaum, behind Caddy) after this commit's CI is green
- The full-stack Playwright E2E is deferred (needs both servers plus a seeded DB) — run it manually

### Pipeline Stages:
```
┌─────────┐  ┌─────────────┐  ┌──────────────────────┐
│   CI    │─▶│ Auto-merge  │─▶│ Deploy to bitbaum    │
│ verify  │  │ green PRs   │  │ (Hetzner, via Caddy) │
└─────────┘  └─────────────┘  └──────────────────────┘
```

---

## 📚 Troubleshooting

### Common Issues:

#### 1. Build Failures:
```bash
# Check contentlayer issues
export SKIP_CONTENTLAYER=true
pnpm run build

# Clear Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache
```

#### 2. Database Connection:
```bash
# Check database status
docker exec formular-postgres-prod pg_isready

# View database logs
docker logs formular-postgres-prod

# Reset database
docker-compose down -v
docker-compose up postgres -d
```

#### 3. Performance Issues:
```bash
# Monitor resource usage
docker stats

# Check application logs
docker logs formular-app-prod

# Scale services
docker-compose up --scale app=3
```

---

## 🔄 Backup & Recovery

### Database Backup:
```bash
# Create backup
docker exec formular-postgres-prod pg_dump -U formbuilder formbuilder > backup.sql

# Restore backup
docker exec -i formular-postgres-prod psql -U formbuilder formbuilder < backup.sql
```

### Full System Backup:
```bash
# Backup volumes
docker run --rm -v formular_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz -C /data .

# Backup configuration
tar czf config_backup.tar.gz docker-compose.prod.yml .env.production scripts/
```

---

## 🚀 Performance Optimization

### Frontend Optimization:
- Static generation for blog pages
- Image optimization with Next.js
- Bundle splitting and lazy loading
- CDN for static assets

### Backend Optimization:
- Redis caching for API responses
- Database connection pooling
- Background job processing
- Horizontal scaling with load balancer

### Database Optimization:
- Proper indexing strategy
- Connection pooling
- Read replicas for scaling
- Regular VACUUM and ANALYZE

---

## 📈 Scaling Strategies

### Horizontal Scaling:
```yaml
# docker-compose.prod.yml
services:
  app:
    deploy:
      replicas: 3
    
  nginx:
    depends_on:
      - app
    ports:
      - "80:80"
      - "443:443"
```

### Vertical Scaling:
```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 4G
        reservations:
          cpus: '1.0'
          memory: 2G
```

---

## 🎯 Production Checklist

### Pre-Deployment:
- [ ] Environment variables configured
- [ ] Secrets properly stored
- [ ] SSL certificates ready
- [ ] Domain DNS configured
- [ ] Backup strategy in place
- [ ] Monitoring alerts configured

### Post-Deployment:
- [ ] Health checks passing
- [ ] Performance benchmarks met
- [ ] Error tracking enabled
- [ ] Log aggregation working
- [ ] Backup restoration tested
- [ ] Security scan completed

---

## 🔗 Quick Commands Reference

```bash
# Deployment
./scripts/deploy.sh                    # Full production deployment
docker-compose up --build -d          # Development deployment

# Monitoring
docker-compose logs -f                 # View logs
docker-compose ps                      # Service status
docker stats                           # Resource usage

# Maintenance
docker-compose down                    # Stop services
docker-compose down -v                 # Stop and remove volumes
docker system prune -a                 # Clean up Docker

# Database
docker exec -it formular-postgres-prod psql -U formbuilder formbuilder
```

---

## 📞 Support & Resources

- **Documentation**: `/docs/` directory
- **API Reference**: `http://localhost:5001/api/trpc`
- **Health Status**: `http://localhost:5001/health`
- **Frontend**: `http://localhost:3000`

---

**🎉 Deployment Status: READY FOR PRODUCTION**

All deployment issues have been resolved. The platform is now ready for enterprise-grade deployment with full Docker orchestration, CI/CD pipeline, and monitoring capabilities.