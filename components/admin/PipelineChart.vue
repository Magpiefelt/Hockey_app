<template>
  <div class="space-y-3">
    <div 
      v-for="(stage, index) in sortedStages" 
      :key="stage.status"
      class="relative"
    >
      <!-- Stage bar -->
      <div class="flex items-center gap-4">
        <!-- Status indicator -->
        <div 
          :class="[
            'w-3 h-3 rounded-full flex-shrink-0',
            getStatusColor(stage.status)
          ]"
        ></div>
        
        <!-- Label and count -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between mb-1">
            <span class="text-sm font-medium text-slate-300">
              {{ getStatusLabel(stage.status) }}
            </span>
            <div class="flex items-center gap-2">
              <span class="text-sm font-bold text-white">{{ stage.count }}</span>
              <span v-if="showValue && stage.value > 0" class="text-xs text-slate-500">
                ({{ formatCurrency(stage.value) }})
              </span>
            </div>
          </div>
          
          <!-- Progress bar -->
          <div class="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div 
              :class="[
                'h-full rounded-full transition-all duration-500',
                getStatusBgColor(stage.status)
              ]"
              :style="{ width: `${getPercentage(stage.count)}%` }"
            ></div>
          </div>
        </div>
      </div>
      
      <!-- Connector line -->
      <div 
        v-if="index < sortedStages.length - 1 && showConnectors"
        class="absolute left-1.5 top-6 w-px h-6 bg-slate-700"
      ></div>
    </div>
    
    <!-- Empty state -->
    <div v-if="sortedStages.length === 0" class="text-center py-8">
      <Icon name="mdi:chart-bar" class="w-12 h-12 text-slate-600 mx-auto mb-2" />
      <p class="text-slate-400">No orders to display</p>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * PipelineChart Component
 * Displays order status distribution as a horizontal bar chart
 * 
 * Usage:
 * <PipelineChart 
 *   :stages="[
 *     { status: 'submitted', count: 5, value: 250000 },
 *     { status: 'quoted', count: 8, value: 400000 },
 *     { status: 'paid', count: 3, value: 150000 }
 *   ]"
 *   :show-value="true"
 * />
 */

interface Stage {
  status: string
  count: number
  value?: number
}

interface Props {
  stages: Stage[]
  showValue?: boolean
  showConnectors?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showValue: true,
  showConnectors: true
})

// Status order for sorting
const statusOrder = [
  'submitted',
  'pending',
  'quoted',
  'in_progress',
  'paid',
  'completed',
  'delivered',
  'cancelled',
  'refunded'
]

// Sort stages by status order
const sortedStages = computed(() => {
  return [...props.stages]
    .filter(s => s.count > 0)
    .sort((a, b) => {
      const aIndex = statusOrder.indexOf(a.status)
      const bIndex = statusOrder.indexOf(b.status)
      return aIndex - bIndex
    })
})

// Calculate max count for percentage
const maxCount = computed(() => {
  return Math.max(...props.stages.map(s => s.count), 1)
})

function getPercentage(count: number): number {
  return (count / maxCount.value) * 100
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value / 100)
}

// Use shared status composable
const { getStatusColors, getStatusLabel } = useOrderStatus()

function getStatusColor(status: string): string {
  return getStatusColors(status).solid
}

function getStatusBgColor(status: string): string {
  // Use the solid colour with reduced opacity for bar fills
  return getStatusColors(status).solid.replace('bg-', 'bg-') + '/70'
}
</script>
