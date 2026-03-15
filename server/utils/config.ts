/**
 * Shared server configuration helpers.
 *
 * Centralises runtime-config + env-var lookups so every module uses the same
 * fallback chain and default values.
 */

const DEFAULT_APP_URL = 'https://elitesportsdj.ca'

export function getAppBaseUrl(): string {
  try {
    const config = useRuntimeConfig()
    return config.public.appBaseUrl || process.env.APP_URL || DEFAULT_APP_URL
  } catch {
    return process.env.APP_URL || DEFAULT_APP_URL
  }
}

export function getAdminEmail(): string {
  return process.env.ADMIN_EMAIL || 'admin@elitesportsdj.ca'
}

export function getBusinessName(): string {
  return process.env.BUSINESS_NAME || 'Elite Sports DJ'
}

export function getSupportEmail(): string {
  return process.env.SUPPORT_EMAIL || 'info@elitesportsdj.ca'
}
