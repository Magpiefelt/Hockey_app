<template>
  <div class="space-y-1.5">
    <label 
      v-if="label" 
      :for="textareaId" 
      class="label"
    >
      {{ label }}
      <span v-if="required" class="text-error-500">*</span>
    </label>
    
    <div class="relative">
      <textarea
        :id="textareaId"
        :value="modelValue"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled"
        :rows="rows"
        :class="textareaClasses"
        @input="handleInput"
        @blur="handleBlur"
      />
      
      <!-- Character count -->
      <div 
        v-if="maxLength" 
        class="absolute bottom-3 right-3 text-xs text-slate-400"
      >
        {{ characterCount }} / {{ maxLength }}
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
  modelValue: string
  label?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  rows?: number
  maxLength?: number
  error?: string
  helpText?: string
}

const props = withDefaults(defineProps<Props>(), {
  required: false,
  disabled: false,
  rows: 4
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'blur': []
}>()

const textareaId = computed(() => `textarea-${Math.random().toString(36).substr(2, 9)}`)
const hasError = computed(() => !!props.error)
const characterCount = computed(() => props.modelValue?.length || 0)

const textareaClasses = computed(() => {
  const base = 'w-full px-4 py-2.5 bg-dark-secondary border rounded-lg text-slate-100 placeholder:text-slate-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black resize-vertical'
  
  if (hasError.value) {
    return `${base} border-error-500 focus:border-error-500 focus:ring-error-500`
  }
  
  if (props.disabled) {
    return `${base} border-white/10 opacity-50 cursor-not-allowed`
  }
  
  return `${base} border-white/10 hover:border-white/20 focus:border-brand-500 focus:ring-brand-500`
})

function handleInput(event: Event) {
  const target = event.target as HTMLTextAreaElement
  let value = target.value
  
  // Enforce max length
  if (props.maxLength && value.length > props.maxLength) {
    value = value.slice(0, props.maxLength)
    target.value = value
  }
  
  emit('update:modelValue', value)
}

function handleBlur() {
  emit('blur')
}

const errorMessage = computed(() => props.error)
</script>
