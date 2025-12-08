# Production Deployment Guide

This guide provides step-by-step instructions for deploying the Elite Sports DJ application to production.

---

## Prerequisites

Before deploying, ensure you have:

- **Docker** and **Docker Compose** installed (for containerized deployment)
- **PostgreSQL** database (v14+)
- **Redis** server (v7+)
- **Node.js** v18+ (if deploying without Docker)
- **pnpm** package manager
- **Domain name** with SSL certificate
- **Stripe account** for payment processing
- **SMTP credentials** or SendGrid API key for emails
- **AWS S3** or S3-compatible storage for file uploads

---

## Environment Configuration

### 1. Copy Environment Template

```bash
cp .env.example .env
```

### 2. Configure Required Variables

Edit `.env` and set the following **required** variables:

```bash
# Application
APP_URL=https://yourdomain.com
NODE_ENV=production

# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Session (generate with: openssl rand -base64 32)
SESSION_SECRET=your-secure-random-secret-here

# Stripe
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="Elite Sports DJ <noreply@yourdomain.com>"

# S3 Storage
S3_BUCKET_NAME=your-bucket-name
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key

# Redis
REDIS_URL=redis://localhost:6379
```

---

## Deployment Options

### Option 1: Docker Compose (Recommended)

This option includes PostgreSQL, Redis, and the application in containers.

#### Step 1: Build and Start Services

```bash
docker-compose up -d
```

#### Step 2: Run Database Migrations

```bash
docker-compose exec app pnpm migrate:up
```

#### Step 3: Seed Initial Data (Optional)

```bash
docker-compose exec app pnpm db:seed
```

#### Step 4: Verify Deployment

```bash
# Check service health
docker-compose ps

# View logs
docker-compose logs -f app

# Test health endpoint
curl http://localhost:3000/api/health
```

---

### Option 2: Manual Deployment

If you prefer to deploy without Docker:

#### Step 1: Install Dependencies

```bash
pnpm install --frozen-lockfile
```

#### Step 2: Build the Application

```bash
pnpm build
```

#### Step 3: Run Database Migrations

```bash
pnpm migrate:up
```

#### Step 4: Start the Application

```bash
NODE_ENV=production node .output/server/index.mjs
```

---

## Database Setup

### Initialize Database Schema

The database schema is automatically applied when using Docker Compose. For manual setup:

```bash
psql -U postgres -d elitesportsdj -f server/db/schema.sql
```

### Run Migrations

```bash
pnpm migrate:up
```

### Seed Sample Data (Optional)

```bash
pnpm db:seed
```

---

## SSL/HTTPS Configuration

### Using Nginx Reverse Proxy

Create an Nginx configuration file:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Stripe Webhook Configuration

### 1. Set Up Webhook Endpoint

In your Stripe Dashboard:
1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `invoice.paid`
   - `invoice.payment_failed`

### 2. Copy Webhook Secret

Copy the webhook signing secret and add it to your `.env`:

```bash
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## Monitoring and Maintenance

### Health Checks

The application provides several health check endpoints:

- `/api/health` - Basic health check
- `/api/ready` - Readiness check (includes DB connection)
- `/api/live` - Liveness check
- `/api/metrics` - Application metrics

### Logs

View application logs:

```bash
# Docker
docker-compose logs -f app

# PM2 (if using PM2)
pm2 logs elitesportsdj

# Direct
tail -f logs/app.log
```

### Database Backups

Set up automated PostgreSQL backups:

```bash
# Create backup
pg_dump -U postgres elitesportsdj > backup_$(date +%Y%m%d).sql

# Restore backup
psql -U postgres elitesportsdj < backup_20240101.sql
```

---

## Security Checklist

Before going live, ensure:

- [ ] All environment variables are set correctly
- [ ] `SESSION_SECRET` is a strong random string
- [ ] Database credentials are secure
- [ ] SSL/HTTPS is properly configured
- [ ] Stripe is in live mode (not test mode)
- [ ] CORS is configured for your domain only
- [ ] Admin IP whitelist is configured (optional but recommended)
- [ ] All sensitive data is in `.env` (not hardcoded)
- [ ] `.env` file is in `.gitignore`
- [ ] Security headers are enabled (via middleware)
- [ ] Rate limiting is active
- [ ] Database backups are scheduled

---

## Scaling Considerations

### Horizontal Scaling

To run multiple instances behind a load balancer:

1. Use a shared Redis instance for sessions
2. Use a managed PostgreSQL database
3. Use S3 for file storage (not local filesystem)
4. Configure load balancer with sticky sessions

### Performance Optimization

- Enable Redis caching
- Use a CDN for static assets
- Enable database connection pooling
- Monitor and optimize slow queries
- Consider using a reverse proxy cache (Varnish, Nginx)

---

## Troubleshooting

### Application Won't Start

1. Check environment variables: `docker-compose config`
2. Verify database connection: `psql $DATABASE_URL`
3. Check logs: `docker-compose logs app`

### Database Connection Issues

1. Verify `DATABASE_URL` format
2. Check PostgreSQL is running: `docker-compose ps postgres`
3. Test connection: `psql $DATABASE_URL`

### Stripe Webhook Failures

1. Verify webhook secret is correct
2. Check webhook endpoint is accessible
3. Review Stripe Dashboard → Webhooks → Events

---

## Support

For issues or questions:
- Check application logs
- Review environment configuration
- Consult the main README.md
- Check the GitHub repository issues

---

**Last Updated:** December 7, 2025
