<template>
  <component
    :is="componentType"
    :to="to"
    :type="!to ? type : undefined"
    :disabled="disabled"
    :class="buttonClasses"
    v-bind="$attrs"
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  to?: string
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  fullWidth?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  disabled: false,
  fullWidth: false,
})

// Properly resolve NuxtLink component for dynamic component usage
const componentType = computed(() => {
  if (props.to) {
    return resolveComponent('NuxtLink')
  }
  return 'button'
})

const buttonClasses = computed(() => {
  const base = 'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variants = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 focus-visible:ring-brand-500 shadow-md hover:shadow-lg',
    secondary: 'bg-accent-600 text-white hover:bg-accent-700 active:bg-accent-800 focus-visible:ring-accent-500 shadow-md hover:shadow-lg',
    outline: 'border-2 border-brand-600 text-brand-400 hover:bg-brand-600/10 hover:border-brand-500 active:bg-brand-600/20 focus-visible:ring-brand-500',
    ghost: 'text-slate-300 hover:bg-white/5 hover:text-white active:bg-white/10 focus-visible:ring-slate-500',
  }
  
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  }
  
  const width = props.fullWidth ? 'w-full' : ''
  
  return [base, variants[props.variant], sizes[props.size], width].filter(Boolean).join(' ')
})
</script>
