<template>
  <div class="min-h-screen px-4 py-12">
    <div class="container mx-auto max-w-7xl">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-4xl md:text-5xl font-bold text-text-primary mb-2">
          Finance <span class="text-brand-primary">Dashboard</span>
        </h1>
        <p class="text-xl text-text-tertiary">
          Revenue metrics and payment analytics
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center py-20">
        <div class="animate-spin h-12 w-12 border-4 border-brand-primary border-t-transparent rounded-full"></div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="p-6 rounded-xl border-2 border-red-500/40 bg-gradient-to-br from-red-500/10 to-transparent text-center">
        <p class="text-red-600 text-lg mb-4">{{ error }}</p>
        <button 
          @click="fetchMetrics"
          class="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-600 rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>

      <!-- Dashboard Content -->
      <div v-else-if="metrics" class="space-y-8">
        <!-- Key Metrics -->
        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div class="p-6 rounded-xl border-2 border-brand-primary/30 bg-gradient-to-br from-brand-primary/5 to-transparent">
            <div class="flex items-center justify-between mb-2">
              <p class="text-text-tertiary text-sm font-semibold uppercase">Total Revenue</p>
              <div class="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center">
                <svg class="h-5 w-5 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p class="text-4xl font-bold text-text-primary">{{ formatPrice(metrics.totalRevenue) }}</p>
            <p class="text-brand-primary text-sm mt-1">All time</p>
          </div>

          <div class="p-6 rounded-xl border-2 border-green-500/40 bg-gradient-to-br from-green-50 to-transparent">
            <div class="flex items-center justify-between mb-2">
              <p class="text-text-tertiary text-sm font-semibold uppercase">MTD Revenue</p>
              <div class="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <svg class="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <p class="text-4xl font-bold text-text-primary">{{ formatPrice(metrics.mtdRevenue) }}</p>
            <p class="text-green-600 text-sm mt-1">This month</p>
          </div>

          <div class="p-6 rounded-xl border-2 border-purple-500/40 bg-gradient-to-br from-purple-500/5 to-transparent">
            <div class="flex items-center justify-between mb-2">
              <p class="text-text-tertiary text-sm font-semibold uppercase">Avg Order Value</p>
              <div class="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <svg class="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <p class="text-4xl font-bold text-text-primary">{{ formatPrice(metrics.avgOrderValue) }}</p>
            <p class="text-purple-600 text-sm mt-1">Per order</p>
          </div>

          <div class="p-6 rounded-xl border-2 border-brand-primary/30 bg-gradient-to-br from-brand-primary/5 to-transparent">
            <div class="flex items-center justify-between mb-2">
              <p class="text-text-tertiary text-sm font-semibold uppercase">Pending Payments</p>
              <div class="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center">
                <svg class="h-5 w-5 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p class="text-4xl font-bold text-text-primary">{{ formatPrice(metrics.pendingPayments) }}</p>
            <p class="text-brand-primary text-sm mt-1">Awaiting payment</p>
          </div>
        </div>

        <!-- Revenue by Package -->
        <div class="p-8 rounded-xl border border-brand-border bg-white">
          <h2 class="text-2xl font-bold text-text-primary mb-6">Revenue by Package</h2>
          <div class="space-y-4">
            <div v-for="pkg in metrics.revenueByPackage" :key="pkg.name" class="flex items-center justify-between">
              <div class="flex-1">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-white font-medium">{{ pkg.name }}</span>
                  <span class="text-text-tertiary">{{ formatPrice(pkg.revenue) }}</span>
                </div>
                <div class="w-full bg-slate-50 rounded-full h-2">
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
        <div class="p-8 rounded-xl border border-brand-border bg-white">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-bold text-text-primary">Recent Transactions</h2>
            <button class="text-brand-primary hover:text-brand-primary-600 font-medium transition-colors">
              View all →
            </button>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-brand-border">
                  <th class="text-left py-3 px-4 text-text-tertiary font-semibold text-sm uppercase">Date</th>
                  <th class="text-left py-3 px-4 text-text-tertiary font-semibold text-sm uppercase">Customer</th>
                  <th class="text-left py-3 px-4 text-text-tertiary font-semibold text-sm uppercase">Package</th>
                  <th class="text-left py-3 px-4 text-text-tertiary font-semibold text-sm uppercase">Amount</th>
                  <th class="text-left py-3 px-4 text-text-tertiary font-semibold text-sm uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr 
                  v-for="transaction in metrics.recentTransactions" 
                  :key="transaction.id"
                  class="border-b border-brand-border hover:bg-white transition-colors"
                >
                  <td class="py-4 px-4 text-text-tertiary">{{ formatDate(transaction.date) }}</td>
                  <td class="py-4 px-4 text-text-primary">{{ transaction.customerName }}</td>
                  <td class="py-4 px-4 text-text-secondary">{{ transaction.packageName }}</td>
                  <td class="py-4 px-4 text-text-primary font-semibold">{{ formatPrice(transaction.amount) }}</td>
                  <td class="py-4 px-4">
                    <span 
                      class="px-3 py-1 rounded-full text-xs font-semibold"
                      :class="{
                        'bg-green-500/20 text-green-600': transaction.status === 'paid',
                        'bg-yellow-500/20 text-yellow-600': transaction.status === 'pending',
                        'bg-red-500/20 text-red-600': transaction.status === 'failed'
                      }"
                    >
                      {{ transaction.status.toUpperCase() }}
                    </span>
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
  middleware: 'admin'
})

const { showError } = useNotification()
const trpc = useTrpc()

const loading = ref(true)
const error = ref<string | null>(null)
const financeData = ref<FinanceData | null>(null)

const metrics = computed(() => {
  if (!financeData.value) return null
  
  return {
    totalRevenue: financeData.value.totalRevenue,
    mtdRevenue: financeData.value.monthlyRevenue,
    avgOrderValue: financeData.value.totalRevenue > 0 ? Math.round(financeData.value.totalRevenue / 10) : 0,
    pendingPayments: financeData.value.pendingPayments,
    revenueByPackage: financeData.value.revenueByService.map((item, idx) => ({
      name: item.service,
      revenue: item.revenue,
      color: ['bg-brand-primary', 'bg-purple-500', 'bg-brand-primary', 'bg-green-500'][idx % 4]
    })),
    recentTransactions: []
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

const formatPrice = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0
  }).format(amount)
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

onMounted(() => {
  fetchMetrics()
})
</script>

