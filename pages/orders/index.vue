<template>
  <div class="min-h-screen bg-dark-primary px-4 py-12">
    <div class="container mx-auto max-w-6xl">
      <div class="mb-8">
        <h1 class="text-4xl md:text-5xl font-bold text-white mb-4">My <span class="gradient-text">Orders</span></h1>
        <p class="text-slate-400 text-lg">Track your service requests and download deliverables</p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center py-20">
        <div class="flex flex-col items-center gap-4">
          <Icon name="mdi:loading" class="w-12 h-12 text-cyan-500 animate-spin" />
          <p class="text-slate-400">Loading your orders...</p>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
        <Icon name="mdi:alert-circle" class="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p class="text-red-400 mb-4">{{ error }}</p>
        <button 
          @click="fetchOrders"
          class="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-semibold"
        >
          <Icon name="mdi:refresh" class="w-4 h-4 inline-block mr-2" />
          Try Again
        </button>
      </div>

      <!-- Empty State -->
      <div v-else-if="!orders || orders.length === 0" class="card p-12 text-center">
        <Icon name="mdi:file-document-multiple-outline" class="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <h3 class="text-xl font-bold text-white mb-2">No orders yet</h3>
        <p class="text-slate-400 mb-6">Ready to get started? Request a service and we'll send you a custom quote within 24 hours.</p>
        <NuxtLink
          to="/request"
          class="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-lg transition-all duration-200"
        >
          <Icon name="mdi:plus" class="w-5 h-5 mr-2" />
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
              class="px-4 py-2 rounded-lg border border-white/10 bg-dark-secondary text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
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
          
          <p class="text-sm text-slate-400">
            <span class="font-semibold text-white">{{ filteredOrders.length }}</span> 
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

        <!-- Filtered Empty State -->
        <div v-if="filteredOrders.length === 0 && filterStatus" class="card p-12 text-center">
          <Icon name="mdi:filter-off" class="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 class="text-xl font-bold text-white mb-2">No matching orders</h3>
          <p class="text-slate-400 mb-6">No orders found with status '{{ getStatusLabel(filterStatus) }}'</p>
          <button
            @click="filterStatus = ''"
            class="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors"
          >
            Clear filter
          </button>
        </div>
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

// Load packages from database via tRPC
const { data: packagesData } = await useAsyncData('packages', () => 
  trpc.packages.getAll.query()
)
const packages = computed(() => packagesData.value || [])

const getPackageName = (packageId: string) => {
  const pkg = packages.value.find((p: any) => p.id === packageId || p.slug === packageId)
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

<style scoped>
.gradient-text {
  background: linear-gradient(to right, rgb(96, 165, 250), rgb(34, 211, 238));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.card {
  background: linear-gradient(to bottom right, rgb(15, 23, 42), rgb(30, 41, 59));
  border-radius: 1rem;
  border: 2px solid rgba(59, 130, 246, 0.2);
}
</style>
