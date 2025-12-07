<template>
  <div 
    class="video-carousel-item relative overflow-hidden rounded-lg border-2 border-cyan-400/30 bg-slate-900/50 backdrop-blur-sm transition-all duration-300 hover:border-cyan-400 hover:scale-105"
    :class="itemClass"
  >
    <!-- Video Container -->
    <div class="relative aspect-video w-full overflow-hidden">
      <!-- Error Fallback -->
      <div
        v-if="videoError"
        class="absolute inset-0 flex flex-col items-center justify-center bg-slate-800 text-center p-4"
      >
        <Icon name="mdi:alert-circle-outline" class="h-12 w-12 text-red-400 mb-3" />
        <p class="text-sm text-slate-300 font-semibold">Video unavailable</p>
        <p class="text-xs text-slate-500 mt-1">{{ category || 'Content' }}</p>
      </div>
      
      <!-- Loading State -->
      <div
        v-if="!videoLoaded && !videoError"
        class="absolute inset-0 flex items-center justify-center bg-slate-800"
      >
        <div class="flex flex-col items-center gap-2">
          <div class="h-8 w-8 animate-spin rounded-full border-4 border-slate-600 border-t-cyan-400"></div>
          <p class="text-xs text-slate-400">Loading...</p>
        </div>
      </div>
      
      <video
        :src="videoSrc"
        :poster="posterSrc"
        class="h-full w-full object-cover"
        :class="videoClass"
        autoplay
        loop
        muted
        playsinline
        preload="metadata"
        loading="lazy"
        @loadeddata="onVideoLoaded"
        @error="onVideoError"
      ></video>
      
      <!-- Overlay for portrait videos with blurred background -->
      <div 
        v-if="isPortrait" 
        class="absolute inset-0 -z-10"
      >
        <video
          :src="videoSrc"
          class="h-full w-full object-cover blur-2xl opacity-50"
          autoplay
          loop
          muted
          playsinline
          preload="metadata"
          loading="lazy"
        ></video>
      </div>
    </div>
    
    <!-- Video Info Overlay -->
    <div 
      v-if="showInfo"
      class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent p-4"
    >
      <div v-if="category" class="mb-1 text-xs font-bold uppercase tracking-wider text-cyan-400">
        {{ category }}
      </div>
      <div v-if="title" class="text-sm font-semibold text-white">
        {{ title }}
      </div>
    </div>
    
    <!-- Number Badge (optional) -->
    <div 
      v-if="number"
      class="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 text-sm font-bold text-white shadow-lg"
    >
      {{ number }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

interface Props {
  videoSrc: string
  posterSrc?: string
  category?: string
  title?: string
  number?: string | number
  orientation?: 'landscape' | 'portrait' | 'auto'
  showInfo?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  posterSrc: '',
  category: '',
  title: '',
  number: undefined,
  orientation: 'auto',
  showInfo: true
})

const videoLoaded = ref(false)
const videoError = ref(false)
const retryCount = ref(0)
const maxRetries = 2

const isPortrait = computed(() => {
  return props.orientation === 'portrait'
})

const itemClass = computed(() => {
  return {
    'opacity-100': videoLoaded.value,
    'opacity-50': !videoLoaded.value || videoError.value
  }
})

const videoClass = computed(() => {
  if (isPortrait.value) {
    return 'object-contain z-10 relative'
  }
  return 'object-cover'
})

const onVideoLoaded = () => {
  videoLoaded.value = true
}

const onVideoError = (error: Event) => {
  console.error('Video loading error:', error)
  
  // Attempt retry if under max retries
  if (retryCount.value < maxRetries) {
    retryCount.value++
    console.log(`Retrying video load (${retryCount.value}/${maxRetries})...`)
    
    // Force reload by updating src
    const videoElement = (error.target as HTMLVideoElement)
    if (videoElement) {
      setTimeout(() => {
        videoElement.load()
      }, 1000 * retryCount.value) // Exponential backoff
    }
  } else {
    videoError.value = true
  }
}
</script>

<style scoped>
.video-carousel-item {
  min-height: 200px;
}

/* Smooth fade-in when video loads */
video {
  transition: opacity 0.3s ease-in-out;
}
</style>
