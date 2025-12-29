import { describe, it, expect } from 'vitest'

describe('File Upload Validation', () => {
  // MIME type validation
  const ALLOWED_MIME_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'audio/mpeg',
    'audio/mp3',
    'video/mp4'
  ])

  describe('MIME Type Validation', () => {
    it('should allow valid image types', () => {
      expect(ALLOWED_MIME_TYPES.has('image/jpeg')).toBe(true)
      expect(ALLOWED_MIME_TYPES.has('image/png')).toBe(true)
      expect(ALLOWED_MIME_TYPES.has('image/gif')).toBe(true)
    })

    it('should allow valid document types', () => {
      expect(ALLOWED_MIME_TYPES.has('application/pdf')).toBe(true)
    })

    it('should allow valid audio types', () => {
      expect(ALLOWED_MIME_TYPES.has('audio/mpeg')).toBe(true)
      expect(ALLOWED_MIME_TYPES.has('audio/mp3')).toBe(true)
    })

    it('should allow valid video types', () => {
      expect(ALLOWED_MIME_TYPES.has('video/mp4')).toBe(true)
    })

    it('should reject dangerous file types', () => {
      expect(ALLOWED_MIME_TYPES.has('application/x-executable')).toBe(false)
      expect(ALLOWED_MIME_TYPES.has('application/x-msdownload')).toBe(false)
      expect(ALLOWED_MIME_TYPES.has('text/html')).toBe(false)
      expect(ALLOWED_MIME_TYPES.has('application/javascript')).toBe(false)
    })
  })

  describe('Filename Sanitization', () => {
    const DANGEROUS_PATTERNS = [
      /\.\./,                    // Path traversal
      /^\.+$/,                   // Only dots
      /[\x00-\x1f]/,             // Control characters
      /[<>:"|?*]/,               // Windows reserved characters
      /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i, // Windows reserved names
    ]

    function isDangerousFilename(filename: string): boolean {
      return DANGEROUS_PATTERNS.some(pattern => pattern.test(filename))
    }

    function sanitizeFilename(filename: string): string {
      // Remove path components
      let sanitized = filename.split(/[/\\]/).pop() || 'file'
      
      // Replace problematic characters
      sanitized = sanitized
        .replace(/[^\w\s.-]/g, '_')
        .replace(/\s+/g, '_')
        .replace(/_+/g, '_')
        .substring(0, 200)
      
      // Ensure it has an extension
      if (!sanitized.includes('.')) {
        sanitized += '.bin'
      }
      
      return sanitized
    }

    it('should detect path traversal attempts', () => {
      expect(isDangerousFilename('../../../etc/passwd')).toBe(true)
      expect(isDangerousFilename('..\\..\\windows\\system32')).toBe(true)
      expect(isDangerousFilename('file..txt')).toBe(true)
    })

    it('should detect Windows reserved names', () => {
      expect(isDangerousFilename('CON')).toBe(true)
      expect(isDangerousFilename('PRN')).toBe(true)
      expect(isDangerousFilename('AUX')).toBe(true)
      expect(isDangerousFilename('NUL')).toBe(true)
      expect(isDangerousFilename('COM1')).toBe(true)
      expect(isDangerousFilename('LPT1')).toBe(true)
    })

    it('should detect control characters', () => {
      expect(isDangerousFilename('file\x00.txt')).toBe(true)
      expect(isDangerousFilename('file\x1f.txt')).toBe(true)
    })

    it('should allow safe filenames', () => {
      expect(isDangerousFilename('document.pdf')).toBe(false)
      expect(isDangerousFilename('my-file_2024.jpg')).toBe(false)
      expect(isDangerousFilename('report.final.docx')).toBe(false)
    })

    it('should sanitize filenames correctly', () => {
      expect(sanitizeFilename('normal.pdf')).toBe('normal.pdf')
      expect(sanitizeFilename('file with spaces.jpg')).toBe('file_with_spaces.jpg')
      expect(sanitizeFilename('special@#$chars.png')).toBe('special___chars.png')
    })

    it('should extract filename from path', () => {
      expect(sanitizeFilename('/path/to/file.pdf')).toBe('file.pdf')
      expect(sanitizeFilename('C:\\Users\\file.pdf')).toBe('file.pdf')
    })

    it('should add extension if missing', () => {
      expect(sanitizeFilename('noextension')).toBe('noextension.bin')
    })

    it('should limit filename length', () => {
      const longName = 'a'.repeat(300) + '.pdf'
      const sanitized = sanitizeFilename(longName)
      expect(sanitized.length).toBeLessThanOrEqual(204) // 200 + .bin
    })
  })

  describe('File Size Validation', () => {
    const MAX_FILE_SIZES: Record<string, number> = {
      'image': 20 * 1024 * 1024,      // 20MB
      'audio': 100 * 1024 * 1024,     // 100MB
      'video': 500 * 1024 * 1024,     // 500MB
      'document': 50 * 1024 * 1024,   // 50MB
      'default': 50 * 1024 * 1024     // 50MB
    }

    function getFileCategory(mimeType: string): string {
      if (mimeType.startsWith('image/')) return 'image'
      if (mimeType.startsWith('audio/')) return 'audio'
      if (mimeType.startsWith('video/')) return 'video'
      return 'document'
    }

    function isFileSizeValid(mimeType: string, sizeBytes: number): boolean {
      const category = getFileCategory(mimeType)
      const maxSize = MAX_FILE_SIZES[category] || MAX_FILE_SIZES.default
      return sizeBytes <= maxSize
    }

    it('should validate image file sizes', () => {
      expect(isFileSizeValid('image/jpeg', 10 * 1024 * 1024)).toBe(true)  // 10MB
      expect(isFileSizeValid('image/jpeg', 25 * 1024 * 1024)).toBe(false) // 25MB
    })

    it('should validate audio file sizes', () => {
      expect(isFileSizeValid('audio/mpeg', 50 * 1024 * 1024)).toBe(true)   // 50MB
      expect(isFileSizeValid('audio/mpeg', 150 * 1024 * 1024)).toBe(false) // 150MB
    })

    it('should validate video file sizes', () => {
      expect(isFileSizeValid('video/mp4', 400 * 1024 * 1024)).toBe(true)   // 400MB
      expect(isFileSizeValid('video/mp4', 600 * 1024 * 1024)).toBe(false)  // 600MB
    })

    it('should use default size for unknown types', () => {
      expect(isFileSizeValid('application/octet-stream', 40 * 1024 * 1024)).toBe(true)
      expect(isFileSizeValid('application/octet-stream', 60 * 1024 * 1024)).toBe(false)
    })
  })

  describe('MIME Type Extension Matching', () => {
    const EXTENSION_MIME_MAP: Record<string, string[]> = {
      'jpg': ['image/jpeg'],
      'jpeg': ['image/jpeg'],
      'png': ['image/png'],
      'pdf': ['application/pdf'],
      'mp3': ['audio/mpeg', 'audio/mp3'],
      'mp4': ['video/mp4']
    }

    function validateMimeTypeExtension(filename: string, mimeType: string): boolean {
      const extension = filename.split('.').pop()?.toLowerCase()
      if (!extension) return false
      
      const allowedMimes = EXTENSION_MIME_MAP[extension]
      if (!allowedMimes) return true // Unknown extension, allow if MIME type is valid
      
      return allowedMimes.includes(mimeType)
    }

    it('should validate matching MIME type and extension', () => {
      expect(validateMimeTypeExtension('photo.jpg', 'image/jpeg')).toBe(true)
      expect(validateMimeTypeExtension('document.pdf', 'application/pdf')).toBe(true)
      expect(validateMimeTypeExtension('song.mp3', 'audio/mpeg')).toBe(true)
    })

    it('should reject mismatched MIME type and extension', () => {
      expect(validateMimeTypeExtension('photo.jpg', 'application/pdf')).toBe(false)
      expect(validateMimeTypeExtension('document.pdf', 'image/jpeg')).toBe(false)
    })

    it('should allow unknown extensions', () => {
      expect(validateMimeTypeExtension('file.xyz', 'application/octet-stream')).toBe(true)
    })
  })

  describe('S3 Key Generation', () => {
    function generateS3Key(orderId: number, filename: string, kind: string): string {
      const timestamp = Date.now()
      const randomSuffix = Math.random().toString(36).substring(2, 8)
      const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 200)
      
      return `orders/${orderId}/${kind}/${timestamp}-${randomSuffix}-${sanitizedFilename}`
    }

    it('should generate valid S3 keys', () => {
      const key = generateS3Key(123, 'test.pdf', 'upload')
      
      expect(key).toMatch(/^orders\/123\/upload\/\d+-[a-z0-9]+-test\.pdf$/)
    })

    it('should sanitize filename in key', () => {
      const key = generateS3Key(123, 'file with spaces.pdf', 'upload')
      
      expect(key).not.toContain(' ')
      expect(key).toContain('file_with_spaces.pdf')
    })

    it('should include kind in path', () => {
      const uploadKey = generateS3Key(123, 'test.pdf', 'upload')
      const deliverableKey = generateS3Key(123, 'test.pdf', 'deliverable')
      
      expect(uploadKey).toContain('/upload/')
      expect(deliverableKey).toContain('/deliverable/')
    })
  })
})

describe('File Authorization', () => {
  interface User {
    userId: number
    role: 'customer' | 'admin'
  }

  interface FileRecord {
    id: number
    userId: number
    kind: 'upload' | 'deliverable'
  }

  function canAccessFile(user: User, file: FileRecord): boolean {
    // Admin can access all files
    if (user.role === 'admin') return true
    
    // User can only access their own files
    return file.userId === user.userId
  }

  function canDeleteFile(user: User, file: FileRecord): boolean {
    // Admin can delete any file
    if (user.role === 'admin') return true
    
    // User can only delete their own uploads, not deliverables
    return file.userId === user.userId && file.kind === 'upload'
  }

  it('should allow admin to access any file', () => {
    const admin: User = { userId: 1, role: 'admin' }
    const file: FileRecord = { id: 1, userId: 2, kind: 'upload' }
    
    expect(canAccessFile(admin, file)).toBe(true)
  })

  it('should allow user to access own files', () => {
    const user: User = { userId: 2, role: 'customer' }
    const file: FileRecord = { id: 1, userId: 2, kind: 'upload' }
    
    expect(canAccessFile(user, file)).toBe(true)
  })

  it('should deny user access to other users files', () => {
    const user: User = { userId: 2, role: 'customer' }
    const file: FileRecord = { id: 1, userId: 3, kind: 'upload' }
    
    expect(canAccessFile(user, file)).toBe(false)
  })

  it('should allow user to delete own uploads', () => {
    const user: User = { userId: 2, role: 'customer' }
    const file: FileRecord = { id: 1, userId: 2, kind: 'upload' }
    
    expect(canDeleteFile(user, file)).toBe(true)
  })

  it('should deny user from deleting deliverables', () => {
    const user: User = { userId: 2, role: 'customer' }
    const file: FileRecord = { id: 1, userId: 2, kind: 'deliverable' }
    
    expect(canDeleteFile(user, file)).toBe(false)
  })

  it('should allow admin to delete deliverables', () => {
    const admin: User = { userId: 1, role: 'admin' }
    const file: FileRecord = { id: 1, userId: 2, kind: 'deliverable' }
    
    expect(canDeleteFile(admin, file)).toBe(true)
  })
})
