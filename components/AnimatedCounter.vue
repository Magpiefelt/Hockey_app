<template>
  <div class="animated-counter">
    <span class="counter-value">{{ displayValue }}</span>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'

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
const counterElement = ref<HTMLElement | null>(null)

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
    
    const formattedValue = currentValue.value.toFixed(props.decimals)
    displayValue.value = props.prefix + formattedValue + props.suffix
    
    if (progress < 1) {
      requestAnimationFrame(animate)
    }
  }
  
  animate()
}

onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !hasAnimated.value) {
          animateCounter()
        }
      })
    },
    { threshold: 0.5 }
  )
  
  const element = document.querySelector('.animated-counter')
  if (element) {
    observer.observe(element)
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
