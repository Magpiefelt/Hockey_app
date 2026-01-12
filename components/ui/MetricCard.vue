<template>
  <div 
    :class="[
      'bg-slate-900/50 border border-slate-800 rounded-2xl p-5 lg:p-6 transition-all group',
      hover ? 'hover:border-slate-700 hover:shadow-lg' : ''
    ]"
  >
    <div class="flex items-center justify-between mb-4">
      <div 
        :class="[
          'w-11 h-11 rounded-xl flex items-center justify-center transition-transform',
          iconBgClass,
          hover ? 'group-hover:scale-110' : ''
        ]"
      >
        <Icon :name="icon" :class="['w-6 h-6', iconColorClass]" />
      </div>
      <span v-if="label" class="text-xs font-medium text-slate-500 uppercase tracking-wide">
        {{ label }}
      </span>
    </div>
    <p :class="['font-bold text-white mb-1', sizeClass]">
      {{ formattedValue }}
    </p>
    <p class="text-sm text-slate-400">{{ title }}</p>
    
    <!-- Optional trend indicator -->
    <div v-if="trend !== undefined" class="mt-2 flex items-center gap-1">
      <Icon 
        :name="trend >= 0 ? 'mdi:trending-up' : 'mdi:trending-down'" 
        :class="['w-4 h-4', trend >= 0 ? 'text-emerald-400' : 'text-red-400']" 
      />
      <span :class="['text-xs font-medium', trend >= 0 ? 'text-emerald-400' : 'text-red-400']">
        {{ trend >= 0 ? '+' : '' }}{{ trend }}%
      </span>
      <span v-if="trendLabel" class="text-xs text-slate-500">{{ trendLabel }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * MetricCard Component
 * Reusable card for displaying key metrics with icons and optional trend indicators
 * 
 * Usage:
 * <MetricCard 
 *   icon="mdi:currency-usd" 
 *   color="emerald" 
 *   :value="45000" 
 *   format="currency"
 *   title="Total Revenue" 
 *   label="All Time"
 *   :trend="12.5"
 *   trend-label="vs last month"
 * />
 */

interface Props {
  icon: string
  color?: 'emerald' | 'cyan' | 'blue' | 'amber' | 'purple' | 'red' | 'slate'
  value: number | string
  format?: 'currency' | 'number' | 'percent' | 'none'
  title: string
  label?: string
  size?: 'sm' | 'md' | 'lg'
  hover?: boolean
  trend?: number
  trendLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  color: 'cyan',
  format: 'none',
  size: 'md',
  hover: true
})

// Color mappings
const colorMap: Record<string, { bg: string; text: string }> = {
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400' },
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-400' },
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-400' },
  red: { bg: 'bg-red-500/10', text: 'text-red-400' },
  slate: { bg: 'bg-slate-500/10', text: 'text-slate-400' }
}

const iconBgClass = computed(() => colorMap[props.color]?.bg || colorMap.cyan.bg)
const iconColorClass = computed(() => colorMap[props.color]?.text || colorMap.cyan.text)

// Size mappings
const sizeMap: Record<string, string> = {
  sm: 'text-xl lg:text-2xl',
  md: 'text-2xl lg:text-3xl',
  lg: 'text-3xl lg:text-4xl'
}

const sizeClass = computed(() => sizeMap[props.size] || sizeMap.md)

// Format value based on format prop
const formattedValue = computed(() => {
  if (typeof props.value === 'string') return props.value
  
  switch (props.format) {
    case 'currency':
      // Assuming value is in cents
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(props.value / 100)
    
    case 'number':
      return new Intl.NumberFormat('en-US').format(props.value)
    
    case 'percent':
      return `${props.value.toFixed(1)}%`
    
    default:
      return String(props.value)
  }
})
</script>
