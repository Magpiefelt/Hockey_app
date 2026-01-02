<template>
  <section id="main-content" class="hero-section relative min-h-screen overflow-hidden">
    <!-- Animated Background Layers -->
    <div class="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900"></div>
    
    <!-- Ice Rink Texture Overlay -->
    <div class="absolute inset-0 opacity-10">
      <div class="absolute inset-0" style="
        background-image: 
          repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(59, 130, 246, 0.3) 2px, rgba(59, 130, 246, 0.3) 4px),
          repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(59, 130, 246, 0.3) 2px, rgba(59, 130, 246, 0.3) 4px);
        background-size: 100px 100px;
      "></div>
    </div>
    
    <!-- Hockey Puck Pattern -->
    <div class="absolute inset-0 opacity-5">
      <div class="absolute inset-0" style="
        background-image: radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px);
        background-size: 50px 50px;
      "></div>
    </div>
    
    <!-- Animated Gradient Orbs -->
    <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
    <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style="animation-delay: 1s;"></div>
    
    <!-- Diagonal Stripes (Hockey Jersey Style) -->
    <div class="absolute inset-0 opacity-5">
      <div class="absolute inset-0" style="
        background: repeating-linear-gradient(
          45deg,
          transparent,
          transparent 80px,
          rgba(59, 130, 246, 0.5) 80px,
          rgba(59, 130, 246, 0.5) 160px
        );
      "></div>
    </div>
    
    <!-- Split-Screen Content Container -->
    <div class="container relative z-10 flex min-h-screen items-center px-4 py-12 md:py-16 lg:py-20">
      <div class="grid w-full grid-cols-1 gap-8 md:gap-12 lg:grid-cols-12 lg:gap-8 xl:gap-12">
        
        <!-- LEFT COLUMN: Branding & Text (55%) -->
        <div class="flex items-center justify-center lg:col-span-6">
          <RevealOnScroll animation="fade-right">
            <div class="max-w-3xl text-center lg:text-left">
              
              <!-- Trust Badge -->
              <div class="mb-6 flex justify-center lg:justify-start">
                <div class="inline-flex items-center gap-2 sm:gap-3 rounded-full border border-cyan-400/30 bg-slate-900/50 px-3 sm:px-4 py-2 backdrop-blur-sm">
                  <Icon name="mdi:star" class="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />
                  <span class="text-xs sm:text-sm font-semibold text-slate-200">Trusted by 50+ Teams</span>
                  <span class="text-xs sm:text-sm text-slate-400">•</span>
                  <span class="text-xs sm:text-sm font-semibold text-slate-200">500+ Events</span>
                </div>
              </div>
              
              <!-- Logo -->
              <div class="mb-12 flex justify-center lg:justify-start">
                <img 
                  src="/logo.png" 
                  alt="Elite Sports DJ" 
                  class="h-64 w-auto object-contain sm:h-80 md:h-96 lg:h-112 xl:h-128 2xl:h-144 hero-logo-animate" 
                  loading="eager"
                />
              </div>
              
              <!-- Dynamic Badge with Sports Icons -->
              <div class="mb-8 flex justify-center lg:justify-start">
                <div class="badge-sports inline-flex flex-wrap items-center justify-center gap-2 sm:gap-3 rounded-full border-2 border-cyan-400/50 bg-gradient-to-r from-blue-600/30 via-cyan-600/30 to-blue-600/30 px-4 sm:px-6 py-2 sm:py-3 backdrop-blur-md max-w-full">
                  <Icon name="mdi:hockey-sticks" class="h-4 w-4 sm:h-5 sm:w-5 text-cyan-300 animate-bounce hidden sm:inline-block" style="animation-delay: 0s;" />
                  <Icon name="mdi:basketball" class="h-4 w-4 sm:h-5 sm:w-5 text-blue-300 animate-bounce hidden sm:inline-block" style="animation-delay: 0.2s;" />
                  <span class="text-xs sm:text-sm md:text-base font-bold tracking-wider text-white uppercase text-center">Professional Game Day Entertainment</span>
                  <Icon name="mdi:baseball" class="h-4 w-4 sm:h-5 sm:w-5 text-cyan-300 animate-bounce hidden sm:inline-block" style="animation-delay: 0.4s;" />
                  <Icon name="mdi:football" class="h-4 w-4 sm:h-5 sm:w-5 text-blue-300 animate-bounce hidden sm:inline-block" style="animation-delay: 0.6s;" />
                </div>
              </div>
              
              <!-- Main Headline -->
              <h1 class="hero-headline mb-6 md:mb-8 text-3xl font-black leading-tight text-white sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl 2xl:text-7xl">
                <span class="block mb-2">ELEVATE YOUR</span>
                <span class="block bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent animate-gradient">
                  GAME DAY
                </span>
                <span class="block mt-2">EXPERIENCE</span>
              </h1>
              
              <!-- Subheadline -->
              <p class="mb-8 md:mb-10 lg:mb-12 max-w-3xl text-base sm:text-lg md:text-xl lg:text-lg xl:text-xl 2xl:text-2xl leading-relaxed text-slate-200 font-medium mx-auto lg:mx-0">
                Professional DJ services, player introductions, and event hosting for 
                <span class="text-cyan-300 font-bold">hockey</span>, 
                <span class="text-blue-300 font-bold">lacrosse</span>, 
                <span class="text-cyan-300 font-bold">baseball</span>, 
                <span class="text-blue-300 font-bold">basketball</span>, and more.
              </p>
              
              <!-- CTA Buttons -->
              <div class="flex flex-col items-center justify-center gap-4 sm:gap-6 sm:flex-row lg:justify-start">
                <NuxtLink
                  to="/request"
                  class="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-4 sm:px-10 sm:py-5 text-lg sm:text-xl font-bold text-white shadow-2xl shadow-blue-500/50 transition-all hover:scale-105 hover:shadow-cyan-500/50 rounded-lg inline-flex items-center justify-center w-full sm:w-auto"
                >
                  <span class="relative z-10 flex items-center gap-3">
                    Get Started
                    <Icon name="mdi:arrow-right" class="h-6 w-6 transition-transform group-hover:translate-x-1" />
                  </span>
                  <div class="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600 opacity-0 transition-opacity group-hover:opacity-100"></div>
                </NuxtLink>
                
                <button
                  @click="$emit('scroll-to-packages')"
                  class="group border-2 border-cyan-400/50 bg-slate-900/50 px-8 py-4 sm:px-10 sm:py-5 text-lg sm:text-xl font-bold text-white backdrop-blur-md transition-all hover:scale-105 hover:border-cyan-400 hover:bg-slate-800/50 rounded-lg inline-flex items-center justify-center cursor-pointer w-full sm:w-auto"
                >
                  <span class="flex items-center gap-3">
                    View Packages
                    <Icon name="mdi:package-variant" class="h-6 w-6" />
                  </span>
                </button>
              </div>
              
            </div>
          </RevealOnScroll>
        </div>
        
        <!-- RIGHT COLUMN: Video Carousel (45%) -->
        <div class="flex items-center justify-center lg:justify-end lg:col-span-6 lg:pt-0 lg:pl-8 xl:pl-12 2xl:pl-16">
          <RevealOnScroll animation="fade-left">
            <div class="w-full max-w-xs md:max-w-sm lg:max-w-md xl:max-w-lg">
              <HeroVideoCarousel 
                :videos="heroVideos"
                :scroll-speed="25"
                :show-video-info="true"
                :is-modal-open="isVideoModalOpen"
                @video-clicked="openVideoModal"
              />
            </div>
          </RevealOnScroll>
        </div>
        
      </div>
    </div>
    
    <!-- Scroll Indicator -->
    <div class="absolute bottom-10 left-1/2 z-20 -translate-x-1/2">
      <a href="#stats" class="block" aria-label="Scroll down to view statistics">
        <div class="animate-bounce">
          <Icon name="mdi:chevron-down" class="h-12 w-12 text-cyan-400 opacity-70" />
        </div>
      </a>
    </div>
    
    <!-- Bottom Gradient Fade -->
    <div class="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-dark-primary to-transparent"></div>
    
    <!-- Video Player Modal -->
    <VideoPlayerModal
      :is-open="isVideoModalOpen"
      :video-src="selectedVideo?.src || ''"
      :category="selectedVideo?.category"
      :title="selectedVideo?.title"
      :orientation="selectedVideo?.orientation"
      @close="closeVideoModal"
      @video-ended="onVideoEnded"
    />
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// Emit event for scroll to packages
defineEmits(['scroll-to-packages'])

// ============================================
// Video Modal State & Handlers
// ============================================
interface VideoData {
  src: string
  posterSrc?: string
  category?: string
  title?: string
  orientation?: 'landscape' | 'portrait' | 'auto'
}

const isVideoModalOpen = ref(false)
const selectedVideo = ref<VideoData | null>(null)

const openVideoModal = (videoData: VideoData) => {
  selectedVideo.value = videoData
  isVideoModalOpen.value = true
}

const closeVideoModal = () => {
  isVideoModalOpen.value = false
  // Clear selected video after transition completes
  setTimeout(() => {
    selectedVideo.value = null
  }, 300)
}

const onVideoEnded = () => {
  // Optional: Auto-close modal when video ends, or do nothing
  // closeVideoModal()
}

// ============================================
// Hero Video Carousel Data
// ============================================

// Define video data for the hero carousel
const heroVideos = ref([
  {
    src: '/videos/07465b89-b98e-424d-a378-76da8baa0202.mp4',
    poster: '/videos/07465b89-b98e-424d-a378-76da8baa0202.jpg',
    category: 'Hockey',
    title: 'Player Introductions',
    orientation: 'landscape' as const
  },
  {
    src: '/videos/502b2929-babc-4672-89b4-28b76582173e.mp4',
    poster: '/videos/502b2929-babc-4672-89b4-28b76582173e.jpg',
    category: 'Lacrosse',
    title: 'Game Day Energy',
    orientation: 'landscape' as const
  },
  {
    src: '/videos/a389a0ea-f77c-4324-9cea-a12632bbfb5f.mp4',
    poster: '/videos/a389a0ea-f77c-4324-9cea-a12632bbfb5f.jpg',
    category: 'Baseball',
    title: 'Crowd Engagement',
    orientation: 'landscape' as const
  },
  {
    src: '/videos/e889cdc0-d53e-42da-bf1f-6818e675148e.mp4',
    poster: '/videos/e889cdc0-d53e-42da-bf1f-6818e675148e.jpg',
    category: 'Basketball',
    title: 'Hype Videos',
    orientation: 'landscape' as const
  },
  {
    src: '/videos/eb33f3d7-190c-4ec1-8864-beac99ac6b23.mp4',
    poster: '/videos/eb33f3d7-190c-4ec1-8864-beac99ac6b23.jpg',
    category: 'Multi-Sport',
    title: 'Event Hosting',
    orientation: 'landscape' as const
  },
  {
    src: '/videos/f9a10068-aa48-4f4d-9826-1bc443978fee.mp4',
    poster: '/videos/f9a10068-aa48-4f4d-9826-1bc443978fee.jpg',
    category: 'Special Events',
    title: 'Custom Productions',
    orientation: 'landscape' as const
  }
])
</script>

<style scoped>
/* Hero-specific animations */
@keyframes gradient {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

.animate-gradient {
  background-size: 200% 200%;
  animation: gradient 3s ease infinite;
}

.hero-logo-animate {
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

.badge-sports {
  animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(34, 211, 238, 0.3);
  }
  50% {
    box-shadow: 0 0 30px rgba(34, 211, 238, 0.5);
  }
}
</style>
