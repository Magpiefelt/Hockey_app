<template>
  <div class="min-h-screen px-4 py-12 bg-dark-primary">
    <div class="container mx-auto max-w-7xl">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl md:text-4xl font-bold text-white mb-2">
          Admin <span class="gradient-text">Dashboard</span>
        </h1>
        <p class="text-lg text-slate-400">
          Overview of your business performance
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center py-20">
        <div class="animate-spin h-12 w-12 border-4 border-brand-600 border-t-transparent rounded-full"></div>
      </div>

      <!-- Dashboard Content -->
      <div v-else class="space-y-6">
        <!-- Stats Cards -->
        <div class="grid md:grid-cols-4 gap-6">
          <!-- Total Orders -->
          <div class="card p-6">
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-sm font-medium text-slate-400 uppercase">Total Orders</h3>
              <Icon name="mdi:file-document-multiple" class="w-6 h-6 text-brand-500" />
            </div>
            <p class="text-3xl font-bold text-white">{{ stats.totalOrders }}</p>
            <p class="text-sm text-slate-400 mt-1">All time</p>
          </div>

          <!-- Pending Orders -->
          <div class="card p-6">
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-sm font-medium text-slate-400 uppercase">Pending</h3>
              <Icon name="mdi:clock-outline" class="w-6 h-6 text-yellow-500" />
            </div>
            <p class="text-3xl font-bold text-white">{{ stats.pendingOrders }}</p>
            <p class="text-sm text-slate-400 mt-1">Awaiting action</p>
          </div>

          <!-- In Progress -->
          <div class="card p-6">
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-sm font-medium text-slate-400 uppercase">In Progress</h3>
              <Icon name="mdi:progress-clock" class="w-6 h-6 text-cyan-500" />
            </div>
            <p class="text-3xl font-bold text-white">{{ stats.inProgressOrders }}</p>
            <p class="text-sm text-slate-400 mt-1">Being processed</p>
          </div>

          <!-- Completed -->
          <div class="card p-6">
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-sm font-medium text-slate-400 uppercase">Completed</h3>
              <Icon name="mdi:check-circle" class="w-6 h-6 text-green-500" />
            </div>
            <p class="text-3xl font-bold text-white">{{ stats.completedOrders }}</p>
            <p class="text-sm text-slate-400 mt-1">This month</p>
          </div>
        </div>

        <!-- Recent Orders -->
        <div class="card p-6">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-bold text-white">Recent Orders</h2>
            <NuxtLink to="/admin/orders" class="text-brand-500 hover:text-brand-400 text-sm font-medium">
              View All →
            </NuxtLink>
          </div>

          <div v-if="recentOrders.length === 0" class="text-center py-12 text-slate-400">
            No recent orders
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="order in recentOrders"
              :key="order.id"
              class="flex items-center justify-between p-4 rounded-lg bg-dark-secondary border border-white/10 hover:border-brand-500/30 transition-colors cursor-pointer"
              @click="navigateTo(`/admin/orders/${order.id}`)"
            >
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-1">
                  <span class="text-white font-bold">Order #{{ order.id }}</span>
                  <UiBadge :variant="getStatusVariant(order.status)" size="sm">
                    {{ getStatusLabel(order.status) }}
                  </UiBadge>
                </div>
                <p class="text-sm text-slate-400">{{ order.name }} • {{ order.email }}</p>
              </div>
              <div class="text-right">
                <p class="text-sm text-slate-400">{{ formatDate(order.createdAt) }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <NuxtLink to="/admin/orders" class="card p-6 hover:border-brand-500/30 transition-colors">
            <Icon name="mdi:file-document-multiple" class="w-8 h-8 text-brand-500 mb-3" />
            <h3 class="text-lg font-bold text-white mb-1">Manage Orders</h3>
            <p class="text-sm text-slate-400">View and update order statuses</p>
          </NuxtLink>

          <NuxtLink to="/admin/customers" class="card p-6 hover:border-accent-500/30 transition-colors">
            <Icon name="mdi:account-multiple" class="w-8 h-8 text-accent-500 mb-3" />
            <h3 class="text-lg font-bold text-white mb-1">View Customers</h3>
            <p class="text-sm text-slate-400">Manage customer information</p>
          </NuxtLink>

          <NuxtLink to="/admin/finance" class="card p-6 hover:border-success-500/30 transition-colors">
            <Icon name="mdi:chart-line" class="w-8 h-8 text-success-500 mb-3" />
            <h3 class="text-lg font-bold text-white mb-1">Finance Reports</h3>
            <p class="text-sm text-slate-400">View revenue and analytics</p>
          </NuxtLink>

          <NuxtLink to="/admin/calendar" class="card p-6 hover:border-cyan-500/30 transition-colors">
            <Icon name="mdi:calendar-edit" class="w-8 h-8 text-cyan-500 mb-3" />
            <h3 class="text-lg font-bold text-white mb-1">Manage Calendar</h3>
            <p class="text-sm text-slate-400">Block dates and manage availability</p>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'admin'
})

const trpc = useTrpc()
const { formatDate, getStatusLabel } = useUtils()

const loading = ref(true)
const stats = ref({
  totalOrders: 0,
  pendingOrders: 0,
  inProgressOrders: 0,
  completedOrders: 0
})
const recentOrders = ref<any[]>([])

const getStatusVariant = (status: string) => {
  const variants: Record<string, 'brand' | 'warning' | 'success' | 'neutral'> = {
    submitted: 'brand',
    quoted: 'warning',
    in_progress: 'warning',
    ready: 'success',
    delivered: 'success',
    completed: 'neutral'
  }
  return variants[status] || 'neutral'
}

const fetchDashboardData = async () => {
  try {
    loading.value = true
    
    // Fetch stats
    const statsData = await trpc.admin.orders.stats.query()
    stats.value = statsData
    
    // Fetch recent orders (limit 5)
    const ordersData = await trpc.admin.orders.list.query({ limit: 5 })
    recentOrders.value = ordersData
    
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDashboardData()
})

useHead({
  title: 'Admin Dashboard - Elite Sports DJ',
  meta: [
    { name: 'description', content: 'Admin dashboard for Elite Sports DJ' }
  ]
})
</script>
