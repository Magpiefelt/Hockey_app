/**
 * Validate required environment variables on startup
 * This prevents the application from running with missing critical configuration
 */
export default defineNitroPlugin((nitroApp) => {
  const config = useRuntimeConfig()
  const isProduction = process.env.NODE_ENV === 'production'
  
  // Skip strict validation in development or when testing
  if (!isProduction || process.env.SKIP_ENV_VALIDATION === 'true') {
    console.log('✅ Development/Test mode: Skipping strict environment validation')
    return
  }
  
  const requiredEnvVars = [
    { key: 'DATABASE_URL', value: config.databaseUrl, critical: true },
    { key: 'SESSION_SECRET', value: config.sessionSecret, critical: true },
  ]
  
  // Production-only required variables
  if (isProduction) {
    requiredEnvVars.push(
      { key: 'STRIPE_SECRET_KEY', value: config.stripeSecretKey, critical: true },
      { key: 'STRIPE_PUBLISHABLE_KEY', value: config.public.stripePublishableKey, critical: true },
      { key: 'S3_BUCKET_NAME', value: config.s3BucketName, critical: false },
      { key: 'SENDGRID_API_KEY', value: config.sendgridApiKey, critical: false }
    )
  }
  
  const missingCritical: string[] = []
  const missingOptional: string[] = []
  
  for (const envVar of requiredEnvVars) {
    if (!envVar.value || envVar.value.trim() === '') {
      if (envVar.critical) {
        missingCritical.push(envVar.key)
      } else {
        missingOptional.push(envVar.key)
      }
    }
  }
  
  // Log warnings for optional missing variables
  if (missingOptional.length > 0) {
    console.warn('⚠️  Warning: Optional environment variables not set:')
    missingOptional.forEach(key => console.warn(`   - ${key}`))
  }
  
  // Throw error for critical missing variables
  if (missingCritical.length > 0) {
    console.error('❌ Critical environment variables are missing:')
    missingCritical.forEach(key => console.error(`   - ${key}`))
    throw new Error(
      `Application cannot start. Missing required environment variables: ${missingCritical.join(', ')}`
    )
  }
  
  console.log('✅ Environment variable validation passed')
})
