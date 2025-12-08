/**
 * Audit Trail Utility
 * Tracks important business events and admin actions
 */
import { executeQuery } from './database'
import { logger } from './logger'

export enum AuditAction {
  // Authentication
  LOGIN = 'auth.login',
  LOGOUT = 'auth.logout',
  REGISTER = 'auth.register',
  PASSWORD_CHANGE = 'auth.password_change',
  PASSWORD_RESET_REQUEST = 'auth.password_reset_request',
  PASSWORD_RESET = 'auth.password_reset',
  
  // Orders
  ORDER_CREATED = 'order.created',
  ORDER_UPDATED = 'order.updated',
  ORDER_STATUS_CHANGED = 'order.status_changed',
  ORDER_DELETED = 'order.deleted',
  
  // Payments
  PAYMENT_INITIATED = 'payment.initiated',
  PAYMENT_COMPLETED = 'payment.completed',
  PAYMENT_FAILED = 'payment.failed',
  
  // Files
  FILE_UPLOADED = 'file.uploaded',
  FILE_DOWNLOADED = 'file.downloaded',
  FILE_DELETED = 'file.deleted',
  
  // Admin
  ADMIN_ACCESS = 'admin.access',
  ADMIN_UPDATE = 'admin.update',
  CUSTOMER_VIEWED = 'customer.viewed',
  
  // Email
  EMAIL_SENT = 'email.sent',
  EMAIL_FAILED = 'email.failed'
}

interface AuditEntry {
  action: AuditAction | string
  userId?: number
  targetId?: number
  targetType?: string
  metadata?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

/**
 * Log an audit event
 */
export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    // Log to console for immediate visibility
    logger.business(entry.action, {
      userId: entry.userId,
      targetId: entry.targetId,
      targetType: entry.targetType,
      metadata: entry.metadata
    })
    
    // Store in database for long-term audit trail
    // Note: This requires an audit_logs table (see schema below)
    await executeQuery(
      `INSERT INTO audit_logs (action, user_id, target_id, target_type, metadata, ip_address, user_agent, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       ON CONFLICT DO NOTHING`,
      [
        entry.action,
        entry.userId || null,
        entry.targetId || null,
        entry.targetType || null,
        entry.metadata ? JSON.stringify(entry.metadata) : null,
        entry.ipAddress || null,
        entry.userAgent || null
      ]
    ).catch(error => {
      // Don't fail the main operation if audit logging fails
      logger.error('Failed to log audit entry', error)
    })
  } catch (error) {
    // Silently fail - don't break the main flow
    logger.error('Audit logging error', error as Error)
  }
}

/**
 * Log authentication event
 */
export async function logAuthEvent(
  action: AuditAction,
  userId?: number,
  success: boolean = true,
  metadata?: Record<string, any>
): Promise<void> {
  await logAudit({
    action,
    userId,
    metadata: {
      ...metadata,
      success
    }
  })
}

/**
 * Log order event
 */
export async function logOrderEvent(
  action: AuditAction,
  orderId: number,
  userId?: number,
  metadata?: Record<string, any>
): Promise<void> {
  await logAudit({
    action,
    userId,
    targetId: orderId,
    targetType: 'order',
    metadata
  })
}

/**
 * Log payment event
 */
export async function logPaymentEvent(
  action: AuditAction,
  orderId: number,
  amount: number,
  userId?: number,
  metadata?: Record<string, any>
): Promise<void> {
  await logAudit({
    action,
    userId,
    targetId: orderId,
    targetType: 'payment',
    metadata: {
      ...metadata,
      amount
    }
  })
}

/**
 * Log file event
 */
export async function logFileEvent(
  action: AuditAction,
  fileId: number,
  userId?: number,
  metadata?: Record<string, any>
): Promise<void> {
  await logAudit({
    action,
    userId,
    targetId: fileId,
    targetType: 'file',
    metadata
  })
}

/**
 * Log admin action
 */
export async function logAdminAction(
  action: string,
  adminId: number,
  targetId?: number,
  targetType?: string,
  metadata?: Record<string, any>
): Promise<void> {
  await logAudit({
    action: `admin.${action}`,
    userId: adminId,
    targetId,
    targetType,
    metadata
  })
}

/**
 * Get audit trail for a specific resource
 */
export async function getAuditTrail(
  targetType: string,
  targetId: number,
  limit: number = 50
): Promise<any[]> {
  const result = await executeQuery(
    `SELECT 
      id, action, user_id, target_id, target_type, 
      metadata, ip_address, created_at
     FROM audit_logs
     WHERE target_type = $1 AND target_id = $2
     ORDER BY created_at DESC
     LIMIT $3`,
    [targetType, targetId, limit]
  )
  
  return result.rows
}

/**
 * Get user activity log
 */
export async function getUserActivity(
  userId: number,
  limit: number = 100
): Promise<any[]> {
  const result = await executeQuery(
    `SELECT 
      id, action, target_id, target_type, 
      metadata, ip_address, created_at
     FROM audit_logs
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, limit]
  )
  
  return result.rows
}

/**
 * Get recent admin actions
 */
export async function getRecentAdminActions(
  limit: number = 100
): Promise<any[]> {
  const result = await executeQuery(
    `SELECT 
      al.id, al.action, al.user_id, al.target_id, al.target_type,
      al.metadata, al.ip_address, al.created_at,
      u.name as admin_name, u.email as admin_email
     FROM audit_logs al
     JOIN users u ON al.user_id = u.id
     WHERE al.action LIKE 'admin.%'
     ORDER BY al.created_at DESC
     LIMIT $1`,
    [limit]
  )
  
  return result.rows
}

/*
 * SQL Schema for audit_logs table:
 * 
 * CREATE TABLE IF NOT EXISTS audit_logs (
 *   id SERIAL PRIMARY KEY,
 *   action VARCHAR(100) NOT NULL,
 *   user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
 *   target_id INTEGER,
 *   target_type VARCHAR(50),
 *   metadata JSONB,
 *   ip_address VARCHAR(45),
 *   user_agent TEXT,
 *   created_at TIMESTAMP DEFAULT NOW(),
 *   INDEX idx_audit_user (user_id),
 *   INDEX idx_audit_target (target_type, target_id),
 *   INDEX idx_audit_action (action),
 *   INDEX idx_audit_created (created_at DESC)
 * );
 */
