<template>
  <span ref="counterRef" class="animated-counter">
    <span class="counter-value">{{ displayValue }}</span>
  </span>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'

interface Props {
  endValue: number
  duration?: number
  suffix?: string
  prefix?: string
  decimals?: number
}

const props = withDefaults(defineProps<Props>(), {
  duration: 2000,
  suffix: '',
  prefix: '',
  decimals: 0
})

const displayValue = ref(props.prefix + '0' + props.suffix)
const currentValue = ref(0)
const hasAnimated = ref(false)
const counterRef = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

const easeOutQuad = (t: number): number => {
  return t * (2 - t)
}

const animateCounter = () => {
  if (hasAnimated.value) return
  
  hasAnimated.value = true
  const startTime = Date.now()
  const startValue = 0
  const endValue = props.endValue
  
  const animate = () => {
    const now = Date.now()
    const elapsed = now - startTime
    const progress = Math.min(elapsed / props.duration, 1)
    const easedProgress = easeOutQuad(progress)
    
    currentValue.value = startValue + (endValue - startValue) * easedProgress
    
    // Format value - use Math.round for integers, toFixed for decimals
    let formattedValue: string
    if (props.decimals === 0) {
      formattedValue = Math.round(currentValue.value).toString()
    } else {
      formattedValue = currentValue.value.toFixed(props.decimals)
    }
    
    displayValue.value = props.prefix + formattedValue + props.suffix
    
    if (progress < 1) {
      requestAnimationFrame(animate)
    }
  }
  
  animate()
}

onMounted(() => {
  // Use the template ref instead of querySelector
  if (!counterRef.value) return
  
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !hasAnimated.value) {
          animateCounter()
        }
      })
    },
    { 
      threshold: 0.2,
      rootMargin: '0px 0px -50px 0px'
    }
  )
  
  observer.observe(counterRef.value)
})

// Cleanup observer on unmount
onUnmounted(() => {
  if (observer) {
    observer.disconnect()
    observer = null
  }
})

// Watch for prop changes to re-animate if needed
watch(() => props.endValue, (newVal) => {
  if (hasAnimated.value) {
    // Reset and re-animate when endValue changes
    hasAnimated.value = false
    animateCounter()
  }
})
</script>

<style scoped>
.animated-counter {
  display: inline-block;
}

.counter-value {
  font-variant-numeric: tabular-nums;
}
</style>
