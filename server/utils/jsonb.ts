/**
 * JSONB Data Cleaning and Validation Utilities
 * 
 * Purpose: Clean and normalize data before inserting into PostgreSQL JSONB columns
 * 
 * Issues this solves:
 * 1. Empty string properties in objects (e.g., {method: 'youtube', youtube: 'url', spotify: '', text: ''})
 * 2. Plain strings sent to JSONB columns (e.g., goalHorn: "text" instead of {text: "text"})
 * 3. Null and undefined values mixed with valid data
 * 4. Empty arrays and objects
 * 5. XSS vulnerabilities in text fields
 */

import { sanitizeString, isValidUrl } from './sanitize'

/**
 * Clean and normalize JSONB data
 * - Removes null, undefined, and empty strings
 * - Wraps plain strings in {text: string} objects
 * - Handles nested objects and arrays recursively
 * - Returns null if no valid data remains
 * 
 * @param obj - The data to clean
 * @param sanitize - Whether to sanitize string values (default: true)
 * @returns Cleaned data or null if empty
 */
export function cleanJsonbObject(obj: any, sanitize: boolean = true): any | null {
  // Handle null/undefined
  if (obj === null || obj === undefined) {
    return null
  }
  
  // Handle strings - wrap in object for JSONB compatibility
  if (typeof obj === 'string') {
    const trimmed = obj.trim()
    if (!trimmed) return null
    return { text: sanitize ? sanitizeString(trimmed) : trimmed }
  }
  
  // Handle non-objects (numbers, booleans, etc.)
  if (typeof obj !== 'object') {
    return null
  }
  
  // Handle arrays
  if (Array.isArray(obj)) {
    const filtered = obj
      .filter(item => {
        // Remove null/undefined
        if (item === null || item === undefined) return false
        // Remove empty strings
        if (typeof item === 'string' && item.trim() === '') return false
        return true
      })
      .map(item => {
        // Recursively clean nested objects/arrays
        if (typeof item === 'object') {
          return cleanJsonbObject(item, sanitize)
        }
        // Sanitize and trim strings
        if (typeof item === 'string') {
          const trimmed = item.trim()
          return sanitize ? sanitizeString(trimmed) : trimmed
        }
        return item
      })
      .filter(item => item !== null) // Remove items that became null after cleaning
    
    return filtered.length > 0 ? filtered : null
  }
  
  // Handle objects
  const cleaned: Record<string, any> = {}
  let hasValidValues = false
  
  for (const [key, value] of Object.entries(obj)) {
    // Skip null and undefined
    if (value === null || value === undefined) {
      continue
    }
    
    // Skip empty strings
    if (typeof value === 'string' && value.trim() === '') {
      continue
    }
    
    // Recursively clean nested objects/arrays
    if (typeof value === 'object') {
      const cleanedValue = cleanJsonbObject(value, sanitize)
      if (cleanedValue !== null) {
        cleaned[key] = cleanedValue
        hasValidValues = true
      }
    } else {
      // Include non-empty primitive values
      if (typeof value === 'string') {
        const trimmed = value.trim()
        cleaned[key] = sanitize ? sanitizeString(trimmed) : trimmed
      } else {
        cleaned[key] = value
      }
      hasValidValues = true
    }
  }
  
  return hasValidValues ? cleaned : null
}

/**
 * Clean warmup songs object
 * Handles the specific structure: {song1: string|object, song2: string|object, song3: string|object}
 * Wraps each song string in an object if needed
 * 
 * @param warmupSongs - Warmup songs object
 * @param sanitize - Whether to sanitize string values (default: true)
 * @returns Cleaned warmup songs or null
 */
export function cleanWarmupSongs(warmupSongs: any, sanitize: boolean = true): any | null {
  if (!warmupSongs || typeof warmupSongs !== 'object') {
    return null
  }
  
  const cleaned: Record<string, any> = {}
  let hasValidSongs = false
  
  for (const key of ['song1', 'song2', 'song3']) {
    const song = warmupSongs[key]
    
    if (!song) continue
    
    // CRITICAL FIX: Handle plain strings FIRST before calling cleanSongObject
    // Frontend sends plain strings like "Song Name - Artist"
    // We need to wrap them in {text: "..."} objects before processing
    if (typeof song === 'string') {
      const trimmed = song.trim()
      if (trimmed) {
        cleaned[key] = { text: sanitize ? sanitizeString(trimmed) : trimmed }
        hasValidSongs = true
      }
      // Skip to next iteration if string is empty
      continue
    }
    
    // If it's already an object, clean it with cleanSongObject
    if (typeof song === 'object') {
      const cleanedSong = cleanSongObject(song, sanitize)
      if (cleanedSong) {
        cleaned[key] = cleanedSong
        hasValidSongs = true
      }
    }
  }
  
  return hasValidSongs ? cleaned : null
}

/**
 * Clean roster players array
 * Filters out empty strings, trims player names, and sanitizes
 * 
 * @param players - Array of player names
 * @param sanitize - Whether to sanitize player names (default: true)
 * @returns Cleaned array or null
 */
export function cleanRosterPlayers(players: any, sanitize: boolean = true): string[] | null {
  if (!Array.isArray(players)) {
    return null
  }
  
  const cleaned = players
    .filter(p => p && typeof p === 'string' && p.trim())
    .map(p => {
      const trimmed = p.trim()
      return sanitize ? sanitizeString(trimmed) : trimmed
    })
  
  return cleaned.length > 0 ? cleaned : null
}

/**
 * Validate and clean song object
 * Ensures only the relevant field for the selected method is included
 * Removes empty string properties
 * 
 * @param song - Song object with method and url/text
 * @param sanitize - Whether to sanitize string values (default: true)
 * @returns Cleaned song object or null
 */
export function cleanSongObject(song: any, sanitize: boolean = true): any | null {
  if (!song) {
    return null
  }
  
  // If it's a plain string, wrap it
  if (typeof song === 'string') {
    const trimmed = song.trim()
    if (!trimmed) return null
    return { text: sanitize ? sanitizeString(trimmed) : trimmed }
  }
  
  if (typeof song !== 'object') {
    return null
  }
  
  const method = song.method
  
  // If no method, try to infer or treat as text
  if (!method) {
    // Check if it has a text field
    if (song.text && typeof song.text === 'string' && song.text.trim()) {
      const trimmed = song.text.trim()
      return { text: sanitize ? sanitizeString(trimmed) : trimmed }
    }
    // Check if it has youtube
    if (song.youtube && typeof song.youtube === 'string' && song.youtube.trim()) {
      return { method: 'youtube', youtube: song.youtube.trim() }
    }
    // Check if it has spotify
    if (song.spotify && typeof song.spotify === 'string' && song.spotify.trim()) {
      return { method: 'spotify', spotify: song.spotify.trim() }
    }
    return null
  }
  
  // Build clean object with only the relevant field
  const cleaned: any = { method }
  
  switch (method) {
    case 'youtube':
      if (song.youtube && typeof song.youtube === 'string' && song.youtube.trim()) {
        cleaned.youtube = song.youtube.trim()
        return cleaned
      }
      return null
      
    case 'spotify':
      if (song.spotify && typeof song.spotify === 'string' && song.spotify.trim()) {
        cleaned.spotify = song.spotify.trim()
        return cleaned
      }
      return null
      
    case 'text':
      if (song.text && typeof song.text === 'string' && song.text.trim()) {
        const trimmed = song.text.trim()
        cleaned.text = sanitize ? sanitizeString(trimmed) : trimmed
        return cleaned
      }
      return null
      
    default:
      return null
  }
}

/**
 * Validate that JSONB data doesn't exceed size limits
 * PostgreSQL JSONB has practical limits
 * 
 * @param obj - The object to validate
 * @param maxSizeKB - Maximum size in KB (default: 100KB)
 * @returns true if valid, false if too large
 */
export function validateJsonbSize(obj: any, maxSizeKB: number = 100): boolean {
  if (!obj) return true
  
  try {
    const jsonString = JSON.stringify(obj)
    const sizeKB = Buffer.byteLength(jsonString, 'utf8') / 1024
    return sizeKB <= maxSizeKB
  } catch (error) {
    return false
  }
}

// Note: validateArrayLength is available from validation-extended.ts if needed
// Note: isValidUrl is imported from sanitize.ts above

/**
 * Validate YouTube URL
 * 
 * @param url - The URL to validate
 * @returns true if valid YouTube URL
 */
export function isValidYouTubeUrl(url: string): boolean {
  if (!isValidUrl(url)) return false
  
  try {
    const parsed = new URL(url)
    return ['youtube.com', 'www.youtube.com', 'youtu.be', 'm.youtube.com'].includes(parsed.hostname)
  } catch {
    return false
  }
}

/**
 * Validate Spotify URL
 * 
 * @param url - The URL to validate
 * @returns true if valid Spotify URL
 */
export function isValidSpotifyUrl(url: string): boolean {
  if (!isValidUrl(url)) return false
  
  try {
    const parsed = new URL(url)
    return ['spotify.com', 'open.spotify.com'].includes(parsed.hostname)
  } catch {
    return false
  }
}

/**
 * Validate song object structure and content
 * 
 * @param song - The song object to validate
 * @returns Object with isValid flag and error message if invalid
 */
export function validateSongObject(song: any): { isValid: boolean; error?: string } {
  if (!song) {
    return { isValid: false, error: 'Song object is required' }
  }
  
  if (typeof song === 'string') {
    if (!song.trim()) {
      return { isValid: false, error: 'Song text cannot be empty' }
    }
    if (song.length > 200) {
      return { isValid: false, error: 'Song text must be 200 characters or less' }
    }
    return { isValid: true }
  }
  
  if (typeof song !== 'object') {
    return { isValid: false, error: 'Invalid song format' }
  }
  
  const method = song.method
  
  if (!method) {
    // Check if it has any valid field
    if (song.text || song.youtube || song.spotify) {
      return { isValid: true }
    }
    return { isValid: false, error: 'Song must have a method or content' }
  }
  
  switch (method) {
    case 'youtube':
      if (!song.youtube) {
        return { isValid: false, error: 'YouTube URL is required' }
      }
      if (!isValidYouTubeUrl(song.youtube)) {
        return { isValid: false, error: 'Invalid YouTube URL format' }
      }
      return { isValid: true }
      
    case 'spotify':
      if (!song.spotify) {
        return { isValid: false, error: 'Spotify URL is required' }
      }
      if (!isValidSpotifyUrl(song.spotify)) {
        return { isValid: false, error: 'Invalid Spotify URL format' }
      }
      return { isValid: true }
      
    case 'text':
      if (!song.text) {
        return { isValid: false, error: 'Song text is required' }
      }
      if (song.text.length > 200) {
        return { isValid: false, error: 'Song text must be 200 characters or less' }
      }
      return { isValid: true }
      
    default:
      return { isValid: false, error: `Invalid song method: ${method}` }
  }
}
