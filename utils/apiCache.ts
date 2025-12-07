/**
 * API Caching Layer
 * Provides intelligent caching for API responses
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class APICache {
  private cache = new Map<string, CacheEntry<any>>()
  private defaultTTL = 5 * 60 * 1000 // 5 minutes

  set<T>(key: string, data: T, ttl = this.defaultTTL) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined
    
    if (!entry) {
      return null
    }

    // Check if cache has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  has(key: string): boolean {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return false
    }

    // Check if cache has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  clear() {
    this.cache.clear()
  }

  delete(key: string) {
    this.cache.delete(key)
  }

  // Clear expired entries
  cleanup() {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    }
  }
}

// Create singleton instance
const apiCache = new APICache()

// Auto cleanup every 10 minutes
if (process.client) {
  setInterval(() => {
    apiCache.cleanup()
  }, 10 * 60 * 1000)
}

/**
 * Composable for cached API calls
 */
export const useCachedAPI = () => {
  const fetchWithCache = async <T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> => {
    // Check cache first
    const cached = apiCache.get<T>(key)
    if (cached) {
      return cached
    }

    // Fetch and cache
    const data = await fetchFn()
    apiCache.set(key, data, ttl)
    return data
  }

  const invalidateCache = (key: string) => {
    apiCache.delete(key)
  }

  const clearCache = () => {
    apiCache.clear()
  }

  return {
    fetchWithCache,
    invalidateCache,
    clearCache
  }
}

export { apiCache }
