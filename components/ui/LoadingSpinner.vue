<template>
  <div :class="containerClasses">
    <div :class="spinnerClasses"></div>
    <p v-if="text" :class="textClasses">{{ text }}</p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  centered?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  centered: false
})

const containerClasses = computed(() => {
  const base = 'flex flex-col items-center gap-3'
  return props.centered ? `${base} justify-center min-h-[200px]` : base
})

const spinnerClasses = computed(() => {
  const base = 'animate-spin rounded-full border-4 border-brand-600 border-t-transparent'
  
  const sizes = {
    sm: 'h-6 w-6 border-2',
    md: 'h-10 w-10 border-3',
    lg: 'h-16 w-16 border-4'
  }
  
  return `${base} ${sizes[props.size]}`
})

const textClasses = computed(() => {
  const sizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }
  
  return `text-slate-400 ${sizes[props.size]}`
})
</script>
