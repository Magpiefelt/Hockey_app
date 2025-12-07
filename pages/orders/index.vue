<template>
  <div class="container mx-auto px-4 py-12 max-w-6xl">
    <div class="mb-8">
      <h1 class="text-4xl md:text-5xl font-bold text-slate-900 mb-4">My Orders</h1>
      <p class="text-slate-600 text-lg">Track your service requests and download deliverables</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-20">
      <div class="flex flex-col items-center gap-4">
        <Icon name="mdi:loading" class="w-12 h-12 text-cyan-500 animate-spin" />
        <p class="text-slate-600">Loading your orders...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
      <Icon name="mdi:alert-circle" class="w-12 h-12 text-red-500 mx-auto mb-4" />
      <p class="text-red-700 mb-4">{{ error }}</p>
      <button 
        @click="fetchOrders"
        class="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-semibold"
      >
        <Icon name="mdi:refresh" class="w-4 h-4 inline-block mr-2" />
        Try Again
      </button>
    </div>

    <!-- Empty State -->
    <div v-else-if="!orders || orders.length === 0" class="text-center py-20">
      <div class="w-24 h-24 bg-cyan-50 rounded-full flex items-center justify-center mx-auto mb-6">
        <Icon name="mdi:file-document-multiple-outline" class="w-12 h-12 text-cyan-500" />
      </div>
      <h2 class="text-2xl font-bold text-slate-900 mb-2">No orders yet</h2>
      <p class="text-slate-600 mb-8 max-w-md mx-auto leading-relaxed">
        Ready to get started? Request a service and we'll send you a custom quote within 24 hours.
      </p>
      <NuxtLink 
        to="/request"
        class="inline-flex items-center gap-2 px-8 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-lg shadow-sm transition-colors"
      >
        <Icon name="mdi:plus" class="w-5 h-5" />
        Request Your First Service
      </NuxtLink>
    </div>

    <!-- Orders List -->
    <div v-else>
      <!-- Filter/Sort Bar -->
      <div class="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div class="flex items-center gap-2">
          <Icon name="mdi:filter" class="w-5 h-5 text-slate-400" />
          <select
            v-model="filterStatus"
            class="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            aria-label="Filter by status"
          >
            <option value="">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="quoted">Quoted</option>
            <option value="invoiced">Invoiced</option>
            <option value="paid">Paid</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        
        <p class="text-sm text-slate-600">
          <span class="font-semibold">{{ filteredOrders.length }}</span> 
          {{ filteredOrders.length === 1 ? 'order' : 'orders' }}
        </p>
      </div>

      <!-- Orders Grid -->
      <div class="space-y-4">
        <OrderCard
          v-for="order in filteredOrders"
          :key="order.id"
          :order="order"
          @click="navigateTo(`/orders/${order.id}`)"
          @pay="handlePayment"
        />
      </div>

      <!-- Pagination (if needed) -->
      <div v-if="filteredOrders.length === 0 && filterStatus" class="text-center py-12">
        <Icon name="mdi:filter-off" class="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <p class="text-slate-600 mb-4">No orders found with status "{{ getStatusLabel(filterStatus) }}"</p>
        <button
          @click="filterStatus = ''"
          class="text-cyan-600 hover:text-cyan-700 font-medium"
        >
          Clear filter
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default',
  middleware: 'auth'
})

const trpc = useTrpc()
const filterStatus = ref('')

// Load packages from content
const { data: packagesData } = await useAsyncData('packages', () => 
  queryContent('/packages').findOne()
)
const packages = computed(() => packagesData.value?.body || [])

const getPackageName = (packageId: string) => {
  const pkg = packages.value.find((p: any) => p.id === packageId)
  return pkg?.name || packageId
}

const ordersStore = useOrdersStore()
const { showError, showSuccess } = useNotification()

const orders = computed(() => ordersStore.orders)
const loading = computed(() => ordersStore.isLoading)
const error = computed(() => ordersStore.error)

const filteredOrders = computed(() => {
  if (!orders.value) return []
  if (!filterStatus.value) return orders.value
  return orders.value.filter((order: any) => order.status === filterStatus.value)
})

const fetchOrders = async () => {
  await ordersStore.fetchOrders()
  if (ordersStore.error) {
    showError('Failed to load orders')
  }
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'submitted': 'Submitted',
    'quoted': 'Quoted',
    'invoiced': 'Invoiced',
    'paid': 'Paid',
    'in_progress': 'In Progress',
    'completed': 'Completed',
    'delivered': 'Delivered',
    'cancelled': 'Cancelled'
  }
  return labels[status] || status
}

function handlePayment(order: any) {
  // Navigate to payment page or open payment modal
  navigateTo(`/orders/${order.id}?action=pay`)
}

// Fetch orders on mount
onMounted(() => {
  fetchOrders()
})

useHead({
  title: 'My Orders - Elite Sports DJ',
  meta: [
    { name: 'description', content: 'View and manage your service orders' }
  ]
})
</script>
