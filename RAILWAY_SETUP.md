# Railway Environment Setup Guide

## Quick Start: Get Your App Online in 5 Minutes

### Step 1: Configure Environment Variables

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Select your project: **modest-adventure**
3. Click on the **Hockey_app** service
4. Navigate to the **Variables** tab
5. Add the following variables:

#### Critical Variables (Required)

```bash
# Database Connection
DATABASE_URL=${PGDATABASE_URL}

# Session Security
SESSION_SECRET=<paste-generated-secret-here>
```

**To generate SESSION_SECRET:**

Run this command on your local machine:
```bash
openssl rand -base64 48
```

Copy the output and paste it as the value for `SESSION_SECRET`.

#### Optional Variables (For Full Functionality)

```bash
# Stripe Payment Integration (Optional)
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here

# AWS S3 File Storage (Optional)
S3_BUCKET_NAME=your-bucket-name
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key

# Email Service (Optional)
SENDGRID_API_KEY=your-sendgrid-key

# Redis Cache (Optional)
REDIS_URL=redis://your-redis-url
```

### Step 2: Deploy

After adding the variables, Railway will automatically trigger a redeploy. If not:

1. Go to the **Deployments** tab
2. Click **Deploy** or **Redeploy**

### Step 3: Verify

Once deployed, check:

1. **Status**: Should show "ONLINE" (green)
2. **Logs**: Should show "✅ Environment variable validation passed"
3. **URL**: Click on the deployment URL to test the application

---

## Understanding the Variables

### DATABASE_URL

**What it is:** Connection string for your PostgreSQL database

**Value:** `${PGDATABASE_URL}`

**Why this syntax:** Railway automatically injects the Postgres connection URL as `PGDATABASE_URL`. By using `${PGDATABASE_URL}`, you're referencing that auto-injected variable.

**What it looks like:**
```
postgresql://user:password@host:5432/database
```

### SESSION_SECRET

**What it is:** Secret key used to sign and encrypt user sessions

**Requirements:**
- Must be at least 32 characters
- Should be random and unpredictable
- Keep it secret and never commit to git

**How to generate:**
```bash
# Option 1: OpenSSL (recommended)
openssl rand -base64 48

# Option 2: Node.js
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"

# Option 3: Python
python3 -c "import secrets; print(secrets.token_urlsafe(48))"
```

---

## Troubleshooting

### App Still Crashing?

**Check the logs:**
1. Go to Hockey_app service
2. Click on **Logs** tab
3. Look for error messages

**Common issues:**

#### "DATABASE_URL is missing"
- Make sure you added `DATABASE_URL=${PGDATABASE_URL}`
- Verify your Postgres service is running
- Check that the services are linked

#### "SESSION_SECRET is missing"
- Generate a new secret with `openssl rand -base64 48`
- Add it to variables
- Redeploy

#### "Connection refused" or "ECONNREFUSED"
- Database might not be ready yet
- Wait 30 seconds and try again
- Check Postgres service status

### App Online But Features Not Working?

#### Stripe payments not working
- Add `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY`
- Get keys from [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)

#### File uploads not working
- Add S3 configuration variables
- Create an S3 bucket in AWS
- Generate IAM credentials with S3 access

#### Emails not sending
- Add `SENDGRID_API_KEY`
- Get key from [SendGrid Dashboard](https://app.sendgrid.com/settings/api_keys)

---

## Environment Variable Reference

| Variable | Required | Purpose | Example Value |
|----------|----------|---------|---------------|
| `DATABASE_URL` | ✅ Yes | Postgres connection | `${PGDATABASE_URL}` |
| `SESSION_SECRET` | ✅ Yes | Session encryption | `<random-48-char-string>` |
| `STRIPE_SECRET_KEY` | ❌ No | Stripe payments | `sk_test_...` |
| `STRIPE_PUBLISHABLE_KEY` | ❌ No | Stripe client | `pk_test_...` |
| `S3_BUCKET_NAME` | ❌ No | File storage | `my-app-uploads` |
| `S3_REGION` | ❌ No | AWS region | `us-east-1` |
| `S3_ACCESS_KEY_ID` | ❌ No | AWS credentials | `AKIA...` |
| `S3_SECRET_ACCESS_KEY` | ❌ No | AWS credentials | `<secret>` |
| `SENDGRID_API_KEY` | ❌ No | Email service | `SG....` |
| `REDIS_URL` | ❌ No | Cache/sessions | `redis://...` |

---

## Security Best Practices

### ✅ DO:
- Generate strong random secrets
- Use environment variables for all secrets
- Rotate secrets periodically
- Use different secrets for dev/staging/prod

### ❌ DON'T:
- Commit secrets to git
- Share secrets in plain text
- Use weak or predictable secrets
- Reuse secrets across environments

---

## Next Steps

Once your app is online:

1. **Test the application** - Visit the Railway URL
2. **Check all features** - Try navigation, forms, etc.
3. **Monitor logs** - Watch for any errors
4. **Add optional services** - Configure Stripe, S3, etc. as needed

---

## Need Help?

- **Railway Docs:** https://docs.railway.app/
- **Check Logs:** Railway Dashboard → Service → Logs
- **Database Status:** Railway Dashboard → Postgres service
- **Environment Vars:** Railway Dashboard → Service → Variables

---

## Quick Reference Commands

```bash
# Generate SESSION_SECRET
openssl rand -base64 48

# Test database connection locally
psql $DATABASE_URL

# Check if app is responding
curl https://your-app.up.railway.app/api/health
```

---

## Validation Bypass (Development Only)

If you need to temporarily bypass validation (not recommended for production):

```bash
SKIP_ENV_VALIDATION=true
```

This will skip all environment variable checks. Use only for testing!
