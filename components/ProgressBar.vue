<template>
  <div class="w-full">
    <div class="flex items-center justify-between mb-2">
      <span class="text-sm font-medium text-slate-400">
        Step {{ currentStep }} of {{ totalSteps }}
      </span>
      <span class="text-sm text-slate-500">
        {{ Math.round((currentStep / totalSteps) * 100) }}% Complete
      </span>
    </div>
    <div class="w-full bg-slate-700 rounded-full h-2.5">
      <div
        class="bg-gradient-to-r from-blue-600 to-cyan-600 h-2.5 rounded-full transition-all duration-300"
        :style="{ width: `${(currentStep / totalSteps) * 100}%` }"
      ></div>
    </div>
    <div v-if="stepLabels && stepLabels.length" class="flex justify-between mt-2">
      <span
        v-for="(label, index) in stepLabels"
        :key="index"
        class="text-xs"
        :class="index < currentStep ? 'text-cyan-400' : 'text-slate-500'"
      >
        {{ label }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  currentStep: number
  totalSteps: number
  stepLabels?: string[]
}>()
</script>
