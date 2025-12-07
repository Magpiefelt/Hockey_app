<template>
  <div class="tabbed-content">
    <!-- Tab Headers -->
    <div class="tab-headers">
      <button
        v-for="(tab, index) in tabs"
        :key="index"
        @click="activeTab = index"
        :class="['tab-header', { active: activeTab === index }]"
      >
        <Icon v-if="tab.icon" :name="tab.icon" class="tab-icon" />
        <span>{{ tab.title }}</span>
      </button>
    </div>
    
    <!-- Tab Content -->
    <div class="tab-content-wrapper">
      <Transition :name="transitionName" mode="out-in">
        <div :key="activeTab" class="tab-content">
          <slot :name="`tab-${activeTab}`" />
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface Tab {
  title: string
  icon?: string
}

interface Props {
  tabs: Tab[]
}

defineProps<Props>()

const activeTab = ref(0)
const transitionName = ref('tab-slide-left')
const previousTab = ref(0)

watch(activeTab, (newTab) => {
  transitionName.value = newTab > previousTab.value ? 'tab-slide-left' : 'tab-slide-right'
  previousTab.value = newTab
})
</script>

<style scoped>
.tabbed-content {
  width: 100%;
}

.tab-headers {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  border-bottom: 2px solid rgba(148, 163, 184, 0.2);
}

.tab-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 1.125rem;
  font-weight: 700;
  cursor: pointer;
  position: relative;
  transition: all 0.3s;
  border-bottom: 3px solid transparent;
  margin-bottom: -2px;
}

.tab-header:hover {
  color: #cbd5e1;
  background: rgba(59, 130, 246, 0.05);
}

.tab-header.active {
  color: white;
  border-bottom-color: #3b82f6;
}

.tab-icon {
  width: 1.5rem;
  height: 1.5rem;
}

.tab-content-wrapper {
  position: relative;
  min-height: 300px;
}

.tab-content {
  width: 100%;
}

/* Tab Transitions */
.tab-slide-left-enter-active,
.tab-slide-left-leave-active,
.tab-slide-right-enter-active,
.tab-slide-right-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.tab-slide-left-enter-from {
  opacity: 0;
  transform: translateX(40px);
}

.tab-slide-left-leave-to {
  opacity: 0;
  transform: translateX(-40px);
}

.tab-slide-right-enter-from {
  opacity: 0;
  transform: translateX(-40px);
}

.tab-slide-right-leave-to {
  opacity: 0;
  transform: translateX(40px);
}

@media (max-width: 768px) {
  .tab-header {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
  }
  
  .tab-icon {
    width: 1.25rem;
    height: 1.25rem;
  }
}
</style>
