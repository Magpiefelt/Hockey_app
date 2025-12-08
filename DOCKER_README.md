# Docker Deployment Guide

This guide explains how to run the Elite Sports DJ application using Docker and Docker Compose.

---

## Quick Start

### 1. Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+

### 2. Clone and Configure

```bash
# Clone the repository
git clone https://github.com/your-repo/Hockey_app.git
cd Hockey_app

# Copy environment template
cp .env.example .env

# Edit .env and configure your environment variables
nano .env
```

### 3. Start Services

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check service status
docker-compose ps
```

### 4. Initialize Database

```bash
# Run migrations
docker-compose exec app pnpm migrate:up

# (Optional) Seed sample data
docker-compose exec app pnpm db:seed
```

### 5. Access the Application

Open your browser and navigate to:
- **Application**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin (login with seeded admin user)

---

## Services

The Docker Compose setup includes three services:

### 1. PostgreSQL Database
- **Container**: `elitesportsdj-db`
- **Port**: 5432
- **Volume**: `postgres_data` (persistent storage)
- **Default Credentials**: postgres/postgres

### 2. Redis Cache
- **Container**: `elitesportsdj-redis`
- **Port**: 6379
- **Volume**: `redis_data` (persistent storage)

### 3. Application
- **Container**: `elitesportsdj-app`
- **Port**: 3000
- **Dependencies**: PostgreSQL, Redis

---

## Common Commands

### Service Management

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart services
docker-compose restart

# View logs
docker-compose logs -f app

# View all service logs
docker-compose logs -f
```

### Application Commands

```bash
# Run migrations
docker-compose exec app pnpm migrate:up

# Rollback migration
docker-compose exec app pnpm migrate:rollback

# Seed database
docker-compose exec app pnpm db:seed

# Access shell inside app container
docker-compose exec app sh

# Run custom command
docker-compose exec app node -e "console.log('Hello')"
```

### Database Commands

```bash
# Access PostgreSQL shell
docker-compose exec postgres psql -U postgres -d elitesportsdj

# Create database backup
docker-compose exec postgres pg_dump -U postgres elitesportsdj > backup.sql

# Restore database backup
cat backup.sql | docker-compose exec -T postgres psql -U postgres -d elitesportsdj

# View database tables
docker-compose exec postgres psql -U postgres -d elitesportsdj -c "\dt"
```

### Redis Commands

```bash
# Access Redis CLI
docker-compose exec redis redis-cli

# Clear all cache
docker-compose exec redis redis-cli FLUSHALL

# View cache keys
docker-compose exec redis redis-cli KEYS '*'
```

---

## Environment Variables

The application requires several environment variables. See `.env.example` for a complete list.

### Required Variables

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/elitesportsdj

# Redis
REDIS_URL=redis://redis:6379

# Session
SESSION_SECRET=your-secure-random-secret

# Stripe
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## Production Deployment

For production deployment, make the following changes:

### 1. Update Environment Variables

```bash
# Set production mode
NODE_ENV=production

# Use production database
DATABASE_URL=postgresql://user:pass@prod-db:5432/elitesportsdj

# Use production Stripe keys
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...

# Set strong session secret
SESSION_SECRET=$(openssl rand -base64 32)
```

### 2. Use External Database

For production, use a managed PostgreSQL service (AWS RDS, DigitalOcean, etc.):

```yaml
# In docker-compose.yml, remove the postgres service
# Update DATABASE_URL to point to external database
```

### 3. Configure SSL/HTTPS

Use a reverse proxy (Nginx, Traefik, Caddy) for SSL termination:

```yaml
# Example Nginx configuration
server {
    listen 443 ssl;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## Troubleshooting

### Application Won't Start

```bash
# Check logs
docker-compose logs app

# Verify environment variables
docker-compose config

# Rebuild containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Test database connection
docker-compose exec postgres psql -U postgres -d elitesportsdj -c "SELECT 1"

# Check DATABASE_URL format
echo $DATABASE_URL
```

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Change port in docker-compose.yml
ports:
  - "3001:3000"  # Map to different host port
```

### Clear Everything and Start Fresh

```bash
# Stop and remove all containers, networks, and volumes
docker-compose down -v

# Remove all images
docker-compose down --rmi all

# Start fresh
docker-compose up -d --build
```

---

## Health Checks

The application includes health check endpoints:

```bash
# Basic health check
curl http://localhost:3000/api/health

# Readiness check (includes DB)
curl http://localhost:3000/api/ready

# Liveness check
curl http://localhost:3000/api/live

# Metrics
curl http://localhost:3000/api/metrics
```

---

## Volumes and Data Persistence

Data is persisted in Docker volumes:

```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect hockey_app_postgres_data

# Backup volume
docker run --rm -v hockey_app_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz /data

# Restore volume
docker run --rm -v hockey_app_postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres_backup.tar.gz -C /
```

---

## Performance Tuning

### PostgreSQL

```bash
# Increase max connections (in docker-compose.yml)
postgres:
  command: postgres -c max_connections=200

# Increase shared buffers
postgres:
  command: postgres -c shared_buffers=256MB
```

### Application

```bash
# Increase Node.js memory limit
app:
  environment:
    NODE_OPTIONS: --max-old-space-size=4096
```

---

## Security Best Practices

1. **Never commit `.env` file** - Keep secrets out of version control
2. **Use strong passwords** - Generate random passwords for production
3. **Limit exposed ports** - Only expose necessary ports
4. **Use secrets management** - Consider Docker Secrets or external vaults
5. **Regular updates** - Keep base images updated
6. **Scan for vulnerabilities** - Use `docker scan` or Trivy

---

For more information, see:
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Full production deployment guide
- [README.md](./README.md) - Application documentation
