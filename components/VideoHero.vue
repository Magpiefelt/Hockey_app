<template>
  <div class="video-hero">
    <!-- Video Background -->
    <div v-if="videoUrl" class="video-background">
      <video
        ref="videoRef"
        :src="videoUrl"
        autoplay
        loop
        muted
        playsinline
        class="video-element"
      />
      <div class="video-overlay"></div>
    </div>
    
    <!-- Fallback Gradient Background -->
    <div v-else class="gradient-background">
      <div class="animated-orbs">
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="orb orb-3"></div>
      </div>
    </div>
    
    <!-- Content -->
    <div class="hero-content">
      <slot />
    </div>
    
    <!-- Scroll Indicator -->
    <div class="scroll-indicator">
      <Icon name="mdi:chevron-down" class="w-8 h-8 text-white/50 animate-bounce" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Props {
  videoUrl?: string
}

defineProps<Props>()

const videoRef = ref<HTMLVideoElement | null>(null)

onMounted(() => {
  if (videoRef.value) {
    // Ensure video plays on mobile devices
    videoRef.value.play().catch(() => {
      // Autoplay was prevented, video will show as poster
      console.log('Video autoplay was prevented')
    })
  }
})
</script>

<style scoped>
.video-hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.video-background {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.video-element {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(15, 23, 42, 0.7) 0%,
    rgba(30, 41, 59, 0.8) 50%,
    rgba(15, 23, 42, 0.9) 100%
  );
}

.gradient-background {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0f172a 100%);
  z-index: 0;
}

.animated-orbs {
  position: absolute;
  inset: 0;
  opacity: 0.3;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  animation: float 20s ease-in-out infinite;
}

.orb-1 {
  width: 500px;
  height: 500px;
  background: #3b82f6;
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}

.orb-2 {
  width: 400px;
  height: 400px;
  background: #8b5cf6;
  top: 40%;
  right: 10%;
  animation-delay: 7s;
}

.orb-3 {
  width: 450px;
  height: 450px;
  background: #06b6d4;
  bottom: 10%;
  left: 50%;
  animation-delay: 14s;
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(50px, -50px) scale(1.1);
  }
  66% {
    transform: translate(-50px, 50px) scale(0.9);
  }
}

.hero-content {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 80rem;
  margin: 0 auto;
  padding: 2rem;
}

.scroll-indicator {
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}

@media (max-width: 768px) {
  .video-hero {
    min-height: 80vh;
  }
  
  .orb {
    filter: blur(60px);
  }
  
  .orb-1,
  .orb-2,
  .orb-3 {
    width: 300px;
    height: 300px;
  }
}
</style>
