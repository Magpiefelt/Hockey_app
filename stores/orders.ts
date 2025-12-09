import { defineStore } from 'pinia'

interface Order {
  id: string
  name: string
  email: string
  packageId: string | null
  serviceType: string
  sportType: string | null
  status: string
  quotedAmount: number | null
  totalAmount: number | null
  createdAt: string
  updatedAt: string | null
}

interface OrderDetail {
  order: {
    id: string
    name: string
    email: string
    phone: string
    packageId: string | null
    serviceType: string
    sportType: string | null
    status: string
    quotedAmount: number | null
    totalAmount: number | null
    requirementsText: string | null
    adminNotes: string | null
    createdAt: string
    updatedAt: string | null
  }
  files: Array<{
    id: string
    filename: string
    fileSize: number
    kind: string
    url: string
    createdAt: string
  }>
}

interface OrdersState {
  orders: Order[]
  currentOrder: OrderDetail | null
  isLoading: boolean
  error: string | null
}

export const useOrdersStore = defineStore('orders', {
  state: (): OrdersState => ({
    orders: [],
    currentOrder: null,
    isLoading: false,
    error: null
  }),

  getters: {
    /**
     * Get orders by status
     */
    getOrdersByStatus: (state) => (status: string) => {
      return state.orders.filter(order => order.status === status)
    },

    /**
     * Get order count
     */
    orderCount: (state) => state.orders.length,

    /**
     * Check if orders are loaded
     */
    hasOrders: (state) => state.orders.length > 0,

    /**
     * Get pending orders count
     */
    pendingOrdersCount: (state) => {
      return state.orders.filter(order => 
        ['submitted', 'pending'].includes(order.status)
      ).length
    }
  },

  actions: {
    /**
     * Fetch all orders for the authenticated user
     */
    async fetchOrders() {
      this.isLoading = true
      this.error = null

      try {
        const { $client } = useNuxtApp()
        
        // Call tRPC orders.list query
        const orders = await $client.orders.list.query()
        
        this.orders = orders
        
        return {
          success: true,
          orders
        }
      } catch (error: any) {
        console.error('Failed to fetch orders:', error)
        
        this.error = error.message || 'Failed to load orders. Please try again.'
        
        return {
          success: false,
          error: this.error
        }
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Fetch a single order by ID
     */
    async fetchOrderById(orderId: string | number) {
      this.isLoading = true
      this.error = null

      try {
        const { $client } = useNuxtApp()
        
        // Call tRPC orders.get query
        const orderData = await $client.orders.get.query({ id: orderId })
        
        this.currentOrder = orderData
        
        return {
          success: true,
          order: orderData
        }
      } catch (error: any) {
        console.error('Failed to fetch order:', error)
        
        this.error = error.message || 'Failed to load order details. Please try again.'
        this.currentOrder = null
        
        return {
          success: false,
          error: this.error
        }
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Create a new order
     */
    async createOrder(orderData: {
      name: string
      email: string
      phone: string
      organization?: string
      serviceType: string
      sportType?: string
      eventDate?: string
      message?: string
      packageId?: string
      requirementsJson?: any
    }) {
      this.isLoading = true
      this.error = null

      try {
        const { $client } = useNuxtApp()
        
        // Call tRPC orders.create mutation
        const result = await $client.orders.create.mutate(orderData)
        
        // Refresh orders list after creation
        await this.fetchOrders()
        
        return {
          success: true,
          orderId: result.id,
          message: result.message
        }
      } catch (error: any) {
        console.error('Failed to create order:', error)
        
        this.error = error.message || 'Failed to submit order. Please try again.'
        
        return {
          success: false,
          error: this.error
        }
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Clear current order
     */
    clearCurrentOrder() {
      this.currentOrder = null
      this.error = null
    },

    /**
     * Clear all orders
     */
    clearOrders() {
      this.orders = []
      this.currentOrder = null
      this.error = null
    },

    /**
     * Reset error state
     */
    clearError() {
      this.error = null
    }
  }
})
