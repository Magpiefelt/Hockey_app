/**
 * Input Sanitization Utilities
 * Prevents XSS and injection attacks
 */

/**
 * Sanitize string input by removing dangerous content and encoding entities.
 * Removes script/iframe tags, event handlers, javascript: protocol,
 * encodes remaining HTML entities, and normalizes whitespace.
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return ''
  if (!input) return ''

  let result = input
    // Remove script tags and their content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove iframe tags and their content
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    // Remove javascript: protocol
    .replace(/javascript\s*:/gi, '')
    // Remove event handlers (on*)
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/on\w+\s*=[^\s>]*/gi, '')

  // Second pass to catch nested/obfuscated script attempts
  result = result
    .replace(/<\/?script[^>]*>/gi, '')
    .replace(/alert\s*\([^)]*\)/gi, '')

  // Encode remaining HTML entities
  result = result
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')

  // Normalize whitespace
  result = result
    .replace(/\s+/g, ' ')
    .trim()

  return result
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') return ''
  if (!email) return ''

  let result = email
    .toLowerCase()
    .trim()
    // Strip HTML tags and their content first
    .replace(/<[^>]*>/g, '')
    .replace(/[^\w@.-]/g, '')

  // Handle multiple @ symbols - keep only the first one
  const atParts = result.split('@')
  if (atParts.length > 2) {
    result = atParts[0] + '@' + atParts.slice(1).join('')
  }

  // Limit length to 254 (RFC 5321)
  if (result.length > 254) {
    result = result.substring(0, 254)
  }

  return result
}

/**
 * Sanitize phone number
 */
export function sanitizePhone(phone: string): string {
  if (typeof phone !== 'string') return ''
  if (!phone) return ''

  let result = phone.replace(/[^\d\s()+.-]/g, '').trim()

  // Limit length to 20 characters
  if (result.length > 20) {
    result = result.substring(0, 20)
  }

  return result
}

/**
 * Sanitize URL - only allow http and https protocols
 */
export function sanitizeUrl(url: string): string {
  if (typeof url !== 'string') return ''
  if (!url) return ''

  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return ''
    }
    return parsed.toString()
  } catch {
    return ''
  }
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized: any = {}

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value)
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value)
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item =>
        typeof item === 'string' ? sanitizeString(item) :
        typeof item === 'object' && item !== null ? sanitizeObject(item) :
        item
      )
    } else {
      sanitized[key] = value
    }
  }

  return sanitized as T
}

/**
 * Validate and sanitize SQL-like input
 */
export function sanitizeSQLInput(input: string): string {
  if (typeof input !== 'string') return ''

  return input
    .replace(/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi, '')
    .replace(/[;'"\\]/g, '')
    .trim()
}

/**
 * Sanitize filename for safe storage
 */
export function sanitizeFilename(filename: string): string {
  if (typeof filename !== 'string' || !filename) return 'file'

  let result = filename
    // Replace path traversal patterns first (../ -> __)
    .replace(/\.\.\//g, '__')
    // Replace remaining non-safe characters with underscores
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    // Remove leading dots (hidden files)
    .replace(/^\.+/, '')
    .substring(0, 255)

  // If result is empty after sanitization, return default
  if (!result) return 'file'

  return result
}

/**
 * Detect XSS patterns in a string
 */
export function containsXSSPatterns(input: string): boolean {
  if (typeof input !== 'string' || !input) return false

  const xssPatterns = [
    /<script\b/i,
    /<\/script>/i,
    /<iframe\b/i,
    /javascript\s*:/i,
    /on(error|click|load|mouseover|focus|blur|submit|change|keyup|keydown|mouseout|mousemove|dblclick|contextmenu)\s*=/i
  ]

  return xssPatterns.some(pattern => pattern.test(input))
}

/**
 * Validate URL (only http and https)
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Sanitize HTML content - allow only safe tags, strip all attributes
 * except href on <a> tags (with safety checks)
 */
export function sanitizeHtml(html: string): string {
  if (typeof html !== 'string') return ''

  const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li']

  // Process each tag
  const tagRegex = /<\/?([a-z][a-z0-9]*)\b([^>]*)>/gi
  let result = html.replace(tagRegex, (match, tag, attrs) => {
    const tagLower = tag.toLowerCase()

    if (!allowedTags.includes(tagLower)) {
      return ''
    }

    // For closing tags, return clean closing tag
    if (match.startsWith('</')) {
      return `</${tagLower}>`
    }

    // For <a> tags, preserve safe href and add rel attribute
    if (tagLower === 'a') {
      const hrefMatch = attrs.match(/href\s*=\s*["']([^"']*)["']/i)
      if (hrefMatch) {
        const href = hrefMatch[1]
        // Reject javascript: hrefs
        if (/^\s*javascript\s*:/i.test(href)) {
          return `<a>`
        }
        return `<a href="${href}" rel="noopener noreferrer">`
      }
      return `<a>`
    }

    // For all other allowed tags, strip all attributes
    return `<${tagLower}>`
  })

  return result
}

/**
 * Escape HTML entities for safe rendering in HTML contexts
 */
export function escapeHtml(text: string): string {
  if (typeof text !== 'string') return ''

  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  }

  return text.replace(/[&<>"'`=/]/g, char => htmlEntities[char] || char)
}

/**
 * Escape text for use in HTML attributes
 */
export function escapeAttribute(text: string): string {
  if (typeof text !== 'string') return ''

  return escapeHtml(text)
    .replace(/\n/g, '&#10;')
    .replace(/\r/g, '&#13;')
}

/**
 * Strip all HTML tags from a string
 */
export function stripHtml(html: string): string {
  if (typeof html !== 'string') return ''

  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .trim()
}
