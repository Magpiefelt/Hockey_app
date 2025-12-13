/**
 * Test Suite for JSONB Utilities
 * 
 * Tests all edge cases that were causing submission failures
 */

import { describe, it, expect } from 'vitest'
import {
  cleanJsonbObject,
  cleanWarmupSongs,
  cleanRosterPlayers,
  cleanSongObject,
  validateJsonbSize,
  isValidYouTubeUrl,
  isValidSpotifyUrl,
  validateSongObject
} from '../jsonb'
// validateArrayLength is in validation-extended module, tested separately

describe('cleanJsonbObject', () => {
  it('should remove empty strings from objects', () => {
    const input = {
      method: 'youtube',
      youtube: 'https://youtube.com/watch?v=123',
      spotify: '',
      text: ''
    }
    
    const result = cleanJsonbObject(input)
    
    expect(result).toEqual({
      method: 'youtube',
      youtube: 'https://youtube.com/watch?v=123'
    })
    expect(result).not.toHaveProperty('spotify')
    expect(result).not.toHaveProperty('text')
  })
  
  it('should wrap plain strings in objects', () => {
    const input = 'Classic NHL horn'
    const result = cleanJsonbObject(input)
    
    expect(result).toEqual({ text: 'Classic NHL horn' })
  })
  
  it('should return null for empty strings', () => {
    expect(cleanJsonbObject('')).toBeNull()
    expect(cleanJsonbObject('   ')).toBeNull()
  })
  
  it('should return null for empty objects', () => {
    expect(cleanJsonbObject({})).toBeNull()
    expect(cleanJsonbObject({ a: '', b: null, c: undefined })).toBeNull()
  })
  
  it('should handle nested objects', () => {
    const input = {
      level1: {
        level2: {
          value: 'test',
          empty: ''
        },
        empty: ''
      }
    }
    
    const result = cleanJsonbObject(input)
    
    expect(result).toEqual({
      level1: {
        level2: {
          value: 'test'
        }
      }
    })
  })
  
  it('should handle arrays', () => {
    const input = {
      items: ['item1', '', 'item2', null, undefined, 'item3']
    }
    
    const result = cleanJsonbObject(input)
    
    expect(result).toEqual({
      items: ['item1', 'item2', 'item3']
    })
  })
  
  it('should return null for null/undefined input', () => {
    expect(cleanJsonbObject(null)).toBeNull()
    expect(cleanJsonbObject(undefined)).toBeNull()
  })
})

describe('cleanSongObject', () => {
  it('should clean song object with method and URL', () => {
    const input = {
      method: 'youtube',
      youtube: 'https://youtube.com/watch?v=123',
      spotify: '',
      text: ''
    }
    
    const result = cleanSongObject(input)
    
    expect(result).toEqual({
      method: 'youtube',
      youtube: 'https://youtube.com/watch?v=123'
    })
  })
  
  it('should wrap plain string in text object', () => {
    const result = cleanSongObject('Song Name - Artist')
    
    expect(result).toEqual({ text: 'Song Name - Artist' })
  })
  
  it('should infer method from content', () => {
    const input = {
      youtube: 'https://youtube.com/watch?v=123'
    }
    
    const result = cleanSongObject(input)
    
    expect(result).toEqual({
      method: 'youtube',
      youtube: 'https://youtube.com/watch?v=123'
    })
  })
  
  it('should return null for empty song', () => {
    expect(cleanSongObject(null)).toBeNull()
    expect(cleanSongObject('')).toBeNull()
    expect(cleanSongObject({})).toBeNull()
  })
  
  it('should handle text method', () => {
    const input = {
      method: 'text',
      text: 'Song Name - Artist',
      youtube: '',
      spotify: ''
    }
    
    const result = cleanSongObject(input)
    
    expect(result).toEqual({
      method: 'text',
      text: 'Song Name - Artist'
    })
  })
})

describe('cleanWarmupSongs', () => {
  it('should clean warmup songs object', () => {
    const input = {
      song1: 'Song 1',
      song2: 'Song 2',
      song3: ''
    }
    
    const result = cleanWarmupSongs(input)
    
    expect(result).toEqual({
      song1: { text: 'Song 1' },
      song2: { text: 'Song 2' }
    })
    expect(result).not.toHaveProperty('song3')
  })
  
  it('should handle song objects', () => {
    const input = {
      song1: {
        method: 'youtube',
        youtube: 'https://youtube.com/watch?v=123',
        spotify: '',
        text: ''
      },
      song2: 'Song 2'
    }
    
    const result = cleanWarmupSongs(input)
    
    expect(result).toEqual({
      song1: {
        method: 'youtube',
        youtube: 'https://youtube.com/watch?v=123'
      },
      song2: { text: 'Song 2' }
    })
  })
  
  it('should return null for empty warmup songs', () => {
    expect(cleanWarmupSongs(null)).toBeNull()
    expect(cleanWarmupSongs({})).toBeNull()
    expect(cleanWarmupSongs({ song1: '', song2: '', song3: '' })).toBeNull()
  })
})

describe('cleanRosterPlayers', () => {
  it('should clean player names array', () => {
    const input = ['Player 1', '', '  Player 2  ', null, undefined, 'Player 3']
    
    const result = cleanRosterPlayers(input)
    
    expect(result).toEqual(['Player 1', 'Player 2', 'Player 3'])
  })
  
  it('should return null for empty array', () => {
    expect(cleanRosterPlayers([])).toBeNull()
    expect(cleanRosterPlayers(['', '', ''])).toBeNull()
  })
  
  it('should return null for non-array input', () => {
    expect(cleanRosterPlayers(null)).toBeNull()
    expect(cleanRosterPlayers('not an array' as any)).toBeNull()
  })
})

describe('validateJsonbSize', () => {
  it('should accept small objects', () => {
    const obj = { name: 'Test', value: 123 }
    expect(validateJsonbSize(obj)).toBe(true)
  })
  
  it('should reject very large objects', () => {
    const largeObj = { data: 'x'.repeat(200 * 1024) } // 200KB
    expect(validateJsonbSize(largeObj, 100)).toBe(false)
  })
  
  it('should accept null/undefined', () => {
    expect(validateJsonbSize(null)).toBe(true)
    expect(validateJsonbSize(undefined)).toBe(true)
  })
})

// validateArrayLength tests moved to validation-extended.test.ts

describe('isValidYouTubeUrl', () => {
  it('should accept valid YouTube URLs', () => {
    expect(isValidYouTubeUrl('https://youtube.com/watch?v=123')).toBe(true)
    expect(isValidYouTubeUrl('https://www.youtube.com/watch?v=123')).toBe(true)
    expect(isValidYouTubeUrl('https://youtu.be/123')).toBe(true)
    expect(isValidYouTubeUrl('https://m.youtube.com/watch?v=123')).toBe(true)
  })
  
  it('should reject invalid URLs', () => {
    expect(isValidYouTubeUrl('not a url')).toBe(false)
    expect(isValidYouTubeUrl('https://spotify.com/track/123')).toBe(false)
    expect(isValidYouTubeUrl('')).toBe(false)
  })
})

describe('isValidSpotifyUrl', () => {
  it('should accept valid Spotify URLs', () => {
    expect(isValidSpotifyUrl('https://spotify.com/track/123')).toBe(true)
    expect(isValidSpotifyUrl('https://open.spotify.com/track/123')).toBe(true)
  })
  
  it('should reject invalid URLs', () => {
    expect(isValidSpotifyUrl('not a url')).toBe(false)
    expect(isValidSpotifyUrl('https://youtube.com/watch?v=123')).toBe(false)
    expect(isValidSpotifyUrl('')).toBe(false)
  })
})

describe('validateSongObject', () => {
  it('should accept valid song with YouTube URL', () => {
    const song = {
      method: 'youtube',
      youtube: 'https://youtube.com/watch?v=123'
    }
    
    const result = validateSongObject(song)
    expect(result.isValid).toBe(true)
  })
  
  it('should accept valid song with Spotify URL', () => {
    const song = {
      method: 'spotify',
      spotify: 'https://open.spotify.com/track/123'
    }
    
    const result = validateSongObject(song)
    expect(result.isValid).toBe(true)
  })
  
  it('should accept valid song with text', () => {
    const song = {
      method: 'text',
      text: 'Song Name - Artist'
    }
    
    const result = validateSongObject(song)
    expect(result.isValid).toBe(true)
  })
  
  it('should accept plain string', () => {
    const result = validateSongObject('Song Name - Artist')
    expect(result.isValid).toBe(true)
  })
  
  it('should reject empty song', () => {
    const result = validateSongObject(null)
    expect(result.isValid).toBe(false)
    expect(result.error).toBeDefined()
  })
  
  it('should reject invalid YouTube URL', () => {
    const song = {
      method: 'youtube',
      youtube: 'not a url'
    }
    
    const result = validateSongObject(song)
    expect(result.isValid).toBe(false)
    expect(result.error).toContain('YouTube')
  })
  
  it('should reject text that is too long', () => {
    const song = {
      method: 'text',
      text: 'x'.repeat(300)
    }
    
    const result = validateSongObject(song)
    expect(result.isValid).toBe(false)
    expect(result.error).toContain('200 characters')
  })
})

describe('cleanWarmupSongs - Critical Fix Verification', () => {
  it('should handle plain strings from Package 2 frontend', () => {
    // This is exactly what the frontend sends
    const input = {
      song1: 'Thunderstruck - AC/DC',
      song2: 'Eye of the Tiger - Survivor',
      song3: 'Seven Nation Army - The White Stripes'
    }
    
    const result = cleanWarmupSongs(input)
    
    // Should wrap each string in {text: ...}
    expect(result).toEqual({
      song1: { text: 'Thunderstruck - AC/DC' },
      song2: { text: 'Eye of the Tiger - Survivor' },
      song3: { text: 'Seven Nation Army - The White Stripes' }
    })
  })
  
  it('should handle mixed plain strings and empty values', () => {
    const input = {
      song1: 'Song 1 - Artist',
      song2: '',
      song3: 'Song 3 - Artist'
    }
    
    const result = cleanWarmupSongs(input)
    
    expect(result).toEqual({
      song1: { text: 'Song 1 - Artist' },
      song3: { text: 'Song 3 - Artist' }
    })
    expect(result).not.toHaveProperty('song2')
  })
  
  it('should handle whitespace-only strings', () => {
    const input = {
      song1: 'Valid Song',
      song2: '   ',
      song3: '\t\n'
    }
    
    const result = cleanWarmupSongs(input)
    
    expect(result).toEqual({
      song1: { text: 'Valid Song' }
    })
  })
  
  it('should still handle structured objects correctly', () => {
    const input = {
      song1: { method: 'youtube', youtube: 'https://youtube.com/watch?v=123' },
      song2: 'Plain String Song',
      song3: { method: 'text', text: 'Structured Text Song' }
    }
    
    const result = cleanWarmupSongs(input)
    
    expect(result).toEqual({
      song1: { method: 'youtube', youtube: 'https://youtube.com/watch?v=123' },
      song2: { text: 'Plain String Song' },
      song3: { method: 'text', text: 'Structured Text Song' }
    })
  })
  
  it('should handle only song1 and song2 (song3 optional)', () => {
    const input = {
      song1: 'Required Song 1',
      song2: 'Required Song 2'
    }
    
    const result = cleanWarmupSongs(input)
    
    expect(result).toEqual({
      song1: { text: 'Required Song 1' },
      song2: { text: 'Required Song 2' }
    })
  })
})

describe('Edge Cases - Real World Scenarios', () => {
  it('should handle Package #1 submission data', () => {
    const introSong = {
      method: 'youtube',
      youtube: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
      spotify: '',
      text: ''
    }
    
    const result = cleanSongObject(introSong)
    
    expect(result).toEqual({
      method: 'youtube',
      youtube: 'https://youtube.com/watch?v=dQw4w9WgXcQ'
    })
  })
  
  it('should handle Package #3 submission data', () => {
    const goalHorn = 'Classic NHL horn'
    const winSong = 'We Are The Champions - Queen'
    
    expect(cleanJsonbObject(goalHorn)).toEqual({ text: 'Classic NHL horn' })
    expect(cleanJsonbObject(winSong)).toEqual({ text: 'We Are The Champions - Queen' })
  })
  
  it('should handle warmup songs from Package #2', () => {
    const warmupSongs = {
      song1: 'Thunderstruck - AC/DC',
      song2: 'Eye of the Tiger - Survivor',
      song3: ''
    }
    
    const result = cleanWarmupSongs(warmupSongs)
    
    expect(result).toEqual({
      song1: { text: 'Thunderstruck - AC/DC' },
      song2: { text: 'Eye of the Tiger - Survivor' }
    })
  })
})
