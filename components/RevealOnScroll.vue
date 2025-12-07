<template>
  <div
    ref="elementRef"
    :class="['reveal-container', animationClass, { visible: isVisible }]"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { useScrollReveal } from '~/composables/useScrollReveal'

interface Props {
  animation?: 'fade-up' | 'fade-down' | 'fade-left' | 'fade-right' | 'zoom-in' | 'zoom-out'
  delay?: number
  threshold?: number
}

const props = withDefaults(defineProps<Props>(), {
  animation: 'fade-up',
  delay: 0,
  threshold: 0.1
})

const { isVisible, elementRef } = useScrollReveal({
  threshold: props.threshold,
  once: true
})

const animationClass = computed(() => `animation-${props.animation}`)
</script>

<style scoped>
.reveal-container {
  opacity: 0;
  will-change: transform, opacity;
  transition: opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1),
              transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.reveal-container.visible {
  opacity: 1;
  will-change: auto;
}

/* Fade Up */
.animation-fade-up {
  transform: translateY(40px);
}

.animation-fade-up.visible {
  transform: translateY(0);
}

/* Fade Down */
.animation-fade-down {
  transform: translateY(-40px);
}

.animation-fade-down.visible {
  transform: translateY(0);
}

/* Fade Left */
.animation-fade-left {
  transform: translateX(40px);
}

.animation-fade-left.visible {
  transform: translateX(0);
}

/* Fade Right */
.animation-fade-right {
  transform: translateX(-40px);
}

.animation-fade-right.visible {
  transform: translateX(0);
}

/* Zoom In */
.animation-zoom-in {
  transform: scale(0.95);
}

.animation-zoom-in.visible {
  transform: scale(1);
}

/* Zoom Out */
.animation-zoom-out {
  transform: scale(1.05);
}

.animation-zoom-out.visible {
  transform: scale(1);
}

@media (prefers-reduced-motion: reduce) {
  .reveal-container {
    opacity: 1 !important;
    transform: none !important;
    transition: none !important;
    will-change: auto !important;
  }
}
</style>
