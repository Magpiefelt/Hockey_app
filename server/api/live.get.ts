/**
 * Liveness Check Endpoint
 * Indicates if the application is alive and running
 * Used by orchestration systems (Kubernetes, ECS) to restart unhealthy containers
 */

export default defineEventHandler((event) => {
  // Simple check - if this endpoint responds, the process is alive
  setResponseStatus(event, 200)
  return {
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  }
})
