<script setup lang="ts">
/**
 * Analytics Dashboard Component
 * Shows key metrics and trends for admin overview
 */

const { $trpc } = useNuxtApp()

// State
const period = ref<'7d' | '30d' | '90d' | '1y'>('30d')
const loading = ref(true)
const error = ref<string | null>(null)

const analytics = ref<{
  period: string
  conversionRate: number
  quotedCount: number
  convertedCount: number
  avgTimeToQuoteHours: number
  revenueTrend: Array<{ date: string; orders: number; revenue: number }>
  topPackages: Array<{ package: string; orders: number; revenue: number }>
  pendingActions: {
    awaitingQuote: number
    staleQuotes: number
    readyToStart: number
  }
} | null>(null)

// Load analytics
async function loadAnalytics() {
  loading.value = true
  error.value = null
  
  try {
    analytics.value = await $trpc.adminEnhancements.analytics.query({
      period: period.value
    })
  } catch (err: any) {
    error.value = err.message || 'Failed to load analytics'
  } finally {
    loading.value = false
  }
}

// Watch period changes
watch(period, loadAnalytics)

// Initial load
onMounted(loadAnalytics)

// Helpers
function formatCurrency(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function formatHours(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`
  if (hours < 24) return `${hours.toFixed(1)}h`
  return `${(hours / 24).toFixed(1)}d`
}

// Simple sparkline calculation
function getSparklinePath(data: Array<{ revenue: number }>): string {
  if (data.length < 2) return ''
  
  const values = data.map(d => d.revenue)
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const range = max - min || 1
  
  const width = 100
  const height = 30
  const stepX = width / (values.length - 1)
  
  const points = values.map((v, i) => {
    const x = i * stepX
    const y = height - ((v - min) / range) * height
    return `${x},${y}`
  })
  
  return `M ${points.join(' L ')}`
}
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
    <!-- Header -->
    <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
      <h2 class="text-lg font-bold text-gray-900">Analytics Overview</h2>
      
      <select
        v-model="period"
        class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
      >
        <option value="7d">Last 7 days</option>
        <option value="30d">Last 30 days</option>
        <option value="90d">Last 90 days</option>
        <option value="1y">Last year</option>
      </select>
    </div>
    
    <!-- Content -->
    <div class="p-6">
      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center h-48">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
      </div>
      
      <!-- Error -->
      <div v-else-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {{ error }}
      </div>
      
      <!-- Analytics Data -->
      <div v-else-if="analytics">
        <!-- Key Metrics -->
        <div class="grid grid-cols-4 gap-4 mb-6">
          <!-- Conversion Rate -->
          <div class="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl p-4">
            <p class="text-sm text-cyan-600 font-medium mb-1">Conversion Rate</p>
            <p class="text-3xl font-bold text-cyan-700">{{ analytics.conversionRate }}%</p>
            <p class="text-xs text-cyan-600 mt-1">
              {{ analytics.convertedCount }}/{{ analytics.quotedCount }} quotes
            </p>
          </div>
          
          <!-- Avg Time to Quote -->
          <div class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
            <p class="text-sm text-purple-600 font-medium mb-1">Avg Time to Quote</p>
            <p class="text-3xl font-bold text-purple-700">{{ formatHours(analytics.avgTimeToQuoteHours) }}</p>
            <p class="text-xs text-purple-600 mt-1">from submission</p>
          </div>
          
          <!-- Awaiting Quote -->
          <div class="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4">
            <p class="text-sm text-amber-600 font-medium mb-1">Awaiting Quote</p>
            <p class="text-3xl font-bold text-amber-700">{{ analytics.pendingActions.awaitingQuote }}</p>
            <p class="text-xs text-amber-600 mt-1">need attention</p>
          </div>
          
          <!-- Stale Quotes -->
          <div 
            class="rounded-xl p-4"
            :class="analytics.pendingActions.staleQuotes > 0 
              ? 'bg-gradient-to-br from-red-50 to-red-100' 
              : 'bg-gradient-to-br from-green-50 to-green-100'"
          >
            <p 
              class="text-sm font-medium mb-1"
              :class="analytics.pendingActions.staleQuotes > 0 ? 'text-red-600' : 'text-green-600'"
            >
              Stale Quotes
            </p>
            <p 
              class="text-3xl font-bold"
              :class="analytics.pendingActions.staleQuotes > 0 ? 'text-red-700' : 'text-green-700'"
            >
              {{ analytics.pendingActions.staleQuotes }}
            </p>
            <p 
              class="text-xs mt-1"
              :class="analytics.pendingActions.staleQuotes > 0 ? 'text-red-600' : 'text-green-600'"
            >
              {{ analytics.pendingActions.staleQuotes > 0 ? '7+ days old' : 'all fresh!' }}
            </p>
          </div>
        </div>
        
        <!-- Revenue Trend -->
        <div class="mb-6">
          <h3 class="text-sm font-semibold text-gray-700 mb-3">Revenue Trend</h3>
          <div class="bg-gray-50 rounded-lg p-4 h-24 flex items-end">
            <svg v-if="analytics.revenueTrend.length > 1" class="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
              <path 
                :d="getSparklinePath(analytics.revenueTrend)"
                fill="none"
                stroke="#0891b2"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <p v-else class="text-gray-400 text-sm w-full text-center">Not enough data</p>
          </div>
        </div>
        
        <!-- Top Packages -->
        <div>
          <h3 class="text-sm font-semibold text-gray-700 mb-3">Top Packages</h3>
          <div class="space-y-2">
            <div 
              v-for="(pkg, index) in analytics.topPackages" 
              :key="pkg.package"
              class="flex items-center gap-3"
            >
              <span class="w-6 h-6 rounded-full bg-cyan-100 text-cyan-700 text-xs font-bold flex items-center justify-center">
                {{ index + 1 }}
              </span>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-gray-900 truncate">{{ pkg.package }}</span>
                  <span class="text-sm font-bold text-cyan-600">{{ formatCurrency(pkg.revenue) }}</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                  <div 
                    class="bg-cyan-500 h-1.5 rounded-full"
                    :style="{ width: `${(pkg.revenue / (analytics.topPackages[0]?.revenue || 1)) * 100}%` }"
                  ></div>
                </div>
              </div>
            </div>
            
            <p v-if="analytics.topPackages.length === 0" class="text-gray-400 text-sm text-center py-4">
              No data for this period
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
