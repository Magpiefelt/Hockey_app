/**
 * Validation Utilities
 * Common validation functions for input data
 */

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false
  // Check max length (254 chars total, 64 chars local part)
  if (email.length > 254) return false
  const localPart = email.split('@')[0]
  if (localPart && localPart.length > 64) return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate phone number (flexible format, 10-17 chars)
 */
export function isValidPhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false
  const phoneRegex = /^[\d\s()+.-]{10,17}$/
  return phoneRegex.test(phone)
}

/**
 * Validate date string
 */
export function isValidDate(dateString: string): boolean {
  if (!dateString || typeof dateString !== 'string') return false
  const date = new Date(dateString)
  return !isNaN(date.getTime())
}

/**
 * Validate future date (same-day counts as future)
 */
export function isFutureDate(dateString: string): boolean {
  if (!isValidDate(dateString)) return false
  const date = new Date(dateString)
  const now = new Date()
  // Compare date portions - same day or later counts as future
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return dateOnly >= todayOnly
}

/**
 * Validate past date
 */
export function isPastDate(dateString: string): boolean {
  if (!isValidDate(dateString)) return false
  const date = new Date(dateString)
  return date < new Date()
}

/**
 * Validate password strength
 */
export function isStrongPassword(password: string): { valid: boolean; errors: string[]; strength: 'weak' | 'medium' | 'strong' } {
  const errors: string[] = []

  if (!password) {
    errors.push('Password is required')
    return { valid: false, errors, strength: 'weak' }
  }

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }

  // Check for common patterns
  const commonPatterns = [
    /^password/i,
    /^123456/,
    /^qwerty/i,
    /^admin/i,
    /^letmein/i,
    /^welcome/i,
    /^monkey/i,
    /^dragon/i,
    /^master/i
  ]

  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      errors.push('Password contains a common pattern')
      break
    }
  }

  // Calculate strength
  let strength: 'weak' | 'medium' | 'strong' = 'weak'
  if (errors.length === 0) {
    strength = 'strong'
  } else if (errors.length <= 2) {
    strength = 'medium'
  }

  return {
    valid: errors.length === 0,
    errors,
    strength
  }
}

/**
 * Validate order status
 */
export function isValidOrderStatus(status: string): boolean {
  const validStatuses = [
    'pending',
    'submitted',
    'in_progress',
    'quoted',
    'quote_viewed',
    'quote_accepted',
    'invoiced',
    'paid',
    'completed',
    'delivered',
    'cancelled'
  ]
  return validStatuses.includes(status)
}

/**
 * Validate file size
 */
export function isValidFileSize(sizeBytes: number, maxSizeMB: number = 200): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  return sizeBytes > 0 && sizeBytes <= maxSizeBytes
}

/**
 * Validate MIME type
 */
export function isValidMimeType(mimeType: string, customAllowedTypes?: string[]): boolean {
  const defaultAllowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'audio/mpeg',
    'audio/wav',
    'audio/mp3',
    'video/mp4',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv'
  ]
  const allowedTypes = customAllowedTypes || defaultAllowedTypes
  return allowedTypes.includes(mimeType)
}

/**
 * Validate amount (in cents)
 */
export function isValidAmount(amount: number, maxAmount: number = 100000000): boolean {
  return Number.isInteger(amount) && amount >= 0 && amount <= maxAmount
}

/**
 * Validate pagination parameters
 */
export function validatePagination(page?: number, pageSize?: number): { page: number; pageSize: number } {
  const validPage = page && page > 0 ? Math.floor(page) : 1
  const validPageSize = pageSize && pageSize > 0 ? Math.min(Math.floor(pageSize), 100) : 50

  return { page: validPage, pageSize: validPageSize }
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

/**
 * Validate ID (number or numeric string)
 */
export function isValidId(id: any): boolean {
  if (typeof id === 'number') {
    return Number.isInteger(id) && id > 0
  }
  if (typeof id === 'string') {
    const num = parseInt(id, 10)
    return !isNaN(num) && num > 0 && num.toString() === id
  }
  return false
}

/**
 * Parse ID from various formats, returns null if invalid
 */
export function parseId(id: any): number | null {
  if (typeof id === 'number') {
    return Number.isInteger(id) && id > 0 ? id : null
  }
  if (typeof id === 'string') {
    const num = parseInt(id, 10)
    if (!isNaN(num) && num > 0) {
      return num
    }
  }
  return null
}

/**
 * Validate JSON string
 */
export function isValidJSON(str: string): boolean {
  try {
    JSON.parse(str)
    return true
  } catch {
    return false
  }
}

/**
 * Validate sport type
 */
export function isValidSportType(sport: string): boolean {
  const validSports = [
    'basketball',
    'football',
    'baseball',
    'soccer',
    'hockey',
    'volleyball',
    'lacrosse',
    'wrestling',
    'track',
    'other'
  ]
  return validSports.includes(sport.toLowerCase())
}

/**
 * Validate URL format (only http and https)
 */
export function isValidUrl(url: string): boolean {
  if (!url) return false
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Validate YouTube URL
 */
export function isValidYouTubeUrl(url: string): boolean {
  if (!url) return false
  const youtubeRegex = /^(https?:\/\/)?(www\.|music\.)?(youtube\.com\/(watch\?v=|embed\/|v\/)|youtu\.be\/)[\w-]+/
  return youtubeRegex.test(url)
}

/**
 * Validate Spotify URL or URI
 */
export function isValidSpotifyUrl(url: string): boolean {
  if (!url) return false
  const spotifyRegex = /^(https?:\/\/open\.spotify\.com\/(track|album|playlist|artist)\/[\w]+|spotify:(track|album|playlist|artist):[\w]+)/
  return spotifyRegex.test(url)
}

/**
 * Validate URL slug (lowercase, hyphens, numbers only)
 */
export function isValidSlug(slug: string): boolean {
  if (!slug) return false
  const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/
  return slugRegex.test(slug)
}

/**
 * Validate Canadian postal code
 */
export function isValidCanadianPostalCode(postalCode: string): boolean {
  if (!postalCode) return false
  const postalCodeRegex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/
  return postalCodeRegex.test(postalCode)
}

/**
 * Validate Canadian province code
 */
export function isValidProvinceCode(code: string): boolean {
  const validCodes = ['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT']
  return validCodes.includes(code.toUpperCase())
}
