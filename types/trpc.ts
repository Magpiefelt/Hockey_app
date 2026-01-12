/**
 * Type definitions for tRPC API responses
 * These types match the data structures returned by the backend API
 */

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  organization: string
  orderCount: number
  totalOrders: number
  totalSpent: number
  createdAt: string
}

export interface FinanceData {
  totalRevenue: number
  monthlyRevenue: number
  lastMonthRevenue: number
  yearToDateRevenue: number
  pendingPayments: number
  paidOrderCount: number
  avgOrderValue: number
  conversionRate: number
  averageDaysToPayment: number
  taxCollected: number
  revenueByService: Array<{
    service: string
    revenue: number
    orderCount: number
  }>
  topCustomers: Array<{
    name: string
    email: string
    totalSpent: number
    orderCount: number
  }>
  ordersByStatus: Array<{
    status: string
    label: string
    count: number
    value: number
    color: string
  }>
  outstandingByAge: {
    current: { count: number; amount: number }
    thirtyDays: { count: number; amount: number }
    sixtyPlus: { count: number; amount: number }
  }
  recentTransactions: Array<{
    id: number
    date: string
    customerName: string
    packageName: string
    amount: number
    status: string
    orderId: number
  }>
}

export interface Order {
  id: number
  name: string
  email: string
  phone: string
  organization: string
  serviceType: string
  packageId: number | null
  packageName: string | null
  eventDate: string | null
  eventDateTime: string | null
  eventTime: string | null
  eventLocation: string | null
  status: string
  totalAmount: number
  quotedAmount: number | null
  createdAt: string
  updatedAt: string
  fileCount?: number
}

export interface TaxSummary {
  year: number
  quarter?: number
  totals: {
    subtotal: number
    gst: number
    pst: number
    hst: number
    taxCollected: number
    total: number
    orderCount: number
  }
  byProvince: Array<{
    province: string
    subtotal: number
    gst: number
    pst: number
    hst: number
    total: number
    orderCount: number
  }>
}

export interface RevenueTrendItem {
  month: string
  monthShort: string
  revenue: number
  previousYearRevenue: number
  orderCount: number
}
