/**
 * Redis Client Utility
 * Provides Redis connection and helper methods for caching and rate limiting
 * Falls back to in-memory storage when Redis is not available (development)
 */

import { logger } from './logger'

interface RedisClient {
  get(key: string): Promise<string | null>
  set(key: string, value: string, options?: { EX?: number; PX?: number }): Promise<void>
  del(key: string): Promise<void>
  incr(key: string): Promise<number>
  expire(key: string, seconds: number): Promise<void>
  ttl(key: string): Promise<number>
  exists(key: string): Promise<boolean>
}

// In-memory fallback for development
class InMemoryRedis implements RedisClient {
  private store = new Map<string, { value: string; expiry?: number }>()
  
  async get(key: string): Promise<string | null> {
    const item = this.store.get(key)
    if (!item) return null
    
    if (item.expiry && item.expiry < Date.now()) {
      this.store.delete(key)
      return null
    }
    
    return item.value
  }
  
  async set(key: string, value: string, options?: { EX?: number; PX?: number }): Promise<void> {
    let expiry: number | undefined
    
    if (options?.EX) {
      expiry = Date.now() + (options.EX * 1000)
    } else if (options?.PX) {
      expiry = Date.now() + options.PX
    }
    
    this.store.set(key, { value, expiry })
  }
  
  async del(key: string): Promise<void> {
    this.store.delete(key)
  }
  
  async incr(key: string): Promise<number> {
    const current = await this.get(key)
    const newValue = (parseInt(current || '0') + 1).toString()
    await this.set(key, newValue)
    return parseInt(newValue)
  }
  
  async expire(key: string, seconds: number): Promise<void> {
    const item = this.store.get(key)
    if (item) {
      item.expiry = Date.now() + (seconds * 1000)
    }
  }
  
  async ttl(key: string): Promise<number> {
    const item = this.store.get(key)
    if (!item || !item.expiry) return -1
    
    const remaining = Math.ceil((item.expiry - Date.now()) / 1000)
    return remaining > 0 ? remaining : -2
  }
  
  async exists(key: string): Promise<boolean> {
    const value = await this.get(key)
    return value !== null
  }
}

let redisClient: RedisClient | null = null
let isRealRedis = false

/**
 * Initialize Redis connection
 */
async function initRedis(): Promise<RedisClient> {
  const config = useRuntimeConfig()
  const redisUrl = config.redisUrl || process.env.REDIS_URL
  
  if (!redisUrl) {
    logger.warn('Redis URL not configured, using in-memory fallback')
    return new InMemoryRedis()
  }
  
  try {
    // Dynamically import ioredis only if Redis URL is configured
    const Redis = (await import('ioredis')).default
    const client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000)
        return delay
      }
    })
    
    // Test connection
    await client.ping()
    
    logger.info('Redis connection established', { url: redisUrl.replace(/:[^:]*@/, ':****@') })
    isRealRedis = true
    
    // Wrap ioredis client to match our interface
    return {
      async get(key: string) {
        return await client.get(key)
      },
      async set(key: string, value: string, options?: { EX?: number; PX?: number }) {
        if (options?.EX) {
          await client.set(key, value, 'EX', options.EX)
        } else if (options?.PX) {
          await client.set(key, value, 'PX', options.PX)
        } else {
          await client.set(key, value)
        }
      },
      async del(key: string) {
        await client.del(key)
      },
      async incr(key: string) {
        return await client.incr(key)
      },
      async expire(key: string, seconds: number) {
        await client.expire(key, seconds)
      },
      async ttl(key: string) {
        return await client.ttl(key)
      },
      async exists(key: string) {
        const result = await client.exists(key)
        return result === 1
      }
    }
  } catch (error: any) {
    logger.error('Failed to connect to Redis, using in-memory fallback', error)
    return new InMemoryRedis()
  }
}

/**
 * Get Redis client (singleton)
 */
export async function getRedisClient(): Promise<RedisClient> {
  if (!redisClient) {
    redisClient = await initRedis()
  }
  return redisClient
}

/**
 * Check if using real Redis (vs in-memory fallback)
 */
export function isUsingRedis(): boolean {
  return isRealRedis
}

/**
 * Rate limiting helper
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const client = await getRedisClient()
  
  const count = await client.incr(key)
  
  if (count === 1) {
    await client.expire(key, windowSeconds)
  }
  
  const ttl = await client.ttl(key)
  const remaining = Math.max(0, limit - count)
  const allowed = count <= limit
  
  return {
    allowed,
    remaining,
    resetIn: ttl > 0 ? ttl : windowSeconds
  }
}

/**
 * Cache helper with TTL
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = await getRedisClient()
  const value = await client.get(key)
  
  if (!value) return null
  
  try {
    return JSON.parse(value) as T
  } catch {
    return value as any
  }
}

/**
 * Cache set helper
 */
export async function cacheSet<T>(
  key: string,
  value: T,
  ttlSeconds?: number
): Promise<void> {
  const client = await getRedisClient()
  const serialized = typeof value === 'string' ? value : JSON.stringify(value)
  
  if (ttlSeconds) {
    await client.set(key, serialized, { EX: ttlSeconds })
  } else {
    await client.set(key, serialized)
  }
}

/**
 * Cache delete helper
 */
export async function cacheDel(key: string): Promise<void> {
  const client = await getRedisClient()
  await client.del(key)
}
