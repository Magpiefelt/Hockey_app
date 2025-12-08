/**
 * Performance Monitoring Middleware
 * Tracks response times and identifies slow endpoints
 */
import { logger } from '../utils/logger'

// Store performance metrics in memory
const performanceMetrics = new Map<string, {
  count: number
  totalTime: number
  minTime: number
  maxTime: number
  avgTime: number
}>()

export default defineEventHandler((event) => {
  const startTime = Date.now()
  const path = event.path
  const method = event.method
  const key = `${method} ${path}`
  
  // Hook into response finish
  event.node.res.on('finish', () => {
    const duration = Date.now() - startTime
    
    // Update metrics
    let metrics = performanceMetrics.get(key)
    if (!metrics) {
      metrics = {
        count: 0,
        totalTime: 0,
        minTime: Infinity,
        maxTime: 0,
        avgTime: 0
      }
      performanceMetrics.set(key, metrics)
    }
    
    metrics.count++
    metrics.totalTime += duration
    metrics.minTime = Math.min(metrics.minTime, duration)
    metrics.maxTime = Math.max(metrics.maxTime, duration)
    metrics.avgTime = metrics.totalTime / metrics.count
    
    // Log slow requests (>3 seconds)
    if (duration > 3000) {
      logger.warn('Slow endpoint detected', {
        endpoint: key,
        duration,
        requestId: event.context.requestId,
        avgTime: Math.round(metrics.avgTime),
        maxTime: metrics.maxTime
      })
    }
    
    // Attach performance data to response headers (for debugging)
    if (process.env.NODE_ENV !== 'production') {
      event.node.res.setHeader('X-Response-Time', `${duration}ms`)
      event.node.res.setHeader('X-Avg-Response-Time', `${Math.round(metrics.avgTime)}ms`)
    }
  })
})

/**
 * Get performance metrics (for monitoring endpoint)
 */
export function getPerformanceMetrics() {
  const metrics: any[] = []
  
  performanceMetrics.forEach((data, endpoint) => {
    metrics.push({
      endpoint,
      ...data,
      avgTime: Math.round(data.avgTime)
    })
  })
  
  // Sort by average time (slowest first)
  return metrics.sort((a, b) => b.avgTime - a.avgTime)
}

/**
 * Reset performance metrics
 */
export function resetPerformanceMetrics() {
  performanceMetrics.clear()
}
