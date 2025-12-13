/**
 * Extended Validation Utilities
 * 
 * Additional validation functions for input length, content, and structure
 */

import { ValidationError } from './errors'

/**
 * Validate string length
 * 
 * @param value - The string to validate
 * @param fieldName - Name of the field for error messages
 * @param maxLength - Maximum allowed length
 * @param minLength - Minimum allowed length (default: 0)
 * @throws ValidationError if invalid
 */
export function validateStringLength(
  value: string | null | undefined,
  fieldName: string,
  maxLength: number,
  minLength: number = 0
): void {
  if (!value) {
    if (minLength > 0) {
      throw new ValidationError(`${fieldName} is required`, fieldName)
    }
    return
  }
  
  if (typeof value !== 'string') {
    throw new ValidationError(`${fieldName} must be a string`, fieldName)
  }
  
  const trimmed = value.trim()
  
  if (trimmed.length < minLength) {
    throw new ValidationError(
      `${fieldName} must be at least ${minLength} characters`,
      fieldName
    )
  }
  
  if (trimmed.length > maxLength) {
    throw new ValidationError(
      `${fieldName} must be ${maxLength} characters or less`,
      fieldName
    )
  }
}

/**
 * Validate array length
 * 
 * @param value - The array to validate
 * @param fieldName - Name of the field for error messages
 * @param maxLength - Maximum allowed length
 * @param minLength - Minimum allowed length (default: 0)
 * @throws ValidationError if invalid
 */
export function validateArrayLength(
  value: any[] | null | undefined,
  fieldName: string,
  maxLength: number,
  minLength: number = 0
): void {
  if (!value) {
    if (minLength > 0) {
      throw new ValidationError(`${fieldName} is required`, fieldName)
    }
    return
  }
  
  if (!Array.isArray(value)) {
    throw new ValidationError(`${fieldName} must be an array`, fieldName)
  }
  
  if (value.length < minLength) {
    throw new ValidationError(
      `${fieldName} must have at least ${minLength} items`,
      fieldName
    )
  }
  
  if (value.length > maxLength) {
    throw new ValidationError(
      `${fieldName} must have ${maxLength} items or less`,
      fieldName
    )
  }
}

/**
 * Validate that a value is within allowed range
 * 
 * @param value - The number to validate
 * @param fieldName - Name of the field for error messages
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @throws ValidationError if invalid
 */
export function validateNumberRange(
  value: number | null | undefined,
  fieldName: string,
  min: number,
  max: number
): void {
  if (value === null || value === undefined) {
    return
  }
  
  if (typeof value !== 'number' || isNaN(value)) {
    throw new ValidationError(`${fieldName} must be a valid number`, fieldName)
  }
  
  if (value < min || value > max) {
    throw new ValidationError(
      `${fieldName} must be between ${min} and ${max}`,
      fieldName
    )
  }
}

/**
 * Validate that a date is in the future
 * 
 * @param dateString - The date string to validate
 * @param fieldName - Name of the field for error messages
 * @param minDaysInFuture - Minimum days in the future (default: 0)
 * @throws ValidationError if invalid
 */
export function validateFutureDate(
  dateString: string | null | undefined,
  fieldName: string,
  minDaysInFuture: number = 0
): void {
  if (!dateString) {
    return
  }
  
  const date = new Date(dateString)
  
  if (isNaN(date.getTime())) {
    throw new ValidationError(`${fieldName} must be a valid date`, fieldName)
  }
  
  const now = new Date()
  const minDate = new Date(now.getTime() + minDaysInFuture * 24 * 60 * 60 * 1000)
  
  if (date < minDate) {
    if (minDaysInFuture === 0) {
      throw new ValidationError(`${fieldName} must be in the future`, fieldName)
    } else {
      throw new ValidationError(
        `${fieldName} must be at least ${minDaysInFuture} days in the future`,
        fieldName
      )
    }
  }
}

/**
 * Validate that a value matches allowed options
 * 
 * @param value - The value to validate
 * @param fieldName - Name of the field for error messages
 * @param allowedValues - Array of allowed values
 * @throws ValidationError if invalid
 */
export function validateEnum(
  value: any,
  fieldName: string,
  allowedValues: any[]
): void {
  if (!value) {
    return
  }
  
  if (!allowedValues.includes(value)) {
    throw new ValidationError(
      `${fieldName} must be one of: ${allowedValues.join(', ')}`,
      fieldName
    )
  }
}

/**
 * Validate all input lengths for order submission
 * Centralized validation to ensure consistency
 * 
 * @param input - The order input data
 * @throws ValidationError if any field exceeds limits
 */
export function validateOrderInputLengths(input: any): void {
  // Contact information
  validateStringLength(input.name, 'Name', 100, 1)
  validateStringLength(input.email, 'Email', 120, 1)
  validateStringLength(input.phone, 'Phone', 30, 1)
  
  // Optional text fields
  validateStringLength(input.organization, 'Organization', 100)
  validateStringLength(input.teamName, 'Team name', 100)
  validateStringLength(input.notes, 'Notes', 5000)
  validateStringLength(input.serviceType, 'Service type', 50)
  validateStringLength(input.sportType, 'Sport type', 50)
  
  // Arrays
  if (input.roster?.players) {
    validateArrayLength(input.roster.players, 'Roster', 50)
    
    // Validate individual player names
    input.roster.players.forEach((player: any, index: number) => {
      if (player && typeof player === 'string') {
        validateStringLength(player, `Player ${index + 1}`, 100)
      }
    })
  }
  
  if (input.audioFiles) {
    validateArrayLength(input.audioFiles, 'Audio files', 10)
  }
  
  if (input.sponsors) {
    validateArrayLength(input.sponsors, 'Sponsors', 20)
  }
}

/**
 * Sanitize and validate all JSONB fields
 * Ensures data is clean before database insertion
 * 
 * @param input - The order input data
 * @returns Object with validation results
 */
export function validateJsonbFields(input: any): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  // Validate intro song if present
  if (input.introSong) {
    if (typeof input.introSong === 'object' && input.introSong.method) {
      const method = input.introSong.method
      
      if (method === 'youtube' && input.introSong.youtube) {
        if (input.introSong.youtube.length > 500) {
          errors.push('YouTube URL must be 500 characters or less')
        }
      } else if (method === 'spotify' && input.introSong.spotify) {
        if (input.introSong.spotify.length > 500) {
          errors.push('Spotify URL must be 500 characters or less')
        }
      } else if (method === 'text' && input.introSong.text) {
        if (input.introSong.text.length > 200) {
          errors.push('Song text must be 200 characters or less')
        }
      }
    }
  }
  
  // Validate warmup songs if present
  if (input.warmupSongs && typeof input.warmupSongs === 'object') {
    for (const key of ['song1', 'song2', 'song3']) {
      const song = input.warmupSongs[key]
      if (song && typeof song === 'string' && song.length > 200) {
        errors.push(`Warmup ${key} must be 200 characters or less`)
      }
    }
  }
  
  // Validate goal horn if present
  if (input.goalHorn) {
    if (typeof input.goalHorn === 'string' && input.goalHorn.length > 200) {
      errors.push('Goal horn must be 200 characters or less')
    } else if (typeof input.goalHorn === 'object' && input.goalHorn.text) {
      if (input.goalHorn.text.length > 200) {
        errors.push('Goal horn text must be 200 characters or less')
      }
    }
  }
  
  // Validate goal song if present
  if (input.goalSong) {
    if (typeof input.goalSong === 'string' && input.goalSong.length > 200) {
      errors.push('Goal song must be 200 characters or less')
    } else if (typeof input.goalSong === 'object' && input.goalSong.text) {
      if (input.goalSong.text.length > 200) {
        errors.push('Goal song text must be 200 characters or less')
      }
    }
  }
  
  // Validate win song if present
  if (input.winSong) {
    if (typeof input.winSong === 'string' && input.winSong.length > 200) {
      errors.push('Win song must be 200 characters or less')
    } else if (typeof input.winSong === 'object' && input.winSong.text) {
      if (input.winSong.text.length > 200) {
        errors.push('Win song text must be 200 characters or less')
      }
    }
  }
  
  // Validate sponsors if present
  if (input.sponsors) {
    if (Array.isArray(input.sponsors)) {
      if (input.sponsors.length > 20) {
        errors.push('Maximum 20 sponsors allowed')
      }
      input.sponsors.forEach((sponsor: any, index: number) => {
        if (sponsor && typeof sponsor === 'string' && sponsor.length > 200) {
          errors.push(`Sponsor ${index + 1} must be 200 characters or less`)
        }
      })
    } else if (typeof input.sponsors === 'object') {
      const sponsorCount = Object.keys(input.sponsors).length
      if (sponsorCount > 20) {
        errors.push('Maximum 20 sponsors allowed')
      }
    }
  }
  
  // Validate audio files if present
  if (input.audioFiles && Array.isArray(input.audioFiles)) {
    if (input.audioFiles.length > 10) {
      errors.push('Maximum 10 audio files allowed')
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Check if a string contains potentially malicious content
 * Basic XSS detection
 * 
 * @param value - The string to check
 * @returns true if suspicious content detected
 */
export function containsSuspiciousContent(value: string): boolean {
  if (!value || typeof value !== 'string') return false
  
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // Event handlers like onclick=
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /eval\(/i,
    /expression\(/i
  ]
  
  return suspiciousPatterns.some(pattern => pattern.test(value))
}

/**
 * Validate that input doesn't contain XSS attempts
 * 
 * @param input - The order input data
 * @throws ValidationError if suspicious content detected
 */
export function validateNoXSS(input: any): void {
  const fieldsToCheck = [
    input.name,
    input.organization,
    input.teamName,
    input.notes
  ]
  
  for (const field of fieldsToCheck) {
    if (field && containsSuspiciousContent(field)) {
      throw new ValidationError(
        'Invalid characters detected in input',
        'security'
      )
    }
  }
  
  // Check player names
  if (input.roster?.players && Array.isArray(input.roster.players)) {
    for (const player of input.roster.players) {
      if (player && containsSuspiciousContent(player)) {
        throw new ValidationError(
          'Invalid characters detected in player name',
          'roster'
        )
      }
    }
  }
}
