<script setup lang="ts">
/**
 * Customer Detail Drawer Component
 * Shows full customer profile with order history and communication log
 */

const props = defineProps<{
  email: string
}>()

const emit = defineEmits<{
  close: []
  viewOrder: [orderId: string]
}>()

const { $trpc } = useNuxtApp()

// State
const loading = ref(true)
const error = ref<string | null>(null)
const customer = ref<{
  id: string
  name: string
  email: string
  phone: string
  organization: string
  orderCount: number
  totalSpent: number
  firstOrderDate: string
} | null>(null)

const orders = ref<Array<{
  id: string
  status: string
  serviceType: string
  packageName: string
  eventDate: string | null
  quotedAmount: number | null
  totalAmount: number | null
  createdAt: string
}>>([])

const emails = ref<Array<{
  id: number
  subject: string
  type: string
  status: string
  sentAt: string | null
}>>([])

const activeTab = ref<'orders' | 'emails'>('orders')

// Load customer data
onMounted(async () => {
  try {
    const data = await $trpc.adminEnhancements.getCustomerDetails.query({
      email: props.email
    })
    customer.value = data.customer
    orders.value = data.orders
    emails.value = data.emails
  } catch (err: any) {
    error.value = err.message || 'Failed to load customer details'
  } finally {
    loading.value = false
  }
})

// Helpers
function formatCurrency(cents: number | null): string {
  if (!cents) return '-'
  return `$${(cents / 100).toFixed(2)}`
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'submitted': 'bg-blue-100 text-blue-800',
    'quoted': 'bg-purple-100 text-purple-800',
    'quote_viewed': 'bg-indigo-100 text-indigo-800',
    'quote_accepted': 'bg-cyan-100 text-cyan-800',
    'invoiced': 'bg-yellow-100 text-yellow-800',
    'paid': 'bg-green-100 text-green-800',
    'in_progress': 'bg-orange-100 text-orange-800',
    'completed': 'bg-emerald-100 text-emerald-800',
    'delivered': 'bg-teal-100 text-teal-800',
    'cancelled': 'bg-red-100 text-red-800'
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

function getEmailStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'sent': 'text-green-600',
    'failed': 'text-red-600',
    'bounced': 'text-orange-600'
  }
  return colors[status] || 'text-gray-600'
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex justify-end">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/30" @click="emit('close')"></div>
    
    <!-- Drawer -->
    <div class="relative w-full max-w-lg bg-white shadow-2xl overflow-hidden flex flex-col">
      <!-- Header -->
      <div class="flex-shrink-0 bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4 text-white">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-bold">Customer Profile</h2>
          <button 
            @click="emit('close')" 
            class="text-white/80 hover:text-white transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      <!-- Content -->
      <div class="flex-1 overflow-y-auto">
        <!-- Loading -->
        <div v-if="loading" class="flex items-center justify-center h-64">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
        </div>
        
        <!-- Error -->
        <div v-else-if="error" class="p-6">
          <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {{ error }}
          </div>
        </div>
        
        <!-- Customer Data -->
        <div v-else-if="customer" class="p-6">
          <!-- Customer Info Card -->
          <div class="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-5 mb-6">
            <div class="flex items-start gap-4">
              <div class="w-14 h-14 bg-cyan-500 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                {{ customer.name.charAt(0).toUpperCase() }}
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-lg font-bold text-gray-900 truncate">{{ customer.name }}</h3>
                <p class="text-gray-600 truncate">{{ customer.email }}</p>
                <p v-if="customer.phone" class="text-gray-500 text-sm">{{ customer.phone }}</p>
                <p v-if="customer.organization" class="text-gray-500 text-sm">{{ customer.organization }}</p>
              </div>
            </div>
            
            <!-- Stats -->
            <div class="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-slate-200">
              <div class="text-center">
                <p class="text-2xl font-bold text-gray-900">{{ customer.orderCount }}</p>
                <p class="text-xs text-gray-500">Orders</p>
              </div>
              <div class="text-center">
                <p class="text-2xl font-bold text-cyan-600">{{ formatCurrency(customer.totalSpent) }}</p>
                <p class="text-xs text-gray-500">Total Spent</p>
              </div>
              <div class="text-center">
                <p class="text-sm font-medium text-gray-900">{{ formatDate(customer.firstOrderDate) }}</p>
                <p class="text-xs text-gray-500">First Order</p>
              </div>
            </div>
          </div>
          
          <!-- Tabs -->
          <div class="flex border-b border-gray-200 mb-4">
            <button
              @click="activeTab = 'orders'"
              class="px-4 py-2 font-medium text-sm border-b-2 transition-colors"
              :class="activeTab === 'orders' 
                ? 'border-cyan-500 text-cyan-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'"
            >
              Orders ({{ orders.length }})
            </button>
            <button
              @click="activeTab = 'emails'"
              class="px-4 py-2 font-medium text-sm border-b-2 transition-colors"
              :class="activeTab === 'emails' 
                ? 'border-cyan-500 text-cyan-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'"
            >
              Emails ({{ emails.length }})
            </button>
          </div>
          
          <!-- Orders Tab -->
          <div v-if="activeTab === 'orders'" class="space-y-3">
            <div v-if="orders.length === 0" class="text-center py-8 text-gray-500">
              No orders found
            </div>
            
            <div 
              v-for="order in orders" 
              :key="order.id"
              @click="emit('viewOrder', order.id)"
              class="bg-white border border-gray-200 rounded-lg p-4 hover:border-cyan-300 hover:shadow-sm cursor-pointer transition-all"
            >
              <div class="flex items-start justify-between mb-2">
                <div>
                  <span class="font-medium text-gray-900">#{{ order.id }}</span>
                  <span 
                    class="ml-2 px-2 py-0.5 text-xs font-medium rounded-full"
                    :class="getStatusColor(order.status)"
                  >
                    {{ order.status.replace('_', ' ') }}
                  </span>
                </div>
                <span class="text-sm text-gray-500">{{ formatDate(order.createdAt) }}</span>
              </div>
              
              <p class="text-sm text-gray-600 mb-2">{{ order.packageName || order.serviceType }}</p>
              
              <div class="flex items-center justify-between text-sm">
                <span v-if="order.eventDate" class="text-gray-500">
                  Event: {{ formatDate(order.eventDate) }}
                </span>
                <span v-if="order.totalAmount || order.quotedAmount" class="font-medium text-cyan-600">
                  {{ formatCurrency(order.totalAmount || order.quotedAmount) }}
                </span>
              </div>
            </div>
          </div>
          
          <!-- Emails Tab -->
          <div v-if="activeTab === 'emails'" class="space-y-3">
            <div v-if="emails.length === 0" class="text-center py-8 text-gray-500">
              No emails sent
            </div>
            
            <div 
              v-for="email in emails" 
              :key="email.id"
              class="bg-white border border-gray-200 rounded-lg p-4"
            >
              <div class="flex items-start justify-between mb-1">
                <span class="font-medium text-gray-900 text-sm truncate flex-1 mr-2">
                  {{ email.subject }}
                </span>
                <span 
                  class="text-xs font-medium flex-shrink-0"
                  :class="getEmailStatusColor(email.status)"
                >
                  {{ email.status }}
                </span>
              </div>
              
              <div class="flex items-center justify-between text-xs text-gray-500">
                <span class="bg-gray-100 px-2 py-0.5 rounded">{{ email.type }}</span>
                <span>{{ email.sentAt ? formatDate(email.sentAt) : 'Pending' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Footer Actions -->
      <div v-if="customer" class="flex-shrink-0 border-t border-gray-200 px-6 py-4 bg-gray-50">
        <div class="flex gap-3">
          <button class="flex-1 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors text-sm font-medium">
            Send Email
          </button>
          <button class="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
            Create Order
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
