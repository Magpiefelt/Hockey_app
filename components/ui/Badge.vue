<template>
  <span :class="badgeClasses">
    <slot />
  </span>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'brand' | 'success' | 'warning' | 'error' | 'neutral'
  size?: 'sm' | 'md'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'brand',
  size: 'md',
})

const badgeClasses = computed(() => {
  const base = 'inline-flex items-center gap-1.5 rounded-full font-semibold border'
  
  const variants = {
    brand: 'bg-brand-500/15 text-brand-400 border-brand-500/30',
    success: 'bg-success-500/15 text-success-400 border-success-500/30',
    warning: 'bg-warning-500/15 text-warning-400 border-warning-500/30',
    error: 'bg-error-500/15 text-error-400 border-error-500/30',
    neutral: 'bg-slate-700/30 text-slate-300 border-slate-600/40',
  }
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  }
  
  return [base, variants[props.variant], sizes[props.size]].join(' ')
})
</script>
