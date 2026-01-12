<template>
  <div class="max-w-7xl mx-auto">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div>
        <h1 class="text-2xl lg:text-3xl font-bold text-white mb-1">Customers</h1>
        <p class="text-slate-400">Manage and view customer information</p>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-sm text-slate-400">
          <span class="font-semibold text-white">{{ filteredCustomers.length }}</span> customers
        </span>
      </div>
    </div>

    <!-- Search -->
    <div class="mb-6">
      <div class="relative max-w-md">
        <Icon name="mdi:magnify" class="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by name or email..."
          class="w-full px-4 py-3 pl-12 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
        />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-20">
      <div class="flex flex-col items-center gap-4">
        <div class="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
        <p class="text-slate-400">Loading customers...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center">
      <div class="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center mx-auto mb-4">
        <Icon name="mdi:alert-circle" class="w-8 h-8 text-red-400" />
      </div>
      <p class="text-red-400 text-lg mb-4">{{ error }}</p>
      <button 
        @click="fetchCustomers" 
        class="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-all"
      >
        Try Again
      </button>
    </div>

    <!-- Content -->
    <div v-else>
      <!-- Stats Summary -->
      <div class="grid sm:grid-cols-3 gap-4 lg:gap-6 mb-8">
        <div class="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 lg:p-6 hover:border-slate-700 transition-all group">
          <div class="flex items-center justify-between mb-4">
            <div class="w-11 h-11 rounded-xl bg-cyan-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Icon name="mdi:account-group" class="h-6 w-6 text-cyan-400" />
            </div>
            <span class="text-xs font-medium text-slate-500 uppercase tracking-wide">Total</span>
          </div>
          <p class="text-2xl lg:text-3xl font-bold text-white mb-1">{{ filteredCustomers.length }}</p>
          <p class="text-sm text-slate-400">Customers</p>
        </div>

        <div class="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 lg:p-6 hover:border-slate-700 transition-all group">
          <div class="flex items-center justify-between mb-4">
            <div class="w-11 h-11 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Icon name="mdi:clipboard-list" class="h-6 w-6 text-purple-400" />
            </div>
            <span class="text-xs font-medium text-slate-500 uppercase tracking-wide">Total</span>
          </div>
          <p class="text-2xl lg:text-3xl font-bold text-white mb-1">{{ totalOrders }}</p>
          <p class="text-sm text-slate-400">Orders</p>
        </div>

        <div class="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 lg:p-6 hover:border-slate-700 transition-all group">
          <div class="flex items-center justify-between mb-4">
            <div class="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Icon name="mdi:currency-usd" class="h-6 w-6 text-emerald-400" />
            </div>
            <span class="text-xs font-medium text-slate-500 uppercase tracking-wide">Total</span>
          </div>
          <p class="text-2xl lg:text-3xl font-bold text-white mb-1">${{ totalRevenue.toLocaleString() }}</p>
          <p class="text-sm text-slate-400">Revenue</p>
        </div>
      </div>

      <!-- Customers Table -->
      <div class="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-slate-800 bg-slate-800/30">
                <th class="text-left py-4 px-6 text-slate-300 font-semibold text-xs uppercase tracking-wide">Name</th>
                <th class="text-left py-4 px-6 text-slate-300 font-semibold text-xs uppercase tracking-wide">Email</th>
                <th class="text-left py-4 px-6 text-slate-300 font-semibold text-xs uppercase tracking-wide">Phone</th>
                <th class="text-left py-4 px-6 text-slate-300 font-semibold text-xs uppercase tracking-wide">Organization</th>
                <th class="text-left py-4 px-6 text-slate-300 font-semibold text-xs uppercase tracking-wide">Orders</th>
                <th class="text-left py-4 px-6 text-slate-300 font-semibold text-xs uppercase tracking-wide">Joined</th>
                <th class="text-left py-4 px-6 text-slate-300 font-semibold text-xs uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="filteredCustomers.length === 0">
                <td colspan="7" class="py-16 text-center">
                  <div class="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
                    <Icon name="mdi:account-search" class="w-8 h-8 text-slate-600" />
                  </div>
                  <p class="text-slate-400 mb-1">No customers found</p>
                  <p class="text-sm text-slate-500">Try adjusting your search query</p>
                </td>
              </tr>
              <tr 
                v-for="customer in filteredCustomers" 
                :key="customer.id"
                class="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group"
              >
                <td class="py-4 px-6">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                      <span class="text-white text-sm font-bold">{{ customer.name?.charAt(0)?.toUpperCase() || '?' }}</span>
                    </div>
                    <span class="text-white font-medium">{{ customer.name }}</span>
                  </div>
                </td>
                <td class="py-4 px-6 text-slate-300">{{ customer.email }}</td>
                <td class="py-4 px-6 text-slate-400">{{ customer.phone || '-' }}</td>
                <td class="py-4 px-6 text-slate-400">{{ customer.organization || '-' }}</td>
                <td class="py-4 px-6">
                  <button
                    v-if="customer.orderCount > 0"
                    @click="viewCustomerOrders(customer)"
                    class="px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 text-xs font-semibold hover:bg-cyan-500/20 transition-colors flex items-center gap-1"
                  >
                    {{ customer.orderCount }} orders
                    <Icon name="mdi:arrow-right" class="w-3 h-3" />
                  </button>
                  <span v-else class="px-3 py-1.5 rounded-lg bg-slate-700/50 text-slate-500 text-xs font-semibold">
                    No orders
                  </span>
                </td>
                <td class="py-4 px-6 text-slate-400 text-sm">{{ formatDate(customer.createdAt) }}</td>
                <td class="py-4 px-6">
                  <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      @click="viewCustomerOrders(customer)"
                      class="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
                      title="View orders"
                    >
                      <Icon name="mdi:clipboard-list" class="w-4 h-4" />
                    </button>
                    <a
                      :href="`mailto:${customer.email}`"
                      class="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
                      title="Send email"
                    >
                      <Icon name="mdi:email" class="w-4 h-4" />
                    </a>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Customer } from '~/types/trpc'

definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

const router = useRouter()
const { showError } = useNotification()
const { formatDate } = useUtils()
const trpc = useTrpc()

const loading = ref(true)
const error = ref<string | null>(null)
const customers = ref<Customer[]>([])
const totalOrders = ref(0)
const totalRevenue = ref(0)
const searchQuery = ref('')

const filteredCustomers = computed(() => {
  if (!searchQuery.value) return customers.value
  
  const search = searchQuery.value.toLowerCase()
  return customers.value.filter(c => 
    c.name.toLowerCase().includes(search) || 
    c.email.toLowerCase().includes(search)
  )
})

const viewCustomerOrders = (customer: Customer) => {
  // Navigate to orders page filtered by customer email
  router.push({
    path: '/admin/orders',
    query: { search: customer.email }
  })
}

const fetchCustomers = async () => {
  loading.value = true
  error.value = null
  
  try {
    const response = await trpc.admin.customers.list.query()
    
    customers.value = response
    totalOrders.value = response.reduce((sum, c) => sum + (c.orderCount || 0), 0)
    totalRevenue.value = response.reduce((sum, c) => sum + (c.totalSpent || 0), 0) / 100
  } catch (err: any) {
    const { handleTrpcError } = await import('~/composables/useTrpc')
    error.value = handleTrpcError(err)
    showError('Failed to load customers')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchCustomers()
})

useHead({
  title: 'Customers - Elite Sports DJ Admin',
  meta: [
    { name: 'description', content: 'Manage customer information' }
  ]
})
</script>
