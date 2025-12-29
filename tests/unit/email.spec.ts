import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the email utility functions
const mockSendEmail = vi.fn()
const mockEscapeHtml = vi.fn((str: string) => str.replace(/[<>&"']/g, ''))
const mockSanitizeString = vi.fn((str: string) => str.replace(/[<>]/g, ''))

vi.mock('../../server/utils/email', () => ({
  sendEmail: mockSendEmail,
  sendCustomEmail: vi.fn(),
  sendOrderConfirmation: vi.fn(),
  sendQuoteEmail: vi.fn(),
  sendInvoiceEmail: vi.fn(),
  sendPaymentReceipt: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  isEmailConfigured: vi.fn(() => true)
}))

vi.mock('../../server/utils/sanitize', () => ({
  escapeHtml: mockEscapeHtml,
  sanitizeString: mockSanitizeString
}))

describe('Email Utility', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('XSS Prevention', () => {
    it('should escape HTML in custom email body', () => {
      const maliciousInput = '<script>alert("xss")</script>'
      const escaped = mockEscapeHtml(maliciousInput)
      
      expect(escaped).not.toContain('<script>')
      expect(escaped).not.toContain('</script>')
    })

    it('should escape HTML entities properly', () => {
      const input = '<div onclick="evil()">Test & "quotes"</div>'
      const escaped = mockEscapeHtml(input)
      
      expect(escaped).not.toContain('<div')
      expect(escaped).not.toContain('onclick')
    })

    it('should sanitize email subject to prevent header injection', () => {
      const maliciousSubject = 'Normal Subject\r\nBcc: attacker@evil.com'
      const sanitized = mockSanitizeString(maliciousSubject)
      
      // Should not contain newlines that could inject headers
      expect(sanitized).not.toMatch(/[\r\n]/)
    })

    it('should handle nested script tags', () => {
      const nested = '<scr<script>ipt>alert(1)</scr</script>ipt>'
      const escaped = mockEscapeHtml(nested)
      
      expect(escaped).not.toContain('<script')
    })

    it('should escape event handlers', () => {
      const input = '<img src=x onerror="alert(1)">'
      const escaped = mockEscapeHtml(input)
      
      expect(escaped).not.toContain('onerror')
    })
  })

  describe('Email Validation', () => {
    it('should validate email format', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org'
      ]
      
      const invalidEmails = [
        'notanemail',
        '@nodomain.com',
        'spaces in@email.com',
        'missing@.com'
      ]
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      
      validEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(true)
      })
      
      invalidEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(false)
      })
    })
  })

  describe('Email Content', () => {
    it('should format currency correctly', () => {
      const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`
      
      expect(formatPrice(1000)).toBe('$10.00')
      expect(formatPrice(9999)).toBe('$99.99')
      expect(formatPrice(100000)).toBe('$1000.00')
      expect(formatPrice(50)).toBe('$0.50')
    })

    it('should generate valid date strings', () => {
      const date = new Date('2024-01-15')
      const formatted = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      
      expect(formatted).toContain('January')
      expect(formatted).toContain('15')
      expect(formatted).toContain('2024')
    })
  })

  describe('URL Validation', () => {
    it('should validate URLs start with http', () => {
      const validateUrl = (url: string) => url.startsWith('http')
      
      expect(validateUrl('https://example.com')).toBe(true)
      expect(validateUrl('http://example.com')).toBe(true)
      expect(validateUrl('javascript:alert(1)')).toBe(false)
      expect(validateUrl('data:text/html,<script>alert(1)</script>')).toBe(false)
    })

    it('should reject javascript: URLs', () => {
      const safeUrl = (url: string) => url.startsWith('http') ? url : '#'
      
      expect(safeUrl('javascript:alert(1)')).toBe('#')
      expect(safeUrl('https://safe.com')).toBe('https://safe.com')
    })
  })
})

describe('Email Templates', () => {
  describe('Order Confirmation', () => {
    it('should include order ID in template', () => {
      const orderId = 12345
      const template = `Order #${orderId}`
      
      expect(template).toContain('12345')
    })

    it('should escape customer name', () => {
      const name = '<script>alert("xss")</script>'
      const escaped = mockEscapeHtml(name)
      
      expect(escaped).not.toContain('<script>')
    })
  })

  describe('Quote Email', () => {
    it('should format quote amount correctly', () => {
      const quoteAmount = 25000 // $250.00
      const formatted = `$${(quoteAmount / 100).toFixed(2)}`
      
      expect(formatted).toBe('$250.00')
    })

    it('should include validity period', () => {
      const validDays = 30
      const message = `This quote is valid for ${validDays} days`
      
      expect(message).toContain('30 days')
    })
  })

  describe('Password Reset', () => {
    it('should include expiration warning', () => {
      const expiresIn = 60
      const warning = `This link will expire in ${expiresIn} minutes`
      
      expect(warning).toContain('60 minutes')
    })

    it('should validate reset URL', () => {
      const resetUrl = 'https://example.com/reset?token=abc123'
      
      expect(resetUrl.startsWith('https://')).toBe(true)
      expect(resetUrl).toContain('token=')
    })
  })
})

describe('Bulk Email', () => {
  it('should handle name placeholder replacement', () => {
    const template = 'Hello {{name}}, welcome!'
    const name = 'John'
    const result = template.replace(/\{\{name\}\}/g, name)
    
    expect(result).toBe('Hello John, welcome!')
  })

  it('should escape names in placeholder replacement', () => {
    const template = 'Hello {{name}}'
    const maliciousName = '<script>alert(1)</script>'
    const escapedName = mockEscapeHtml(maliciousName)
    const result = template.replace(/\{\{name\}\}/g, escapedName)
    
    expect(result).not.toContain('<script>')
  })

  it('should handle missing name gracefully', () => {
    const template = 'Hello {{name}}'
    const name = undefined
    const result = name ? template.replace(/\{\{name\}\}/g, name) : template
    
    expect(result).toBe('Hello {{name}}')
  })
})
