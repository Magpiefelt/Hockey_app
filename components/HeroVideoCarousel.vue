<template>
  <div class="video-carousel-wrapper relative h-full w-full">
    <!-- Film Strip Frame -->
    <div class="film-strip-frame absolute inset-0 rounded-2xl border-4 border-dashed border-cyan-400/30 pointer-events-none z-20"></div>
    
    <!-- Carousel Container -->
    <div 
      class="carousel-container relative h-full overflow-hidden rounded-2xl bg-slate-950/60 backdrop-blur-md shadow-2xl shadow-cyan-500/10"
      @mouseenter="pauseAnimation"
      @mouseleave="resumeAnimation"
    >
      <!-- Scrolling Videos Container -->
      <div 
        ref="scrollContainer"
        class="scroll-content flex flex-col gap-4 p-4"
        :style="scrollStyle"
      >
        <!-- First Set of Videos -->
        <HeroVideoCarouselItem
          v-for="(video, index) in videos"
          :key="`video-${index}`"
          :video-src="video.src"
          :poster-src="video.poster"
          :category="video.category"
          :title="video.title"
          :number="String(index + 1).padStart(2, '0')"
          :orientation="video.orientation"
          :show-info="showVideoInfo"
        />
        
        <!-- Duplicate Set for Seamless Loop -->
        <HeroVideoCarouselItem
          v-for="(video, index) in videos"
          :key="`video-duplicate-${index}`"
          :video-src="video.src"
          :poster-src="video.poster"
          :category="video.category"
          :title="video.title"
          :number="String(index + 1).padStart(2, '0')"
          :orientation="video.orientation"
          :show-info="showVideoInfo"
        />
      </div>
    </div>
    
    <!-- Gradient Overlays for Fade Effect -->
    <div class="pointer-events-none absolute left-0 right-0 top-0 z-10 h-32 bg-gradient-to-b from-slate-950/90 to-transparent"></div>
    <div class="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-40 bg-gradient-to-t from-slate-950/90 to-transparent"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface VideoItem {
  src: string
  poster?: string
  category?: string
  title?: string
  orientation?: 'landscape' | 'portrait' | 'auto'
}

interface Props {
  videos: VideoItem[]
  scrollSpeed?: number
  showVideoInfo?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  scrollSpeed: 30, // pixels per second
  showVideoInfo: true
})

const scrollContainer = ref<HTMLElement | null>(null)
const scrollPosition = ref(0)
const isPaused = ref(false)
const isVisible = ref(true)
const animationFrameId = ref<number | null>(null)
const lastTimestamp = ref<number>(0)
const observer = ref<IntersectionObserver | null>(null)

const scrollStyle = computed(() => {
  return {
    transform: `translateY(-${scrollPosition.value}px)`,
    transition: isPaused.value ? 'transform 0.3s ease-out' : 'none'
  }
})

const animate = (timestamp: number) => {
  if (!lastTimestamp.value) {
    lastTimestamp.value = timestamp
  }
  
  const deltaTime = timestamp - lastTimestamp.value
  lastTimestamp.value = timestamp
  
  if (!isPaused.value && isVisible.value && scrollContainer.value) {
    // Calculate scroll increment based on time elapsed
    const scrollIncrement = (props.scrollSpeed * deltaTime) / 1000
    scrollPosition.value += scrollIncrement
    
    // Get the height of one set of videos
    const containerHeight = scrollContainer.value.scrollHeight / 2
    
    // Reset position when we've scrolled through one complete set
    if (scrollPosition.value >= containerHeight) {
      scrollPosition.value = 0
    }
  }
  
  animationFrameId.value = requestAnimationFrame(animate)
}

const pauseAnimation = () => {
  isPaused.value = true
}

const resumeAnimation = () => {
  isPaused.value = false
}

onMounted(() => {
  animationFrameId.value = requestAnimationFrame(animate)
  
  // Pause animation when carousel is not visible (performance optimization)
  if (scrollContainer.value) {
    observer.value = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisible.value = entry.isIntersecting
        })
      },
      { threshold: 0.1 }
    )
    observer.value.observe(scrollContainer.value)
  }
})

onUnmounted(() => {
  if (animationFrameId.value !== null) {
    cancelAnimationFrame(animationFrameId.value)
  }
  if (observer.value) {
    observer.value.disconnect()
  }
})
</script>

<style scoped>
.video-carousel-wrapper {
  min-height: 600px;
  max-height: 800px;
}

.carousel-container {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.film-strip-frame {
  animation: pulse-border 3s ease-in-out infinite;
}

@keyframes pulse-border {
  0%, 100% {
    border-color: rgba(34, 211, 238, 0.4);
  }
  50% {
    border-color: rgba(34, 211, 238, 0.6);
  }
}

.scroll-content {
  will-change: transform;
}

/* Smooth scrolling performance */
@media (prefers-reduced-motion: reduce) {
  .scroll-content {
    animation: none;
  }
}
</style>
