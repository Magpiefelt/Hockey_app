/**
 * Metrics Endpoint
 * Returns application metrics for monitoring and observability
 */

import { query } from '../db/connection'
import { logger } from '../utils/logger'

export default defineEventHandler(async (event) => {
  try {
    const metrics: any = {
      timestamp: new Date().toISOString(),
      system: {
        uptime: process.uptime(),
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
          external: Math.round(process.memoryUsage().external / 1024 / 1024)
        },
        cpu: process.cpuUsage(),
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      },
      database: {},
      business: {}
    }

    // Database metrics
    try {
      // Total orders
      const ordersResult = await query('SELECT COUNT(*) as count FROM quote_requests')
      metrics.database.totalOrders = parseInt(ordersResult.rows[0].count)

      // Orders by status
      const statusResult = await query(`
        SELECT status, COUNT(*) as count 
        FROM quote_requests 
        GROUP BY status
      `)
      metrics.database.ordersByStatus = statusResult.rows.reduce((acc: any, row: any) => {
        acc[row.status] = parseInt(row.count)
        return acc
      }, {})

      // Total users
      const usersResult = await query('SELECT COUNT(*) as count FROM users')
      metrics.database.totalUsers = parseInt(usersResult.rows[0].count)

      // Total files
      const filesResult = await query('SELECT COUNT(*) as count FROM file_uploads')
      metrics.database.totalFiles = parseInt(filesResult.rows[0].count)

      // Total emails sent
      const emailsResult = await query('SELECT COUNT(*) as count FROM email_logs')
      metrics.database.totalEmailsSent = parseInt(emailsResult.rows[0].count)

      // Database size (PostgreSQL specific)
      const sizeResult = await query(`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size
      `)
      metrics.database.size = sizeResult.rows[0].size

      // Active connections
      const connectionsResult = await query(`
        SELECT COUNT(*) as count 
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `)
      metrics.database.activeConnections = parseInt(connectionsResult.rows[0].count)

    } catch (error: any) {
      logger.error('Failed to collect database metrics', error)
      metrics.database.error = error.message
    }

    // Business metrics
    try {
      // Orders in last 24 hours
      const recentOrdersResult = await query(`
        SELECT COUNT(*) as count 
        FROM quote_requests 
        WHERE created_at > NOW() - INTERVAL '24 hours'
      `)
      metrics.business.ordersLast24Hours = parseInt(recentOrdersResult.rows[0].count)

      // Revenue metrics (if available)
      const revenueResult = await query(`
        SELECT 
          COUNT(*) as paid_orders,
          SUM(total_amount) as total_revenue
        FROM quote_requests 
        WHERE status IN ('paid', 'completed', 'delivered')
      `)
      if (revenueResult.rows.length > 0) {
        metrics.business.paidOrders = parseInt(revenueResult.rows[0].paid_orders) || 0
        metrics.business.totalRevenue = parseInt(revenueResult.rows[0].total_revenue) || 0
      }

      // Average order processing time
      const processingTimeResult = await query(`
        SELECT 
          AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_seconds
        FROM quote_requests 
        WHERE status IN ('completed', 'delivered')
        AND updated_at IS NOT NULL
      `)
      if (processingTimeResult.rows.length > 0 && processingTimeResult.rows[0].avg_seconds) {
        metrics.business.avgProcessingTimeHours = Math.round(
          parseFloat(processingTimeResult.rows[0].avg_seconds) / 3600
        )
      }

    } catch (error: any) {
      logger.error('Failed to collect business metrics', error)
      metrics.business.error = error.message
    }

    return metrics

  } catch (error: any) {
    logger.error('Metrics endpoint error', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to collect metrics'
    })
  }
})
