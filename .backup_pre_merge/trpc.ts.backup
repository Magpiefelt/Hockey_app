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
  pendingPayments: number
  revenueByService: Array<{
    service: string
    revenue: number
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
  eventTime: string | null
  eventLocation: string | null
  status: string
  totalAmount: number
  createdAt: string
  updatedAt: string
  fileCount?: number
}
