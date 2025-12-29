import { describe, it, expect } from 'vitest'
import {
  isValidEmail,
  isValidPhone,
  isValidDate,
  isFutureDate,
  isPastDate,
  isStrongPassword,
  isValidOrderStatus,
  isValidFileSize,
  isValidMimeType,
  isValidAmount,
  validatePagination,
  isValidUUID,
  isValidId,
  parseId,
  isValidJSON,
  isValidSportType,
  isValidUrl,
  isValidYouTubeUrl,
  isValidSpotifyUrl,
  isValidSlug
} from '../../server/utils/validation'

describe('isValidEmail', () => {
  it('should accept valid emails', () => {
    expect(isValidEmail('test@example.com')).toBe(true)
    expect(isValidEmail('user.name@domain.co.uk')).toBe(true)
    expect(isValidEmail('user+tag@example.org')).toBe(true)
  })

  it('should reject invalid emails', () => {
    expect(isValidEmail('invalid')).toBe(false)
    expect(isValidEmail('invalid@')).toBe(false)
    expect(isValidEmail('@domain.com')).toBe(false)
    expect(isValidEmail('test@.com')).toBe(false)
  })

  it('should reject emails exceeding max length', () => {
    const longLocal = 'a'.repeat(65) + '@example.com'
    expect(isValidEmail(longLocal)).toBe(false)
    
    const longEmail = 'a'.repeat(255) + '@example.com'
    expect(isValidEmail(longEmail)).toBe(false)
  })

  it('should handle empty and invalid input', () => {
    expect(isValidEmail('')).toBe(false)
    expect(isValidEmail(null as any)).toBe(false)
    expect(isValidEmail(undefined as any)).toBe(false)
  })
})

describe('isValidPhone', () => {
  it('should accept valid phone numbers', () => {
    expect(isValidPhone('1234567890')).toBe(true)
    expect(isValidPhone('(123) 456-7890')).toBe(true)
    expect(isValidPhone('+1 555 123 4567')).toBe(true)
    expect(isValidPhone('123-456-7890')).toBe(true)
  })

  it('should reject invalid phone numbers', () => {
    expect(isValidPhone('123')).toBe(false) // Too short
    expect(isValidPhone('12345')).toBe(false) // Too short
    expect(isValidPhone('1'.repeat(20))).toBe(false) // Too long
  })

  it('should handle empty and invalid input', () => {
    expect(isValidPhone('')).toBe(false)
    expect(isValidPhone(null as any)).toBe(false)
  })
})

describe('isValidDate', () => {
  it('should accept valid date strings', () => {
    expect(isValidDate('2024-01-15')).toBe(true)
    expect(isValidDate('2024-12-31T23:59:59Z')).toBe(true)
    expect(isValidDate('January 1, 2024')).toBe(true)
  })

  it('should reject invalid date strings', () => {
    expect(isValidDate('not a date')).toBe(false)
    expect(isValidDate('2024-13-45')).toBe(false) // Invalid month/day
  })

  it('should handle empty and invalid input', () => {
    expect(isValidDate('')).toBe(false)
    expect(isValidDate(null as any)).toBe(false)
  })
})

describe('isFutureDate', () => {
  it('should return true for future dates', () => {
    const futureDate = new Date()
    futureDate.setFullYear(futureDate.getFullYear() + 1)
    expect(isFutureDate(futureDate.toISOString())).toBe(true)
  })

  it('should return false for past dates', () => {
    expect(isFutureDate('2020-01-01')).toBe(false)
  })

  it('should return true for today', () => {
    const today = new Date()
    today.setHours(12, 0, 0, 0)
    expect(isFutureDate(today.toISOString())).toBe(true)
  })
})

describe('isPastDate', () => {
  it('should return true for past dates', () => {
    expect(isPastDate('2020-01-01')).toBe(true)
  })

  it('should return false for future dates', () => {
    const futureDate = new Date()
    futureDate.setFullYear(futureDate.getFullYear() + 1)
    expect(isPastDate(futureDate.toISOString())).toBe(false)
  })
})

describe('isStrongPassword', () => {
  it('should accept strong passwords', () => {
    const result = isStrongPassword('SecurePass123!')
    expect(result.valid).toBe(true)
    expect(result.strength).toBe('strong')
  })

  it('should reject weak passwords', () => {
    const result = isStrongPassword('weak')
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('should require minimum length', () => {
    const result = isStrongPassword('Abc123!')
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Password must be at least 8 characters long')
  })

  it('should require uppercase letters', () => {
    const result = isStrongPassword('lowercase123!')
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Password must contain at least one uppercase letter')
  })

  it('should require lowercase letters', () => {
    const result = isStrongPassword('UPPERCASE123!')
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Password must contain at least one lowercase letter')
  })

  it('should require numbers', () => {
    const result = isStrongPassword('NoNumbers!')
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Password must contain at least one number')
  })

  it('should require special characters', () => {
    const result = isStrongPassword('NoSpecial123')
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Password must contain at least one special character')
  })

  it('should detect common patterns', () => {
    const result = isStrongPassword('Password123!')
    expect(result.errors).toContain('Password contains a common pattern')
  })

  it('should handle empty input', () => {
    const result = isStrongPassword('')
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Password is required')
  })
})

describe('isValidOrderStatus', () => {
  it('should accept valid statuses', () => {
    expect(isValidOrderStatus('pending')).toBe(true)
    expect(isValidOrderStatus('submitted')).toBe(true)
    expect(isValidOrderStatus('in_progress')).toBe(true)
    expect(isValidOrderStatus('completed')).toBe(true)
    expect(isValidOrderStatus('delivered')).toBe(true)
    expect(isValidOrderStatus('cancelled')).toBe(true)
  })

  it('should reject invalid statuses', () => {
    expect(isValidOrderStatus('invalid')).toBe(false)
    expect(isValidOrderStatus('')).toBe(false)
    expect(isValidOrderStatus('PENDING')).toBe(false) // Case sensitive
  })
})

describe('isValidFileSize', () => {
  it('should accept valid file sizes', () => {
    expect(isValidFileSize(1024)).toBe(true) // 1KB
    expect(isValidFileSize(10 * 1024 * 1024)).toBe(true) // 10MB
  })

  it('should reject files exceeding max size', () => {
    expect(isValidFileSize(300 * 1024 * 1024)).toBe(false) // 300MB > 200MB default
  })

  it('should accept custom max size', () => {
    expect(isValidFileSize(50 * 1024 * 1024, 100)).toBe(true) // 50MB < 100MB
    expect(isValidFileSize(150 * 1024 * 1024, 100)).toBe(false) // 150MB > 100MB
  })

  it('should reject invalid sizes', () => {
    expect(isValidFileSize(0)).toBe(false)
    expect(isValidFileSize(-1)).toBe(false)
    expect(isValidFileSize(NaN)).toBe(false)
  })
})

describe('isValidMimeType', () => {
  it('should accept common image types', () => {
    expect(isValidMimeType('image/jpeg')).toBe(true)
    expect(isValidMimeType('image/png')).toBe(true)
    expect(isValidMimeType('image/gif')).toBe(true)
  })

  it('should accept audio types', () => {
    expect(isValidMimeType('audio/mpeg')).toBe(true)
    expect(isValidMimeType('audio/wav')).toBe(true)
  })

  it('should accept document types', () => {
    expect(isValidMimeType('application/pdf')).toBe(true)
  })

  it('should reject unknown types', () => {
    expect(isValidMimeType('application/x-evil')).toBe(false)
    expect(isValidMimeType('text/html')).toBe(false)
  })

  it('should accept custom allowed types', () => {
    expect(isValidMimeType('text/html', ['text/html', 'text/plain'])).toBe(true)
    expect(isValidMimeType('image/jpeg', ['text/html'])).toBe(false)
  })
})

describe('isValidAmount', () => {
  it('should accept valid amounts', () => {
    expect(isValidAmount(0)).toBe(true)
    expect(isValidAmount(100)).toBe(true)
    expect(isValidAmount(9999999)).toBe(true)
  })

  it('should reject invalid amounts', () => {
    expect(isValidAmount(-1)).toBe(false)
    expect(isValidAmount(1.5)).toBe(false) // Must be integer
    expect(isValidAmount(NaN)).toBe(false)
  })

  it('should respect max amount', () => {
    expect(isValidAmount(100000001)).toBe(false) // Exceeds default max
    expect(isValidAmount(500, 1000)).toBe(true)
    expect(isValidAmount(1500, 1000)).toBe(false)
  })
})

describe('validatePagination', () => {
  it('should return defaults for invalid input', () => {
    expect(validatePagination()).toEqual({ page: 1, pageSize: 50 })
    expect(validatePagination(0, 0)).toEqual({ page: 1, pageSize: 50 })
    expect(validatePagination(-1, -1)).toEqual({ page: 1, pageSize: 50 })
  })

  it('should accept valid values', () => {
    expect(validatePagination(2, 25)).toEqual({ page: 2, pageSize: 25 })
  })

  it('should cap page size at 100', () => {
    expect(validatePagination(1, 200)).toEqual({ page: 1, pageSize: 100 })
  })

  it('should floor decimal values', () => {
    expect(validatePagination(1.9, 25.5)).toEqual({ page: 1, pageSize: 25 })
  })
})

describe('isValidUUID', () => {
  it('should accept valid UUIDs', () => {
    expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
    expect(isValidUUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe(true)
  })

  it('should reject invalid UUIDs', () => {
    expect(isValidUUID('invalid')).toBe(false)
    expect(isValidUUID('550e8400-e29b-41d4-a716')).toBe(false) // Too short
    expect(isValidUUID('')).toBe(false)
  })
})

describe('isValidId', () => {
  it('should accept valid numeric IDs', () => {
    expect(isValidId(1)).toBe(true)
    expect(isValidId(999)).toBe(true)
    expect(isValidId('123')).toBe(true)
  })

  it('should reject invalid IDs', () => {
    expect(isValidId(0)).toBe(false)
    expect(isValidId(-1)).toBe(false)
    expect(isValidId(1.5)).toBe(false)
    expect(isValidId('abc')).toBe(false)
    expect(isValidId('')).toBe(false)
    expect(isValidId(null)).toBe(false)
  })
})

describe('parseId', () => {
  it('should parse valid IDs', () => {
    expect(parseId(123)).toBe(123)
    expect(parseId('456')).toBe(456)
  })

  it('should return null for invalid IDs', () => {
    expect(parseId(0)).toBeNull()
    expect(parseId(-1)).toBeNull()
    expect(parseId('abc')).toBeNull()
    expect(parseId(null)).toBeNull()
    expect(parseId(undefined)).toBeNull()
  })
})

describe('isValidJSON', () => {
  it('should accept valid JSON', () => {
    expect(isValidJSON('{"key": "value"}')).toBe(true)
    expect(isValidJSON('[1, 2, 3]')).toBe(true)
    expect(isValidJSON('"string"')).toBe(true)
  })

  it('should reject invalid JSON', () => {
    expect(isValidJSON('not json')).toBe(false)
    expect(isValidJSON('{invalid}')).toBe(false)
    expect(isValidJSON('')).toBe(false)
  })
})

describe('isValidSportType', () => {
  it('should accept valid sports', () => {
    expect(isValidSportType('hockey')).toBe(true)
    expect(isValidSportType('basketball')).toBe(true)
    expect(isValidSportType('FOOTBALL')).toBe(true) // Case insensitive
  })

  it('should reject invalid sports', () => {
    expect(isValidSportType('quidditch')).toBe(false)
    expect(isValidSportType('')).toBe(false)
  })
})

describe('isValidUrl', () => {
  it('should accept http/https URLs', () => {
    expect(isValidUrl('http://example.com')).toBe(true)
    expect(isValidUrl('https://example.com/path')).toBe(true)
  })

  it('should reject other protocols', () => {
    expect(isValidUrl('ftp://example.com')).toBe(false)
    expect(isValidUrl('javascript:alert(1)')).toBe(false)
  })

  it('should reject invalid URLs', () => {
    expect(isValidUrl('not a url')).toBe(false)
    expect(isValidUrl('')).toBe(false)
  })
})

describe('isValidYouTubeUrl', () => {
  it('should accept valid YouTube URLs', () => {
    expect(isValidYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true)
    expect(isValidYouTubeUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(true)
    expect(isValidYouTubeUrl('https://youtube.com/embed/dQw4w9WgXcQ')).toBe(true)
    expect(isValidYouTubeUrl('https://music.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true)
  })

  it('should reject invalid YouTube URLs', () => {
    expect(isValidYouTubeUrl('https://example.com/video')).toBe(false)
    expect(isValidYouTubeUrl('https://vimeo.com/123456')).toBe(false)
    expect(isValidYouTubeUrl('')).toBe(false)
  })
})

describe('isValidSpotifyUrl', () => {
  it('should accept valid Spotify URLs', () => {
    expect(isValidSpotifyUrl('https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh')).toBe(true)
    expect(isValidSpotifyUrl('https://open.spotify.com/album/1DFixLWuPkv3KT3TnV35m3')).toBe(true)
    expect(isValidSpotifyUrl('spotify:track:4iV5W9uYEdYUVa79Axb7Rh')).toBe(true)
  })

  it('should reject invalid Spotify URLs', () => {
    expect(isValidSpotifyUrl('https://example.com/music')).toBe(false)
    expect(isValidSpotifyUrl('https://soundcloud.com/track')).toBe(false)
    expect(isValidSpotifyUrl('')).toBe(false)
  })
})

describe('isValidSlug', () => {
  it('should accept valid slugs', () => {
    expect(isValidSlug('my-slug')).toBe(true)
    expect(isValidSlug('slug123')).toBe(true)
    expect(isValidSlug('a-b-c')).toBe(true)
  })

  it('should reject invalid slugs', () => {
    expect(isValidSlug('My-Slug')).toBe(false) // Uppercase
    expect(isValidSlug('slug_with_underscores')).toBe(false)
    expect(isValidSlug('slug with spaces')).toBe(false)
    expect(isValidSlug('-starts-with-hyphen')).toBe(false)
    expect(isValidSlug('')).toBe(false)
  })
})
