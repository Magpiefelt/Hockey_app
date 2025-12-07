<template>
  <div ref="sectionRef" class="parallax-section" :style="sectionStyle">
    <div class="parallax-background" :style="backgroundStyle">
      <div class="parallax-overlay"></div>
    </div>
    <div class="parallax-content">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface Props {
  speed?: number
  imageUrl?: string
  gradient?: string
}

const props = withDefaults(defineProps<Props>(), {
  speed: 0.5,
  gradient: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.9))'
})

const sectionRef = ref<HTMLElement | null>(null)
const scrollY = ref(0)
const sectionTop = ref(0)

const backgroundStyle = computed(() => {
  const offset = (scrollY.value - sectionTop.value) * props.speed
  return {
    transform: `translateY(${offset}px)`,
    backgroundImage: props.imageUrl ? `url(${props.imageUrl})` : 'none'
  }
})

const sectionStyle = computed(() => ({
  background: !props.imageUrl ? props.gradient : 'transparent'
}))

const handleScroll = () => {
  scrollY.value = window.scrollY
}

onMounted(() => {
  if (sectionRef.value) {
    sectionTop.value = sectionRef.value.offsetTop
  }
  window.addEventListener('scroll', handleScroll, { passive: true })
  handleScroll()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.parallax-section {
  position: relative;
  overflow: hidden;
  min-height: 600px;
}

.parallax-background {
  position: absolute;
  inset: -10%;
  background-size: cover;
  background-position: center;
  will-change: transform;
}

.parallax-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.85), rgba(30, 41, 59, 0.85));
}

.parallax-content {
  position: relative;
  z-index: 1;
  padding: 6rem 0;
}

@media (prefers-reduced-motion: reduce) {
  .parallax-background {
    transform: none !important;
  }
}
</style>
