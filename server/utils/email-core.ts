/**
 * Shared email infrastructure: logging, sending, and common types.
 *
 * Both `email.ts` (basic templates) and `email-enhanced.ts` (rich templates)
 * delegate to these helpers so the Mailgun integration, DB-logging fallback
 * chain, and managed-template override logic live in one place.
 */

import { sendEmailWithMailgun } from './mailgun'
import { logger } from './logger'
import { executeQuery } from './database'
import { resolveManagedEmailTemplate } from '../services/emailTemplateService'

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export interface SendEmailConfig {
  skipTemplateOverride?: boolean
}

/**
 * Log an email attempt to the `email_logs` table.
 *
 * Uses a three-level fallback chain to handle schema evolution:
 *  1. Full schema (with `metadata_json`)
 *  2. Without `metadata_json`
 *  3. Legacy column names (`recipient_email`, `email_type`)
 */
export async function logEmail(
  quoteRequestId: number | null,
  toEmail: string,
  subject: string,
  template: string,
  metadata: any,
  status: 'sent' | 'failed' | 'bounced',
  errorMessage?: string
): Promise<void> {
  try {
    await executeQuery(
      `INSERT INTO email_logs (quote_id, to_email, subject, template, status, error_message, metadata_json, sent_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [quoteRequestId, toEmail, subject, template, status, errorMessage || null, JSON.stringify(metadata || {})]
    )
  } catch (error: any) {
    if (error.code === '42703') {
      try {
        await executeQuery(
          `INSERT INTO email_logs (quote_id, to_email, subject, template, status, error_message, sent_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [quoteRequestId, toEmail, subject, template, status, errorMessage || null]
        )
      } catch (fallback1Error: any) {
        if (fallback1Error.code === '42703') {
          try {
            await executeQuery(
              `INSERT INTO email_logs (quote_id, recipient_email, subject, email_type, status, error_message, sent_at)
               VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
              [quoteRequestId, toEmail, subject, template, status, errorMessage || null]
            )
          } catch (fallback2Error) {
            logger.error('Failed to log email (all fallbacks)', { error: fallback2Error, toEmail, subject })
          }
        } else {
          logger.error('Failed to log email (fallback)', { error: fallback1Error, toEmail, subject })
        }
      }
    } else {
      logger.error('Failed to log email', { error, toEmail, subject })
    }
  }
}

/**
 * Send an email via Mailgun with managed-template override support and
 * automatic DB logging on success or failure.
 */
export async function sendEmailCore(
  options: EmailOptions,
  template: string,
  metadata: any,
  quoteRequestId?: number | null,
  config?: SendEmailConfig
): Promise<boolean> {
  if (!options.to) {
    logger.error('Email recipient is required', { template })
    return false
  }

  if (!options.subject) {
    logger.error('Email subject is required', { template, to: options.to })
    return false
  }

  try {
    const resolvedTemplate = config?.skipTemplateOverride
      ? { subject: options.subject, html: options.html, overrideApplied: false }
      : await resolveManagedEmailTemplate(template, {
          subject: options.subject,
          html: options.html,
          metadata: {
            ...(metadata || {}),
            to: options.to,
            subject: options.subject
          }
        })

    const sent = await sendEmailWithMailgun({
      to: options.to,
      subject: resolvedTemplate.subject,
      html: resolvedTemplate.html,
      text: options.text
    })

    if (sent) {
      logger.info('Email sent successfully', {
        to: options.to,
        subject: resolvedTemplate.subject,
        template,
        overrideApplied: resolvedTemplate.overrideApplied
      })

      await logEmail(
        quoteRequestId || null,
        options.to,
        resolvedTemplate.subject,
        template,
        { ...(metadata || {}), templateOverrideApplied: resolvedTemplate.overrideApplied },
        'sent'
      )
      return true
    } else {
      throw new Error('Email sending returned false')
    }
  } catch (error: any) {
    logger.error('Failed to send email', {
      error: error.message,
      to: options.to,
      subject: options.subject,
      template
    })

    await logEmail(
      quoteRequestId || null,
      options.to,
      options.subject,
      template,
      metadata,
      'failed',
      error.message
    )

    return false
  }
}
