<template>
  <section :class="sectionClasses">
    <div :class="containerClasses">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'default' | 'dark' | 'darker' | 'gradient'
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl' | '7xl' | 'full'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  padding: 'lg',
  maxWidth: '6xl',
})

const sectionClasses = computed(() => {
  const base = 'relative'
  
  const variants = {
    default: 'bg-background',
    dark: 'bg-background-secondary',
    darker: 'bg-background-accent',
    gradient: 'bg-gradient-dark',
  }
  
  const paddings = {
    none: '',
    sm: 'px-4 py-16',
    md: 'px-4 py-20',
    lg: 'px-4 py-28 md:py-36',
    xl: 'px-4 py-36 md:py-48',
  }
  
  return [base, variants[props.variant], paddings[props.padding]].filter(Boolean).join(' ')
})

const containerClasses = computed(() => {
  const base = 'container mx-auto'
  
  const maxWidths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full',
  }
  
  return [base, maxWidths[props.maxWidth]].join(' ')
})
</script>
