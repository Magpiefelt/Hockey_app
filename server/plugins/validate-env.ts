/**
 * Validate required environment variables on startup
 * This prevents the application from running with missing critical configuration
 */
export default defineNitroPlugin((nitroApp) => {
  const config = useRuntimeConfig()
  const isProduction = process.env.NODE_ENV === 'production'
  
  // Skip validation for Railway health checks
  if (process.env.RAILWAY_HEALTHCHECK_TIMEOUT_SEC) {
    console.log('✅ Railway health check: Skipping validation')
    return
  }
  
  // Skip strict validation in development or when testing
  if (!isProduction || process.env.SKIP_ENV_VALIDATION === 'true') {
    console.log('✅ Development/Test mode: Skipping strict environment validation')
    return
  }
  
  // Critical variables - app cannot start without these
  const criticalEnvVars = [
    { key: 'DATABASE_URL', value: config.databaseUrl },
    { key: 'SESSION_SECRET', value: config.sessionSecret },
  ]
  
  // Optional variables - warn but don't block startup
  const optionalEnvVars = [
    { key: 'STRIPE_SECRET_KEY', value: config.stripeSecretKey },
    { key: 'STRIPE_PUBLISHABLE_KEY', value: config.public.stripePublishableKey },
    { key: 'S3_BUCKET_NAME', value: config.s3BucketName },
    { key: 'SENDGRID_API_KEY', value: config.sendgridApiKey },
    { key: 'REDIS_URL', value: config.redisUrl }
  ]
  
  const missingCritical: string[] = []
  const missingOptional: string[] = []
  
  // Check critical variables
  for (const envVar of criticalEnvVars) {
    if (!envVar.value || envVar.value.trim() === '') {
      missingCritical.push(envVar.key)
    }
  }
  
  // Check optional variables
  for (const envVar of optionalEnvVars) {
    if (!envVar.value || envVar.value.trim() === '') {
      missingOptional.push(envVar.key)
    }
  }
  
  // Log warnings for optional missing variables
  if (missingOptional.length > 0) {
    console.warn('⚠️  Warning: Optional environment variables not set:')
    missingOptional.forEach(key => console.warn(`   - ${key}`))
    console.warn('   Some features may be disabled.')
  }
  
  // Throw error for critical missing variables with helpful message
  if (missingCritical.length > 0) {
    console.error('❌ Critical environment variables are missing:')
    missingCritical.forEach(key => console.error(`   - ${key}`))
    console.error('\n📝 To fix this in Railway:')
    console.error('   1. Go to your service settings')
    console.error('   2. Navigate to Variables tab')
    console.error('   3. Add the missing variables:')
    console.error('      - DATABASE_URL: Use ${PGDATABASE_URL} to reference the Postgres service')
    console.error('      - SESSION_SECRET: Generate with: openssl rand -base64 48')
    console.error('   4. Redeploy the service')
    console.error('\n💡 Tip: You can temporarily bypass validation with SKIP_ENV_VALIDATION=true\n')
    throw new Error(
      `Application cannot start. Missing required environment variables: ${missingCritical.join(', ')}`
    )
  }
  
  // Success message with configuration status
  console.log('✅ Environment variable validation passed')
  console.log(`   Database: ${config.databaseUrl ? '✓ Configured' : '✗ Not configured'}`)
  console.log(`   Session: ${config.sessionSecret ? '✓ Configured' : '✗ Not configured'}`)
  console.log(`   Stripe: ${config.stripeSecretKey ? '✓ Configured' : '○ Optional (not set)'}`)
  console.log(`   S3: ${config.s3BucketName ? '✓ Configured' : '○ Optional (not set)'}`)
  console.log(`   Email: ${config.sendgridApiKey ? '✓ Configured' : '○ Optional (not set)'}`)
  console.log(`   Redis: ${config.redisUrl ? '✓ Configured' : '○ Optional (not set)'}`)
})
// Force rebuild to pick up environment variables
// Build: 1765159112
