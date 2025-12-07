<template>
  <div class="testimonial-carousel">
    <div class="carousel-container">
      <!-- Testimonial Cards -->
      <Transition :name="transitionName" mode="out-in">
        <div :key="currentIndex" class="testimonial-card">
          <div class="quote-icon">
            <Icon name="mdi:format-quote-close" class="w-16 h-16 text-blue-400/30" />
          </div>
          
          <p class="testimonial-text">
            "{{ currentTestimonial.quote }}"
          </p>
          
          <div class="testimonial-author">
            <div :class="['author-avatar', getAvatarClass(currentIndex)]">
              {{ currentTestimonial.author.charAt(0) }}
            </div>
            <div class="author-info">
              <div class="author-name">{{ currentTestimonial.author }}</div>
              <div class="author-role">{{ currentTestimonial.role }}</div>
            </div>
          </div>
          
          <!-- Rating Stars -->
          <div class="rating">
            <Icon 
              v-for="i in 5" 
              :key="i" 
              name="mdi:star" 
              class="w-6 h-6 text-yellow-400"
            />
          </div>
        </div>
      </Transition>
    </div>
    
    <!-- Navigation Controls -->
    <div class="carousel-controls">
      <button 
        @click="previousTestimonial" 
        class="control-button"
        aria-label="Previous testimonial"
      >
        <Icon name="mdi:chevron-left" class="w-6 h-6" />
      </button>
      
      <!-- Dots Indicator -->
      <div class="dots-container">
        <button
          v-for="(_, index) in testimonials"
          :key="index"
          @click="goToTestimonial(index)"
          :class="['dot', { active: index === currentIndex }]"
          :aria-label="`Go to testimonial ${index + 1}`"
        />
      </div>
      
      <button 
        @click="nextTestimonial" 
        class="control-button"
        aria-label="Next testimonial"
      >
        <Icon name="mdi:chevron-right" class="w-6 h-6" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface Testimonial {
  quote: string
  author: string
  role: string
}

interface Props {
  testimonials: Testimonial[]
  autoplay?: boolean
  interval?: number
}

const props = withDefaults(defineProps<Props>(), {
  autoplay: true,
  interval: 5000
})

const currentIndex = ref(0)
const transitionName = ref('slide-left')
let autoplayTimer: NodeJS.Timeout | null = null

const currentTestimonial = computed(() => props.testimonials[currentIndex.value])

const nextTestimonial = () => {
  transitionName.value = 'slide-left'
  currentIndex.value = (currentIndex.value + 1) % props.testimonials.length
  resetAutoplay()
}

const previousTestimonial = () => {
  transitionName.value = 'slide-right'
  currentIndex.value = (currentIndex.value - 1 + props.testimonials.length) % props.testimonials.length
  resetAutoplay()
}

const goToTestimonial = (index: number) => {
  if (index === currentIndex.value) return
  transitionName.value = index > currentIndex.value ? 'slide-left' : 'slide-right'
  currentIndex.value = index
  resetAutoplay()
}

const getAvatarClass = (index: number) => {
  const classes = [
    'bg-gradient-to-br from-blue-500 to-cyan-500',
    'bg-gradient-to-br from-purple-500 to-pink-500',
    'bg-gradient-to-br from-green-500 to-emerald-500',
    'bg-gradient-to-br from-orange-500 to-red-500'
  ]
  return classes[index % classes.length]
}

const startAutoplay = () => {
  if (props.autoplay) {
    autoplayTimer = setInterval(() => {
      nextTestimonial()
    }, props.interval)
  }
}

const stopAutoplay = () => {
  if (autoplayTimer) {
    clearInterval(autoplayTimer)
    autoplayTimer = null
  }
}

const resetAutoplay = () => {
  stopAutoplay()
  startAutoplay()
}

onMounted(() => {
  startAutoplay()
})

onUnmounted(() => {
  stopAutoplay()
})
</script>

<style scoped>
.testimonial-carousel {
  width: 100%;
  max-width: 56rem;
  margin: 0 auto;
}

.carousel-container {
  position: relative;
  min-height: 24rem;
  margin-bottom: 3rem;
}

.testimonial-card {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.5), rgba(15, 23, 42, 0.5));
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 1.5rem;
  padding: 3rem;
  backdrop-filter: blur(10px);
  position: relative;
}

.quote-icon {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
}

.testimonial-text {
  font-size: 1.5rem;
  line-height: 1.75;
  color: #e2e8f0;
  font-style: italic;
  margin-bottom: 2.5rem;
  font-weight: 500;
}

.testimonial-author {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.author-avatar {
  width: 4rem;
  height: 4rem;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 900;
  color: white;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
}

.author-info {
  flex: 1;
}

.author-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: white;
  margin-bottom: 0.25rem;
}

.author-role {
  font-size: 1rem;
  color: #94a3b8;
}

.rating {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.carousel-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
}

.control-button {
  width: 3rem;
  height: 3rem;
  border-radius: 0.75rem;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(6, 182, 212, 0.2));
  border: 1px solid rgba(59, 130, 246, 0.3);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  backdrop-filter: blur(10px);
}

.control-button:hover {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.4), rgba(6, 182, 212, 0.4));
  transform: scale(1.1);
}

.dots-container {
  display: flex;
  gap: 0.75rem;
}

.dot {
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 9999px;
  background-color: rgba(148, 163, 184, 0.3);
  transition: all 0.3s;
  border: none;
  cursor: pointer;
}

.dot.active {
  width: 2rem;
  background: linear-gradient(135deg, #3b82f6, #06b6d4);
}

.dot:hover:not(.active) {
  background-color: rgba(148, 163, 184, 0.5);
  transform: scale(1.2);
}

/* Slide Transitions */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.5s ease;
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(100px);
}

.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-100px);
}

.slide-right-enter-from {
  opacity: 0;
  transform: translateX(-100px);
}

.slide-right-leave-to {
  opacity: 0;
  transform: translateX(100px);
}

@media (max-width: 768px) {
  .testimonial-card {
    padding: 2rem;
  }
  
  .testimonial-text {
    font-size: 1.125rem;
  }
  
  .author-avatar {
    width: 3rem;
    height: 3rem;
    font-size: 1.25rem;
  }
}
</style>
