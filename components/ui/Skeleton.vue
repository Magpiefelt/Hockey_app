<template>
  <div :class="skeletonClasses" :style="customStyle"></div>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'text' | 'circular' | 'rectangular'
  width?: string
  height?: string
  lines?: number
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'rectangular',
  lines: 1
})

const skeletonClasses = computed(() => {
  const base = 'animate-pulse bg-gradient-to-r from-dark-secondary via-slate-700 to-dark-secondary bg-[length:200%_100%]'
  
  const variants = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg'
  }
  
  return `${base} ${variants[props.variant]}`
})

const customStyle = computed(() => {
  const style: Record<string, string> = {}
  
  if (props.width) {
    style.width = props.width
  }
  
  if (props.height) {
    style.height = props.height
  } else if (props.variant === 'text') {
    style.height = '1rem'
  } else if (props.variant === 'circular') {
    style.width = props.width || '3rem'
    style.height = props.width || '3rem'
  }
  
  return style
})
</script>

<style scoped>
@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.animate-pulse {
  animation: shimmer 2s infinite linear;
}
</style>
