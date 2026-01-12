<template>
  <div 
    :class="[
      'border rounded-2xl overflow-hidden',
      variantClasses
    ]"
  >
    <!-- Header -->
    <div 
      v-if="title || $slots.action" 
      :class="[
        'flex items-center justify-between p-5 lg:p-6',
        showHeaderBorder ? 'border-b border-slate-800' : ''
      ]"
    >
      <h2 class="text-lg font-bold text-white flex items-center gap-2">
        <Icon v-if="icon" :name="icon" :class="['w-6 h-6', iconColorClass]" />
        {{ title }}
      </h2>
      <slot name="action">
        <NuxtLink 
          v-if="actionText && actionTo"
          :to="actionTo"
          class="text-sm text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 transition-colors"
        >
          {{ actionText }}
          <Icon name="mdi:arrow-right" class="w-4 h-4" />
        </NuxtLink>
      </slot>
    </div>
    
    <!-- Content -->
    <div :class="contentPadding">
      <slot />
    </div>
    
    <!-- Footer -->
    <div v-if="$slots.footer" class="border-t border-slate-800 p-5 lg:p-6">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * DataCard Component
 * Reusable card container for sections with headers, content, and optional footers
 * 
 * Usage:
 * <DataCard 
 *   title="Recent Orders" 
 *   icon="mdi:clipboard-list"
 *   icon-color="cyan"
 *   action-text="View All"
 *   action-to="/admin/orders"
 * >
 *   <template #default>
 *     <!-- Main content -->
 *   </template>
 *   <template #footer>
 *     <!-- Optional footer -->
 *   </template>
 * </DataCard>
 */

interface Props {
  title?: string
  icon?: string
  iconColor?: 'cyan' | 'emerald' | 'blue' | 'amber' | 'purple' | 'red' | 'slate'
  variant?: 'default' | 'glass' | 'gradient'
  actionText?: string
  actionTo?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  showHeaderBorder?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  iconColor: 'cyan',
  variant: 'default',
  padding: 'none',
  showHeaderBorder: true
})

// Variant classes
const variantClasses = computed(() => {
  switch (props.variant) {
    case 'glass':
      return 'bg-slate-900/30 backdrop-blur-sm border-slate-800/50'
    case 'gradient':
      return 'bg-gradient-to-br from-slate-900/50 to-slate-800/30 border-slate-800'
    default:
      return 'bg-slate-900/50 border-slate-800'
  }
})

// Icon color classes
const iconColorMap: Record<string, string> = {
  cyan: 'text-cyan-400',
  emerald: 'text-emerald-400',
  blue: 'text-blue-400',
  amber: 'text-amber-400',
  purple: 'text-purple-400',
  red: 'text-red-400',
  slate: 'text-slate-400'
}

const iconColorClass = computed(() => iconColorMap[props.iconColor] || iconColorMap.cyan)

// Content padding
const paddingMap: Record<string, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-6'
}

const contentPadding = computed(() => paddingMap[props.padding] || '')
</script>
