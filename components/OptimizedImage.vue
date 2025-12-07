<template>
  <div class="optimized-image-container">
    <!-- Placeholder/skeleton while loading -->
    <div
      v-if="!isLoaded"
      :style="{
        paddingBottom: `${(height / width) * 100}%`,
        backgroundColor: '#f0f0f0',
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      }"
      class="relative w-full"
    />
    
    <!-- Actual image -->
    <img
      v-show="isLoaded"
      :src="src"
      :alt="alt"
      :width="width"
      :height="height"
      :loading="lazy ? 'lazy' : 'eager'"
      :decoding="decoding"
      class="w-full h-auto"
      @load="onImageLoad"
      @error="onImageError"
    />
    
    <!-- Error state -->
    <div
      v-if="hasError"
      class="flex items-center justify-center w-full h-64 bg-gray-200 text-gray-600"
    >
      <span>Failed to load image</span>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  src: string
  alt: string
  width?: number
  height?: number
  lazy?: boolean
  decoding?: 'async' | 'sync' | 'auto'
}

const props = withDefaults(defineProps<Props>(), {
  width: 1200,
  height: 800,
  lazy: true,
  decoding: 'async'
})

const isLoaded = ref(false)
const hasError = ref(false)

const onImageLoad = () => {
  isLoaded.value = true
  hasError.value = false
}

const onImageError = () => {
  hasError.value = true
  isLoaded.value = true
}
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
</style>
