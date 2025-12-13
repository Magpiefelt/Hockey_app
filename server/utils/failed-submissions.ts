/**
 * Failed Submissions Tracking Utilities
 * 
 * Purpose: Log and track failed submission attempts to prevent data loss
 */

import { executeQuery } from './database'
import { logger } from './logger'

/**
 * Log a failed submission attempt
 * 
 * @param data - The submission data and error information
 * @returns The ID of the logged failed submission
 */
export async function logFailedSubmission(data: {
  contactEmail?: string
  contactName?: string
  contactPhone?: string
  packageId?: number | null
  formData: any
  error: Error
  errorCode?: string
  ipAddress?: string
  userAgent?: string
}): Promise<number | null> {
  try {
    const result = await executeQuery<{ id: number }>(
      `INSERT INTO failed_submissions (
        contact_email, contact_name, contact_phone, package_id,
        form_data, error_message, error_stack, error_code,
        ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id`,
      [
        data.contactEmail || null,
        data.contactName || null,
        data.contactPhone || null,
        data.packageId || null,
        JSON.stringify(data.formData),
        data.error.message,
        data.error.stack || null,
        data.errorCode || null,
        data.ipAddress || null,
        data.userAgent || null
      ]
    )
    
    if (result.rows.length > 0) {
      const failedSubmissionId = result.rows[0].id
      logger.info('Failed submission logged', { 
        failedSubmissionId,
        contactEmail: data.contactEmail,
        errorMessage: data.error.message 
      })
      return failedSubmissionId
    }
    
    return null
  } catch (logError: any) {
    // Don't let logging failure prevent error from being thrown
    logger.error('Failed to log failed submission', {
      error: logError.message,
      originalError: data.error.message
    })
    return null
  }
}

/**
 * Mark a failed submission as retried
 * 
 * @param failedSubmissionId - The ID of the failed submission
 * @param successful - Whether the retry was successful
 * @param notes - Optional notes about the retry
 */
export async function markFailedSubmissionRetried(
  failedSubmissionId: number,
  successful: boolean,
  notes?: string
): Promise<void> {
  try {
    await executeQuery(
      `UPDATE failed_submissions 
       SET retry_attempted = TRUE,
           retry_successful = $1,
           retry_at = NOW(),
           retry_notes = $2
       WHERE id = $3`,
      [successful, notes || null, failedSubmissionId]
    )
    
    logger.info('Failed submission retry recorded', { 
      failedSubmissionId,
      successful 
    })
  } catch (error: any) {
    logger.error('Failed to mark submission as retried', {
      failedSubmissionId,
      error: error.message
    })
  }
}

/**
 * Get recent failed submissions
 * 
 * @param limit - Maximum number of submissions to return (default: 50)
 * @param offset - Offset for pagination (default: 0)
 * @returns Array of failed submissions
 */
export async function getRecentFailedSubmissions(
  limit: number = 50,
  offset: number = 0
): Promise<any[]> {
  try {
    const result = await executeQuery(
      `SELECT 
        id, contact_email, contact_name, contact_phone,
        package_id, form_data, error_message, error_code,
        ip_address, retry_attempted, retry_successful,
        created_at, updated_at
       FROM failed_submissions
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    )
    
    return result.rows
  } catch (error: any) {
    logger.error('Failed to fetch failed submissions', {
      error: error.message
    })
    return []
  }
}

/**
 * Get failed submissions count
 * 
 * @returns Total count of failed submissions
 */
export async function getFailedSubmissionsCount(): Promise<number> {
  try {
    const result = await executeQuery<{ count: string }>(
      'SELECT COUNT(*) as count FROM failed_submissions'
    )
    
    return parseInt(result.rows[0]?.count || '0', 10)
  } catch (error: any) {
    logger.error('Failed to count failed submissions', {
      error: error.message
    })
    return 0
  }
}

/**
 * Get failed submissions by email
 * 
 * @param email - The contact email to search for
 * @returns Array of failed submissions for this email
 */
export async function getFailedSubmissionsByEmail(email: string): Promise<any[]> {
  try {
    const result = await executeQuery(
      `SELECT 
        id, contact_email, contact_name, contact_phone,
        package_id, form_data, error_message, error_code,
        retry_attempted, retry_successful,
        created_at, updated_at
       FROM failed_submissions
       WHERE contact_email = $1
       ORDER BY created_at DESC`,
      [email]
    )
    
    return result.rows
  } catch (error: any) {
    logger.error('Failed to fetch failed submissions by email', {
      email,
      error: error.message
    })
    return []
  }
}

/**
 * Delete old failed submissions
 * Cleanup utility to remove old failed submissions after a certain period
 * 
 * @param daysOld - Delete submissions older than this many days (default: 90)
 * @returns Number of deleted submissions
 */
export async function deleteOldFailedSubmissions(daysOld: number = 90): Promise<number> {
  try {
    // Validate daysOld is a positive number
    if (!Number.isInteger(daysOld) || daysOld < 1) {
      throw new Error('daysOld must be a positive integer')
    }
    
    const result = await executeQuery(
      `DELETE FROM failed_submissions
       WHERE created_at < NOW() - INTERVAL '1 day' * $1
       AND (retry_successful = TRUE OR retry_attempted = FALSE)
       RETURNING id`,
      [daysOld]
    )const deletedCount = result.rows.length
    
    if (deletedCount > 0) {
      logger.info('Deleted old failed submissions', { 
        deletedCount,
        daysOld 
      })
    }
    
    return deletedCount
  } catch (error: any) {
    logger.error('Failed to delete old failed submissions', {
      error: error.message
    })
    return 0
  }
}
