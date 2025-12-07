<template>
  <div class="space-y-1.5">
    <label 
      v-if="label" 
      :for="inputId" 
      class="label"
    >
      {{ label }}
      <span v-if="required" class="text-error-500">*</span>
    </label>
    
    <div class="relative">
      <input
        :id="inputId"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled"
        :class="inputClasses"
        @input="handleInput"
        @blur="handleBlur"
      />
      
      <!-- Error icon -->
      <div 
        v-if="hasError" 
        class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"
      >
        <svg class="w-5 h-5 text-error-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
interface Props {
  modelValue: string | number
  label?: string
  type?: 'text' | 'email' | 'tel' | 'number' | 'date' | 'password' | 'url'
  placeholder?: string
  required?: boolean
  disabled?: boolean
  error?: string
  helpText?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  required: false,
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  'blur': []
}>()

const inputId = computed(() => `input-${Math.random().toString(36).substr(2, 9)}`)
const hasError = computed(() => !!props.error)

const inputClasses = computed(() => {
  const base = 'w-full px-4 py-2.5 bg-dark-secondary border rounded-lg text-slate-100 placeholder:text-slate-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black shadow-sm focus:shadow-md'
  
  if (hasError.value) {
    return `${base} border-error-500 focus:border-error-500 focus:ring-error-500`
  }
  
  if (props.disabled) {
    return `${base} border-white/10 opacity-50 cursor-not-allowed`
  }
  
  return `${base} border-white/10 hover:border-white/20 focus:border-brand-500 focus:ring-brand-500`
})

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  const value = props.type === 'number' ? Number(target.value) : target.value
  emit('update:modelValue', value)
}

function handleBlur() {
  emit('blur')
}

const errorMessage = computed(() => props.error)
</script>
