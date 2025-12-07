<template>
  <div class="scroll-progress-container">
    <div class="scroll-progress-bar" :style="{ width: `${scrollProgress}%` }"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const scrollProgress = ref(0)

const updateScrollProgress = () => {
  const windowHeight = window.innerHeight
  const documentHeight = document.documentElement.scrollHeight
  const scrollTop = window.scrollY
  
  const scrollableHeight = documentHeight - windowHeight
  const progress = (scrollTop / scrollableHeight) * 100
  
  scrollProgress.value = Math.min(Math.max(progress, 0), 100)
}

onMounted(() => {
  window.addEventListener('scroll', updateScrollProgress, { passive: true })
  updateScrollProgress()
})

onUnmounted(() => {
  window.removeEventListener('scroll', updateScrollProgress)
})
</script>

<style scoped>
.scroll-progress-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background-color: rgba(30, 41, 59, 0.5);
  z-index: 9998;
}

.scroll-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #06b6d4);
  transition: width 0.1s ease-out;
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
}
</style>
