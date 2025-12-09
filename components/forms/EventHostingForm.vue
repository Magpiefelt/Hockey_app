<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <div class="mb-8">
      <h3 class="text-2xl font-bold text-white mb-2">Event Hosting Request</h3>
      <p class="text-slate-400">Tell us about your event and we'll create a custom package for you.</p>
    </div>

    <!-- Event Date -->
    <div>
      <label for="eventDate" class="block text-sm font-semibold text-white mb-2">
        Event Date <span class="text-red-400" aria-label="required">*</span>
      </label>
      <UiInput
        id="eventDate"
        v-model="formData.eventDate"
        type="date"
        required
        :error="errors.eventDate"
        @blur="validateEventDate"
        aria-describedby="eventDate-help"
      />
      <p id="eventDate-help" class="mt-1 text-sm text-slate-400">
        When is your event scheduled?
      </p>
    </div>

    <!-- Event Type -->
    <div>
      <label for="eventType" class="block text-sm font-semibold text-white mb-2">
        Event Type <span class="text-red-400" aria-label="required">*</span>
      </label>
      <UiSelect
        id="eventType"
        v-model="formData.eventType"
        label=""
        placeholder="Select event type"
        :options="eventTypeOptions"
        required
        aria-describedby="eventType-help"
      />
      <p id="eventType-help" class="mt-1 text-sm text-slate-400">
        What type of event are you hosting?
      </p>
    </div>

    <!-- Other Event Type (conditional) -->
    <div v-if="formData.eventType === 'other'">
      <label for="eventTypeOther" class="block text-sm font-semibold text-white mb-2">
        Please Specify Event Type <span class="text-red-400" aria-label="required">*</span>
      </label>
      <UiInput
        id="eventTypeOther"
        v-model="formData.eventTypeOther"
        type="text"
        required
        placeholder="Enter event type"
        aria-describedby="eventTypeOther-help"
      />
      <p id="eventTypeOther-help" class="mt-1 text-sm text-slate-400">
        Please describe your event type
      </p>
    </div>

    <!-- Expected Attendance -->
    <div>
      <label for="expectedAttendance" class="block text-sm font-semibold text-white mb-2">
        Expected Attendance
      </label>
      <UiInput
        id="expectedAttendance"
        v-model="formData.expectedAttendance"
        type="number"
        min="1"
        placeholder="Number of guests"
        aria-describedby="attendance-help"
      />
      <p id="attendance-help" class="mt-1 text-sm text-slate-400">
        Approximate number of attendees (optional)
      </p>
    </div>

    <!-- Contact Information Section -->
    <fieldset class="pt-6 border-t border-slate-700">
      <legend class="text-lg font-bold text-white mb-4 px-2">
        <Icon name="mdi:account" class="w-5 h-5 inline-block mr-2" />
        Contact Information
      </legend>
      <ContactInfoSection
        v-model="formData.contactInfo"
        @validation="handleContactValidation"
      />
    </fieldset>

    <!-- Additional Notes -->
    <div>
      <label for="notes" class="block text-sm font-semibold text-white mb-2">
        <Icon name="mdi:note-text" class="w-5 h-5 inline-block mr-1" />
        Additional Information
      </label>
      <UiTextarea
        id="notes"
        v-model="formData.notes"
        rows="4"
        placeholder="Tell us more about your event, expected attendance, special requirements, etc."
        aria-describedby="notes-help"
      />
      <p id="notes-help" class="mt-2 text-sm text-slate-400">
        Share any special requests, venue details, or specific needs for your event
      </p>
    </div>

    <!-- Submit Button -->
    <div class="flex gap-4 pt-4" role="group" aria-label="Form navigation">
      <UiButton
        type="button"
        variant="outline"
        @click="$emit('back')"
        class="flex-1"
        aria-label="Go back to package selection"
      >
        <Icon name="mdi:arrow-left" class="w-5 h-5 mr-2" />
        Back
      </UiButton>
      <UiButton
        type="submit"
        variant="primary"
        class="flex-1"
        :disabled="isSubmitting || !isFormValid"
        :aria-label="isSubmitting ? 'Submitting request' : 'Continue to review'"
      >
        <Icon v-if="isSubmitting" name="mdi:loading" class="w-5 h-5 mr-2 animate-spin" />
        <Icon v-else name="mdi:arrow-right" class="w-5 h-5 mr-2" />
        {{ isSubmitting ? 'Processing...' : 'Continue to Review' }}
      </UiButton>
    </div>

    <!-- Form Validation Message -->
    <div
      v-if="!isFormValid && hasAttemptedSubmit"
      class="p-4 rounded-lg bg-red-500/10 border border-red-500/30"
      role="alert"
      aria-live="assertive"
    >
      <p class="text-sm text-red-400 flex items-center gap-2">
        <Icon name="mdi:alert-circle" class="w-5 h-5" />
        Please fill in all required fields before continuing
      </p>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { deepMerge } from '~/utils/deepMerge'

const emit = defineEmits<{
  submit: [data: any]
  back: []
}>()

const props = defineProps<{
  modelValue?: any
}>()

const isSubmitting = ref(false)
const hasAttemptedSubmit = ref(false)
const isContactValid = ref(false)

const errors = reactive({
  eventDate: ''
})

const eventTypeOptions = [
  { value: 'tournament', label: 'Tournament' },
  { value: 'wedding', label: 'Wedding' },
  { value: 'corporate', label: 'Corporate Event' },
  { value: 'banquet', label: 'Banquet' },
  { value: 'fundraiser', label: 'Fundraiser' },
  { value: 'other', label: 'Other' }
]

// Initialize with defaults
const defaultFormData = {
  packageId: 'event-hosting',
  eventDate: '',
  eventType: '',
  eventTypeOther: '',
  expectedAttendance: '',
  contactInfo: {
    name: '',
    email: '',
    phone: ''
  },
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  notes: ''
}

// Create reactive formData and merge props with defaults
const formData = reactive({ ...defaultFormData })

// If props.modelValue exists, deep merge it into formData
if (props.modelValue) {
  Object.assign(formData, deepMerge(formData, props.modelValue))
}

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    Object.assign(formData, deepMerge(formData, newValue))
  }
}, { deep: true })

const isFormValid = computed(() => {
  const hasEventDate = formData.eventDate.trim().length > 0
  const hasEventType = formData.eventType.trim().length > 0
  const hasEventTypeOther = formData.eventType !== 'other' || formData.eventTypeOther.trim().length > 0
  
  return hasEventDate && hasEventType && hasEventTypeOther && isContactValid.value
})

function validateEventDate() {
  if (!formData.eventDate || formData.eventDate.trim().length === 0) {
    errors.eventDate = 'Event date is required'
  } else {
    errors.eventDate = ''
  }
}

function handleContactValidation(isValid: boolean) {
  isContactValid.value = isValid
}

const handleSubmit = async () => {
  hasAttemptedSubmit.value = true
  
  if (!isFormValid.value) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }

  isSubmitting.value = true
  try {
    // Merge contact info into top level for compatibility
    const submitData = {
      ...formData,
      contactName: formData.contactInfo.name,
      contactEmail: formData.contactInfo.email,
      contactPhone: formData.contactInfo.phone
    }
    emit('submit', submitData)
  } finally {
    isSubmitting.value = false
  }
}
</script>
