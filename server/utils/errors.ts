/**
 * Error Handling Utilities
 * Standardized error creation and handling
 */
import { TRPCError } from '@trpc/server'

/**
 * Custom error types
 */
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class DatabaseError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message)
    this.name = 'DatabaseError'
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = 'Insufficient permissions') {
    super(message)
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends Error {
  constructor(resource: string) {
    super(`${resource} not found`)
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConflictError'
  }
}

/**
 * Convert custom errors to tRPC errors
 */
export function toTRPCError(error: any): TRPCError {
  if (error instanceof TRPCError) {
    return error
  }
  
  if (error instanceof ValidationError) {
    return new TRPCError({
      code: 'BAD_REQUEST',
      message: error.message,
      cause: error
    })
  }
  
  if (error instanceof AuthenticationError) {
    return new TRPCError({
      code: 'UNAUTHORIZED',
      message: error.message,
      cause: error
    })
  }
  
  if (error instanceof AuthorizationError) {
    return new TRPCError({
      code: 'FORBIDDEN',
      message: error.message,
      cause: error
    })
  }
  
  if (error instanceof NotFoundError) {
    return new TRPCError({
      code: 'NOT_FOUND',
      message: error.message,
      cause: error
    })
  }
  
  if (error instanceof ConflictError) {
    return new TRPCError({
      code: 'CONFLICT',
      message: error.message,
      cause: error
    })
  }
  
  if (error instanceof DatabaseError) {
    console.error('Database error:', error.originalError)
    
    // Check if it's a JSON/JSONB parsing error
    const isJsonError = error.message && (
      error.message.includes('json') || 
      error.message.includes('JSON') ||
      error.message.includes('Expected') ||
      error.message.includes('invalid input syntax')
    )
    
    // Provide user-friendly messages for common errors
    let userMessage = 'A database error occurred'
    
    if (isJsonError) {
      userMessage = 'There was a problem processing your submission. Please check your information and try again.'
    }
    
    return new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? userMessage
        : `${userMessage} (Dev: ${error.message})`,
      cause: error
    })
  }
  
  // Generic error
  console.error('Unexpected error:', error)
  return new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : error.message || 'Unknown error',
    cause: error
  })
}

/**
 * Wrap async functions with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args)
    } catch (error) {
      throw toTRPCError(error)
    }
  }) as T
}

/**
 * Log error with context
 */
export function logError(error: any, context?: Record<string, any>) {
  const timestamp = new Date().toISOString()
  const errorInfo = {
    timestamp,
    name: error.name,
    message: error.message,
    stack: error.stack,
    ...context
  }
  
  console.error('[ERROR]', JSON.stringify(errorInfo, null, 2))
}

/**
 * Assert condition or throw error
 */
export function assert(condition: any, message: string): asserts condition {
  if (!condition) {
    throw new ValidationError(message)
  }
}

/**
 * Assert resource exists or throw NotFoundError
 */
export function assertExists<T>(
  resource: T | null | undefined,
  resourceName: string
): asserts resource is T {
  if (!resource) {
    throw new NotFoundError(resourceName)
  }
}

/**
 * Assert user is authorized or throw AuthorizationError
 */
export function assertAuthorized(condition: boolean, message?: string) {
  if (!condition) {
    throw new AuthorizationError(message)
  }
}
