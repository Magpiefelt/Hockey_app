# Elite Sports DJ Services - Setup & Deployment Guide

**Version**: 3.2 (Fixed & Optimized)  
**Status**: ✅ Production Ready  
**Last Updated**: December 4, 2025

---

## 📋 What's New in Version 3.2

### Critical Fixes Applied
✅ **Removed duplicate database utilities** - Fixed import conflicts in `db-pool.ts`  
✅ **Fixed build configuration** - Updated Nuxt config for proper SPA rendering  
✅ **Resolved all TypeScript errors** - Zero compilation errors  
✅ **Fixed middleware stack** - All 9 middleware layers properly configured  
✅ **Updated authentication** - Secure JWT implementation with token refresh  

### Code Quality Improvements
✅ Comprehensive error handling with custom error types  
✅ Input validation & sanitization (XSS prevention)  
✅ Security headers implementation (CSP, X-Frame-Options, etc.)  
✅ Rate limiting with Redis support  
✅ Structured logging with JSON output  
✅ Audit trail logging for security events  
✅ Performance monitoring middleware  

### Architecture Enhancements
✅ tRPC for type-safe API with automatic batching  
✅ Connection pooling for database (20-50 connections)  
✅ Transaction support with automatic rollback  
✅ Proper CORS configuration with environment variables  
✅ Admin IP filtering for sensitive routes  
✅ Request context enrichment for logging  

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Extract & Install
```bash
# Extract the zip file
unzip elite-sports-dj-v3.2-FIXED.zip
cd elite-sports-dj

# Install dependencies (first time only)
pnpm install
```

### Step 2: Configure Environment
```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your settings (see Environment Variables section)
# Minimum required:
# - DATABASE_URL
# - SESSION_SECRET
```

### Step 3: Run Application
```bash
# Development mode (with hot reload)
pnpm dev

# Application opens at http://localhost:3000
```

That's it! The application is now running.

---

## 🔧 Detailed Setup

### Prerequisites
- **Node.js** 18+ - https://nodejs.org/
- **pnpm** - `npm install -g pnpm` (or use npm/yarn)
- **PostgreSQL** 12+ - https://www.postgresql.org/
- **Redis** (optional) - https://redis.io/ (for rate limiting)

### Installation Steps

#### 1. Extract Application
```bash
unzip elite-sports-dj-v3.2-FIXED.zip
cd elite-sports-dj
```

#### 2. Install Dependencies
```bash
pnpm install
# This installs all required packages from package.json
# Takes 2-5 minutes depending on internet speed
```

#### 3. Create PostgreSQL Database
```bash
# Using psql
psql -U postgres
CREATE DATABASE elite_sports_dj;
\q

# Or using createdb
createdb -U postgres elite_sports_dj
```

#### 4. Configure Environment Variables
```bash
# Copy the example file
cp .env.example .env

# Edit .env with your values
nano .env  # or use your preferred editor
```

See **Environment Variables** section below for all available options.

#### 5. Build Application (Optional for Development)
```bash
# For development, you can skip this
# For production, run:
pnpm build
```

#### 6. Run Application

**Development Mode:**
```bash
pnpm dev
# Starts at http://localhost:3000
# Features: Hot reload, source maps, debug logging
```

**Production Mode:**
```bash
# First build
pnpm build

# Then run
node .output/server/index.mjs
# Starts at http://localhost:3000
# Features: Optimized, minified, production logging
```

---

## 🔐 Environment Variables

### Required Variables

#### Database Configuration
```env
# PostgreSQL connection string
# Format: postgresql://username:password@host:port/database
DATABASE_URL=postgresql://postgres:password@localhost:5432/elite_sports_dj
```

#### Authentication
```env
# JWT signing secret - MUST be at least 32 characters
# Generate with: openssl rand -base64 32
SESSION_SECRET=your-super-secret-key-min-32-chars-long
```

### Optional Variables

#### Email Configuration (SMTP)
```env
# Gmail example
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=Elite Sports DJ <noreply@elitesportsdj.com>

# Or use SendGrid
SENDGRID_API_KEY=SG.xxxxx
```

#### Payment Processing (Stripe)
```env
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

#### File Storage (AWS S3)
```env
S3_BUCKET_NAME=your-bucket-name
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
S3_ENDPOINT=https://s3.amazonaws.com  # Optional
```

#### Caching (Redis)
```env
REDIS_URL=redis://localhost:6379
```

#### Application Settings
```env
APP_URL=http://localhost:3000
NODE_ENV=development

# Admin IP whitelist (comma-separated)
ADMIN_IP_WHITELIST=192.168.1.1,10.0.0.1
```

---

## 📁 Project Structure

```
elite-sports-dj/
├── pages/                      # Frontend pages (auto-routed)
│   ├── index.vue              # Homepage
│   ├── request.vue            # Service request form
│   ├── login.vue              # User login
│   ├── admin.vue              # Admin dashboard
│   ├── orders.vue             # Orders management
│   └── emails.vue             # Email management
│
├── components/                 # Reusable Vue components
│   ├── FAQAccordion.vue
│   ├── ServiceCard.vue
│   ├── RequestForm.vue
│   └── ... (13+ components)
│
├── server/                     # Backend (Node.js/Nitro)
│   ├── api/                   # API routes
│   │   ├── health.get.ts      # Health check endpoint
│   │   ├── live.get.ts        # Liveness probe
│   │   ├── ready.get.ts       # Readiness probe
│   │   ├── metrics.get.ts     # Performance metrics
│   │   ├── upload.post.ts     # File upload
│   │   ├── trpc/[trpc].ts     # tRPC handler
│   │   └── webhooks/          # Webhook handlers
│   │       └── stripe.post.ts
│   │
│   ├── middleware/            # Request middleware (9 layers)
│   │   ├── 01.logging.ts      # Request/response logging
│   │   ├── 02.cors.ts         # CORS configuration
│   │   ├── 03.security.ts     # Security headers
│   │   ├── 04.rate-limit.ts   # Rate limiting
│   │   ├── 05.error-handler.ts # Error handling
│   │   ├── 06.context.ts      # Context enrichment
│   │   ├── 07.performance.ts  # Performance monitoring
│   │   ├── 08.request-validation.ts # Input validation
│   │   └── 09.ip-filter.ts    # Admin IP filtering
│   │
│   ├── trpc/                  # tRPC configuration
│   │   ├── context.ts         # tRPC context
│   │   ├── trpc.ts            # tRPC setup & procedures
│   │   └── routers/           # API routers
│   │       ├── index.ts       # Router composition
│   │       ├── auth.ts        # Authentication
│   │       ├── orders.ts      # Order management
│   │       ├── payments.ts    # Payment processing
│   │       ├── files.ts       # File uploads
│   │       ├── emails.ts      # Email sending
│   │       └── admin.ts       # Admin operations
│   │
│   ├── db/                    # Database
│   │   ├── connection.ts      # Connection pool setup
│   │   └── seed.ts            # Database seeding
│   │
│   └── utils/                 # Utility functions
│       ├── auth.ts            # Authentication utilities
│       ├── database.ts        # Database helpers
│       ├── errors.ts          # Error handling
│       ├── validation.ts      # Input validation
│       ├── sanitize.ts        # Data sanitization
│       ├── logger.ts          # Logging
│       ├── audit.ts           # Audit logging
│       ├── email.ts           # Email sending
│       ├── stripe.ts          # Stripe integration
│       ├── s3.ts              # AWS S3 integration
│       ├── redis.ts           # Redis integration
│       └── cache.ts           # Caching layer
│
├── assets/                     # Static assets
│   └── css/                   # Stylesheets
│
├── public/                     # Public files
│
├── tests/                      # Test files
│   ├── unit/
│   └── integration/
│
├── nuxt.config.ts             # Nuxt configuration
├── tsconfig.json              # TypeScript configuration
├── package.json               # Dependencies
├── pnpm-lock.yaml             # Dependency lock file
├── .env.example               # Environment variables template
├── README.md                  # Original README
├── SETUP_GUIDE.md            # This file
└── BACKEND_VALIDATION_REPORT.md # Backend validation report
```

---

## 🧪 Testing

### Run All Tests
```bash
pnpm test
```

### Run Tests in Watch Mode
```bash
pnpm test:watch
```

### Run Tests with Coverage
```bash
pnpm test:coverage
```

### Run Specific Test File
```bash
pnpm test tests/unit/logger.test.ts
```

---

## 🏗️ Building for Production

### Build Process
```bash
# Clean previous builds
rm -rf .nuxt .output dist

# Install dependencies
pnpm install

# Build application
pnpm build
```

### Output Structure
After building, the `.output/` directory contains:
```
.output/
├── public/              # Static assets
│   ├── _nuxt/          # Compiled JavaScript & CSS
│   └── index.html      # Entry HTML file
└── server/             # Server code
    ├── index.mjs       # Server entry point
    ├── server.mjs      # Compiled server code
    └── nitro.json      # Configuration
```

### Running Production Build
```bash
# Set environment variables
export DATABASE_URL="postgresql://..."
export SESSION_SECRET="..."

# Run server
node .output/server/index.mjs
```

---

## 🐳 Docker Deployment

### Build Docker Image
```bash
docker build -t elite-sports-dj:3.2 .
```

### Run Docker Container
```bash
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e SESSION_SECRET="..." \
  -e STRIPE_SECRET_KEY="..." \
  elite-sports-dj:3.2
```

### Docker Compose (with Database)
```bash
docker-compose up --build
```

---

## 📊 API Documentation

### tRPC Endpoints

All API calls go through `/api/trpc/` endpoint.

#### Authentication
```typescript
// Register
auth.register({ name, email, password })

// Login
auth.login({ email, password })

// Logout
auth.logout()

// Get profile
auth.profile()

// Update profile
auth.updateProfile({ name, email })
```

#### Orders
```typescript
// Create order
orders.create({ name, email, phone, serviceType, ... })

// List orders
orders.list({ page, pageSize })

// Get order
orders.get({ id })

// Update order
orders.update({ id, status, ... })

// Cancel order
orders.cancel({ id })
```

#### Payments
```typescript
// Create Stripe checkout
payments.createCheckout({ orderId })

// Verify payment
payments.verifyPayment({ sessionId })
```

#### Files
```typescript
// Upload file
files.upload({ file, orderId })

// List files
files.list({ orderId })

// Delete file
files.delete({ id })
```

#### Emails
```typescript
// Send email
emails.send({ to, subject, body })

// List emails
emails.list({ page })

// Resend email
emails.resend({ id })
```

### Health Check Endpoints

```bash
# Basic health check
curl http://localhost:3000/api/health

# Liveness probe (Kubernetes)
curl http://localhost:3000/api/live

# Readiness probe (Kubernetes)
curl http://localhost:3000/api/ready

# Performance metrics
curl http://localhost:3000/api/metrics
```

---

## 🔒 Security Features

### Authentication & Authorization
- ✅ JWT tokens (7-day expiration)
- ✅ Secure HTTP-only cookies
- ✅ Automatic token refresh
- ✅ Password hashing (bcrypt, 10 rounds)
- ✅ Role-based access control (RBAC)

### Input Protection
- ✅ Email validation
- ✅ Phone number validation
- ✅ Password strength validation
- ✅ File size & type validation
- ✅ XSS prevention (input sanitization)
- ✅ SQL injection prevention (parameterized queries)

### Network Security
- ✅ CORS configuration
- ✅ Security headers (CSP, X-Frame-Options, etc.)
- ✅ CSRF protection (SameSite cookies)
- ✅ Rate limiting (per-IP)
- ✅ Admin IP whitelist

### Data Protection
- ✅ Audit logging
- ✅ Error tracking
- ✅ Slow query detection
- ✅ Connection pooling

---

## 🚨 Troubleshooting

### Port Already in Use
```bash
# Use different port
PORT=3001 pnpm dev

# Or kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Database Connection Error
```bash
# Check PostgreSQL is running
psql -U postgres -c "SELECT 1"

# Verify DATABASE_URL format
# postgresql://username:password@host:port/database

# Check credentials
psql -U postgres -h localhost -d elite_sports_dj
```

### Module Not Found
```bash
# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Build Fails
```bash
# Clean build artifacts
rm -rf .nuxt .output dist

# Rebuild
pnpm build
```

### TypeScript Errors
```bash
# Check types
npx tsc --noEmit

# Rebuild with force
pnpm build --force
```

### Application Won't Start
```bash
# Check logs
pnpm dev 2>&1 | head -100

# Verify environment variables
echo $DATABASE_URL
echo $SESSION_SECRET

# Check port availability
netstat -tlnp | grep 3000
```

---

## 📈 Performance Optimization

### Database
- Connection pooling: 20-50 connections
- Query timeout: 30 seconds
- Slow query detection: > 1 second
- Index optimization for frequent queries

### Caching
- Redis for session caching
- Rate limiting cache
- HTTP caching headers

### Frontend
- Code splitting
- Lazy loading components
- Image optimization
- CSS minification

### Monitoring
- Performance metrics endpoint
- Slow query detection
- Error tracking
- Request logging

---

## 🔄 Updating the Application

### Update Dependencies
```bash
# Check for updates
pnpm update --interactive

# Update all
pnpm update

# Update specific package
pnpm update package-name
```

### Update Application Code
```bash
# Pull latest changes
git pull origin main

# Install new dependencies
pnpm install

# Rebuild
pnpm build
```

---

## 📝 Logs & Monitoring

### View Logs
```bash
# Development
pnpm dev 2>&1 | tee app.log

# Production
node .output/server/index.mjs 2>&1 | tee app.log
```

### Log Format
All logs are in JSON format for easy parsing:
```json
{
  "timestamp": "2025-12-04T23:30:00Z",
  "level": "INFO",
  "message": "User registered",
  "userId": 123,
  "email": "user@example.com"
}
```

### Filter Logs
```bash
# Show only errors
grep '"level":"ERROR"' app.log

# Show specific user
grep '"userId":123' app.log

# Show slow queries
grep '"duration":' app.log | awk -F',' '{print $NF}' | sort -n
```

---

## 🎯 Next Steps

1. ✅ Extract application
2. ✅ Install dependencies: `pnpm install`
3. ✅ Configure environment: Copy and edit `.env`
4. ✅ Set up database: Create PostgreSQL database
5. ✅ Run application: `pnpm dev`
6. ✅ Access at: http://localhost:3000

---

## 📞 Support

For issues or questions:
1. Check the **Troubleshooting** section above
2. Review logs for error messages
3. Check environment variables are set correctly
4. Verify database is running and accessible

---

**Happy deploying! 🚀**
