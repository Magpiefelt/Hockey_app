/**
 * Validation Utilities
 * Common validation functions for input data
 */

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate phone number (flexible format)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\d\s()+.-]{10,}$/
  return phoneRegex.test(phone)
}

/**
 * Validate date string
 */
export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString)
  return !isNaN(date.getTime())
}

/**
 * Validate future date
 */
export function isFutureDate(dateString: string): boolean {
  if (!isValidDate(dateString)) return false
  const date = new Date(dateString)
  return date > new Date()
}

/**
 * Validate password strength
 */
export function isStrongPassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
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
  
  return {
    valid: errors.length === 0,
    errors
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
export function isValidMimeType(mimeType: string): boolean {
  const allowedTypes = [
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
  return allowedTypes.includes(mimeType)
}

/**
 * Validate amount (in cents)
 */
export function isValidAmount(amount: number): boolean {
  return Number.isInteger(amount) && amount >= 0 && amount <= 100000000 // Max $1M
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
