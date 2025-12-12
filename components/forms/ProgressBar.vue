<template>
  <div class="w-full" role="progressbar" :aria-valuenow="percentage" aria-valuemin="0" aria-valuemax="100">
    <!-- Step Indicator Text -->
    <div class="flex items-center justify-between mb-2">
      <span class="text-sm font-semibold text-white">
        Step {{ currentStep }} of {{ totalSteps }}
      </span>
      <span class="text-sm text-slate-400">
        {{ percentage }}% Complete
      </span>
    </div>

    <!-- Progress Bar -->
    <div class="h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
      <div 
        class="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500 ease-out rounded-full"
        :style="{ width: percentage + '%' }"
        :aria-label="`${percentage}% complete`"
      />
    </div>

    <!-- Step Labels (Optional - shows on desktop) -->
    <div v-if="stepLabels && stepLabels.length > 0" class="hidden md:flex justify-between mt-3 text-xs">
      <div 
        v-for="(label, index) in stepLabels" 
        :key="index"
        class="flex flex-col items-center"
        :class="[
          index + 1 < currentStep ? 'text-cyan-400' : '',
          index + 1 === currentStep ? 'text-white font-semibold' : '',
          index + 1 > currentStep ? 'text-slate-500' : ''
        ]"
      >
        <div 
          class="w-8 h-8 rounded-full flex items-center justify-center mb-1 border-2 transition-all"
          :class="[
            index + 1 < currentStep ? 'bg-cyan-500 border-cyan-500' : '',
            index + 1 === currentStep ? 'bg-cyan-500/20 border-cyan-500' : '',
            index + 1 > currentStep ? 'bg-slate-800 border-slate-600' : ''
          ]"
        >
          <Icon 
            v-if="index + 1 < currentStep" 
            name="mdi:check" 
            class="w-5 h-5 text-white" 
          />
          <span v-else class="text-sm">{{ index + 1 }}</span>
        </div>
        <span class="text-center max-w-[80px]">{{ label }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  currentStep: number
  totalSteps: number
  stepLabels?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  stepLabels: () => []
})

const percentage = computed(() => {
  return Math.round((props.currentStep / props.totalSteps) * 100)
})
</script>
