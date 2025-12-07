/**
 * Readiness Check Endpoint
 * Indicates if the application is ready to receive traffic
 * Used by load balancers and orchestration systems (Kubernetes, ECS)
 */

import { query } from '../db/connection'

export default defineEventHandler(async (event) => {
  try {
    // Check if database is accessible
    await query('SELECT 1')
    
    // Check if critical environment variables are set
    const config = useRuntimeConfig()
    if (!config.databaseUrl || !config.sessionSecret) {
      throw new Error('Missing critical configuration')
    }

    // Application is ready
    setResponseStatus(event, 200)
    return {
      status: 'ready',
      timestamp: new Date().toISOString()
    }
  } catch (error: any) {
    // Application is not ready
    setResponseStatus(event, 503)
    return {
      status: 'not_ready',
      error: error.message,
      timestamp: new Date().toISOString()
    }
  }
})
