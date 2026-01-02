<script setup lang="ts">
/**
 * Analytics Dashboard Component
 * Shows key metrics and trends for admin overview
 */

const trpc = useTrpc()

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
    analytics.value = await trpc.adminEnhancements.analytics.query({
      period: period.value
    })
  } catch (err: any) {
    const { handleTrpcError } = await import('~/composables/useTrpc')
    error.value = handleTrpcError(err)
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
  <UiCard variant="default" :hover="false">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-lg font-bold text-white">Analytics Overview</h2>
      
      <select
        v-model="period"
        class="px-3 py-1.5 text-sm bg-dark-tertiary border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
      >
        <option value="7d">Last 7 days</option>
        <option value="30d">Last 30 days</option>
        <option value="90d">Last 90 days</option>
        <option value="1y">Last year</option>
      </select>
    </div>
    
    <!-- Content -->
    <div>
      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center h-48">
        <UiLoadingSpinner />
      </div>
      
      <!-- Error -->
      <div v-else-if="error" class="bg-error-500/10 border border-error-500/30 text-error-400 px-4 py-3 rounded-lg">
        {{ error }}
      </div>
      
      <!-- Analytics Data -->
      <div v-else-if="analytics">
        <!-- Key Metrics -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <!-- Conversion Rate -->
          <div class="bg-brand-500/10 border border-brand-500/20 rounded-xl p-4">
            <p class="text-sm text-brand-400 font-medium mb-1">Conversion Rate</p>
            <p class="text-3xl font-bold text-brand-300">{{ analytics.conversionRate }}%</p>
            <p class="text-xs text-brand-400/70 mt-1">
              {{ analytics.convertedCount }}/{{ analytics.quotedCount }} quotes
            </p>
          </div>
          
          <!-- Avg Time to Quote -->
          <div class="bg-accent-500/10 border border-accent-500/20 rounded-xl p-4">
            <p class="text-sm text-accent-400 font-medium mb-1">Avg Time to Quote</p>
            <p class="text-3xl font-bold text-accent-300">{{ formatHours(analytics.avgTimeToQuoteHours) }}</p>
            <p class="text-xs text-accent-400/70 mt-1">from submission</p>
          </div>
          
          <!-- Awaiting Quote -->
          <div class="bg-warning-500/10 border border-warning-500/20 rounded-xl p-4">
            <p class="text-sm text-warning-400 font-medium mb-1">Awaiting Quote</p>
            <p class="text-3xl font-bold text-warning-300">{{ analytics.pendingActions.awaitingQuote }}</p>
            <p class="text-xs text-warning-400/70 mt-1">need attention</p>
          </div>
          
          <!-- Stale Quotes -->
          <div 
            class="rounded-xl p-4 border"
            :class="analytics.pendingActions.staleQuotes > 0 
              ? 'bg-error-500/10 border-error-500/20' 
              : 'bg-success-500/10 border-success-500/20'"
          >
            <p 
              class="text-sm font-medium mb-1"
              :class="analytics.pendingActions.staleQuotes > 0 ? 'text-error-400' : 'text-success-400'"
            >
              Stale Quotes
            </p>
            <p 
              class="text-3xl font-bold"
              :class="analytics.pendingActions.staleQuotes > 0 ? 'text-error-300' : 'text-success-300'"
            >
              {{ analytics.pendingActions.staleQuotes }}
            </p>
            <p 
              class="text-xs mt-1"
              :class="analytics.pendingActions.staleQuotes > 0 ? 'text-error-400/70' : 'text-success-400/70'"
            >
              {{ analytics.pendingActions.staleQuotes > 0 ? '7+ days old' : 'all fresh!' }}
            </p>
          </div>
        </div>
        
        <!-- Revenue Trend -->
        <div class="mb-6">
          <h3 class="text-sm font-semibold text-slate-300 mb-3">Revenue Trend</h3>
          <div class="bg-dark-tertiary border border-white/5 rounded-lg p-4 h-24 flex items-end">
            <svg v-if="analytics.revenueTrend.length > 1" class="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
              <path 
                :d="getSparklinePath(analytics.revenueTrend)"
                fill="none"
                stroke="#22d3ee"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <p v-else class="text-slate-500 text-sm w-full text-center">Not enough data</p>
          </div>
        </div>
        
        <!-- Top Packages -->
        <div>
          <h3 class="text-sm font-semibold text-slate-300 mb-3">Top Packages</h3>
          <div class="space-y-3">
            <div 
              v-for="(pkg, index) in analytics.topPackages" 
              :key="pkg.package"
              class="flex items-center gap-3"
            >
              <span class="w-6 h-6 rounded-full bg-brand-500/20 text-brand-400 text-xs font-bold flex items-center justify-center">
                {{ index + 1 }}
              </span>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-white truncate">{{ pkg.package }}</span>
                  <span class="text-sm font-bold text-brand-400">{{ formatCurrency(pkg.revenue) }}</span>
                </div>
                <div class="w-full bg-slate-700 rounded-full h-1.5 mt-1">
                  <div 
                    class="bg-brand-500 h-1.5 rounded-full transition-all"
                    :style="{ width: `${(pkg.revenue / (analytics.topPackages[0]?.revenue || 1)) * 100}%` }"
                  ></div>
                </div>
              </div>
            </div>
            
            <p v-if="analytics.topPackages.length === 0" class="text-slate-500 text-sm text-center py-4">
              No data for this period
            </p>
          </div>
        </div>
      </div>
    </div>
  </UiCard>
</template>
