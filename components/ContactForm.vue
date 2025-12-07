<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <div class="grid md:grid-cols-2 gap-6">
      <!-- Name Field -->
      <UiInput
        v-model="formData.name"
        label="Full Name"
        type="text"
        placeholder="John Doe"
        required
        :error="errors.name"
        @blur="validateField('name')"
      />

      <!-- Email Field -->
      <UiInput
        v-model="formData.email"
        label="Email Address"
        type="email"
        placeholder="john@example.com"
        required
        :error="errors.email"
        @blur="validateField('email')"
      />

      <!-- Phone Field -->
      <UiInput
        v-model="formData.phone"
        label="Phone Number"
        type="tel"
        placeholder="(555) 123-4567"
        required
        :error="errors.phone"
        @blur="validateField('phone')"
      />

      <!-- Service Type -->
      <UiSelect
        v-model="formData.service"
        label="Service Type"
        placeholder="Select a service"
        required
        :error="errors.service"
        :options="serviceOptions"
        @blur="validateField('service')"
      />

      <!-- Event Date -->
      <UiInput
        v-model="formData.eventDate"
        label="Event Date"
        type="date"
        required
        :error="errors.eventDate"
        @blur="validateField('eventDate')"
      />
    </div>

    <!-- Message Field -->
    <UiTextarea
      v-model="formData.message"
      label="Message"
      placeholder="Tell us about your event..."
      :rows="5"
      required
      :error="errors.message"
      @blur="validateField('message')"
    />

    <!-- Submit Button -->
    <UiButton
      type="submit"
      variant="primary"
      size="lg"
      full-width
      :disabled="isSubmitting"
    >
      <span v-if="!isSubmitting">Send Message</span>
      <span v-else class="flex items-center gap-2">
        <Icon name="mdi:loading" class="w-5 h-5 animate-spin" />
        Sending...
      </span>
    </UiButton>
  </form>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'

interface FormData {
  name: string
  email: string
  phone: string
  service: string
  eventDate: string
  message: string
}

const emit = defineEmits<{
  submit: [data: FormData]
  success: []
  error: [message: string]
}>()

const formData = reactive<FormData>({
  name: '',
  email: '',
  phone: '',
  service: '',
  eventDate: '',
  message: ''
})

const errors = reactive<Partial<Record<keyof FormData, string>>>({})
const isSubmitting = ref(false)

const serviceOptions = [
  { label: 'Game Day DJ', value: 'game-day' },
  { label: 'Player Introductions', value: 'player-intros' },
  { label: 'Full Season Package', value: 'full-season' },
  { label: 'Event Hosting', value: 'event-hosting' }
]

const validateField = (field: keyof FormData) => {
  errors[field] = ''

  switch (field) {
    case 'name':
      if (!formData.name.trim()) {
        errors.name = 'Name is required'
      } else if (formData.name.trim().length < 2) {
        errors.name = 'Name must be at least 2 characters'
      }
      break

    case 'email':
      if (!formData.email.trim()) {
        errors.email = 'Email is required'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = 'Please enter a valid email address'
      }
      break

    case 'phone':
      if (!formData.phone.trim()) {
        errors.phone = 'Phone number is required'
      } else if (!/^[\d\s\-\(\)]+$/.test(formData.phone)) {
        errors.phone = 'Please enter a valid phone number'
      }
      break

    case 'service':
      if (!formData.service) {
        errors.service = 'Please select a service'
      }
      break

    case 'eventDate':
      if (!formData.eventDate) {
        errors.eventDate = 'Event date is required'
      } else {
        const selectedDate = new Date(formData.eventDate)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        if (selectedDate < today) {
          errors.eventDate = 'Event date must be in the future'
        }
      }
      break

    case 'message':
      if (!formData.message.trim()) {
        errors.message = 'Message is required'
      } else if (formData.message.trim().length < 10) {
        errors.message = 'Message must be at least 10 characters'
      }
      break
  }
}

const validateForm = (): boolean => {
  Object.keys(formData).forEach(key => {
    validateField(key as keyof FormData)
  })

  return Object.values(errors).every(error => !error)
}

const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }

  isSubmitting.value = true

  try {
    // Emit the form data to parent component
    emit('submit', { ...formData })
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Reset form
    Object.keys(formData).forEach(key => {
      formData[key as keyof FormData] = ''
    })
    
    emit('success')
  } catch (error) {
    emit('error', 'Failed to send message. Please try again.')
  } finally {
    isSubmitting.value = false
  }
}
</script>
