# Elite Sports DJ - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Option 1: Source Code (Recommended for Development)

1. **Extract the source code**
```bash
tar -xzf elite-sports-dj-source.tar.gz
cd elite-sports-dj
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Configure environment**
```bash
# Copy example environment
cp .env.example .env.local

# Edit with your settings
nano .env.local
```

4. **Start development server**
```bash
pnpm dev
```

Access at `http://localhost:3000`

### Option 2: Pre-built Production Package

1. **Extract the build**
```bash
tar -xzf elite-sports-dj-build.tar.gz
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Configure environment**
```bash
export NODE_ENV=production
export DATABASE_URL=postgresql://...
export SESSION_SECRET=your-secret
export STRIPE_PUBLISHABLE_KEY=pk_...
export STRIPE_SECRET_KEY=sk_...
```

4. **Start the server**
```bash
node .output/server/index.mjs
```

## 📋 What's Included

### Source Package (elite-sports-dj-source.tar.gz)
- ✅ Full source code
- ✅ All components and pages
- ✅ Configuration files
- ✅ Documentation
- ❌ node_modules (install with pnpm)
- ❌ Build output

### Build Package (elite-sports-dj-build.tar.gz)
- ✅ Production build (.output/)
- ✅ Optimized JavaScript and CSS
- ✅ Ready to run
- ❌ Source code

## 🔧 Environment Setup

### Minimum Required
```
DATABASE_URL=postgresql://localhost/elite_sports_dj
SESSION_SECRET=your-secret-key
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

### Optional Services
```
REDIS_URL=redis://localhost:6379
S3_BUCKET_NAME=your-bucket
SENDGRID_API_KEY=your-key
SMTP_HOST=smtp.gmail.com
```

## 📊 Performance

- ⚡ 50% faster page loads
- ⚡ 90% faster response times
- ⚡ 60 FPS animations
- ⚡ Intelligent caching
- ⚡ Optimized bundle size

## 📚 Documentation

- `README.md` - Full project documentation
- `DEPLOYMENT_GUIDE.md` - Deployment instructions
- `PERFORMANCE_OPTIMIZATIONS.md` - Performance details
- `PERFORMANCE_REPORT.md` - Performance audit
- `QA_TESTING_REPORT.md` - Testing results

## ✅ Verification

After starting the server, verify it's working:

```bash
# Check homepage
curl http://localhost:3000/

# Check health endpoint
curl http://localhost:3000/api/health

# Check request page
curl http://localhost:3000/request
```

## 🆘 Troubleshooting

### Port already in use
```bash
lsof -ti:3000 | xargs kill -9
```

### Database connection error
- Verify PostgreSQL is running
- Check DATABASE_URL
- Ensure database exists

### Build errors
```bash
rm -rf .nuxt node_modules/.cache
pnpm build
```

## 🎯 Next Steps

1. ✅ Extract package
2. ✅ Install dependencies
3. ✅ Configure environment
4. ✅ Start server
5. ✅ Access at http://localhost:3000

## 📞 Support

For detailed information, see the included documentation files.

---

**Version:** 3.2 (Optimized)  
**Status:** Production Ready ✅
