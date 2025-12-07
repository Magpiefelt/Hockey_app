<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="modal-overlay" @click="closeModal">
        <div class="modal-container" @click.stop>
          <button class="modal-close" @click="closeModal" aria-label="Close modal">
            <Icon name="mdi:close" class="w-6 h-6" />
          </button>
          
          <div class="modal-content">
            <!-- Icon -->
            <div class="modal-icon-wrapper">
              <div :class="['modal-icon', iconColorClass]">
                <Icon :name="service.icon" class="w-16 h-16 text-white" />
              </div>
            </div>
            
            <!-- Title -->
            <h3 class="modal-title">{{ service.title }}</h3>
            
            <!-- Description -->
            <p class="modal-description">{{ service.description }}</p>
            
            <!-- Features List -->
            <div class="modal-features">
              <h4 class="features-title">What's Included:</h4>
              <ul class="features-list">
                <li v-for="feature in service.features" :key="feature" class="feature-item">
                  <Icon name="mdi:check-circle" class="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span>{{ feature }}</span>
                </li>
              </ul>
            </div>
            
            <!-- Pricing Info -->
            <div v-if="service.pricing" class="modal-pricing">
              <div class="pricing-label">Starting at</div>
              <div class="pricing-value">{{ service.pricing }}</div>
            </div>
            
            <!-- CTA Button -->
            <NuxtLink 
              to="/request"
              class="modal-cta"
            >
              Request This Service
              <Icon name="mdi:arrow-right" class="w-5 h-5" />
            </NuxtLink>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { watch } from 'vue'

interface Service {
  title: string
  description: string
  icon: string
  features: string[]
  pricing?: string
  color: string
}

interface Props {
  isOpen: boolean
  service: Service
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

const closeModal = () => {
  emit('close')
}

const iconColorClass = computed(() => {
  const colorMap: Record<string, string> = {
    blue: 'bg-gradient-to-br from-blue-500 to-cyan-500',
    purple: 'bg-gradient-to-br from-purple-500 to-pink-500',
    cyan: 'bg-gradient-to-br from-cyan-500 to-blue-500',
    green: 'bg-gradient-to-br from-green-500 to-emerald-500'
  }
  return colorMap[props.service.color] || colorMap.blue
})

// Lock body scroll when modal is open
watch(() => props.isOpen, (isOpen) => {
  if (import.meta.client) {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }
})

// Close on escape key
onMounted(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && props.isOpen) {
      closeModal()
    }
  }
  document.addEventListener('keydown', handleEscape)
  
  onUnmounted(() => {
    document.removeEventListener('keydown', handleEscape)
    if (import.meta.client) {
      document.body.style.overflow = ''
    }
  })
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  overflow-y: auto;
}

.modal-container {
  position: relative;
  width: 100%;
  max-width: 42rem;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border-radius: 1.5rem;
  border: 1px solid rgba(148, 163, 184, 0.2);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  max-height: 90vh;
  overflow-y: auto;
}

.modal-close {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.5rem;
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  z-index: 10;
}

.modal-close:hover {
  background-color: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.modal-content {
  padding: 3rem;
}

.modal-icon-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
}

.modal-icon {
  width: 6rem;
  height: 6rem;
  border-radius: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
}

.modal-title {
  font-size: 2.25rem;
  font-weight: 900;
  color: white;
  text-align: center;
  margin-bottom: 1.5rem;
}

.modal-description {
  font-size: 1.125rem;
  color: #cbd5e1;
  text-align: center;
  line-height: 1.75;
  margin-bottom: 2.5rem;
}

.modal-features {
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 1rem;
  padding: 2rem;
  margin-bottom: 2rem;
}

.features-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: white;
  margin-bottom: 1.5rem;
}

.features-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.feature-item {
  display: flex;
  align-items: start;
  gap: 0.75rem;
  color: #e2e8f0;
  font-size: 1rem;
  line-height: 1.5;
}

.modal-pricing {
  text-align: center;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(6, 182, 212, 0.1));
  border-radius: 1rem;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.pricing-label {
  font-size: 0.875rem;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.pricing-value {
  font-size: 2.5rem;
  font-weight: 900;
  background: linear-gradient(135deg, #3b82f6, #06b6d4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.modal-cta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  width: 100%;
  padding: 1.25rem 2rem;
  background: linear-gradient(135deg, #3b82f6, #06b6d4);
  color: white;
  font-weight: 700;
  font-size: 1.125rem;
  border-radius: 0.75rem;
  transition: all 0.3s;
  box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.3);
}

.modal-cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 20px 25px -5px rgba(59, 130, 246, 0.4);
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.9);
  opacity: 0;
}
</style>
