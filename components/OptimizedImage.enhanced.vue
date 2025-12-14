<template>
  <div class="optimized-image-container" ref="containerRef">
    <!-- Placeholder/skeleton while loading -->
    <div
      v-if="!isLoaded && !hasError"
      :style="{
        paddingBottom: aspectRatio ? `${aspectRatio}%` : `${(height / width) * 100}%`,
        backgroundColor: '#f0f0f0',
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      }"
      class="relative w-full"
    />
    
    <!-- Actual image with responsive support -->
    <picture v-show="isLoaded && !hasError">
      <!-- WebP format for modern browsers (if provided) -->
      <source
        v-if="srcWebp"
        :srcset="generateSrcset(srcWebp, 'webp')"
        :sizes="sizes"
        type="image/webp"
      />
      
      <!-- Fallback to original format -->
      <img
        :src="src"
        :srcset="generateSrcset(src)"
        :sizes="sizes"
        :alt="alt"
        :width="width"
        :height="height"
        :loading="shouldLazyLoad ? 'lazy' : 'eager'"
        :decoding="decoding"
        :fetchpriority="fetchpriority"
        class="w-full h-auto"
        @load="onImageLoad"
        @error="onImageError"
      />
    </picture>
    
    <!-- Error state -->
    <div
      v-if="hasError"
      class="flex items-center justify-center w-full h-64 bg-gray-200 text-gray-600"
    >
      <div class="text-center">
        <Icon name="mdi:image-broken" class="h-12 w-12 mx-auto mb-2 text-gray-400" />
        <span class="text-sm">Failed to load image</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface Props {
  src: string
  srcWebp?: string // Optional WebP version for better compression
  alt: string
  width?: number
  height?: number
  aspectRatio?: number // e.g., 56.25 for 16:9
  lazy?: boolean
  decoding?: 'async' | 'sync' | 'auto'
  fetchpriority?: 'high' | 'low' | 'auto'
  sizes?: string // Responsive sizes attribute
  responsiveWidths?: number[] // Widths to generate for srcset
}

const props = withDefaults(defineProps<Props>(), {
  width: 1200,
  height: 800,
  lazy: true,
  decoding: 'async',
  fetchpriority: 'auto',
  sizes: '100vw',
  responsiveWidths: () => [320, 640, 768, 1024, 1280, 1536]
})

const containerRef = ref<HTMLElement | null>(null)
const isLoaded = ref(false)
const hasError = ref(false)
const isInViewport = ref(false)
const observer = ref<IntersectionObserver | null>(null)

// Only lazy load if prop is true AND image is not in initial viewport
const shouldLazyLoad = computed(() => {
  return props.lazy && !isInViewport.value
})

const generateSrcset = (baseSrc: string, format?: string) => {
  // If the src already contains query params or is a full URL, handle accordingly
  const isFullUrl = baseSrc.startsWith('http')
  
  // For now, return the base src
  // In production, you'd generate multiple sizes:
  // return props.responsiveWidths.map(w => `${baseSrc}?w=${w} ${w}w`).join(', ')
  return baseSrc
}

const onImageLoad = () => {
  isLoaded.value = true
  hasError.value = false
}

const onImageError = () => {
  hasError.value = true
  isLoaded.value = true
}

onMounted(() => {
  if (!containerRef.value) return

  // Check if image is in initial viewport
  observer.value = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          isInViewport.value = true
          // Disconnect after first intersection
          if (observer.value) {
            observer.value.disconnect()
          }
        }
      })
    },
    {
      rootMargin: '50px', // Start loading slightly before entering viewport
      threshold: 0.01
    }
  )

  observer.value.observe(containerRef.value)
})

onUnmounted(() => {
  if (observer.value) {
    observer.value.disconnect()
  }
})
</script>

<style scoped>
.optimized-image-container {
  position: relative;
  overflow: hidden;
  background-color: #f0f0f0;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Ensure images don't cause layout shift */
img {
  display: block;
  max-width: 100%;
  height: auto;
}
</style>
