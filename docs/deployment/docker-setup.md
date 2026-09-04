# Docker Setup Guide

---
created_date: 2025-01-27
last_modified_date: 2026-09-04
last_modified_summary: "Commands updated to pnpm (the repo's package manager)."
---

## Overview

This guide covers setting up Formular using Docker for both development and production environments. Docker provides consistent, isolated environments and simplifies deployment.

## Prerequisites

### Required Software
- **Docker**: Version 20.10+ 
- **Docker Compose**: Version 2.0+
- **Git**: For cloning the repository

### System Requirements
- **RAM**: Minimum 4GB (8GB recommended)
- **Disk Space**: Minimum 10GB free space
- **CPU**: 2+ cores recommended

## Quick Start (Development)

### 1. Clone Repository
```bash
git clone <repository-url>
cd formular
```

### 2. Environment Setup
```bash
# Copy environment template
cp env.docker.example .env

# Edit environment variables
nano .env
```

**Required Environment Variables:**
```env
DB_PASSWORD=your-secure-password-here
JWT_SECRET=your-super-secret-jwt-key-change-in-production
OPENAI_API_KEY=your-openai-api-key-here  # Optional for basic functionality
```

### 3. Start Development Environment
```bash
# Start all services
pnpm run docker:dev

# Or using docker-compose directly
docker-compose up --build
```

### 4. Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001
- **Database**: localhost:5432 (formbuilder/formbuilder)
- **Redis**: localhost:6379

## Development Workflow

### Available Commands

| Command | Description |
|---------|-------------|
| `pnpm run docker:dev` | Start development environment |
| `pnpm run docker:down` | Stop all containers |
| `pnpm run docker:clean` | Stop and remove all containers/volumes |
| `pnpm run docker:logs` | View container logs |
| `pnpm run docker:migrate` | Run database migrations |

### Working with Containers

#### View Running Containers
```bash
docker ps
```

#### Access Container Shell
```bash
# Backend container
docker exec -it formular-backend bash

# Database container
docker exec -it formular-postgres psql -U formbuilder -d formbuilder
```

#### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Hot Reloading

The development setup includes volume mounts for hot reloading:
- **Frontend**: Changes to `frontend/` directory automatically reload
- **Backend**: Changes to `backend/` directory automatically restart server
- **Database**: Persistent data stored in Docker volumes

## Production Deployment

### 1. Environment Configuration
```bash
# Copy production environment template
cp env.docker.example .env.production

# Configure production values
nano .env.production
```

**Production Environment Variables:**
```env
NODE_ENV=production
DB_PASSWORD=strong-production-password
JWT_SECRET=cryptographically-secure-secret-key
OPENAI_API_KEY=prod-openai-key
NEXT_PUBLIC_API_URL=https://your-domain.com
```

### 2. Deploy Production Stack
```bash
# Start production environment
pnpm run docker:prod

# Or with custom environment file
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d
```

### 3. Run Database Migrations
```bash
# Run migrations in production
docker-compose -f docker-compose.prod.yml --profile migrate up migrate
```

## Service Architecture

### Development Services
- **postgres**: PostgreSQL 15 database
- **redis**: Redis 7 for caching and job queues
- **backend**: Node.js/Express API server
- **frontend**: Next.js development server
- **migrate**: Database migration service (on-demand)

### Production Services
- **postgres**: PostgreSQL 15 database (persistent)
- **redis**: Redis 7 for caching (persistent)
- **app**: Combined frontend/backend application
- **nginx**: Reverse proxy (optional)

## Volumes and Data Persistence

### Development Volumes
```yaml
postgres_data:      # Database data
redis_data:         # Redis cache data
backend_node_modules:   # Backend dependencies
frontend_node_modules:  # Frontend dependencies
```

### Production Volumes
```yaml
postgres_prod_data: # Production database data
redis_prod_data:    # Production cache data
```

## Networking

### Internal Network
All services communicate through the `formular-network` bridge network:
- **Database**: `postgres:5432`
- **Redis**: `redis:6379`
- **Backend**: `backend:5001`
- **Frontend**: `frontend:3000`

### External Access
- **Frontend**: Port 3000 → http://localhost:3000
- **Backend**: Port 5001 → http://localhost:5001
- **Database**: Port 5432 → localhost:5432 (development only)
- **Redis**: Port 6379 → localhost:6379 (development only)

## Health Checks

All services include health checks:
- **PostgreSQL**: `pg_isready` command
- **Redis**: `redis-cli ping` command
- **Backend**: HTTP GET to `/health` endpoint
- **Frontend**: Built-in Next.js health check

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port
lsof -ti:3000 | xargs kill

# Or use different ports
PORT=3001 docker-compose up
```

#### Database Connection Failed
```bash
# Check database status
docker-compose logs postgres

# Reset database
docker-compose down -v
docker-compose up postgres
```

#### Out of Disk Space
```bash
# Clean up Docker system
pnpm run docker:clean
docker system prune -a

# Remove unused images
docker image prune -a
```

#### Permission Issues
```bash
# Fix file permissions
sudo chown -R $USER:$USER .
chmod -R 755 .
```

### Debugging Commands

```bash
# Container resource usage
docker stats

# Inspect container configuration
docker inspect formular-backend

# Network information
docker network ls
docker network inspect formular_formular-network

# Volume information
docker volume ls
docker volume inspect formular_postgres_data
```

## Performance Optimization

### Development Optimizations
- Use `.dockerignore` to exclude unnecessary files
- Volume mounts for node_modules to improve performance
- Multi-stage builds to reduce image size

### Production Optimizations
- Multi-stage builds with production-only dependencies
- Health checks for service reliability
- Resource limits and restart policies
- Nginx reverse proxy for static file serving

## Security Considerations

### Development Security
- Default passwords (change for production)
- Database ports exposed (for debugging)
- Debug logging enabled

### Production Security
- Strong passwords and secrets
- No exposed database ports
- HTTPS with SSL certificates
- Regular security updates

## Backup and Recovery

### Database Backup
```bash
# Create backup
docker exec formular-postgres pg_dump -U formbuilder formbuilder > backup.sql

# Restore backup
docker exec -i formular-postgres psql -U formbuilder formbuilder < backup.sql
```

### Volume Backup
```bash
# Backup volume
docker run --rm -v formular_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz /data

# Restore volume
docker run --rm -v formular_postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres_backup.tar.gz -C /
```

## Next Steps

1. **Development**: Use `pnpm run docker:dev` for daily development
2. **Testing**: Set up automated testing with Docker
3. **CI/CD**: Integrate Docker builds with GitHub Actions
4. **Production**: Deploy to cloud provider with Docker Compose
5. **Monitoring**: Add logging and monitoring solutions

For more information, see:
- [Development Setup](../getting-started/development-setup.md)
- [Production Deployment](./production-deployment.md)
- [Architecture Overview](../architecture/README.md) 