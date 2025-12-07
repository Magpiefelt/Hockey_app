<template>
  <div class="faq-accordion">
    <div
      v-for="(item, index) in displayItems"
      :key="index"
      class="faq-item"
    >
      <button
        @click="toggle(index)"
        :class="['faq-question', { active: activeIndex === index }]"
        :aria-expanded="activeIndex === index"
      >
        <span class="question-text">{{ item.question }}</span>
        <Icon 
          name="mdi:chevron-down" 
          :class="['chevron-icon', { rotated: activeIndex === index }]"
        />
      </button>
      
      <Transition name="accordion">
        <div v-if="activeIndex === index" class="faq-answer-wrapper">
          <div class="faq-answer">
            {{ item.answer }}
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface FAQ {
  question: string
  answer: string
}

interface Props {
  items?: FAQ[]
  faqs?: FAQ[]
}

const props = defineProps<Props>()
const displayItems = computed(() => props.items || props.faqs || [])

const activeIndex = ref<number | null>(null)

const toggle = (index: number) => {
  activeIndex.value = activeIndex.value === index ? null : index
}
</script>

<style scoped>
.faq-accordion {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.faq-item {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.5), rgba(15, 23, 42, 0.5));
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 1rem;
  overflow: hidden;
  backdrop-filter: blur(10px);
  transition: all 0.3s;
}

.faq-item:hover {
  border-color: rgba(59, 130, 246, 0.4);
}

.faq-question {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 2rem;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: all 0.3s;
}

.faq-question.active {
  background: rgba(59, 130, 246, 0.1);
}

.question-text {
  font-size: 1.125rem;
  font-weight: 700;
  color: white;
  flex: 1;
  padding-right: 1rem;
}

.chevron-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: #3b82f6;
  transition: transform 0.3s ease;
  flex-shrink: 0;
}

.chevron-icon.rotated {
  transform: rotate(180deg);
}

.faq-answer-wrapper {
  overflow: hidden;
}

.faq-answer {
  padding: 0 2rem 1.5rem 2rem;
  font-size: 1rem;
  line-height: 1.75;
  color: #cbd5e1;
}

/* Accordion Transition */
.accordion-enter-active,
.accordion-leave-active {
  transition: all 0.3s ease;
}

.accordion-enter-from,
.accordion-leave-to {
  opacity: 0;
  max-height: 0;
}

.accordion-enter-to,
.accordion-leave-from {
  opacity: 1;
  max-height: 500px;
}

@media (max-width: 768px) {
  .faq-question {
    padding: 1.25rem 1.5rem;
  }
  
  .question-text {
    font-size: 1rem;
  }
  
  .faq-answer {
    padding: 0 1.5rem 1.25rem 1.5rem;
    font-size: 0.9375rem;
  }
}
</style>
