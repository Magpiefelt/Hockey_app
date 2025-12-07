<template>
  <div :class="['loading-skeleton', variantClass]">
    <div class="skeleton-shimmer"></div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'text' | 'card' | 'circle' | 'button' | 'image'
  width?: string
  height?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'text',
  width: '100%',
  height: 'auto'
})

const variantClass = computed(() => `skeleton-${props.variant}`)
</script>

<style scoped>
.loading-skeleton {
  position: relative;
  overflow: hidden;
  background: linear-gradient(
    90deg,
    rgba(30, 41, 59, 0.5) 0%,
    rgba(51, 65, 85, 0.5) 50%,
    rgba(30, 41, 59, 0.5) 100%
  );
  border-radius: 0.5rem;
}

.skeleton-shimmer {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(148, 163, 184, 0.1) 50%,
    transparent 100%
  );
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.skeleton-text {
  height: 1rem;
  width: 100%;
}

.skeleton-card {
  height: 12rem;
  width: 100%;
  border-radius: 1rem;
}

.skeleton-circle {
  height: 4rem;
  width: 4rem;
  border-radius: 50%;
}

.skeleton-button {
  height: 3rem;
  width: 8rem;
  border-radius: 0.75rem;
}

.skeleton-image {
  height: 16rem;
  width: 100%;
  border-radius: 1rem;
}
</style>
