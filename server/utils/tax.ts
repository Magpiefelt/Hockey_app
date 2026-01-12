/**
 * Tax Calculation Utility
 * Handles Canadian tax calculations for different provinces
 */

export interface TaxRates {
  gst: number  // Federal GST (5%)
  pst: number  // Provincial Sales Tax (varies)
  hst: number  // Harmonized Sales Tax (replaces GST+PST in some provinces)
}

export interface TaxBreakdown {
  subtotal: number      // Amount before tax (in cents)
  gst: number           // GST amount (in cents)
  pst: number           // PST amount (in cents)
  hst: number           // HST amount (in cents)
  totalTax: number      // Total tax (in cents)
  total: number         // Total with tax (in cents)
  effectiveRate: number // Effective tax rate as decimal
}

// Canadian province tax rates (as of 2024)
// Note: These should be verified and updated as tax rates change
const PROVINCE_TAX_RATES: Record<string, TaxRates> = {
  // GST only provinces (5% GST)
  'AB': { gst: 0.05, pst: 0, hst: 0 },      // Alberta
  'NT': { gst: 0.05, pst: 0, hst: 0 },      // Northwest Territories
  'NU': { gst: 0.05, pst: 0, hst: 0 },      // Nunavut
  'YT': { gst: 0.05, pst: 0, hst: 0 },      // Yukon
  
  // GST + PST provinces
  'BC': { gst: 0.05, pst: 0.07, hst: 0 },   // British Columbia (7% PST)
  'MB': { gst: 0.05, pst: 0.07, hst: 0 },   // Manitoba (7% RST)
  'SK': { gst: 0.05, pst: 0.06, hst: 0 },   // Saskatchewan (6% PST)
  
  // HST provinces (combined federal + provincial)
  'ON': { gst: 0, pst: 0, hst: 0.13 },      // Ontario (13% HST)
  'NB': { gst: 0, pst: 0, hst: 0.15 },      // New Brunswick (15% HST)
  'NL': { gst: 0, pst: 0, hst: 0.15 },      // Newfoundland & Labrador (15% HST)
  'NS': { gst: 0, pst: 0, hst: 0.15 },      // Nova Scotia (15% HST)
  'PE': { gst: 0, pst: 0, hst: 0.15 },      // Prince Edward Island (15% HST)
  
  // Quebec (GST + QST - QST is calculated on subtotal only)
  'QC': { gst: 0.05, pst: 0.09975, hst: 0 } // Quebec (9.975% QST)
}

// Default province if not specified
const DEFAULT_PROVINCE = 'AB'

/**
 * Get tax rates for a province
 */
export function getTaxRates(province: string): TaxRates {
  const upperProvince = province.toUpperCase()
  return PROVINCE_TAX_RATES[upperProvince] || PROVINCE_TAX_RATES[DEFAULT_PROVINCE]
}

/**
 * Calculate tax breakdown for an amount
 * @param amountCents - The subtotal amount in cents
 * @param province - Two-letter province code (e.g., 'AB', 'ON', 'BC')
 * @returns Tax breakdown with all components
 */
export function calculateTax(amountCents: number, province: string = DEFAULT_PROVINCE): TaxBreakdown {
  const rates = getTaxRates(province)
  const subtotal = Math.round(amountCents)
  
  let gst = 0
  let pst = 0
  let hst = 0
  
  if (rates.hst > 0) {
    // HST provinces - single combined tax
    hst = Math.round(subtotal * rates.hst)
  } else {
    // GST + PST provinces
    gst = Math.round(subtotal * rates.gst)
    pst = Math.round(subtotal * rates.pst)
  }
  
  const totalTax = gst + pst + hst
  const total = subtotal + totalTax
  const effectiveRate = subtotal > 0 ? totalTax / subtotal : 0
  
  return {
    subtotal,
    gst,
    pst,
    hst,
    totalTax,
    total,
    effectiveRate
  }
}

/**
 * Calculate tax from a total amount (reverse calculation)
 * @param totalCents - The total amount including tax in cents
 * @param province - Two-letter province code
 * @returns Tax breakdown
 */
export function calculateTaxFromTotal(totalCents: number, province: string = DEFAULT_PROVINCE): TaxBreakdown {
  const rates = getTaxRates(province)
  const totalRate = rates.gst + rates.pst + rates.hst
  
  // Calculate subtotal from total: subtotal = total / (1 + rate)
  const subtotal = Math.round(totalCents / (1 + totalRate))
  
  return calculateTax(subtotal, province)
}

/**
 * Get province name from code
 */
export function getProvinceName(code: string): string {
  const names: Record<string, string> = {
    'AB': 'Alberta',
    'BC': 'British Columbia',
    'MB': 'Manitoba',
    'NB': 'New Brunswick',
    'NL': 'Newfoundland and Labrador',
    'NS': 'Nova Scotia',
    'NT': 'Northwest Territories',
    'NU': 'Nunavut',
    'ON': 'Ontario',
    'PE': 'Prince Edward Island',
    'QC': 'Quebec',
    'SK': 'Saskatchewan',
    'YT': 'Yukon'
  }
  return names[code.toUpperCase()] || code
}

/**
 * Get all supported provinces
 */
export function getSupportedProvinces(): Array<{ code: string; name: string; rates: TaxRates }> {
  return Object.entries(PROVINCE_TAX_RATES).map(([code, rates]) => ({
    code,
    name: getProvinceName(code),
    rates
  }))
}

/**
 * Format tax breakdown for display
 */
export function formatTaxBreakdown(breakdown: TaxBreakdown): {
  subtotal: string
  gst: string
  pst: string
  hst: string
  totalTax: string
  total: string
  effectiveRate: string
} {
  const format = (cents: number) => 
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100)
  
  return {
    subtotal: format(breakdown.subtotal),
    gst: format(breakdown.gst),
    pst: format(breakdown.pst),
    hst: format(breakdown.hst),
    totalTax: format(breakdown.totalTax),
    total: format(breakdown.total),
    effectiveRate: `${(breakdown.effectiveRate * 100).toFixed(2)}%`
  }
}
