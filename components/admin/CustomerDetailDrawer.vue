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

const trpc = useTrpc()

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
    const data = await trpc.adminEnhancements.getCustomerDetails.query({
      email: props.email
    })
    customer.value = data.customer
    orders.value = data.orders
    emails.value = data.emails
  } catch (err: any) {
    const { handleTrpcError } = await import('~/composables/useTrpc')
    error.value = handleTrpcError(err)
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

function getStatusVariant(status: string): 'brand' | 'success' | 'warning' | 'error' | 'neutral' {
  const variants: Record<string, 'brand' | 'success' | 'warning' | 'error' | 'neutral'> = {
    'submitted': 'brand',
    'quoted': 'warning',
    'quote_viewed': 'brand',
    'quote_accepted': 'success',
    'invoiced': 'warning',
    'paid': 'success',
    'in_progress': 'warning',
    'completed': 'success',
    'delivered': 'success',
    'cancelled': 'error'
  }
  return variants[status] || 'neutral'
}

function getEmailStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'sent': 'text-success-400',
    'failed': 'text-error-400',
    'bounced': 'text-warning-400'
  }
  return colors[status] || 'text-slate-400'
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex justify-end">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/50" @click="emit('close')"></div>
    
    <!-- Drawer -->
    <div class="relative w-full max-w-lg bg-dark-secondary border-l border-white/10 shadow-2xl overflow-hidden flex flex-col">
      <!-- Header -->
      <div class="flex-shrink-0 bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4 border-b border-white/10">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-bold text-white">Customer Profile</h2>
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
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
        </div>
        
        <!-- Error -->
        <div v-else-if="error" class="p-6">
          <div class="bg-error-500/10 border border-error-500/30 text-error-400 px-4 py-3 rounded-lg">
            {{ error }}
          </div>
        </div>
        
        <!-- Customer Data -->
        <div v-else-if="customer" class="p-6">
          <!-- Customer Info Card -->
          <div class="bg-dark-tertiary border border-white/10 rounded-xl p-5 mb-6">
            <div class="flex items-start gap-4">
              <div class="w-14 h-14 bg-gradient-to-br from-brand-500 to-accent-500 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                {{ customer.name.charAt(0).toUpperCase() }}
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-lg font-bold text-white truncate">{{ customer.name }}</h3>
                <p class="text-slate-400 truncate">{{ customer.email }}</p>
                <p v-if="customer.phone" class="text-slate-500 text-sm">{{ customer.phone }}</p>
                <p v-if="customer.organization" class="text-slate-500 text-sm">{{ customer.organization }}</p>
              </div>
            </div>
            
            <!-- Stats -->
            <div class="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-white/10">
              <div class="text-center">
                <p class="text-2xl font-bold text-white">{{ customer.orderCount }}</p>
                <p class="text-xs text-slate-400">Orders</p>
              </div>
              <div class="text-center">
                <p class="text-2xl font-bold text-brand-400">{{ formatCurrency(customer.totalSpent) }}</p>
                <p class="text-xs text-slate-400">Total Spent</p>
              </div>
              <div class="text-center">
                <p class="text-sm font-medium text-white">{{ formatDate(customer.firstOrderDate) }}</p>
                <p class="text-xs text-slate-400">First Order</p>
              </div>
            </div>
          </div>
          
          <!-- Tabs -->
          <div class="flex border-b border-white/10 mb-4">
            <button
              @click="activeTab = 'orders'"
              class="px-4 py-2 font-medium text-sm border-b-2 transition-colors"
              :class="activeTab === 'orders' 
                ? 'border-brand-500 text-brand-400' 
                : 'border-transparent text-slate-400 hover:text-white'"
            >
              Orders ({{ orders.length }})
            </button>
            <button
              @click="activeTab = 'emails'"
              class="px-4 py-2 font-medium text-sm border-b-2 transition-colors"
              :class="activeTab === 'emails' 
                ? 'border-brand-500 text-brand-400' 
                : 'border-transparent text-slate-400 hover:text-white'"
            >
              Emails ({{ emails.length }})
            </button>
          </div>
          
          <!-- Orders Tab -->
          <div v-if="activeTab === 'orders'" class="space-y-3">
            <div v-if="orders.length === 0" class="text-center py-8 text-slate-400">
              No orders found
            </div>
            
            <div 
              v-for="order in orders" 
              :key="order.id"
              @click="emit('viewOrder', order.id)"
              class="bg-dark-tertiary border border-white/10 rounded-lg p-4 hover:border-brand-500/30 cursor-pointer transition-all"
            >
              <div class="flex items-start justify-between mb-2">
                <div class="flex items-center gap-2">
                  <span class="font-medium text-white">#{{ order.id }}</span>
                  <UiBadge :variant="getStatusVariant(order.status)" size="sm">
                    {{ order.status.replace('_', ' ') }}
                  </UiBadge>
                </div>
                <span class="text-sm text-slate-400">{{ formatDate(order.createdAt) }}</span>
              </div>
              
              <p class="text-sm text-slate-400 mb-2">{{ order.packageName || order.serviceType }}</p>
              
              <div class="flex items-center justify-between text-sm">
                <span v-if="order.eventDate" class="text-slate-500">
                  Event: {{ formatDate(order.eventDate) }}
                </span>
                <span v-if="order.totalAmount || order.quotedAmount" class="font-medium text-brand-400">
                  {{ formatCurrency(order.totalAmount || order.quotedAmount) }}
                </span>
              </div>
            </div>
          </div>
          
          <!-- Emails Tab -->
          <div v-if="activeTab === 'emails'" class="space-y-3">
            <div v-if="emails.length === 0" class="text-center py-8 text-slate-400">
              No emails sent
            </div>
            
            <div 
              v-for="email in emails" 
              :key="email.id"
              class="bg-dark-tertiary border border-white/10 rounded-lg p-4"
            >
              <div class="flex items-start justify-between mb-1">
                <span class="font-medium text-white text-sm truncate flex-1 mr-2">
                  {{ email.subject }}
                </span>
                <span 
                  class="text-xs font-medium flex-shrink-0"
                  :class="getEmailStatusColor(email.status)"
                >
                  {{ email.status }}
                </span>
              </div>
              
              <div class="flex items-center justify-between text-xs text-slate-500">
                <span class="bg-slate-700 px-2 py-0.5 rounded text-slate-300">{{ email.type }}</span>
                <span>{{ email.sentAt ? formatDate(email.sentAt) : 'Pending' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Footer Actions -->
      <div v-if="customer" class="flex-shrink-0 border-t border-white/10 px-6 py-4 bg-dark-tertiary">
        <div class="flex gap-3">
          <UiButton variant="primary" full-width size="sm">
            Send Email
          </UiButton>
          <UiButton variant="outline" size="sm">
            Create Order
          </UiButton>
        </div>
      </div>
    </div>
  </div>
</template>
