<template>
  <div class="revenue-trend-chart">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h3 class="text-lg font-bold text-white">Revenue Trend</h3>
        <p class="text-sm text-slate-400">Monthly revenue over the past {{ months }} months</p>
      </div>
      <div class="flex gap-2">
        <button
          v-for="period in periods"
          :key="period.value"
          @click="selectedPeriod = period.value"
          :class="[
            'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
            selectedPeriod === period.value
              ? 'bg-cyan-500 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          ]"
        >
          {{ period.label }}
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center h-64">
      <div class="flex flex-col items-center gap-3">
        <div class="w-8 h-8 border-3 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
        <p class="text-slate-400 text-sm">Loading chart data...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="flex items-center justify-center h-64">
      <div class="text-center">
        <Icon name="mdi:alert-circle" class="w-12 h-12 text-red-400 mx-auto mb-3" />
        <p class="text-red-400 mb-2">{{ error }}</p>
        <button
          @click="fetchData"
          class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Retry
        </button>
      </div>
    </div>

    <!-- Chart -->
    <div v-else class="h-64">
      <canvas ref="chartCanvas"></canvas>
    </div>

    <!-- Summary Stats -->
    <div v-if="!loading && !error" class="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-700">
      <div class="text-center">
        <p class="text-2xl font-bold text-white">{{ formatCurrency(totalRevenue) }}</p>
        <p class="text-sm text-slate-400">Total Revenue</p>
      </div>
      <div class="text-center">
        <p class="text-2xl font-bold text-white">{{ formatCurrency(averageRevenue) }}</p>
        <p class="text-sm text-slate-400">Monthly Average</p>
      </div>
      <div class="text-center">
        <p :class="['text-2xl font-bold', growthRate >= 0 ? 'text-green-400' : 'text-red-400']">
          {{ growthRate >= 0 ? '+' : '' }}{{ growthRate.toFixed(1) }}%
        </p>
        <p class="text-sm text-slate-400">Growth Rate</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { Chart, registerables } from 'chart.js'

// Register Chart.js components
Chart.register(...registerables)

interface Props {
  data?: { month: string; revenue: number }[]
  months?: number
}

const props = withDefaults(defineProps<Props>(), {
  months: 12
})

const chartCanvas = ref<HTMLCanvasElement | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const selectedPeriod = ref(12)
let chartInstance: Chart | null = null

const periods = [
  { label: '6M', value: 6 },
  { label: '12M', value: 12 },
  { label: '24M', value: 24 }
]

// Sample data generator for demonstration
const generateSampleData = (months: number) => {
  const data = []
  const now = new Date()
  
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    
    // Generate realistic-looking revenue data with some variation
    const baseRevenue = 2000 + Math.random() * 3000
    const seasonalFactor = 1 + 0.3 * Math.sin((date.getMonth() / 12) * 2 * Math.PI)
    const revenue = Math.round(baseRevenue * seasonalFactor * 100) // Convert to cents
    
    data.push({
      month: monthName,
      revenue
    })
  }
  
  return data
}

const chartData = computed(() => {
  if (props.data && props.data.length > 0) {
    return props.data.slice(-selectedPeriod.value)
  }
  return generateSampleData(selectedPeriod.value)
})

const totalRevenue = computed(() => {
  return chartData.value.reduce((sum, item) => sum + item.revenue, 0)
})

const averageRevenue = computed(() => {
  if (chartData.value.length === 0) return 0
  return totalRevenue.value / chartData.value.length
})

const growthRate = computed(() => {
  if (chartData.value.length < 2) return 0
  const firstHalf = chartData.value.slice(0, Math.floor(chartData.value.length / 2))
  const secondHalf = chartData.value.slice(Math.floor(chartData.value.length / 2))
  
  const firstAvg = firstHalf.reduce((sum, item) => sum + item.revenue, 0) / firstHalf.length
  const secondAvg = secondHalf.reduce((sum, item) => sum + item.revenue, 0) / secondHalf.length
  
  if (firstAvg === 0) return 0
  return ((secondAvg - firstAvg) / firstAvg) * 100
})

const formatCurrency = (cents: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(cents / 100)
}

const createChart = () => {
  if (!chartCanvas.value) return
  
  // Destroy existing chart
  if (chartInstance) {
    chartInstance.destroy()
  }
  
  const ctx = chartCanvas.value.getContext('2d')
  if (!ctx) return
  
  // Create gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, 256)
  gradient.addColorStop(0, 'rgba(6, 182, 212, 0.3)')
  gradient.addColorStop(1, 'rgba(6, 182, 212, 0)')
  
  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: chartData.value.map(d => d.month),
      datasets: [{
        label: 'Revenue',
        data: chartData.value.map(d => d.revenue / 100), // Convert cents to dollars
        borderColor: 'rgb(6, 182, 212)',
        backgroundColor: gradient,
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgb(6, 182, 212)',
        pointBorderColor: 'rgb(15, 23, 42)',
        pointBorderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgb(30, 41, 59)',
          titleColor: 'rgb(255, 255, 255)',
          bodyColor: 'rgb(148, 163, 184)',
          borderColor: 'rgb(51, 65, 85)',
          borderWidth: 1,
          padding: 12,
          displayColors: false,
          callbacks: {
            label: (context) => {
              return `Revenue: ${formatCurrency(context.raw as number * 100)}`
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(51, 65, 85, 0.5)',
            drawBorder: false
          },
          ticks: {
            color: 'rgb(148, 163, 184)',
            font: {
              size: 11
            }
          }
        },
        y: {
          grid: {
            color: 'rgba(51, 65, 85, 0.5)',
            drawBorder: false
          },
          ticks: {
            color: 'rgb(148, 163, 184)',
            font: {
              size: 11
            },
            callback: (value) => `$${value}`
          },
          beginAtZero: true
        }
      }
    }
  })
}

const fetchData = async () => {
  loading.value = true
  error.value = null
  
  try {
    // In a real implementation, this would fetch from the API
    // For now, we use the sample data generator
    await new Promise(resolve => setTimeout(resolve, 500))
    createChart()
  } catch (err: any) {
    error.value = err.message || 'Failed to load chart data'
  } finally {
    loading.value = false
  }
}

watch(selectedPeriod, () => {
  createChart()
})

watch(() => props.data, () => {
  createChart()
}, { deep: true })

onMounted(() => {
  fetchData()
})

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.destroy()
  }
})
</script>

<style scoped>
.revenue-trend-chart {
  background: linear-gradient(to bottom right, rgb(15, 23, 42), rgb(30, 41, 59));
  border: 1px solid rgba(51, 65, 85, 0.5);
  border-radius: 1rem;
  padding: 1.5rem;
}
</style>
