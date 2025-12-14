<template>
  <div ref="sectionRef">
    <!-- Placeholder while section is not visible -->
    <div
      v-if="!isVisible && showPlaceholder"
      :style="{ minHeight: placeholderHeight }"
      class="w-full bg-slate-900/20 animate-pulse"
    />
    
    <!-- Actual content loads when visible -->
    <slot v-if="isVisible" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface Props {
  rootMargin?: string
  threshold?: number
  placeholderHeight?: string
  showPlaceholder?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  rootMargin: '200px', // Start loading 200px before section enters viewport
  threshold: 0.01,
  placeholderHeight: '400px',
  showPlaceholder: true
})

const sectionRef = ref<HTMLElement | null>(null)
const isVisible = ref(false)
const observer = ref<IntersectionObserver | null>(null)

onMounted(() => {
  if (!sectionRef.value) return

  observer.value = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !isVisible.value) {
          isVisible.value = true
          // Disconnect after first intersection to save resources
          if (observer.value) {
            observer.value.disconnect()
          }
        }
      })
    },
    {
      rootMargin: props.rootMargin,
      threshold: props.threshold
    }
  )

  observer.value.observe(sectionRef.value)
})

onUnmounted(() => {
  if (observer.value) {
    observer.value.disconnect()
  }
})
</script>

<style scoped>
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
