/**
 * Development Logging Utility
 * Provides console logging that only runs in development mode
 * Automatically stripped in production builds for better performance
 */

const isDev = process.env.NODE_ENV === 'development'

export const devLog = (...args: any[]) => {
  if (isDev) {
    console.log('[DEV]', ...args)
  }
}

export const devWarn = (...args: any[]) => {
  if (isDev) {
    console.warn('[DEV]', ...args)
  }
}

export const devError = (...args: any[]) => {
  if (isDev) {
    console.error('[DEV]', ...args)
  }
}

export const devTable = (data: any) => {
  if (isDev && console.table) {
    console.table(data)
  }
}

export const devGroup = (label: string, callback: () => void) => {
  if (isDev) {
    console.group(label)
    callback()
    console.groupEnd()
  }
}

/**
 * Performance timing utility for development
 */
export const devTime = (label: string) => {
  if (isDev) {
    console.time(label)
  }
}

export const devTimeEnd = (label: string) => {
  if (isDev) {
    console.timeEnd(label)
  }
}

/**
 * Composable for component-level debugging
 */
export const useDevLog = (componentName: string) => {
  const log = (...args: any[]) => {
    devLog(`[${componentName}]`, ...args)
  }

  const warn = (...args: any[]) => {
    devWarn(`[${componentName}]`, ...args)
  }

  const error = (...args: any[]) => {
    devError(`[${componentName}]`, ...args)
  }

  return {
    log,
    warn,
    error
  }
}
