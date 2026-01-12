<template>
  <div class="max-w-7xl mx-auto">
    <!-- Welcome Header -->
    <div class="mb-8">
      <h1 class="text-2xl lg:text-3xl font-bold text-white mb-2">
        Welcome back, <span class="text-cyan-400">{{ userName }}</span>
      </h1>
      <p class="text-slate-400">
        Here's what's happening with your business today.
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-20">
      <div class="flex flex-col items-center gap-4">
        <div class="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
        <p class="text-slate-400">Loading dashboard...</p>
      </div>
    </div>

    <!-- Dashboard Content -->
    <div v-else class="space-y-8">
      <!-- Action Required Banner -->
      <div 
        v-if="stats.pendingOrders > 0"
        class="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <Icon name="mdi:alert-circle" class="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h3 class="font-semibold text-white">{{ stats.pendingOrders }} orders need attention</h3>
            <p class="text-sm text-slate-400">Review and respond to pending orders</p>
          </div>
        </div>
        <NuxtLink
          to="/admin/orders?status=submitted"
          class="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2"
        >
          <Icon name="mdi:eye" class="w-4 h-4" />
          View Orders
        </NuxtLink>
      </div>

      <!-- Stats Grid - Using MetricCard Component -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <UiMetricCard
          icon="mdi:currency-usd"
          color="emerald"
          :value="financeStats.totalRevenue"
          format="currency"
          title="Total Revenue"
          label="All Time"
        />
        <UiMetricCard
          icon="mdi:trending-up"
          color="cyan"
          :value="financeStats.monthlyRevenue"
          format="currency"
          title="Monthly Revenue"
          label="This Month"
        />
        <UiMetricCard
          icon="mdi:clipboard-list"
          color="blue"
          :value="stats.totalOrders"
          format="number"
          title="Total Orders"
          label="All Time"
        />
        <UiMetricCard
          icon="mdi:clock-outline"
          color="amber"
          :value="financeStats.pendingPayments"
          format="currency"
          title="Pending Payments"
          label="Awaiting"
        />
      </div>

      <!-- Main Content Grid -->
      <div class="grid lg:grid-cols-3 gap-6 lg:gap-8">
        <!-- Recent Orders - Using DataCard Component -->
        <UiDataCard
          class="lg:col-span-2"
          title="Recent Orders"
          icon="mdi:clipboard-list"
          icon-color="cyan"
          action-text="View All"
          action-to="/admin/orders"
        >
          <div v-if="recentOrders.length === 0" class="p-12 text-center">
            <div class="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <Icon name="mdi:clipboard-text-outline" class="w-8 h-8 text-slate-600" />
            </div>
            <p class="text-slate-400 mb-2">No orders yet</p>
            <p class="text-sm text-slate-500">Orders will appear here once customers submit requests</p>
          </div>

          <div v-else class="divide-y divide-slate-800">
            <div
              v-for="order in recentOrders"
              :key="order.id"
              class="p-4 lg:p-5 hover:bg-slate-800/30 transition-colors cursor-pointer group"
              @click="navigateTo(`/admin/orders/${order.id}`)"
            >
              <div class="flex items-center justify-between gap-4">
                <div class="flex items-center gap-4 min-w-0">
                  <div class="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0 group-hover:bg-slate-700 transition-colors">
                    <span class="text-sm font-bold text-slate-400">#{{ order.id }}</span>
                  </div>
                  <div class="min-w-0">
                    <p class="font-medium text-white truncate">{{ order.name }}</p>
                    <p class="text-sm text-slate-400 truncate">{{ order.email }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-3 flex-shrink-0">
                  <span 
                    :class="[
                      'px-3 py-1 text-xs font-semibold rounded-full',
                      getStatusClasses(order.status)
                    ]"
                  >
                    {{ getStatusLabel(order.status) }}
                  </span>
                  <Icon name="mdi:chevron-right" class="w-5 h-5 text-slate-600 group-hover:text-slate-400 transition-colors" />
                </div>
              </div>
            </div>
          </div>
        </UiDataCard>

        <!-- Quick Actions Sidebar -->
        <div class="space-y-6">
          <!-- Order Status Summary - Using DataCard Component -->
          <UiDataCard
            title="Order Status"
            icon="mdi:chart-donut"
            icon-color="purple"
            padding="md"
          >
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-2 h-2 rounded-full bg-amber-400"></div>
                  <span class="text-slate-300">Pending</span>
                </div>
                <span class="font-semibold text-white">{{ stats.pendingOrders }}</span>
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-2 h-2 rounded-full bg-cyan-400"></div>
                  <span class="text-slate-300">In Progress</span>
                </div>
                <span class="font-semibold text-white">{{ stats.inProgressOrders }}</span>
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-2 h-2 rounded-full bg-emerald-400"></div>
                  <span class="text-slate-300">Completed</span>
                </div>
                <span class="font-semibold text-white">{{ stats.completedOrders }}</span>
              </div>
            </div>
          </UiDataCard>

          <!-- Quick Actions - Using DataCard Component -->
          <UiDataCard
            title="Quick Actions"
            icon="mdi:lightning-bolt"
            icon-color="amber"
            padding="sm"
          >
            <div class="space-y-2">
              <NuxtLink
                to="/admin/orders"
                class="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800 transition-colors group"
              >
                <div class="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                  <Icon name="mdi:clipboard-list" class="w-5 h-5 text-cyan-400" />
                </div>
                <span class="font-medium text-slate-300 group-hover:text-white transition-colors">Manage Orders</span>
              </NuxtLink>
              
              <NuxtLink
                to="/admin/packages"
                class="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800 transition-colors group"
              >
                <div class="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                  <Icon name="mdi:package-variant" class="w-5 h-5 text-purple-400" />
                </div>
                <span class="font-medium text-slate-300 group-hover:text-white transition-colors">Edit Packages</span>
              </NuxtLink>
              
              <NuxtLink
                to="/admin/calendar"
                class="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800 transition-colors group"
              >
                <div class="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                  <Icon name="mdi:calendar-month" class="w-5 h-5 text-blue-400" />
                </div>
                <span class="font-medium text-slate-300 group-hover:text-white transition-colors">Block Dates</span>
              </NuxtLink>
              
              <NuxtLink
                to="/admin/finance"
                class="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800 transition-colors group"
              >
                <div class="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                  <Icon name="mdi:chart-line" class="w-5 h-5 text-emerald-400" />
                </div>
                <span class="font-medium text-slate-300 group-hover:text-white transition-colors">View Reports</span>
              </NuxtLink>
            </div>
          </UiDataCard>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

const authStore = useAuthStore()
const trpc = useTrpc()
const { formatDate, getStatusLabel } = useUtils()

const userName = computed(() => {
  const name = authStore.user?.name || authStore.user?.email?.split('@')[0] || 'Admin'
  return name.split(' ')[0] // First name only
})

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

const getStatusClasses = (status: string) => {
  const classes: Record<string, string> = {
    submitted: 'bg-blue-500/20 text-blue-400',
    quoted: 'bg-purple-500/20 text-purple-400',
    invoiced: 'bg-amber-500/20 text-amber-400',
    paid: 'bg-emerald-500/20 text-emerald-400',
    in_progress: 'bg-cyan-500/20 text-cyan-400',
    completed: 'bg-emerald-500/20 text-emerald-400',
    delivered: 'bg-teal-500/20 text-teal-400',
    cancelled: 'bg-red-500/20 text-red-400'
  }
  return classes[status] || 'bg-slate-500/20 text-slate-400'
}

const fetchDashboardData = async () => {
  try {
    loading.value = true
    
    // Fetch stats
    const statsData = await trpc.admin.orders.stats.query()
    stats.value = statsData
    
    // Fetch finance stats - try new finance router first, fall back to admin.finance
    try {
      const financeData = await trpc.finance.stats.query()
      financeStats.value = {
        totalRevenue: financeData.totalRevenue,
        monthlyRevenue: financeData.monthlyRevenue,
        pendingPayments: financeData.pendingPayments,
        paidOrderCount: financeData.paidOrderCount
      }
    } catch (financeError) {
      // Fall back to old endpoint
      try {
        const financeData = await trpc.admin.finance.stats.query()
        financeStats.value = {
          totalRevenue: financeData.totalRevenue,
          monthlyRevenue: financeData.monthlyRevenue,
          pendingPayments: financeData.pendingPayments,
          paidOrderCount: financeData.paidOrderCount
        }
      } catch (fallbackError) {
        console.error('Failed to fetch finance data:', fallbackError)
      }
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
  title: 'Dashboard - Elite Sports DJ Admin',
  meta: [
    { name: 'description', content: 'Admin dashboard for Elite Sports DJ' }
  ]
})
</script>
