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
        <!-- Financial Summary -->
        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <!-- Total Revenue -->
          <div class="card p-6 bg-gradient-to-br from-brand-500/10 to-brand-600/5 border-brand-500/20">
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-sm font-medium text-slate-400 uppercase">Total Revenue</h3>
              <svg class="w-6 h-6 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p class="text-3xl font-bold text-white">{{ formatPrice(financeStats.totalRevenue) }}</p>
            <p class="text-sm text-brand-400 mt-1">All time</p>
          </div>

          <!-- MTD Revenue -->
          <div class="card p-6 bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-sm font-medium text-slate-400 uppercase">MTD Revenue</h3>
              <svg class="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <p class="text-3xl font-bold text-white">{{ formatPrice(financeStats.monthlyRevenue) }}</p>
            <p class="text-sm text-green-400 mt-1">This month</p>
          </div>

          <!-- Pending Payments -->
          <div class="card p-6 bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-sm font-medium text-slate-400 uppercase">Pending Payments</h3>
              <svg class="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p class="text-3xl font-bold text-white">{{ formatPrice(financeStats.pendingPayments) }}</p>
            <p class="text-sm text-yellow-400 mt-1">Awaiting payment</p>
          </div>

          <!-- Avg Order Value -->
          <div class="card p-6 bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-sm font-medium text-slate-400 uppercase">Avg Order Value</h3>
              <svg class="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <p class="text-3xl font-bold text-white">{{ formatPrice(avgOrderValue) }}</p>
            <p class="text-sm text-purple-400 mt-1">Per order</p>
          </div>
        </div>

        <!-- Order Stats Cards -->
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
const financeStats = ref({
  totalRevenue: 0,
  monthlyRevenue: 0,
  pendingPayments: 0,
  paidOrderCount: 0
})
const recentOrders = ref<any[]>([])

const avgOrderValue = computed(() => {
  if (financeStats.value.paidOrderCount > 0) {
    return Math.round(financeStats.value.totalRevenue / financeStats.value.paidOrderCount)
  }
  return 0
})

const formatPrice = (amount: number | null) => {
  if (amount === null || amount === undefined) return '$0'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0
  }).format(amount)
}

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
    
    // Fetch finance stats
    try {
      const financeData = await trpc.admin.finance.stats.query()
      financeStats.value = {
        totalRevenue: financeData.totalRevenue,
        monthlyRevenue: financeData.monthlyRevenue,
        pendingPayments: financeData.pendingPayments,
        paidOrderCount: financeData.paidOrderCount
      }
    } catch (financeError) {
      console.error('Failed to fetch finance data:', financeError)
      // Continue without finance data - don't block the dashboard
    }
    
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
