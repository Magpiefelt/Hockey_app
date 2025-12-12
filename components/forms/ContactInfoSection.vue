<template>
  <div class="space-y-4">
    <div>
      <UiInput
        id="contactName"
        v-model="localValue.name"
        type="text"
        label="Full Name"
        :required="true"
        :error="errors.name"
        helpText="Your first and last name"
        @blur="validateName"
        @input="clearNameError"
      />
    </div>

    <div>
      <UiInput
        id="contactEmail"
        v-model="localValue.email"
        type="email"
        label="Email Address"
        :required="true"
        :error="errors.email"
        helpText="We'll send order updates to this email"
        @blur="validateEmail"
        @input="clearEmailError"
      />
    </div>

    <div>
      <UiInput
        id="contactPhone"
        v-model="localValue.phone"
        type="tel"
        label="Phone Number"
        :required="true"
        :error="errors.phone"
        helpText="For urgent order updates"
        @blur="validatePhone"
        @input="clearPhoneError"
      />
    </div>

    <!-- Privacy Notice -->
    <div class="mt-4 p-3 rounded-lg bg-slate-900/30 border border-slate-700/50">
      <p class="text-sm text-slate-400">
        <Icon name="mdi:shield-check" class="w-4 h-4 inline-block mr-1 text-cyan-400" />
        We'll use your information to respond to your request. 
        <a href="/privacy" class="text-cyan-400 hover:text-cyan-300 underline" target="_blank">
          View our Privacy Policy
        </a>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'

interface ContactInfo {
  name: string
  email: string
  phone: string
}

interface Props {
  modelValue: ContactInfo
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: ContactInfo]
  'validation': [isValid: boolean]
}>()

const localValue = ref<ContactInfo>({ ...props.modelValue })

const errors = ref({
  name: '',
  email: '',
  phone: ''
})

// Watch for changes and emit to parent
watch(localValue, (newValue) => {
  console.log('👁️ ContactInfoSection: localValue changed:', newValue)
  emit('update:modelValue', newValue)
  // Validate silently (don't show errors) to update button state
  validateAllSilent()
}, { deep: true })

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  localValue.value = { ...newValue }
}, { deep: true })

// Initialize validation state on mount
onMounted(() => {
  console.log('🚀 ContactInfoSection: Component mounted, localValue:', localValue.value)
  // Start with optimistic validation - assume valid if fields have content
  validateAllSilent()
  console.log('🚀 ContactInfoSection: Initial validation complete')
})

function clearNameError() {
  errors.value.name = ''
}

function clearEmailError() {
  errors.value.email = ''
}

function clearPhoneError() {
  errors.value.phone = ''
}

function validateName() {
  // Simplified: just check if not empty
  if (!localValue.value.name || localValue.value.name.trim().length === 0) {
    errors.value.name = 'Please enter your name'
    return false
  }
  errors.value.name = ''
  return true
}

function validateEmail() {
  // Simplified: basic check for @ symbol
  const email = localValue.value.email?.trim() || ''
  if (email.length === 0) {
    errors.value.email = 'Please enter your email'
    return false
  }
  if (!email.includes('@')) {
    errors.value.email = 'Please enter a valid email'
    return false
  }
  errors.value.email = ''
  return true
}

function validatePhone() {
  // Simplified: just check if not empty
  const phone = localValue.value.phone?.trim() || ''
  if (phone.length === 0) {
    errors.value.phone = 'Please enter your phone number'
    return false
  }
  errors.value.phone = ''
  return true
}

function validateAllSilent() {
  // Validate without showing errors (for real-time button state)
  const name = localValue.value.name?.trim() || ''
  const email = localValue.value.email?.trim() || ''
  const phone = localValue.value.phone?.trim() || ''
  
  const isValid = name.length > 0 && email.includes('@') && phone.length > 0
  
  console.log('✅ ContactInfoSection validateAllSilent:', {
    name: { value: name, valid: name.length > 0 },
    email: { value: email, valid: email.includes('@') },
    phone: { value: phone, valid: phone.length > 0 },
    isValid
  })
  
  console.log('📤 ContactInfoSection: Emitting validation event with:', isValid)
  emit('validation', isValid)
  return isValid
}

function validateAll() {
  // Validate with error display (for explicit validation)
  const nameValid = validateName()
  const emailValid = validateEmail()
  const phoneValid = validatePhone()
  const isValid = nameValid && emailValid && phoneValid
  
  console.log('ContactInfoSection explicit validation:', {
    nameValid,
    emailValid,
    phoneValid,
    isValid
  })
  
  emit('validation', isValid)
  return isValid
}

// Expose validation method to parent
defineExpose({
  validate: validateAll
})
</script>
