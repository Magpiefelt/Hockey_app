<template>
  <div class="booking-pipeline">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h3 class="text-lg font-bold text-white">Booking Pipeline</h3>
        <p class="text-sm text-slate-400">Orders by status stage</p>
      </div>
      <div class="text-right">
        <p class="text-2xl font-bold text-white">{{ totalOrders }}</p>
        <p class="text-sm text-slate-400">Total Orders</p>
      </div>
    </div>

    <!-- Pipeline Visualization -->
    <div class="space-y-4">
      <div
        v-for="stage in pipelineStages"
        :key="stage.status"
        class="relative"
      >
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <div
              :class="[
                'w-3 h-3 rounded-full',
                stage.colorClass
              ]"
            ></div>
            <span class="text-sm font-medium text-slate-300">{{ stage.label }}</span>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-sm font-bold text-white">{{ stage.count }}</span>
            <span class="text-xs text-slate-500">{{ formatCurrency(stage.value) }}</span>
          </div>
        </div>
        
        <!-- Progress Bar -->
        <div class="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            :class="['h-full rounded-full transition-all duration-500', stage.bgClass]"
            :style="{ width: `${getPercentage(stage.count)}%` }"
          ></div>
        </div>
      </div>
    </div>

    <!-- Conversion Funnel Stats -->
    <div class="mt-6 pt-6 border-t border-slate-700">
      <h4 class="text-sm font-semibold text-slate-400 mb-4">Conversion Rates</h4>
      <div class="grid grid-cols-2 gap-4">
        <div class="bg-slate-800/50 rounded-lg p-3">
          <p class="text-xs text-slate-400 mb-1">Quote → Paid</p>
          <p class="text-lg font-bold text-cyan-400">{{ quoteToPayRate.toFixed(1) }}%</p>
        </div>
        <div class="bg-slate-800/50 rounded-lg p-3">
          <p class="text-xs text-slate-400 mb-1">Submitted → Completed</p>
          <p class="text-lg font-bold text-green-400">{{ submittedToCompletedRate.toFixed(1) }}%</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface PipelineData {
  submitted?: number
  quoted?: number
  invoiced?: number
  paid?: number
  in_progress?: number
  completed?: number
  cancelled?: number
}

interface Props {
  data?: PipelineData
}

const props = withDefaults(defineProps<Props>(), {
  data: () => ({
    submitted: 5,
    quoted: 8,
    invoiced: 3,
    paid: 12,
    in_progress: 4,
    completed: 25,
    cancelled: 2
  })
})

const stageConfig = [
  { status: 'submitted', label: 'Submitted', colorClass: 'bg-blue-500', bgClass: 'bg-blue-500', avgValue: 0 },
  { status: 'quoted', label: 'Quoted', colorClass: 'bg-purple-500', bgClass: 'bg-purple-500', avgValue: 15000 },
  { status: 'invoiced', label: 'Invoiced', colorClass: 'bg-yellow-500', bgClass: 'bg-yellow-500', avgValue: 15000 },
  { status: 'paid', label: 'Paid', colorClass: 'bg-cyan-500', bgClass: 'bg-cyan-500', avgValue: 15000 },
  { status: 'in_progress', label: 'In Progress', colorClass: 'bg-orange-500', bgClass: 'bg-orange-500', avgValue: 15000 },
  { status: 'completed', label: 'Completed', colorClass: 'bg-green-500', bgClass: 'bg-green-500', avgValue: 15000 },
  { status: 'cancelled', label: 'Cancelled', colorClass: 'bg-red-500', bgClass: 'bg-red-500', avgValue: 0 }
]

const pipelineStages = computed(() => {
  return stageConfig.map(config => {
    const count = (props.data as any)[config.status] || 0
    return {
      ...config,
      count,
      value: count * config.avgValue
    }
  })
})

const totalOrders = computed(() => {
  return pipelineStages.value.reduce((sum, stage) => sum + stage.count, 0)
})

const maxCount = computed(() => {
  return Math.max(...pipelineStages.value.map(s => s.count), 1)
})

const getPercentage = (count: number): number => {
  return (count / maxCount.value) * 100
}

const formatCurrency = (cents: number): string => {
  if (cents === 0) return '-'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(cents / 100)
}

// Conversion rate calculations
const quoteToPayRate = computed(() => {
  const quoted = (props.data?.quoted || 0) + (props.data?.invoiced || 0) + (props.data?.paid || 0) + (props.data?.in_progress || 0) + (props.data?.completed || 0)
  const paid = (props.data?.paid || 0) + (props.data?.in_progress || 0) + (props.data?.completed || 0)
  if (quoted === 0) return 0
  return (paid / quoted) * 100
})

const submittedToCompletedRate = computed(() => {
  const total = totalOrders.value - (props.data?.cancelled || 0)
  const completed = props.data?.completed || 0
  if (total === 0) return 0
  return (completed / total) * 100
})
</script>

<style scoped>
.booking-pipeline {
  background: linear-gradient(to bottom right, rgb(15, 23, 42), rgb(30, 41, 59));
  border: 1px solid rgba(51, 65, 85, 0.5);
  border-radius: 1rem;
  padding: 1.5rem;
}
</style>
