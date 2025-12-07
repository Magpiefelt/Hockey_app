<template>
  <Transition name="slide-up">
    <div
      v-if="isVisible"
      class="sticky-cta-bar fixed bottom-0 left-0 right-0 z-50 border-t-2 border-cyan-400/30 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 backdrop-blur-lg"
    >
      <div class="container mx-auto px-4 py-4">
        <div class="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <!-- Message -->
          <div class="text-center sm:text-left">
            <p class="text-lg font-bold text-white">
              Ready to elevate your game day?
            </p>
            <p class="text-sm text-slate-300">
              Get a custom quote in 24 hours
            </p>
          </div>
          
          <!-- CTA Button -->
          <div>
            <UiButton
              to="/request"
              class="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-3 font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:scale-105"
            >
              <span class="relative z-10 flex items-center gap-2">
                Get Quote
                <Icon name="mdi:arrow-right" class="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </span>
              <div class="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600 opacity-0 transition-opacity group-hover:opacity-100"></div>
            </UiButton>
          </div>
          
          <!-- Close Button -->
          <button
            @click="hide"
            class="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-800 hover:text-white sm:relative sm:right-0 sm:top-0"
            aria-label="Close sticky bar"
          >
            <Icon name="mdi:close" class="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const isVisible = ref(false)
const isDismissed = useLocalStorage('elite-sports-dj-cta-dismissed', false)

const checkScroll = () => {
  if (isDismissed.value) return
  
  // Show sticky bar after scrolling past hero section (approximately 100vh)
  const scrollPosition = window.scrollY
  const viewportHeight = window.innerHeight
  
  isVisible.value = scrollPosition > viewportHeight * 0.8
}

const hide = () => {
  isDismissed.value = true
  isVisible.value = false
}

onMounted(() => {
  window.addEventListener('scroll', checkScroll)
  checkScroll() // Check initial position
})

onUnmounted(() => {
  window.removeEventListener('scroll', checkScroll)
})
</script>

<style scoped>
.sticky-cta-bar {
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
}

/* Slide up animation */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

.slide-up-enter-to,
.slide-up-leave-from {
  transform: translateY(0);
  opacity: 1;
}
</style>
