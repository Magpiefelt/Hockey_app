/**
 * Logging Utility
 * Structured logging for better observability
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

interface LogContext {
  [key: string]: any
}

class Logger {
  private minLevel: LogLevel
  
  constructor() {
    this.minLevel = process.env.NODE_ENV === 'production' 
      ? LogLevel.INFO 
      : LogLevel.DEBUG
  }
  
  private log(level: LogLevel, message: string, context?: LogContext) {
    if (level < this.minLevel) return
    
    const timestamp = new Date().toISOString()
    const levelName = LogLevel[level]
    
    const logEntry = {
      timestamp,
      level: levelName,
      message,
      ...context
    }
    
    const formatted = JSON.stringify(logEntry)
    
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formatted)
        break
      case LogLevel.INFO:
        console.info(formatted)
        break
      case LogLevel.WARN:
        console.warn(formatted)
        break
      case LogLevel.ERROR:
        console.error(formatted)
        break
    }
  }
  
  debug(message: string, context?: LogContext) {
    this.log(LogLevel.DEBUG, message, context)
  }
  
  info(message: string, context?: LogContext) {
    this.log(LogLevel.INFO, message, context)
  }
  
  warn(message: string, context?: LogContext) {
    this.log(LogLevel.WARN, message, context)
  }
  
  error(message: string, error?: Error, context?: LogContext) {
    this.log(LogLevel.ERROR, message, {
      ...context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    })
  }
  
  /**
   * Log database query
   */
  query(sql: string, params?: any[], duration?: number) {
    this.debug('Database query', {
      sql: sql.substring(0, 200),
      params,
      duration
    })
  }
  
  /**
   * Log API request
   */
  request(method: string, path: string, userId?: number) {
    this.info('API request', {
      method,
      path,
      userId
    })
  }
  
  /**
   * Log API response
   */
  response(method: string, path: string, statusCode: number, duration: number) {
    this.info('API response', {
      method,
      path,
      statusCode,
      duration
    })
  }
  
  /**
   * Log authentication event
   */
  auth(event: string, userId?: number, success: boolean = true) {
    this.info('Authentication event', {
      event,
      userId,
      success
    })
  }
  
  /**
   * Log business event
   */
  business(event: string, context?: LogContext) {
    this.info('Business event', {
      event,
      ...context
    })
  }
}

export const logger = new Logger()
