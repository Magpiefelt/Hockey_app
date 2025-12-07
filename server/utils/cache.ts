/**
 * Caching Utility
 * Provides a distributed caching layer using Redis for expensive operations.
 */

import { getRedisClient } from './redis'
import { logger } from './logger'

interface CacheOptions {
  ttl?: number // Time to live in seconds
  prefix?: string
}

/**
 * Get a value from the cache.
 * @param key The cache key.
 * @param options Cache options like prefix.
 * @returns The cached value, or null if not found.
 */
export async function getCached<T>(
  key: string,
  options: CacheOptions = {}
): Promise<T | null> {
  const redis = getRedisClient()
  if (!redis) return null

  const fullKey = options.prefix ? `${options.prefix}:${key}` : key

  try {
    const cached = await redis.get(fullKey)
    if (cached) {
      logger.debug('Cache hit', { key: fullKey })
      return JSON.parse(cached) as T
    }

    logger.debug('Cache miss', { key: fullKey })
    return null
  } catch (error: any) {
    logger.error('Cache get error', error, { key: fullKey })
    return null
  }
}

/**
 * Set a value in the cache.
 * @param key The cache key.
 * @param value The value to cache.
 * @param options Cache options like TTL and prefix.
 * @returns True if the value was set, false otherwise.
 */
export async function setCached<T>(
  key: string,
  value: T,
  options: CacheOptions = {}
): Promise<boolean> {
  const redis = getRedisClient()
  if (!redis) return false

  const fullKey = options.prefix ? `${options.prefix}:${key}` : key
  const ttl = options.ttl || 3600 // Default 1 hour

  try {
    const serialized = JSON.stringify(value)
    await redis.set(fullKey, serialized, 'EX', ttl)
    logger.debug('Cache set', { key: fullKey, ttl })
    return true
  } catch (error: any) {
    logger.error('Cache set error', error, { key: fullKey })
    return false
  }
}

/**
 * Delete a value from the cache.
 * @param key The cache key to delete.
 * @param options Cache options like prefix.
 * @returns True if the key was deleted, false otherwise.
 */
export async function deleteCached(
  key: string,
  options: CacheOptions = {}
): Promise<boolean> {
  const redis = getRedisClient()
  if (!redis) return false

  const fullKey = options.prefix ? `${options.prefix}:${key}` : key

  try {
    await redis.del(fullKey)
    logger.debug('Cache deleted', { key: fullKey })
    return true
  } catch (error: any) {
    logger.error('Cache delete error', error, { key: fullKey })
    return false
  }
}

/**
 * Retrieves a value from the cache. If the value is not found, it computes the value using the provided function, caches it, and then returns it.
 * @param key The cache key.
 * @param compute A function that computes the value if it's not in the cache.
 * @param options Cache options like TTL and prefix.
 * @returns The cached or computed value.
 */
export async function getOrCompute<T>(
  key: string,
  compute: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const cached = await getCached<T>(key, options)
  if (cached !== null) {
    return cached
  }

  const value = await compute()
  await setCached(key, value, options)

  return value
}

/**
 * Invalidates cache entries that match a given pattern.
 * @param pattern The glob-style pattern to match keys against.
 * @param options Cache options like prefix.
 * @returns The number of keys that were invalidated.
 */
export async function invalidatePattern(
  pattern: string,
  options: CacheOptions = {}
): Promise<number> {
  const redis = getRedisClient()
  if (!redis) return 0

  const fullPattern = options.prefix ? `${options.prefix}:${pattern}` : pattern

  try {
    const keys = await redis.keys(fullPattern)
    if (keys.length > 0) {
      await redis.del(...keys)
      logger.info('Cache pattern invalidated', { pattern: fullPattern, count: keys.length })
      return keys.length
    }
    return 0
  } catch (error: any) {
    logger.error('Cache invalidation error', error, { pattern: fullPattern })
    return 0
  }
}
