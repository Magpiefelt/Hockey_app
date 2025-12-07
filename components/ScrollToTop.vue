<template>
  <Transition name="scroll-to-top">
    <button
      v-if="isVisible"
      @click="scrollToTop"
      class="scroll-to-top-button"
      aria-label="Scroll to top"
    >
      <Icon name="mdi:chevron-up" class="w-6 h-6" />
    </button>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useSmoothScroll } from '~/composables/useSmoothScroll'

const isVisible = ref(false)
const { scrollToTop: smoothScrollToTop } = useSmoothScroll()

const checkScroll = () => {
  isVisible.value = window.scrollY > 300
}

const scrollToTop = () => {
  smoothScrollToTop()
}

onMounted(() => {
  window.addEventListener('scroll', checkScroll, { passive: true })
  checkScroll()
})

onUnmounted(() => {
  window.removeEventListener('scroll', checkScroll)
})
</script>

<style scoped>
.scroll-to-top-button {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #06b6d4);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.5);
  cursor: pointer;
  z-index: 9997;
  transition: all 0.3s ease;
}

.scroll-to-top-button:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 35px -5px rgba(59, 130, 246, 0.6);
}

.scroll-to-top-button:active {
  transform: translateY(-2px);
}

/* Transition */
.scroll-to-top-enter-active,
.scroll-to-top-leave-active {
  transition: all 0.3s ease;
}

.scroll-to-top-enter-from,
.scroll-to-top-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.8);
}

@media (max-width: 768px) {
  .scroll-to-top-button {
    bottom: 1.5rem;
    right: 1.5rem;
    width: 3rem;
    height: 3rem;
  }
}
</style>
