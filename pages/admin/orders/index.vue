<template>
  <div class="max-w-7xl mx-auto">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div>
        <h1 class="text-2xl lg:text-3xl font-bold text-white mb-1">Orders</h1>
        <p class="text-slate-400">Manage and track all service requests</p>
      </div>
      <div class="flex items-center gap-3">
        <div class="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl">
          <span class="text-sm text-slate-400">
            <span class="font-semibold text-white">{{ filteredOrders.length }}</span> orders
          </span>
        </div>
      </div>
    </div>

    <!-- Bulk Actions Toolbar -->
    <AdminBulkActionsToolbar
      v-if="selectedOrderIds.length > 0"
      :selected-ids="selectedOrderIds"
      :total-count="filteredOrders.length"
      @clear-selection="clearSelection"
      @select-all="selectAll"
      @action-complete="handleBulkActionComplete"
      class="mb-6"
    />

    <!-- Filters -->
    <div class="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 mb-6">
      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label class="block text-sm font-medium text-slate-400 mb-2">Status</label>
          <select
            v-model="filters.status"
            class="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
          >
            <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-slate-400 mb-2">Package</label>
          <select
            v-model="filters.packageId"
            class="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
          >
            <option v-for="opt in packageOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-slate-400 mb-2">Search</label>
          <div class="relative">
            <Icon name="mdi:magnify" class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              v-model="filters.search"
              type="text"
              placeholder="Email or name..."
              class="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
            />
          </div>
        </div>
        
        <div class="flex items-end">
          <button
            @click="resetFilters"
            class="w-full px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-xl transition-all font-medium"
          >
            Reset Filters
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-20">
      <div class="flex flex-col items-center gap-4">
        <div class="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
        <p class="text-slate-400">Loading orders...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center">
      <div class="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center mx-auto mb-4">
        <Icon name="mdi:alert-circle" class="w-8 h-8 text-red-400" />
      </div>
      <p class="text-red-400 text-lg mb-4">{{ error }}</p>
      <button 
        @click="fetchOrders"
        class="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-all"
      >
        Try Again
      </button>
    </div>

    <!-- Orders Table -->
    <div v-else class="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-slate-800 bg-slate-800/30">
              <th class="text-left py-4 px-4">
                <input
                  type="checkbox"
                  :checked="isAllSelected"
                  :indeterminate="isPartiallySelected"
                  @change="toggleSelectAll"
                  class="w-4 h-4 rounded border-slate-600 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0 bg-slate-700"
                />
              </th>
              <th 
                class="text-left py-4 px-6 text-slate-300 font-semibold text-xs uppercase tracking-wide cursor-pointer hover:text-cyan-400 transition-colors"
                @click="toggleSort('id')"
              >
                <span class="flex items-center gap-1">
                  Order ID
                  <Icon v-if="sortColumn === 'id'" :name="sortDirection === 'asc' ? 'mdi:arrow-up' : 'mdi:arrow-down'" class="w-4 h-4" />
                  <Icon v-else name="mdi:unfold-more-horizontal" class="w-4 h-4 opacity-50" />
                </span>
              </th>
              <th 
                class="text-left py-4 px-6 text-slate-300 font-semibold text-xs uppercase tracking-wide cursor-pointer hover:text-cyan-400 transition-colors"
                @click="toggleSort('name')"
              >
                <span class="flex items-center gap-1">
                  Customer
                  <Icon v-if="sortColumn === 'name'" :name="sortDirection === 'asc' ? 'mdi:arrow-up' : 'mdi:arrow-down'" class="w-4 h-4" />
                  <Icon v-else name="mdi:unfold-more-horizontal" class="w-4 h-4 opacity-50" />
                </span>
              </th>
              <th class="text-left py-4 px-6 text-slate-300 font-semibold text-xs uppercase tracking-wide">Package</th>
              <th 
                class="text-left py-4 px-6 text-slate-300 font-semibold text-xs uppercase tracking-wide cursor-pointer hover:text-cyan-400 transition-colors"
                @click="toggleSort('status')"
              >
                <span class="flex items-center gap-1">
                  Status
                  <Icon v-if="sortColumn === 'status'" :name="sortDirection === 'asc' ? 'mdi:arrow-up' : 'mdi:arrow-down'" class="w-4 h-4" />
                  <Icon v-else name="mdi:unfold-more-horizontal" class="w-4 h-4 opacity-50" />
                </span>
              </th>
              <th class="text-left py-4 px-6 text-slate-300 font-semibold text-xs uppercase tracking-wide">Amount</th>
              <th 
                class="text-left py-4 px-6 text-slate-300 font-semibold text-xs uppercase tracking-wide cursor-pointer hover:text-cyan-400 transition-colors"
                @click="toggleSort('createdAt')"
              >
                <span class="flex items-center gap-1">
                  Date
                  <Icon v-if="sortColumn === 'createdAt'" :name="sortDirection === 'asc' ? 'mdi:arrow-up' : 'mdi:arrow-down'" class="w-4 h-4" />
                  <Icon v-else name="mdi:unfold-more-horizontal" class="w-4 h-4 opacity-50" />
                </span>
              </th>
              <th class="text-left py-4 px-6 text-slate-300 font-semibold text-xs uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="paginatedOrders.length === 0">
              <td colspan="8" class="py-16 text-center">
                <div class="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
                  <Icon name="mdi:clipboard-text-outline" class="w-8 h-8 text-slate-600" />
                </div>
                <p class="text-slate-400 mb-1">No orders found</p>
                <p class="text-sm text-slate-500">Try adjusting your filters or check back later</p>
              </td>
            </tr>
            <tr 
              v-for="order in paginatedOrders" 
              :key="order.id"
              class="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group cursor-pointer"
              :class="{ 'bg-cyan-500/5': selectedOrderIds.includes(order.id) }"
              @click="navigateTo(`/admin/orders/${order.id}`)"
            >
              <td class="py-4 px-4" @click.stop>
                <input
                  type="checkbox"
                  :checked="selectedOrderIds.includes(order.id)"
                  @change="toggleOrderSelection(order.id)"
                  class="w-4 h-4 rounded border-slate-600 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0 bg-slate-700"
                />
              </td>
              <td class="py-4 px-6">
                <span class="font-mono text-sm font-semibold text-white">#{{ order.id }}</span>
              </td>
              <td class="py-4 px-6">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <span class="text-sm font-bold text-slate-400">{{ getInitials(order.name) }}</span>
                  </div>
                  <div class="min-w-0">
                    <p class="font-medium text-white truncate">{{ order.name }}</p>
                    <p class="text-sm text-slate-400 truncate">{{ order.email }}</p>
                  </div>
                </div>
              </td>
              <td class="py-4 px-6">
                <span class="text-slate-300">{{ getPackageName(order) }}</span>
              </td>
              <td class="py-4 px-6">
                <span 
                  :class="[
                    'px-3 py-1 text-xs font-semibold rounded-full',
                    getStatusBadge(order.status)
                  ]"
                >
                  {{ getStatusLabel(order.status) }}
                </span>
              </td>
              <td class="py-4 px-6">
                <span v-if="order.quotedAmount" class="text-white font-semibold">
                  {{ formatPrice(order.quotedAmount) }}
                </span>
                <span v-else class="text-slate-500">—</span>
              </td>
              <td class="py-4 px-6 text-slate-400">
                {{ formatDate(order.createdAt) }}
              </td>
              <td class="py-4 px-6" @click.stop>
                <div class="flex items-center gap-2 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                  <button
                    @click="openEditModal(order)"
                    class="p-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-lg transition-colors"
                    title="Quick edit"
                  >
                    <Icon name="mdi:pencil" class="w-4 h-4" />
                  </button>
                  <button
                    @click="navigateTo(`/admin/orders/${order.id}`)"
                    class="p-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
                    title="View details"
                  >
                    <Icon name="mdi:eye" class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-800">
        <div class="text-slate-400 text-sm">
          Showing <span class="font-medium text-white">{{ (currentPage - 1) * pageSize + 1 }}</span> to <span class="font-medium text-white">{{ Math.min(currentPage * pageSize, totalOrders) }}</span> of <span class="font-medium text-white">{{ totalOrders }}</span> orders
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="goToPage(1)"
            :disabled="currentPage === 1"
            class="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-300 hover:text-white rounded-lg transition-all"
            title="First page"
          >
            <Icon name="mdi:chevron-double-left" class="w-4 h-4" />
          </button>
          <button
            @click="goToPage(currentPage - 1)"
            :disabled="currentPage === 1"
            class="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-300 hover:text-white rounded-lg transition-all text-sm font-medium flex items-center gap-1"
          >
            <Icon name="mdi:chevron-left" class="w-4 h-4" />
            Previous
          </button>
          
          <!-- Page Numbers -->
          <div class="hidden sm:flex items-center gap-1">
            <template v-for="page in visiblePages" :key="page">
              <button
                v-if="page !== '...'"
                @click="goToPage(page as number)"
                :class="[
                  'w-10 h-10 rounded-lg text-sm font-medium transition-all',
                  currentPage === page 
                    ? 'bg-cyan-500 text-white' 
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                ]"
              >
                {{ page }}
              </button>
              <span v-else class="px-2 text-slate-500">...</span>
            </template>
          </div>
          
          <button
            @click="goToPage(currentPage + 1)"
            :disabled="currentPage === totalPages"
            class="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-300 hover:text-white rounded-lg transition-all text-sm font-medium flex items-center gap-1"
          >
            Next
            <Icon name="mdi:chevron-right" class="w-4 h-4" />
          </button>
          <button
            @click="goToPage(totalPages)"
            :disabled="currentPage === totalPages"
            class="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-300 hover:text-white rounded-lg transition-all"
            title="Last page"
          >
            <Icon name="mdi:chevron-double-right" class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Info Section -->
    <div class="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6">
      <div class="flex gap-3">
        <Icon name="mdi:information" class="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div class="text-sm text-slate-300 space-y-2">
          <p>
            <strong class="text-white">Tip:</strong> Click on any row to view the full order details. Use the checkboxes to select multiple orders for bulk actions.
          </p>
          <p>
            Orders are sorted by date (newest first) by default. Click column headers to change sorting.
          </p>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <AdminOrderEditModal
      v-if="editingOrder"
      v-model="showEditModal"
      :order="editingOrder"
      @saved="handleOrderSaved"
    />
  </div>
</template>

<script setup lang="ts">
import type { Order } from '~/types/trpc'

definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

const { showError, showSuccess } = useNotification()
const { formatDate } = useUtils()
const { getStatusLabel, getStatusBadge } = useOrderStatus()
const trpc = useTrpc()
const route = useRoute()

const loading = ref(true)
const error = ref<string | null>(null)
const orders = ref<Order[]>([])
const packages = ref<any[]>([])
const currentPage = ref(1)
const pageSize = 20
const totalOrders = ref(0)
const totalPages = computed(() => Math.ceil(totalOrders.value / pageSize))

// Selection state for bulk actions
const selectedOrderIds = ref<number[]>([])

const isAllSelected = computed(() => {
  return filteredOrders.value.length > 0 && 
         selectedOrderIds.value.length === filteredOrders.value.length
})

const isPartiallySelected = computed(() => {
  return selectedOrderIds.value.length > 0 && 
         selectedOrderIds.value.length < filteredOrders.value.length
})

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedOrderIds.value = []
  } else {
    selectedOrderIds.value = filteredOrders.value.map(o => o.id)
  }
}

const toggleOrderSelection = (orderId: number) => {
  const index = selectedOrderIds.value.indexOf(orderId)
  if (index === -1) {
    selectedOrderIds.value.push(orderId)
  } else {
    selectedOrderIds.value.splice(index, 1)
  }
}

const clearSelection = () => {
  selectedOrderIds.value = []
}

const selectAll = () => {
  selectedOrderIds.value = filteredOrders.value.map(o => o.id)
}

const handleBulkActionComplete = (action: string, results: { success: number[]; failed: { id: number; error: string }[] }) => {
  const successCount = results.success.length
  const failedCount = results.failed.length
  
  if (successCount > 0) {
    showSuccess(`${action}: ${successCount} order(s) updated successfully`)
  }
  if (failedCount > 0) {
    showError(`${action}: ${failedCount} order(s) failed`)
  }
  
  // Refresh orders and clear selection
  fetchOrders()
  clearSelection()
}

const filters = ref({
  status: '',
  packageId: '',
  search: ''
})

// Sorting state
type SortColumn = 'id' | 'name' | 'email' | 'status' | 'createdAt'
type SortDirection = 'asc' | 'desc'
const sortColumn = ref<SortColumn>('createdAt')
const sortDirection = ref<SortDirection>('desc')

const toggleSort = (column: SortColumn) => {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumn.value = column
    sortDirection.value = 'asc'
  }
}

const statusOptions = [
  { label: 'All Statuses', value: '' },
  { label: 'Submitted', value: 'submitted' },
  { label: 'Quoted', value: 'quoted' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Ready', value: 'ready' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Cancelled', value: 'cancelled' }
]

const packageOptions = computed(() => [
  { label: 'All Packages', value: '' },
  ...packages.value.map(pkg => ({ label: pkg.name, value: pkg.id }))
])


// Server handles filtering and pagination — client only applies local sorting
const filteredOrders = computed(() => {
  let result = [...orders.value]

  // Client-side package filter (not sent to server)
  if (filters.value.packageId) {
    result = result.filter(o => o.packageId === filters.value.packageId)
  }

  // Apply sorting
  result.sort((a, b) => {
    let aVal: any
    let bVal: any

    switch (sortColumn.value) {
      case 'id':
        aVal = a.id
        bVal = b.id
        break
      case 'name':
        aVal = a.name?.toLowerCase() || ''
        bVal = b.name?.toLowerCase() || ''
        break
      case 'email':
        aVal = a.email?.toLowerCase() || ''
        bVal = b.email?.toLowerCase() || ''
        break
      case 'status':
        aVal = a.status || ''
        bVal = b.status || ''
        break
      case 'createdAt':
        aVal = new Date(a.createdAt || 0).getTime()
        bVal = new Date(b.createdAt || 0).getTime()
        break
      default:
        return 0
    }

    if (aVal < bVal) return sortDirection.value === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDirection.value === 'asc' ? 1 : -1
    return 0
  })

  return result
})

// Server already paginates — use filteredOrders directly
const paginatedOrders = computed(() => filteredOrders.value)

// Visible page numbers for pagination
const visiblePages = computed(() => {
  const pages: (number | string)[] = []
  const total = totalPages.value
  const current = currentPage.value
  
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    pages.push(1)
    if (current > 3) pages.push('...')
    
    const start = Math.max(2, current - 1)
    const end = Math.min(total - 1, current + 1)
    
    for (let i = start; i <= end; i++) pages.push(i)
    
    if (current < total - 2) pages.push('...')
    pages.push(total)
  }
  
  return pages
})

// When filters change, reset to page 1 and re-fetch from server
watch(() => [filters.value.status, filters.value.search], () => {
  currentPage.value = 1
  selectedOrderIds.value = []
  fetchOrders()
})

// When page changes, re-fetch from server
watch(currentPage, () => {
  selectedOrderIds.value = []
  fetchOrders()
})

const fetchPackages = async () => {
  try {
    const response = await trpc.packages.getAll.query()
    packages.value = response
  } catch (err: any) {
    console.error('Failed to load packages:', err)
  }
}

const fetchOrders = async () => {
  loading.value = true
  error.value = null
  
  try {
    const queryParams: { 
      status?: string; 
      search?: string;
      page?: number;
      pageSize?: number;
    } = {
      page: currentPage.value,
      pageSize: pageSize
    }
    if (filters.value.status) queryParams.status = filters.value.status
    if (filters.value.search) queryParams.search = filters.value.search
    
    const response = await trpc.admin.orders.list.query(queryParams)
    
    // Handle both old (array) and new ({ orders, total }) response shapes
    if (Array.isArray(response)) {
      orders.value = response
      totalOrders.value = response.length
    } else {
      orders.value = response.orders
      totalOrders.value = response.total
    }
  } catch (err: any) {
    const { handleTrpcError } = await import('~/composables/useTrpc')
    error.value = handleTrpcError(err)
    showError('Failed to load orders')
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
  currentPage.value = 1
  selectedOrderIds.value = []
}

// Get package name from order data
const getPackageName = (order: any) => {
  // First try to get from the joined package data
  if (order.packageName) return order.packageName
  
  // Then try to match from loaded packages
  if (order.packageId && packages.value.length > 0) {
    const pkg = packages.value.find(p => p.id === order.packageId || p.slug === order.packageId)
    if (pkg) return pkg.name
  }
  
  // Fall back to serviceType or default
  return order.serviceType || 'No Package'
}

// Get initials from name
const getInitials = (name: string) => {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

// Format price
const formatPrice = (cents: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0
  }).format(cents / 100)
}

// Add goToPage function for pagination
const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

// Edit modal state
const showEditModal = ref(false)
const editingOrder = ref<Order | null>(null)

function openEditModal(order: Order) {
  editingOrder.value = order
  showEditModal.value = true
}

function handleOrderSaved(data: any) {
  // Update the order in the list
  const index = orders.value.findIndex(o => o.id === editingOrder.value?.id)
  if (index !== -1) {
    orders.value[index] = {
      ...orders.value[index],
      ...data
    }
  }
  
  // Refresh orders to get latest data
  fetchOrders()
}

onMounted(async () => {
  // Honour URL query params from global search or dashboard links
  if (route.query.search) {
    filters.value.search = String(route.query.search)
  }
  if (route.query.status) {
    filters.value.status = String(route.query.status)
  }

  // Fetch both packages and orders in parallel
  await Promise.all([
    fetchPackages(),
    fetchOrders()
  ])
})

useHead({
  title: 'Orders Management - Elite Sports DJ Admin',
  meta: [
    { name: 'description', content: 'Manage all service orders' }
  ]
})
</script>
