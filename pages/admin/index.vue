<template>
  <div class="min-h-screen px-4 py-12 bg-dark-primary">
    <div class="container mx-auto max-w-7xl">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl md:text-4xl font-bold text-white mb-2">
          Orders <span class="gradient-text">Management</span>
        </h1>
        <p class="text-lg text-slate-400">
          View and manage all service requests
        </p>
      </div>

      <!-- Filters -->
      <div class="card p-6 mb-6">
        <div class="grid md:grid-cols-4 gap-4">
          <UiSelect
            v-model="filters.status"
            label="Status"
            :options="statusOptions"
          />
          
          <UiSelect
            v-model="filters.packageId"
            label="Package"
            :options="packageOptions"
          />
          
          <UiInput
            v-model="filters.search"
            label="Search"
            type="text"
            placeholder="Email or name..."
          />
          
          <div class="flex items-end">
            <UiButton
              @click="resetFilters"
              variant="outline"
              full-width
            >
              Reset Filters
            </UiButton>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center py-20">
        <div class="animate-spin h-12 w-12 border-4 border-brand-600 border-t-transparent rounded-full"></div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="p-6 rounded-xl border border-error-500/30 bg-error-500/10 text-center">
        <p class="text-error-400 text-lg mb-4">{{ error }}</p>
        <UiButton 
          @click="fetchOrders"
          variant="outline"
        >
          Try Again
        </UiButton>
      </div>

      <!-- Orders Table -->
      <div v-else class="card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-white/10">
                <th class="text-left py-4 px-6 text-slate-400 font-semibold text-xs uppercase">Order ID</th>
                <th class="text-left py-4 px-6 text-slate-400 font-semibold text-xs uppercase">Customer</th>
                <th class="text-left py-4 px-6 text-slate-400 font-semibold text-xs uppercase">Email</th>
                <th class="text-left py-4 px-6 text-slate-400 font-semibold text-xs uppercase">Package</th>
                <th class="text-left py-4 px-6 text-slate-400 font-semibold text-xs uppercase">Status</th>
                <th class="text-left py-4 px-6 text-slate-400 font-semibold text-xs uppercase">Date</th>
                <th class="text-left py-4 px-6 text-slate-400 font-semibold text-xs uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="filteredOrders.length === 0">
                <td colspan="7" class="py-12 text-center text-slate-400">
                  No orders found
                </td>
              </tr>
              <tr 
                v-for="order in filteredOrders" 
                :key="order.id"
                class="border-b border-white/5 hover:bg-dark-secondary transition-colors cursor-pointer"
                @click="navigateTo(`/admin/orders/${order.id}`)"
              >
                <td class="py-4 px-6 text-white font-mono text-sm font-semibold">#{{ order.id }}</td>
                <td class="py-4 px-6 text-white font-medium">{{ order.name }}</td>
                <td class="py-4 px-6 text-slate-300">{{ order.email }}</td>
                <td class="py-4 px-6 text-slate-300">{{ getPackageName(order.packageId) }}</td>
                <td class="py-4 px-6">
                  <UiBadge
                    :variant="getStatusVariant(order.status)"
                    size="sm"
                  >
                    {{ getStatusLabel(order.status) }}
                  </UiBadge>
                </td>
                <td class="py-4 px-6 text-slate-400">{{ formatDate(order.createdAt) }}</td>
                <td class="py-4 px-6">
                  <span class="text-brand-400 hover:text-brand-300 font-semibold transition-colors inline-flex items-center gap-1">
                    View
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="flex items-center justify-between px-6 py-4 border-t border-white/10">
          <div class="text-slate-400 text-sm">
            Showing {{ (currentPage - 1) * pageSize + 1 }} to {{ Math.min(currentPage * pageSize, totalOrders) }} of {{ totalOrders }} orders
          </div>
          <div class="flex gap-2">
            <UiButton
              @click="currentPage--"
              :disabled="currentPage === 1"
              variant="outline"
              size="sm"
            >
              Previous
            </UiButton>
            <UiButton
              @click="currentPage++"
              :disabled="currentPage === totalPages"
              variant="outline"
              size="sm"
            >
              Next
            </UiButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Order } from '~/types/trpc'

definePageMeta({
  middleware: 'admin'
})

const { showError } = useNotification()
const { getStatusColor, getStatusLabel, formatDate } = useUtils()
const trpc = useTrpc()

const loading = ref(true)
const error = ref<string | null>(null)
const orders = ref<Order[]>([])
const packages = ref<any[]>([])
const currentPage = ref(1)
const pageSize = 20
const totalOrders = ref(0)
const totalPages = computed(() => Math.ceil(totalOrders.value / pageSize))

const filters = ref({
  status: '',
  packageId: '',
  search: ''
})

const statusOptions = [
  { label: 'All Statuses', value: '' },
  { label: 'Submitted', value: 'submitted' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Ready', value: 'ready' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Cancelled', value: 'cancelled' }
]

const packageOptions = computed(() => [
  { label: 'All Packages', value: '' },
  ...packages.value.map(pkg => ({ label: pkg.name, value: pkg.id }))
])

const getStatusVariant = (status: string) => {
  const variants: Record<string, 'brand' | 'warning' | 'success' | 'neutral'> = {
    pending: 'brand',
    in_progress: 'warning',
    ready: 'success',
    completed: 'neutral'
  }
  return variants[status] || 'neutral'
}

const filteredOrders = computed(() => {
  let result = orders.value

  if (filters.value.status) {
    result = result.filter(o => o.status === filters.value.status)
  }

  if (filters.value.packageId) {
    result = result.filter(o => o.packageId === filters.value.packageId)
  }

  if (filters.value.search) {
    const search = filters.value.search.toLowerCase()
    result = result.filter(o => 
      o.email.toLowerCase().includes(search) || 
      o.name.toLowerCase().includes(search)
    )
  }

  return result
})

const fetchOrders = async () => {
  loading.value = true
  error.value = null
  
  try {
    const queryParams: { status?: string; search?: string } = {}
    if (filters.value.status) queryParams.status = filters.value.status
    if (filters.value.search) queryParams.search = filters.value.search
    
    const response = await trpc.admin.orders.list.query(queryParams)
    
    orders.value = response
    totalOrders.value = response.length
  } catch (err: any) {
    const { handleTrpcError } = await import('~/composables/useTrpc')
    error.value = handleTrpcError(err)
    showError('Failed to load orders')
    // Error logged: 'Error loading orders:', err)
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  filters.value = {
    status: '',
    packageId: '',
    search: ''
  }
}

const getPackageName = (packageId) => {
  const pkg = packages.value.find(p => p.id === packageId)
  return pkg ? pkg.name : 'Unknown'
}

onMounted(() => {
  fetchOrders()
})

useHead({
  title: 'Orders Management - Elite Sports DJ Admin',
  meta: [
    { name: 'description', content: 'Manage all service orders' }
  ]
})
</script>
