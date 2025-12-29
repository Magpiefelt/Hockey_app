import { describe, it, expect } from 'vitest'
import {
  sanitizeString,
  sanitizeEmail,
  sanitizePhone,
  sanitizeUrl,
  sanitizeFilename,
  sanitizeObject,
  containsXSSPatterns,
  sanitizeHtml,
  isValidUrl
} from '../../server/utils/sanitize'

describe('sanitizeString', () => {
  it('should remove script tags', () => {
    const input = 'Hello <script>alert("xss")</script> World'
    const result = sanitizeString(input)
    expect(result).not.toContain('<script>')
    expect(result).not.toContain('</script>')
    expect(result).not.toContain('alert')
  })

  it('should remove event handlers', () => {
    const input = '<img src="x" onerror="alert(1)">'
    const result = sanitizeString(input)
    expect(result).not.toContain('onerror')
    expect(result).not.toContain('alert')
  })

  it('should remove javascript: protocol', () => {
    const input = '<a href="javascript:alert(1)">Click</a>'
    const result = sanitizeString(input)
    expect(result).not.toContain('javascript:')
  })

  it('should encode HTML entities', () => {
    const input = '<div>Test & "quotes"</div>'
    const result = sanitizeString(input)
    expect(result).toContain('&lt;')
    expect(result).toContain('&gt;')
    expect(result).toContain('&amp;')
    expect(result).toContain('&quot;')
  })

  it('should handle empty strings', () => {
    expect(sanitizeString('')).toBe('')
  })

  it('should handle non-string input', () => {
    expect(sanitizeString(null as any)).toBe('')
    expect(sanitizeString(undefined as any)).toBe('')
    expect(sanitizeString(123 as any)).toBe('')
  })

  it('should normalize whitespace', () => {
    const input = 'Hello    World\n\nTest'
    const result = sanitizeString(input)
    expect(result).toBe('Hello World Test')
  })

  it('should remove iframe tags', () => {
    const input = '<iframe src="evil.com"></iframe>'
    const result = sanitizeString(input)
    expect(result).not.toContain('<iframe')
  })

  it('should handle nested script attempts', () => {
    const input = '<<script>script>alert(1)<</script>/script>'
    const result = sanitizeString(input)
    expect(result).not.toContain('script')
    expect(result).not.toContain('alert')
  })
})

describe('sanitizeEmail', () => {
  it('should lowercase email', () => {
    expect(sanitizeEmail('Test@Example.COM')).toBe('test@example.com')
  })

  it('should trim whitespace', () => {
    expect(sanitizeEmail('  test@example.com  ')).toBe('test@example.com')
  })

  it('should remove invalid characters', () => {
    expect(sanitizeEmail('test<script>@example.com')).toBe('test@example.com')
  })

  it('should handle multiple @ symbols', () => {
    const result = sanitizeEmail('test@@example.com')
    expect(result.split('@').length).toBe(2)
  })

  it('should limit length', () => {
    const longEmail = 'a'.repeat(300) + '@example.com'
    expect(sanitizeEmail(longEmail).length).toBeLessThanOrEqual(254)
  })

  it('should handle empty input', () => {
    expect(sanitizeEmail('')).toBe('')
    expect(sanitizeEmail(null as any)).toBe('')
  })
})

describe('sanitizePhone', () => {
  it('should keep digits and formatting characters', () => {
    expect(sanitizePhone('(123) 456-7890')).toBe('(123) 456-7890')
  })

  it('should remove letters and special characters', () => {
    expect(sanitizePhone('123-ABC-7890!')).toBe('123--7890')
  })

  it('should handle international format', () => {
    expect(sanitizePhone('+1 (555) 123-4567')).toBe('+1 (555) 123-4567')
  })

  it('should limit length', () => {
    const longPhone = '1'.repeat(30)
    expect(sanitizePhone(longPhone).length).toBeLessThanOrEqual(20)
  })

  it('should handle empty input', () => {
    expect(sanitizePhone('')).toBe('')
    expect(sanitizePhone(null as any)).toBe('')
  })
})

describe('sanitizeUrl', () => {
  it('should accept valid http URLs', () => {
    expect(sanitizeUrl('http://example.com')).toBe('http://example.com/')
  })

  it('should accept valid https URLs', () => {
    expect(sanitizeUrl('https://example.com/path?query=1')).toBe('https://example.com/path?query=1')
  })

  it('should reject javascript: protocol', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBe('')
  })

  it('should reject data: protocol', () => {
    expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('')
  })

  it('should reject file: protocol', () => {
    expect(sanitizeUrl('file:///etc/passwd')).toBe('')
  })

  it('should reject URLs without protocol', () => {
    expect(sanitizeUrl('example.com')).toBe('')
  })

  it('should handle empty input', () => {
    expect(sanitizeUrl('')).toBe('')
    expect(sanitizeUrl(null as any)).toBe('')
  })
})

describe('sanitizeFilename', () => {
  it('should remove path separators', () => {
    expect(sanitizeFilename('../../../etc/passwd')).toBe('______etc_passwd')
  })

  it('should remove special characters', () => {
    expect(sanitizeFilename('file<script>.txt')).toBe('file_script_.txt')
  })

  it('should preserve valid characters', () => {
    expect(sanitizeFilename('my-file_v2.txt')).toBe('my-file_v2.txt')
  })

  it('should remove leading dots', () => {
    expect(sanitizeFilename('.htaccess')).toBe('htaccess')
  })

  it('should limit length', () => {
    const longName = 'a'.repeat(300) + '.txt'
    expect(sanitizeFilename(longName).length).toBeLessThanOrEqual(255)
  })

  it('should return default for empty input', () => {
    expect(sanitizeFilename('')).toBe('file')
    expect(sanitizeFilename(null as any)).toBe('file')
  })
})

describe('sanitizeObject', () => {
  it('should sanitize all string values', () => {
    const input = {
      name: '<script>alert(1)</script>',
      email: 'test@example.com',
      count: 5
    }
    const result = sanitizeObject(input)
    expect(result.name).not.toContain('<script>')
    expect(result.email).toBe('test@example.com')
    expect(result.count).toBe(5)
  })

  it('should handle nested objects', () => {
    const input = {
      user: {
        name: '<img onerror="alert(1)">',
        profile: {
          bio: 'javascript:void(0)'
        }
      }
    }
    const result = sanitizeObject(input)
    expect(result.user.name).not.toContain('onerror')
    expect(result.user.profile.bio).not.toContain('javascript:')
  })

  it('should handle arrays', () => {
    const input = {
      tags: ['<script>x</script>', 'normal', '<img src=x onerror=alert(1)>']
    }
    const result = sanitizeObject(input)
    expect(result.tags[0]).not.toContain('<script>')
    expect(result.tags[1]).toBe('normal')
    expect(result.tags[2]).not.toContain('onerror')
  })

  it('should preserve non-string values', () => {
    const input = {
      count: 42,
      active: true,
      date: null,
      data: undefined
    }
    const result = sanitizeObject(input)
    expect(result.count).toBe(42)
    expect(result.active).toBe(true)
    expect(result.date).toBeNull()
    expect(result.data).toBeUndefined()
  })
})

describe('containsXSSPatterns', () => {
  it('should detect script tags', () => {
    expect(containsXSSPatterns('<script>alert(1)</script>')).toBe(true)
  })

  it('should detect event handlers', () => {
    expect(containsXSSPatterns('<img onerror="alert(1)">')).toBe(true)
    expect(containsXSSPatterns('<div onclick="evil()">')).toBe(true)
  })

  it('should detect javascript: protocol', () => {
    expect(containsXSSPatterns('javascript:alert(1)')).toBe(true)
  })

  it('should detect iframe tags', () => {
    expect(containsXSSPatterns('<iframe src="evil.com">')).toBe(true)
  })

  it('should return false for safe strings', () => {
    expect(containsXSSPatterns('Hello World')).toBe(false)
    expect(containsXSSPatterns('test@example.com')).toBe(false)
    expect(containsXSSPatterns('Normal text with <b>bold</b>')).toBe(false)
  })

  it('should handle empty and invalid input', () => {
    expect(containsXSSPatterns('')).toBe(false)
    expect(containsXSSPatterns(null as any)).toBe(false)
    expect(containsXSSPatterns(undefined as any)).toBe(false)
  })
})

describe('sanitizeHtml', () => {
  it('should allow safe tags', () => {
    const input = '<p>Hello <strong>World</strong></p>'
    const result = sanitizeHtml(input)
    expect(result).toContain('<p>')
    expect(result).toContain('<strong>')
  })

  it('should remove unsafe tags', () => {
    const input = '<script>alert(1)</script><p>Safe</p>'
    const result = sanitizeHtml(input)
    expect(result).not.toContain('<script>')
    expect(result).toContain('<p>')
  })

  it('should sanitize anchor hrefs', () => {
    const input = '<a href="https://example.com">Link</a>'
    const result = sanitizeHtml(input)
    expect(result).toContain('href=')
    expect(result).toContain('rel="noopener noreferrer"')
  })

  it('should remove javascript: hrefs', () => {
    const input = '<a href="javascript:alert(1)">Evil</a>'
    const result = sanitizeHtml(input)
    expect(result).not.toContain('javascript:')
  })

  it('should strip attributes from allowed tags', () => {
    const input = '<p style="color:red" onclick="evil()">Text</p>'
    const result = sanitizeHtml(input)
    expect(result).not.toContain('style=')
    expect(result).not.toContain('onclick')
    expect(result).toContain('<p>')
  })
})

describe('isValidUrl', () => {
  it('should accept http URLs', () => {
    expect(isValidUrl('http://example.com')).toBe(true)
  })

  it('should accept https URLs', () => {
    expect(isValidUrl('https://example.com/path')).toBe(true)
  })

  it('should reject other protocols', () => {
    expect(isValidUrl('ftp://example.com')).toBe(false)
    expect(isValidUrl('javascript:alert(1)')).toBe(false)
    expect(isValidUrl('file:///etc/passwd')).toBe(false)
  })

  it('should reject invalid URLs', () => {
    expect(isValidUrl('not a url')).toBe(false)
    expect(isValidUrl('')).toBe(false)
  })
})
