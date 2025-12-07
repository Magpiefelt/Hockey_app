<template>
  <div class="space-y-1.5">
    <label 
      v-if="label" 
      :for="selectId" 
      class="label"
    >
      {{ label }}
      <span v-if="required" class="text-error-500">*</span>
    </label>
    
    <div class="relative">
      <select
        :id="selectId"
        :value="modelValue"
        :required="required"
        :disabled="disabled"
        :class="selectClasses"
        @change="handleChange"
        @blur="handleBlur"
      >
        <option value="" disabled>{{ placeholder }}</option>
        <option 
          v-for="option in options" 
          :key="option.value" 
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>
      
      <!-- Dropdown icon -->
      <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
    
    <!-- Error message -->
    <p v-if="hasError" class="text-sm text-error-400">
      {{ errorMessage }}
    </p>
    
    <!-- Help text -->
    <p v-else-if="helpText" class="text-sm text-slate-400">
      {{ helpText }}
    </p>
  </div>
</template>

<script setup lang="ts">
export interface SelectOption {
  label: string
  value: string | number
}

interface Props {
  modelValue: string | number
  label?: string
  options: SelectOption[]
  placeholder?: string
  required?: boolean
  disabled?: boolean
  error?: string
  helpText?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Select an option',
  required: false,
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  'blur': []
}>()

const selectId = computed(() => `select-${Math.random().toString(36).substr(2, 9)}`)
const hasError = computed(() => !!props.error)

const selectClasses = computed(() => {
  const base = 'w-full px-4 py-2.5 pr-10 bg-dark-secondary border rounded-lg text-slate-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black appearance-none cursor-pointer'
  
  if (hasError.value) {
    return `${base} border-error-500 focus:border-error-500 focus:ring-error-500`
  }
  
  if (props.disabled) {
    return `${base} border-white/10 opacity-50 cursor-not-allowed`
  }
  
  return `${base} border-white/10 hover:border-white/20 focus:border-brand-500 focus:ring-brand-500`
})

function handleChange(event: Event) {
  const target = event.target as HTMLSelectElement
  emit('update:modelValue', target.value)
}

function handleBlur() {
  emit('blur')
}

const errorMessage = computed(() => props.error)
</script>
