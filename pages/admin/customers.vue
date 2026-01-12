<template>
  <div class="px-6 py-8">
    <div class="container mx-auto max-w-7xl">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl md:text-4xl font-bold text-white mb-2">
          Customer <span class="gradient-text">Database</span>
        </h1>
        <p class="text-lg text-slate-400">
          Manage and view customer information
        </p>
      </div>

      <!-- Search -->
      <div class="mb-6">
        <div class="relative">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by name or email..."
            class="w-full px-4 py-3 pl-12 bg-dark-secondary border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
          />
          <Icon name="mdi:magnify" class="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center py-20">
        <div class="animate-spin h-12 w-12 border-4 border-brand-600 border-t-transparent rounded-full"></div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center">
        <div class="flex flex-col items-center gap-4">
          <Icon name="mdi:alert-circle" class="h-12 w-12 text-red-500" />
          <p class="text-red-400 font-medium">{{ error }}</p>
          <button 
            @click="fetchCustomers" 
            class="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>

      <!-- Content -->
      <div v-else>
        <!-- Stats Summary -->
        <div class="grid md:grid-cols-3 gap-6 mb-8">
          <div class="card p-6">
            <div class="flex items-center justify-between mb-2">
              <p class="text-slate-400 text-sm font-semibold uppercase">Total Customers</p>
              <div class="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center">
                <Icon name="mdi:account-group" class="h-5 w-5 text-brand-500" />
              </div>
            </div>
            <p class="text-4xl font-bold text-white">{{ filteredCustomers.length }}</p>
          </div>

          <div class="card p-6">
            <div class="flex items-center justify-between mb-2">
              <p class="text-slate-400 text-sm font-semibold uppercase">Total Orders</p>
              <div class="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Icon name="mdi:clipboard-list" class="h-5 w-5 text-purple-500" />
              </div>
            </div>
            <p class="text-4xl font-bold text-white">{{ totalOrders }}</p>
          </div>

          <div class="card p-6">
            <div class="flex items-center justify-between mb-2">
              <p class="text-slate-400 text-sm font-semibold uppercase">Total Revenue</p>
              <div class="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Icon name="mdi:currency-usd" class="h-5 w-5 text-green-500" />
              </div>
            </div>
            <p class="text-4xl font-bold text-white">${{ totalRevenue.toLocaleString() }}</p>
          </div>
        </div>

        <!-- Customers Table -->
        <div class="card overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-white/10">
                  <th class="text-left py-4 px-6 text-slate-200 font-semibold text-xs uppercase">Name</th>
                  <th class="text-left py-4 px-6 text-slate-200 font-semibold text-xs uppercase">Email</th>
                  <th class="text-left py-4 px-6 text-slate-200 font-semibold text-xs uppercase">Phone</th>
                  <th class="text-left py-4 px-6 text-slate-200 font-semibold text-xs uppercase">Organization</th>
                  <th class="text-left py-4 px-6 text-slate-200 font-semibold text-xs uppercase">Orders</th>
                  <th class="text-left py-4 px-6 text-slate-200 font-semibold text-xs uppercase">Joined</th>
                  <th class="text-left py-4 px-6 text-slate-200 font-semibold text-xs uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="filteredCustomers.length === 0">
                  <td colspan="7" class="py-12 text-center text-slate-400">
                    No customers found
                  </td>
                </tr>
                <tr 
                  v-for="customer in filteredCustomers" 
                  :key="customer.id"
                  class="border-b border-white/5 hover:bg-dark-secondary transition-colors"
                >
                  <td class="py-4 px-6 text-white font-medium">{{ customer.name }}</td>
                  <td class="py-4 px-6 text-slate-300">{{ customer.email }}</td>
                  <td class="py-4 px-6 text-slate-300">{{ customer.phone || '-' }}</td>
                  <td class="py-4 px-6 text-slate-300">{{ customer.organization || '-' }}</td>
                  <td class="py-4 px-6">
                    <button
                      v-if="customer.orderCount > 0"
                      @click="viewCustomerOrders(customer)"
                      class="px-3 py-1 rounded-full bg-brand-500/20 text-brand-400 text-xs font-semibold hover:bg-brand-500/30 transition-colors"
                    >
                      {{ customer.orderCount }} orders →
                    </button>
                    <span v-else class="px-3 py-1 rounded-full bg-slate-500/20 text-slate-400 text-xs font-semibold">
                      No orders
                    </span>
                  </td>
                  <td class="py-4 px-6 text-slate-400">{{ formatDate(customer.createdAt) }}</td>
                  <td class="py-4 px-6">
                    <div class="flex items-center gap-2">
                      <button
                        @click="viewCustomerOrders(customer)"
                        class="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                        title="View orders"
                      >
                        <Icon name="mdi:clipboard-list" class="w-4 h-4" />
                      </button>
                      <a
                        :href="`mailto:${customer.email}`"
                        class="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
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
