<template>
  <div class="min-h-screen px-4 py-12 bg-dark-primary">
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
          <svg class="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center py-20">
        <div class="animate-spin h-12 w-12 border-4 border-brand-600 border-t-transparent rounded-full"></div>
      </div>

      <!-- FIX Issue 12: Add error state display -->
      <div v-else-if="error" class="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center">
        <div class="flex flex-col items-center gap-4">
          <svg class="h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
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
                <svg class="h-5 w-5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <p class="text-4xl font-bold text-white">{{ filteredCustomers.length }}</p>
          </div>

          <div class="card p-6">
            <div class="flex items-center justify-between mb-2">
              <p class="text-slate-400 text-sm font-semibold uppercase">Total Orders</p>
              <div class="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <svg class="h-5 w-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
            </div>
            <p class="text-4xl font-bold text-white">{{ totalOrders }}</p>
          </div>

          <div class="card p-6">
            <div class="flex items-center justify-between mb-2">
              <p class="text-slate-400 text-sm font-semibold uppercase">Total Revenue</p>
              <div class="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <svg class="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
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
                </tr>
              </thead>
              <tbody>
                <tr v-if="filteredCustomers.length === 0">
                  <td colspan="6" class="py-12 text-center text-slate-400">
                    No customers found
                  </td>
                </tr>
                <tr 
                  v-for="customer in filteredCustomers" 
                  :key="customer.id"
                  class="border-b border-white/10 hover:bg-white/5 transition-colors"
                >
                  <td class="py-4 px-6 text-white font-medium">{{ customer.name }}</td>
                  <td class="py-4 px-6 text-slate-300">{{ customer.email }}</td>
                  <td class="py-4 px-6 text-slate-300">{{ customer.phone }}</td>
                  <td class="py-4 px-6 text-slate-300">{{ customer.organization }}</td>
                  <td class="py-4 px-6">
                    <span class="px-3 py-1 rounded-full bg-brand-500/20 text-brand-400 text-xs font-semibold">
                      {{ customer.orderCount }} orders
                    </span>
                  </td>
                  <td class="py-4 px-6 text-slate-400">{{ formatDate(customer.createdAt) }}</td>
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
  middleware: 'admin'
})

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

const fetchCustomers = async () => {
  loading.value = true
  error.value = null
  
  try {
    const response = await trpc.admin.customers.list.query()
    
    customers.value = response
    // FIX Issue 11: Backend returns both orderCount and totalOrders (same value)
    // and totalSpent in cents. Use consistent field access.
    totalOrders.value = response.reduce((sum, c) => sum + (c.orderCount || 0), 0)
    // totalSpent is returned in cents from the database, convert to dollars for display
    totalRevenue.value = response.reduce((sum, c) => sum + (c.totalSpent || 0), 0) / 100
  } catch (err: any) {
    const { handleTrpcError } = await import('~/composables/useTrpc')
    error.value = handleTrpcError(err)
    showError('Failed to load customers')
    // Error logged: 'Error loading customers:', err)
  } finally {
    loading.value = false
  }
}


onMounted(() => {
  fetchCustomers()
})
</script>
