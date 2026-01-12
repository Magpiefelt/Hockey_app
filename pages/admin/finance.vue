<template>
  <div class="max-w-7xl mx-auto">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div>
        <h1 class="text-2xl lg:text-3xl font-bold text-white mb-1">Finance Dashboard</h1>
        <p class="text-slate-400">Revenue metrics and payment analytics</p>
      </div>
      <div class="flex items-center gap-3">
        <button
          @click="fetchMetrics"
          :disabled="loading"
          class="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-xl transition-all font-medium flex items-center gap-2"
        >
          <Icon :name="loading ? 'mdi:loading' : 'mdi:refresh'" :class="loading ? 'w-4 h-4 animate-spin' : 'w-4 h-4'" />
          Refresh
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-20">
      <div class="flex flex-col items-center gap-4">
        <div class="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
        <p class="text-slate-400">Loading financial data...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center">
      <div class="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center mx-auto mb-4">
        <Icon name="mdi:alert-circle" class="w-8 h-8 text-red-400" />
      </div>
      <p class="text-red-400 text-lg mb-4">{{ error }}</p>
      <button 
        @click="fetchMetrics"
        class="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-all"
      >
        Try Again
      </button>
    </div>

    <!-- Dashboard Content -->
    <div v-else-if="metrics" class="space-y-6">
      <!-- Key Metrics Grid -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <!-- Total Revenue -->
        <div class="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 lg:p-6 hover:border-slate-700 transition-all group">
          <div class="flex items-center justify-between mb-4">
            <div class="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Icon name="mdi:currency-usd" class="w-6 h-6 text-emerald-400" />
            </div>
            <span class="text-xs font-medium text-slate-500 uppercase tracking-wide">All Time</span>
          </div>
          <p class="text-2xl lg:text-3xl font-bold text-white mb-1">{{ formatPrice(metrics.totalRevenue) }}</p>
          <p class="text-sm text-slate-400">Total Revenue</p>
        </div>

        <!-- Monthly Revenue -->
        <div class="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 lg:p-6 hover:border-slate-700 transition-all group">
          <div class="flex items-center justify-between mb-4">
            <div class="w-11 h-11 rounded-xl bg-cyan-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Icon name="mdi:trending-up" class="w-6 h-6 text-cyan-400" />
            </div>
            <span class="text-xs font-medium text-slate-500 uppercase tracking-wide">This Month</span>
          </div>
          <p class="text-2xl lg:text-3xl font-bold text-white mb-1">{{ formatPrice(metrics.mtdRevenue) }}</p>
          <p class="text-sm text-slate-400">Monthly Revenue</p>
        </div>

        <!-- Average Order Value -->
        <div class="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 lg:p-6 hover:border-slate-700 transition-all group">
          <div class="flex items-center justify-between mb-4">
            <div class="w-11 h-11 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Icon name="mdi:calculator" class="w-6 h-6 text-purple-400" />
            </div>
            <span class="text-xs font-medium text-slate-500 uppercase tracking-wide">Per Order</span>
          </div>
          <p class="text-2xl lg:text-3xl font-bold text-white mb-1">{{ formatPrice(metrics.avgOrderValue) }}</p>
          <p class="text-sm text-slate-400">Avg Order Value</p>
        </div>

        <!-- Pending Payments -->
        <div class="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 lg:p-6 hover:border-slate-700 transition-all group">
          <div class="flex items-center justify-between mb-4">
            <div class="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Icon name="mdi:clock-outline" class="w-6 h-6 text-amber-400" />
            </div>
            <span class="text-xs font-medium text-slate-500 uppercase tracking-wide">Awaiting</span>
          </div>
          <p class="text-2xl lg:text-3xl font-bold text-white mb-1">{{ formatPrice(metrics.pendingPayments) }}</p>
          <p class="text-sm text-slate-400">Pending Payments</p>
        </div>
      </div>

      <!-- Revenue by Package -->
      <div class="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
        <div class="p-6 border-b border-slate-800">
          <h2 class="text-xl font-bold text-white flex items-center gap-2">
            <Icon name="mdi:chart-bar" class="w-6 h-6 text-cyan-400" />
            Revenue by Package
          </h2>
        </div>
        <div class="p-6">
          <div v-if="metrics.revenueByPackage.length === 0" class="text-center py-8">
            <div class="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mx-auto mb-3">
              <Icon name="mdi:chart-bar" class="w-6 h-6 text-slate-600" />
            </div>
            <p class="text-slate-400">No revenue data available</p>
          </div>
          <div v-else class="space-y-4">
            <div v-for="pkg in metrics.revenueByPackage" :key="pkg.name" class="group">
              <div class="flex items-center justify-between mb-2">
                <span class="text-white font-medium">{{ pkg.name }}</span>
                <span class="text-slate-300 font-semibold">{{ formatPrice(pkg.revenue) }}</span>
              </div>
              <div class="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div 
                  class="h-2.5 rounded-full transition-all duration-500 group-hover:opacity-80"
                  :class="pkg.color"
                  :style="{ width: `${Math.max((pkg.revenue / metrics.totalRevenue) * 100, 2)}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Transactions -->
      <div class="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
        <div class="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 class="text-xl font-bold text-white flex items-center gap-2">
            <Icon name="mdi:receipt-text" class="w-6 h-6 text-emerald-400" />
            Recent Transactions
          </h2>
          <NuxtLink 
            v-if="metrics.recentTransactions.length > 0"
            to="/admin/orders"
            class="text-sm text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 transition-colors"
          >
            View All
            <Icon name="mdi:arrow-right" class="w-4 h-4" />
          </NuxtLink>
        </div>

        <div v-if="metrics.recentTransactions.length === 0" class="p-12 text-center">
          <div class="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
            <Icon name="mdi:receipt-text-outline" class="w-8 h-8 text-slate-600" />
          </div>
          <p class="text-slate-400 mb-1">No recent transactions</p>
          <p class="text-sm text-slate-500">Transactions will appear here once payments are processed</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-slate-800 bg-slate-800/30">
                <th class="text-left py-4 px-6 text-slate-300 font-semibold text-xs uppercase tracking-wide">Date</th>
                <th class="text-left py-4 px-6 text-slate-300 font-semibold text-xs uppercase tracking-wide">Customer</th>
                <th class="text-left py-4 px-6 text-slate-300 font-semibold text-xs uppercase tracking-wide">Package</th>
                <th class="text-left py-4 px-6 text-slate-300 font-semibold text-xs uppercase tracking-wide">Amount</th>
                <th class="text-left py-4 px-6 text-slate-300 font-semibold text-xs uppercase tracking-wide">Status</th>
                <th class="text-left py-4 px-6 text-slate-300 font-semibold text-xs uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="transaction in metrics.recentTransactions" 
                :key="transaction.id"
                class="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group"
              >
                <td class="py-4 px-6 text-slate-400">{{ formatDate(transaction.date) }}</td>
                <td class="py-4 px-6 text-white font-medium">{{ transaction.customerName }}</td>
                <td class="py-4 px-6 text-slate-300">{{ transaction.packageName }}</td>
                <td class="py-4 px-6 text-white font-semibold">{{ formatCurrency(transaction.amount) }}</td>
                <td class="py-4 px-6">
                  <span 
                    :class="[
                      'px-3 py-1 text-xs font-semibold rounded-full',
                      getTransactionStatusClasses(transaction.status)
                    ]"
                  >
                    {{ transaction.status.toUpperCase() }}
                  </span>
                </td>
                <td class="py-4 px-6">
                  <NuxtLink 
                    :to="`/admin/orders/${transaction.orderId}`"
                    class="text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100"
                  >
                    View Order
                    <Icon name="mdi:arrow-right" class="w-4 h-4" />
                  </NuxtLink>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Info Section -->
    <div class="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6">
      <div class="flex gap-3">
        <Icon name="mdi:information" class="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div class="text-sm text-slate-300 space-y-2">
          <p>
            <strong class="text-white">Note:</strong> Revenue figures are based on completed payments processed through Stripe.
          </p>
          <p>
            Pending payments represent quotes that have been accepted but not yet paid.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FinanceData } from '~/types/trpc'

definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

const { showError } = useNotification()
const { formatDate } = useUtils()
const trpc = useTrpc()
const router = useRouter()

const loading = ref(true)
const error = ref<string | null>(null)
const financeData = ref<FinanceData | null>(null)

const metrics = computed(() => {
  if (!financeData.value) return null
  
  return {
    totalRevenue: financeData.value.totalRevenue,
    mtdRevenue: financeData.value.monthlyRevenue,
    avgOrderValue: financeData.value.paidOrderCount > 0 ? Math.round(financeData.value.totalRevenue / financeData.value.paidOrderCount) : 0,
    pendingPayments: financeData.value.pendingPayments,
    revenueByPackage: financeData.value.revenueByService.map((item, idx) => ({
      name: item.service,
      revenue: item.revenue,
      color: ['bg-cyan-500', 'bg-purple-500', 'bg-emerald-500', 'bg-amber-500', 'bg-blue-500', 'bg-pink-500'][idx % 6]
    })),
    recentTransactions: financeData.value.recentTransactions || []
  }
})

const fetchMetrics = async () => {
  loading.value = true
  error.value = null
  
  try {
    const response = await trpc.admin.finance.stats.query()
    financeData.value = response
  } catch (err: any) {
    const { handleTrpcError } = await import('~/composables/useTrpc')
    error.value = handleTrpcError(err)
    showError('Failed to load financial metrics')
    console.error('Error loading finance data:', err)
  } finally {
    loading.value = false
  }
}

const formatPrice = (amount: number | null) => {
  if (amount === null || amount === undefined) return '$0'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0
  }).format(amount)
}

const formatCurrency = (amountInCents: number | null) => {
  if (amountInCents === null || amountInCents === undefined) return '$0.00'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amountInCents / 100)
}

const getTransactionStatusClasses = (status: string) => {
  const classes: Record<string, string> = {
    succeeded: 'bg-emerald-500/20 text-emerald-400',
    pending: 'bg-amber-500/20 text-amber-400',
    failed: 'bg-red-500/20 text-red-400'
  }
  return classes[status] || 'bg-slate-500/20 text-slate-400'
}

onMounted(() => {
  fetchMetrics()
})

useHead({
  title: 'Finance Dashboard - Elite Sports DJ Admin',
  meta: [
    { name: 'description', content: 'View revenue metrics and payment analytics' }
  ]
})
</script>
