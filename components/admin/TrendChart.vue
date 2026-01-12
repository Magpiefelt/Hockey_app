<template>
  <div class="w-full">
    <canvas ref="chartCanvas" :height="height"></canvas>
  </div>
</template>

<script setup lang="ts">
import { Chart, registerables } from 'chart.js'

// Register Chart.js components
Chart.register(...registerables)

interface DataPoint {
  label: string
  value: number
  previousValue?: number
}

interface Props {
  data: DataPoint[]
  type?: 'line' | 'bar'
  height?: number
  showLegend?: boolean
  formatValue?: 'currency' | 'number' | 'percent'
  color?: string
  previousColor?: string
  label?: string
  previousLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'line',
  height: 200,
  showLegend: true,
  formatValue: 'currency',
  color: '#06b6d4', // cyan-500
  previousColor: '#64748b', // slate-500
  label: 'This Period',
  previousLabel: 'Last Period'
})

const chartCanvas = ref<HTMLCanvasElement | null>(null)
let chartInstance: Chart | null = null

// Format value for tooltips
function formatTooltipValue(value: number): string {
  switch (props.formatValue) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0
      }).format(value / 100)
    case 'percent':
      return `${value.toFixed(1)}%`
    default:
      return new Intl.NumberFormat('en-US').format(value)
  }
}

// Create or update chart
function createChart() {
  if (!chartCanvas.value) return
  
  // Destroy existing chart
  if (chartInstance) {
    chartInstance.destroy()
  }
  
  const ctx = chartCanvas.value.getContext('2d')
  if (!ctx) return
  
  const labels = props.data.map(d => d.label)
  const values = props.data.map(d => d.value)
  const hasPreviousData = props.data.some(d => d.previousValue !== undefined)
  const previousValues = hasPreviousData ? props.data.map(d => d.previousValue || 0) : []
  
  const datasets: any[] = [
    {
      label: props.label,
      data: values,
      borderColor: props.color,
      backgroundColor: props.type === 'bar' 
        ? props.color + '80' 
        : props.color + '20',
      borderWidth: 2,
      fill: props.type === 'line',
      tension: 0.4,
      pointRadius: props.type === 'line' ? 4 : 0,
      pointHoverRadius: props.type === 'line' ? 6 : 0,
      pointBackgroundColor: props.color,
      pointBorderColor: '#1e293b',
      pointBorderWidth: 2
    }
  ]
  
  if (hasPreviousData) {
    datasets.push({
      label: props.previousLabel,
      data: previousValues,
      borderColor: props.previousColor,
      backgroundColor: props.type === 'bar' 
        ? props.previousColor + '80' 
        : 'transparent',
      borderWidth: 2,
      borderDash: [5, 5],
      fill: false,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 4,
      pointBackgroundColor: props.previousColor
    })
  }
  
  chartInstance = new Chart(ctx, {
    type: props.type,
    data: {
      labels,
      datasets
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
          display: props.showLegend && hasPreviousData,
          position: 'top',
          align: 'end',
          labels: {
            color: '#94a3b8',
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 20,
            font: {
              size: 12
            }
          }
        },
        tooltip: {
          backgroundColor: '#1e293b',
          titleColor: '#ffffff',
          bodyColor: '#94a3b8',
          borderColor: '#334155',
          borderWidth: 1,
          padding: 12,
          displayColors: true,
          callbacks: {
            label: function(context: any) {
              return `${context.dataset.label}: ${formatTooltipValue(context.parsed.y)}`
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            color: '#334155',
            drawBorder: false
          },
          ticks: {
            color: '#64748b',
            font: {
              size: 11
            }
          }
        },
        y: {
          grid: {
            color: '#334155',
            drawBorder: false
          },
          ticks: {
            color: '#64748b',
            font: {
              size: 11
            },
            callback: function(value: any) {
              return formatTooltipValue(value)
            }
          },
          beginAtZero: true
        }
      }
    }
  })
}

// Watch for data changes
watch(() => props.data, () => {
  createChart()
}, { deep: true })

// Create chart on mount
onMounted(() => {
  nextTick(() => {
    createChart()
  })
})

// Cleanup on unmount
onUnmounted(() => {
  if (chartInstance) {
    chartInstance.destroy()
  }
})
</script>
