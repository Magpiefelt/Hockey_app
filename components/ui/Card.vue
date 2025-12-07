<template>
  <div :class="cardClasses">
    <slot />
  </div>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'default' | 'glass' | 'bordered'
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  hover: true,
  padding: 'lg',
})

const cardClasses = computed(() => {
  const base = 'rounded-xl transition-all duration-200'
  
  const variants = {
    default: 'bg-slate-800 border border-slate-700 shadow-lg',
    glass: 'bg-slate-800/50 backdrop-blur-md border border-slate-700/50 shadow-xl',
    bordered: 'bg-slate-800/30 border-2 border-slate-700',
  }
  
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }
  
  const hover = props.hover ? 'hover:shadow-xl hover:border-slate-600' : ''
  
  return [base, variants[props.variant], paddings[props.padding], hover].filter(Boolean).join(' ')
})
</script>
