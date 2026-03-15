/**
 * Shared email HTML layout wrapper.
 *
 * Every transactional email shares the same document structure, inline CSS,
 * and brand styling. This module provides a single `wrapEmailLayout()`
 * function so individual email builders only provide unique body content.
 */

const BRAND_BLUE = '#0ea5e9'
const BRAND_CYAN = '#06b6d4'
const BRAND_GREEN_START = '#10b981'
const BRAND_GREEN_END = '#059669'

export interface EmailLayoutOptions {
  /** CSS gradient for the header background. Defaults to brand blue. */
  headerBg?: string
  /** Main heading text in the header. */
  headerTitle: string
  /** Optional subtitle below the heading. */
  headerSubtitle?: string
  /** Large HTML icon (e.g. checkmark entity) shown above the header title. */
  headerIcon?: string
  /** The unique body content of the email. */
  bodyHtml: string
  /** Extra HTML appended after the body (e.g. "View Quote Online" link). */
  footerExtraHtml?: string
}

const DEFAULT_HEADER_BG = `linear-gradient(135deg, ${BRAND_BLUE} 0%, ${BRAND_CYAN} 100%)`
const GREEN_HEADER_BG = `linear-gradient(135deg, ${BRAND_GREEN_START} 0%, ${BRAND_GREEN_END} 100%)`

export { DEFAULT_HEADER_BG, GREEN_HEADER_BG }

export function wrapEmailLayout(options: EmailLayoutOptions): string {
  const headerBg = options.headerBg || DEFAULT_HEADER_BG
  const year = new Date().getFullYear()

  const iconHtml = options.headerIcon
    ? `<div style="font-size: 48px; margin-bottom: 10px;">${options.headerIcon}</div>`
    : ''

  const subtitleHtml = options.headerSubtitle
    ? `<p style="margin: 10px 0 0 0; opacity: 0.9;">${options.headerSubtitle}</p>`
    : ''

  const footerExtra = options.footerExtraHtml || ''

  return `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background: ${headerBg}; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
    .footer { background: #f8fafc; padding: 20px 30px; text-align: center; color: #64748b; font-size: 14px; }
    .button { display: inline-block; padding: 12px 24px; background: ${BRAND_BLUE}; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${iconHtml}
      <h1 style="margin: 0; font-size: 28px;">${options.headerTitle}</h1>
      ${subtitleHtml}
    </div>
    <div class="content">
      ${options.bodyHtml}
    </div>
    <div class="footer">
      ${footerExtra}
      <p>&copy; ${year} Elite Sports DJ. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`
}
