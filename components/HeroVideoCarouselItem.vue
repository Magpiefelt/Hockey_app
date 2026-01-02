<template>
  <div 
    class="video-carousel-item relative overflow-hidden rounded-lg border-2 border-cyan-400/30 bg-slate-900/50 backdrop-blur-sm transition-all duration-300 hover:border-cyan-400 hover:scale-105 cursor-pointer group"
    :class="itemClass"
    ref="itemRef"
    role="button"
    tabindex="0"
    :aria-label="`Play video: ${title || category || 'Video'}`"
    @click="handleClick"
    @keydown.enter="handleClick"
    @keydown.space.prevent="handleClick"
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
      
      <!-- Poster Image (shown before video loads) -->
      <img
        v-if="posterSrc && !shouldLoadVideo"
        :src="posterSrc"
        :alt="title || 'Video thumbnail'"
        class="h-full w-full object-cover"
        loading="lazy"
      />
      
      <!-- Loading State -->
      <div
        v-if="shouldLoadVideo && !videoLoaded && !videoError"
        class="absolute inset-0 flex items-center justify-center bg-slate-800"
      >
        <div class="flex flex-col items-center gap-2">
          <div class="h-8 w-8 animate-spin rounded-full border-4 border-slate-600 border-t-cyan-400"></div>
          <p class="text-xs text-slate-400">Loading...</p>
        </div>
      </div>
      
      <!-- Video Element (only loads when in viewport) -->
      <video
        v-if="shouldLoadVideo"
        ref="videoRef"
        :poster="posterSrc"
        class="h-full w-full object-cover"
        :class="videoClass"
        loop
        muted
        playsinline
        preload="none"
        @loadeddata="onVideoLoaded"
        @error="onVideoError"
        @canplay="onVideoCanPlay"
      ></video>
      
      <!-- Play Button Overlay (visible on hover) -->
      <div 
        class="play-overlay absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        :class="{ 'opacity-100': !videoLoaded && !videoError }"
      >
        <div class="play-button-wrapper">
          <div class="play-button">
            <Icon name="mdi:play" class="play-icon" />
          </div>
          <span class="play-text">Click to play</span>
        </div>
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
      class="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 text-sm font-bold text-white shadow-lg z-10"
    >
      {{ number }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'

interface VideoData {
  src: string
  posterSrc?: string
  category?: string
  title?: string
  orientation?: 'landscape' | 'portrait' | 'auto'
}

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

const emit = defineEmits<{
  'video-clicked': [videoData: VideoData]
}>()

const itemRef = ref<HTMLElement | null>(null)
const videoRef = ref<HTMLVideoElement | null>(null)
const videoLoaded = ref(false)
const videoError = ref(false)
const shouldLoadVideo = ref(false)
const retryCount = ref(0)
const maxRetries = 2
const observer = ref<IntersectionObserver | null>(null)

const isPortrait = computed(() => {
  return props.orientation === 'portrait'
})

const itemClass = computed(() => {
  return {
    'opacity-100': videoLoaded.value || !shouldLoadVideo.value,
    'opacity-50': shouldLoadVideo.value && (!videoLoaded.value || videoError.value)
  }
})

const videoClass = computed(() => {
  if (isPortrait.value) {
    return 'object-contain z-10 relative'
  }
  return 'object-cover'
})

// Handle click to open video in modal
const handleClick = () => {
  // Don't emit if there's a video error
  if (videoError.value) return
  
  emit('video-clicked', {
    src: props.videoSrc,
    posterSrc: props.posterSrc,
    category: props.category,
    title: props.title,
    orientation: props.orientation
  })
}

const onVideoLoaded = () => {
  videoLoaded.value = true
}

const onVideoCanPlay = () => {
  videoLoaded.value = true
  // Start playing once loaded
  if (videoRef.value) {
    videoRef.value.play().catch(() => {
      // Autoplay failed, video will show paused
    })
  }
}

const onVideoError = (error: Event) => {
  if (retryCount.value < maxRetries) {
    retryCount.value++
    const videoElement = (error.target as HTMLVideoElement)
    if (videoElement) {
      setTimeout(() => {
        videoElement.load()
      }, 1000 * retryCount.value)
    }
  } else {
    videoError.value = true
  }
}

onMounted(() => {
  // Use Intersection Observer to lazy load videos
  if (itemRef.value) {
    observer.value = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !shouldLoadVideo.value) {
            // Video is in viewport, start loading
            shouldLoadVideo.value = true
            
            // Set video source after DOM update
            setTimeout(() => {
              if (videoRef.value) {
                videoRef.value.src = props.videoSrc
                videoRef.value.load()
              }
            }, 0)
            
            // Disconnect observer after loading starts
            if (observer.value) {
              observer.value.disconnect()
            }
          }
        })
      },
      { 
        rootMargin: '100px', // Start loading 100px before entering viewport
        threshold: 0.1 
      }
    )
    observer.value.observe(itemRef.value)
  }
})

onUnmounted(() => {
  if (observer.value) {
    observer.value.disconnect()
  }
})
</script>

<style scoped>
.video-carousel-item {
  min-height: 200px;
}

/* Smooth fade-in when video loads */
video {
  transition: opacity 0.3s ease-in-out;
}

/* Play overlay styles */
.play-overlay {
  pointer-events: none;
  z-index: 5;
}

.play-button-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  transform: scale(0.9);
  transition: transform 0.3s ease;
}

.group:hover .play-button-wrapper {
  transform: scale(1);
}

.play-button {
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(6, 182, 212, 0.9));
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 
    0 10px 25px rgba(0, 0, 0, 0.3),
    0 0 30px rgba(34, 211, 238, 0.3);
  transition: all 0.3s ease;
}

.group:hover .play-button {
  transform: scale(1.1);
  box-shadow: 
    0 15px 35px rgba(0, 0, 0, 0.4),
    0 0 40px rgba(34, 211, 238, 0.5);
}

.play-icon {
  width: 2rem;
  height: 2rem;
  color: white;
  margin-left: 0.25rem; /* Optical centering for play icon */
}

.play-text {
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  opacity: 0;
  transform: translateY(-5px);
  transition: all 0.3s ease;
}

.group:hover .play-text {
  opacity: 1;
  transform: translateY(0);
}

/* Focus styles for accessibility */
.video-carousel-item:focus {
  outline: none;
  border-color: #22d3ee;
  box-shadow: 0 0 0 3px rgba(34, 211, 238, 0.3);
}

.video-carousel-item:focus .play-overlay {
  opacity: 1;
}

/* Ensure number badge stays above play overlay */
.video-carousel-item > .absolute.right-3.top-3 {
  z-index: 10;
}
</style>
