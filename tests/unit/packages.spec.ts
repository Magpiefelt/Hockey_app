/**
 * Tests for package pricing and data handling
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('packages.json', () => {
  const packagesPath = join(process.cwd(), 'content', 'packages.json')
  let packages: any[]

  beforeAll(() => {
    const content = readFileSync(packagesPath, 'utf-8')
    packages = JSON.parse(content)
  })

  it('should be a valid JSON array', () => {
    expect(Array.isArray(packages)).toBe(true)
    expect(packages.length).toBeGreaterThan(0)
  })

  it('should have price_cents field for all packages', () => {
    for (const pkg of packages) {
      expect(pkg).toHaveProperty('price_cents')
      expect(typeof pkg.price_cents).toBe('number')
    }
  })

  it('should have valid price_cents values (non-negative integers)', () => {
    for (const pkg of packages) {
      expect(pkg.price_cents).toBeGreaterThanOrEqual(0)
      expect(Number.isInteger(pkg.price_cents)).toBe(true)
    }
  })

  it('should have required fields for each package', () => {
    const requiredFields = ['id', 'name', 'description', 'price_cents', 'features']
    
    for (const pkg of packages) {
      for (const field of requiredFields) {
        expect(pkg).toHaveProperty(field)
      }
    }
  })

  it('should have features as an array', () => {
    for (const pkg of packages) {
      expect(Array.isArray(pkg.features)).toBe(true)
      expect(pkg.features.length).toBeGreaterThan(0)
    }
  })

  it('should have unique package IDs', () => {
    const ids = packages.map(p => p.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })
})

describe('seed.ts price handling', () => {
  it('should correctly handle price_cents field', () => {
    // Simulate the seed.ts logic
    const pkg = {
      id: 'test-package',
      name: 'Test Package',
      price_cents: 8000,
      price: 5000 // Old field, should be ignored
    }
    
    const priceCents = typeof pkg.price_cents === 'number' 
      ? pkg.price_cents 
      : (typeof pkg.price === 'number' ? pkg.price : 0)
    
    expect(priceCents).toBe(8000) // price_cents takes precedence
  })

  it('should fall back to price field if price_cents is missing', () => {
    const pkg = {
      id: 'test-package',
      name: 'Test Package',
      price: 5000
    } as any
    
    const priceCents = typeof pkg.price_cents === 'number' 
      ? pkg.price_cents 
      : (typeof pkg.price === 'number' ? pkg.price : 0)
    
    expect(priceCents).toBe(5000)
  })

  it('should default to 0 if no price field exists', () => {
    const pkg = {
      id: 'test-package',
      name: 'Test Package'
    } as any
    
    const priceCents = typeof pkg.price_cents === 'number' 
      ? pkg.price_cents 
      : (typeof pkg.price === 'number' ? pkg.price : 0)
    
    expect(priceCents).toBe(0)
  })
})

describe('formatPrice function', () => {
  const formatPrice = (cents: number): string => {
    return `$${(cents / 100).toFixed(0)}`
  }

  it('should format cents to dollars correctly', () => {
    expect(formatPrice(8000)).toBe('$80')
    expect(formatPrice(11000)).toBe('$110')
    expect(formatPrice(19000)).toBe('$190')
    expect(formatPrice(30000)).toBe('$300')
  })

  it('should handle zero correctly', () => {
    expect(formatPrice(0)).toBe('$0')
  })

  it('should handle small amounts correctly', () => {
    expect(formatPrice(100)).toBe('$1')
    expect(formatPrice(50)).toBe('$1') // Rounds up
  })
})
