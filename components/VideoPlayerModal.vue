<template>
  <Teleport to="body">
    <Transition name="video-modal">
      <div 
        v-if="isOpen" 
        class="video-modal-overlay"
        @click="closeModal"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="title ? 'video-modal-title' : undefined"
      >
        <div 
          class="video-modal-container"
          :class="containerClass"
          @click.stop
          ref="modalContent"
        >
          <!-- Close Button -->
          <button 
            class="video-modal-close" 
            @click="closeModal" 
            aria-label="Close video player"
          >
            <Icon name="mdi:close" class="w-6 h-6" />
          </button>
          
          <div class="video-modal-content">
            <!-- Video Player Wrapper -->
            <div class="video-player-wrapper" :class="orientationClass">
              <!-- Loading State -->
              <div 
                v-if="isLoading && !videoError"
                class="video-loading-state"
              >
                <div class="loading-spinner"></div>
                <p class="loading-text">Loading video...</p>
              </div>
              
              <!-- Error State -->
              <div 
                v-if="videoError"
                class="video-error-state"
              >
                <Icon name="mdi:alert-circle-outline" class="w-16 h-16 text-red-400 mb-4" />
                <p class="error-title">Video unavailable</p>
                <p class="error-message">Sorry, this video could not be loaded.</p>
                <button @click="retryVideo" class="retry-button">
                  <Icon name="mdi:refresh" class="w-5 h-5 mr-2" />
                  Try Again
                </button>
              </div>
              
              <!-- Video Element -->
              <video
                v-show="!isLoading && !videoError"
                ref="videoPlayer"
                class="video-player"
                controls
                playsinline
                @loadeddata="onVideoLoaded"
                @canplay="onVideoCanPlay"
                @error="onVideoError"
                @ended="onVideoEnded"
                @play="onVideoPlay"
                @pause="onVideoPause"
              >
                <source :src="videoSrc" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
            
            <!-- Video Info -->
            <div v-if="category || title" class="video-info">
              <div v-if="category" class="video-category">
                {{ category }}
              </div>
              <h3 v-if="title" id="video-modal-title" class="video-title">
                {{ title }}
              </h3>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'

interface Props {
  isOpen: boolean
  videoSrc: string
  category?: string
  title?: string
  orientation?: 'landscape' | 'portrait' | 'auto'
  autoplay?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  category: '',
  title: '',
  orientation: 'landscape',
  autoplay: true
})

const emit = defineEmits<{
  close: []
  videoEnded: []
  videoPlay: []
  videoPause: []
}>()

// Refs
const videoPlayer = ref<HTMLVideoElement | null>(null)
const modalContent = ref<HTMLElement | null>(null)
const isLoading = ref(true)
const videoError = ref(false)
const isPlaying = ref(false)

// Computed
const orientationClass = computed(() => {
  return {
    'orientation-landscape': props.orientation === 'landscape' || props.orientation === 'auto',
    'orientation-portrait': props.orientation === 'portrait'
  }
})

const containerClass = computed(() => {
  return {
    'container-portrait': props.orientation === 'portrait'
  }
})

// Methods
const closeModal = () => {
  // Pause video before closing
  if (videoPlayer.value) {
    videoPlayer.value.pause()
  }
  emit('close')
}

const onVideoLoaded = () => {
  isLoading.value = false
}

const onVideoCanPlay = () => {
  isLoading.value = false
  // Auto-play when ready if autoplay is enabled
  if (props.autoplay && videoPlayer.value && props.isOpen) {
    videoPlayer.value.play().catch((error) => {
      // Autoplay was prevented, user will need to click play
      console.warn('Autoplay prevented:', error)
    })
  }
}

const onVideoError = () => {
  isLoading.value = false
  videoError.value = true
}

const onVideoEnded = () => {
  isPlaying.value = false
  emit('videoEnded')
}

const onVideoPlay = () => {
  isPlaying.value = true
  emit('videoPlay')
}

const onVideoPause = () => {
  isPlaying.value = false
  emit('videoPause')
}

const retryVideo = () => {
  videoError.value = false
  isLoading.value = true
  if (videoPlayer.value) {
    videoPlayer.value.load()
  }
}

const loadVideo = async () => {
  if (!props.videoSrc) return
  
  isLoading.value = true
  videoError.value = false
  
  await nextTick()
  
  if (videoPlayer.value) {
    videoPlayer.value.src = props.videoSrc
    videoPlayer.value.load()
  }
}

// Watch for modal open/close
watch(() => props.isOpen, async (isOpen) => {
  if (import.meta.client) {
    if (isOpen) {
      // Lock body scroll
      document.body.style.overflow = 'hidden'
      
      // Load and play video
      await loadVideo()
      
      // Focus trap - focus the modal
      await nextTick()
      if (modalContent.value) {
        const closeButton = modalContent.value.querySelector('button') as HTMLElement
        closeButton?.focus()
      }
    } else {
      // Unlock body scroll
      document.body.style.overflow = ''
      
      // Reset states
      isLoading.value = true
      videoError.value = false
      isPlaying.value = false
      
      // Clear video source to stop any buffering
      if (videoPlayer.value) {
        videoPlayer.value.pause()
        videoPlayer.value.src = ''
        videoPlayer.value.load()
      }
    }
  }
})

// Watch for video source changes while modal is open
watch(() => props.videoSrc, () => {
  if (props.isOpen) {
    loadVideo()
  }
})

// Keyboard handling
const handleKeydown = (e: KeyboardEvent) => {
  if (!props.isOpen) return
  
  switch (e.key) {
    case 'Escape':
      closeModal()
      break
    case ' ':
      // Space bar to toggle play/pause (only if not focused on video controls)
      if (document.activeElement !== videoPlayer.value) {
        e.preventDefault()
        if (videoPlayer.value) {
          if (isPlaying.value) {
            videoPlayer.value.pause()
          } else {
            videoPlayer.value.play()
          }
        }
      }
      break
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  
  // Ensure body scroll is restored
  if (import.meta.client) {
    document.body.style.overflow = ''
  }
})
</script>

<style scoped>
.video-modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.92);
  backdrop-filter: blur(12px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  overflow-y: auto;
}

.video-modal-container {
  position: relative;
  width: 100%;
  max-width: 1100px;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border-radius: 1.5rem;
  border: 1px solid rgba(34, 211, 238, 0.2);
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.5),
    0 0 40px rgba(34, 211, 238, 0.1);
  max-height: 95vh;
  overflow: hidden;
}

.video-modal-container.container-portrait {
  max-width: 500px;
}

.video-modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 0.75rem;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 10;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.video-modal-close:hover {
  background-color: rgba(239, 68, 68, 0.8);
  transform: scale(1.1);
  border-color: rgba(239, 68, 68, 0.5);
}

.video-modal-close:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(34, 211, 238, 0.5);
}

.video-modal-content {
  padding: 0;
}

.video-player-wrapper {
  position: relative;
  width: 100%;
  background-color: #000;
  border-radius: 1.5rem 1.5rem 0 0;
  overflow: hidden;
}

.video-player-wrapper.orientation-landscape {
  aspect-ratio: 16 / 9;
}

.video-player-wrapper.orientation-portrait {
  aspect-ratio: 9 / 16;
  max-height: 70vh;
  margin: 0 auto;
}

.video-player {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background-color: #000;
}

/* Loading State */
.video-loading-state {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #0f172a;
}

.loading-spinner {
  width: 3rem;
  height: 3rem;
  border: 4px solid rgba(34, 211, 238, 0.2);
  border-top-color: #22d3ee;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  margin-top: 1rem;
  color: #94a3b8;
  font-size: 0.875rem;
}

/* Error State */
.video-error-state {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #0f172a;
  padding: 2rem;
  text-align: center;
}

.error-title {
  color: white;
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.error-message {
  color: #94a3b8;
  font-size: 0.875rem;
  margin-bottom: 1.5rem;
}

.retry-button {
  display: flex;
  align-items: center;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #3b82f6, #06b6d4);
  color: white;
  font-weight: 600;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
}

.retry-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(59, 130, 246, 0.3);
}

/* Video Info */
.video-info {
  padding: 1.5rem 2rem;
  background: linear-gradient(to top, rgba(15, 23, 42, 1), rgba(15, 23, 42, 0.95));
}

.video-category {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #22d3ee;
  margin-bottom: 0.5rem;
}

.video-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  margin: 0;
  line-height: 1.3;
}

/* Transitions */
.video-modal-enter-active,
.video-modal-leave-active {
  transition: opacity 0.3s ease;
}

.video-modal-enter-active .video-modal-container,
.video-modal-leave-active .video-modal-container {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.video-modal-enter-from,
.video-modal-leave-to {
  opacity: 0;
}

.video-modal-enter-from .video-modal-container,
.video-modal-leave-to .video-modal-container {
  transform: scale(0.95) translateY(20px);
  opacity: 0;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .video-modal-overlay {
    padding: 0.5rem;
  }
  
  .video-modal-container {
    border-radius: 1rem;
    max-height: 98vh;
  }
  
  .video-player-wrapper {
    border-radius: 1rem 1rem 0 0;
  }
  
  .video-modal-close {
    top: 0.75rem;
    right: 0.75rem;
    width: 2.5rem;
    height: 2.5rem;
  }
  
  .video-info {
    padding: 1rem 1.25rem;
  }
  
  .video-title {
    font-size: 1.125rem;
  }
}

/* Ensure video controls are visible */
.video-player::-webkit-media-controls {
  visibility: visible !important;
  opacity: 1 !important;
}
</style>
