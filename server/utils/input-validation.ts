/**
 * Input Validation Utility
 * Provides additional validation and sanitization for user inputs
 */

import { z } from 'zod'

/**
 * Email validation schema
 */
export const emailSchema = z.string()
  .email('Invalid email address')
  .min(5, 'Email too short')
  .max(120, 'Email too long')
  .toLowerCase()
  .trim()

/**
 * Phone number validation schema (flexible format)
 */
export const phoneSchema = z.string()
  .min(10, 'Phone number too short')
  .max(30, 'Phone number too long')
  .regex(/^[\d\s\-\+\(\)]+$/, 'Invalid phone number format')
  .trim()

/**
 * Name validation schema
 */
export const nameSchema = z.string()
  .min(2, 'Name too short')
  .max(100, 'Name too long')
  .regex(/^[a-zA-Z\s\-\'\.]+$/, 'Name contains invalid characters')
  .trim()

/**
 * URL validation schema
 */
export const urlSchema = z.string()
  .url('Invalid URL')
  .max(2048, 'URL too long')

/**
 * Positive integer validation
 */
export const positiveIntSchema = z.number()
  .int('Must be an integer')
  .positive('Must be positive')

/**
 * Money amount validation (in cents)
 */
export const moneySchema = z.number()
  .int('Amount must be in cents (integer)')
  .nonnegative('Amount cannot be negative')
  .max(999999999, 'Amount too large')

/**
 * Date validation (ISO string)
 */
export const dateSchema = z.string()
  .datetime('Invalid date format')
  .or(z.date())

/**
 * Sanitize HTML to prevent XSS (strict - escapes all HTML)
 * Use this for user input that should not contain any HTML
 */
export function sanitizeHtmlStrict(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Sanitize SQL input (basic - use parameterized queries instead!)
 */
export function sanitizeSql(input: string): string {
  return input
    .replace(/['";\\]/g, '')
    .trim()
}

/**
 * Validate and sanitize file name
 */
export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9\-\_\.]/g, '_')
    .replace(/\.{2,}/g, '.')
    .substring(0, 255)
}

/**
 * Check if string contains only alphanumeric characters
 */
export function isAlphanumeric(str: string): boolean {
  return /^[a-zA-Z0-9]+$/.test(str)
}

/**
 * Validate slug format
 */
export const slugSchema = z.string()
  .min(1, 'Slug cannot be empty')
  .max(100, 'Slug too long')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format')

/**
 * Validate IP address
 */
export function isValidIp(ip: string): boolean {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
  const ipv6Regex = /^([0-9a-f]{1,4}:){7}[0-9a-f]{1,4}$/i
  
  if (ipv4Regex.test(ip)) {
    return ip.split('.').every(part => parseInt(part) <= 255)
  }
  
  return ipv6Regex.test(ip)
}

/**
 * Rate limiting key generator
 */
export function generateRateLimitKey(
  identifier: string,
  action: string
): string {
  return `ratelimit:${action}:${identifier}`
}

/**
 * Validate JSON structure
 */
export function isValidJson(str: string): boolean {
  try {
    JSON.parse(str)
    return true
  } catch {
    return false
  }
}

/**
 * Common validation schemas for forms
 */
export const commonSchemas = {
  email: emailSchema,
  phone: phoneSchema,
  name: nameSchema,
  url: urlSchema,
  positiveInt: positiveIntSchema,
  money: moneySchema,
  date: dateSchema,
  slug: slugSchema
}
