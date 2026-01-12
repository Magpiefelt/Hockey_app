<template>
  <div class="px-6 py-8">
    <div class="container mx-auto max-w-7xl">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl md:text-4xl font-bold text-white mb-2">
          Finance <span class="gradient-text">Dashboard</span>
        </h1>
        <p class="text-lg text-slate-400">
          Revenue metrics and payment analytics
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center py-20">
        <div class="animate-spin h-12 w-12 border-4 border-brand-600 border-t-transparent rounded-full"></div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="card p-6 border-red-500/40 text-center">
        <p class="text-red-400 text-lg mb-4">{{ error }}</p>
        <button 
          @click="fetchMetrics"
          class="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>

      <!-- Dashboard Content -->
      <div v-else-if="metrics" class="space-y-8">
        <!-- Key Metrics -->
        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div class="card p-6">
            <div class="flex items-center justify-between mb-2">
              <p class="text-slate-400 text-sm font-semibold uppercase">Total Revenue</p>
              <div class="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center">
                <svg class="h-5 w-5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p class="text-4xl font-bold text-white">{{ formatPrice(metrics.totalRevenue) }}</p>
            <p class="text-brand-400 text-sm mt-1">All time</p>
          </div>

          <div class="card p-6">
            <div class="flex items-center justify-between mb-2">
              <p class="text-slate-400 text-sm font-semibold uppercase">MTD Revenue</p>
              <div class="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <svg class="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <p class="text-4xl font-bold text-white">{{ formatPrice(metrics.mtdRevenue) }}</p>
            <p class="text-green-400 text-sm mt-1">This month</p>
          </div>

          <div class="card p-6">
            <div class="flex items-center justify-between mb-2">
              <p class="text-slate-400 text-sm font-semibold uppercase">Avg Order Value</p>
              <div class="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <svg class="h-5 w-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <p class="text-4xl font-bold text-white">{{ formatPrice(metrics.avgOrderValue) }}</p>
            <p class="text-purple-400 text-sm mt-1">Per order</p>
          </div>

          <div class="card p-6">
            <div class="flex items-center justify-between mb-2">
              <p class="text-slate-400 text-sm font-semibold uppercase">Pending Payments</p>
              <div class="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <svg class="h-5 w-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p class="text-4xl font-bold text-white">{{ formatPrice(metrics.pendingPayments) }}</p>
            <p class="text-yellow-400 text-sm mt-1">Awaiting payment</p>
          </div>
        </div>

        <!-- Revenue by Package -->
        <div class="card p-8">
          <h2 class="text-2xl font-bold text-white mb-6">Revenue by Package</h2>
          <div v-if="metrics.revenueByPackage.length === 0" class="text-center py-8 text-slate-400">
            No revenue data available
          </div>
          <div v-else class="space-y-4">
            <div v-for="pkg in metrics.revenueByPackage" :key="pkg.name" class="flex items-center justify-between">
              <div class="flex-1">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-white font-medium">{{ pkg.name }}</span>
                  <span class="text-slate-400">{{ formatPrice(pkg.revenue) }}</span>
                </div>
                <div class="w-full bg-white/5 rounded-full h-2">
                  <div 
                    class="h-2 rounded-full"
                    :class="pkg.color"
                    :style="{ width: `${(pkg.revenue / metrics.totalRevenue) * 100}%` }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Transactions -->
        <div class="card p-8">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-bold text-white">Recent Transactions</h2>
            <button 
              v-if="metrics.recentTransactions.length > 0"
              @click="navigateToOrders"
              class="text-brand-400 hover:text-brand-300 font-medium transition-colors"
            >
              View all →
            </button>
          </div>

          <div v-if="metrics.recentTransactions.length === 0" class="text-center py-12 text-slate-400">
            No recent transactions
          </div>

          <div v-else class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-white/10">
                  <th class="text-left py-3 px-4 text-slate-200 font-semibold text-sm uppercase">Date</th>
                  <th class="text-left py-3 px-4 text-slate-200 font-semibold text-sm uppercase">Customer</th>
                  <th class="text-left py-3 px-4 text-slate-200 font-semibold text-sm uppercase">Package</th>
                  <th class="text-left py-3 px-4 text-slate-200 font-semibold text-sm uppercase">Amount</th>
                  <th class="text-left py-3 px-4 text-slate-200 font-semibold text-sm uppercase">Status</th>
                  <th class="text-left py-3 px-4 text-slate-200 font-semibold text-sm uppercase">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr 
                  v-for="transaction in metrics.recentTransactions" 
                  :key="transaction.id"
                  class="border-b border-white/10 hover:bg-white/5 transition-colors"
                >
                  <td class="py-4 px-4 text-slate-400">{{ formatDate(transaction.date) }}</td>
                  <td class="py-4 px-4 text-white">{{ transaction.customerName }}</td>
                  <td class="py-4 px-4 text-slate-300">{{ transaction.packageName }}</td>
                  <td class="py-4 px-4 text-white font-semibold">{{ formatCurrency(transaction.amount) }}</td>
                  <td class="py-4 px-4">
                    <span 
                      class="px-3 py-1 rounded-full text-xs font-semibold"
                      :class="{
                        'bg-green-500/20 text-green-400': transaction.status === 'succeeded',
                        'bg-yellow-500/20 text-yellow-400': transaction.status === 'pending',
                        'bg-red-500/20 text-red-400': transaction.status === 'failed'
                      }"
                    >
                      {{ transaction.status.toUpperCase() }}
                    </span>
                  </td>
                  <td class="py-4 px-4">
                    <NuxtLink 
                      :to="`/admin/orders/${transaction.orderId}`"
                      class="text-brand-400 hover:text-brand-300 text-sm font-medium transition-colors"
                    >
                      View Order →
                    </NuxtLink>
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
      color: ['bg-brand-500', 'bg-purple-500', 'bg-cyan-500', 'bg-green-500'][idx % 4]
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

const navigateToOrders = () => {
  router.push('/admin/orders')
}

onMounted(() => {
  fetchMetrics()
})
</script>
