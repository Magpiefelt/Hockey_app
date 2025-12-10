<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <div class="mb-8">
      <h3 class="text-2xl font-bold text-white mb-2">Game Day DJ Request</h3>
      <p class="text-slate-400">Book live DJ services for your games or tournaments.</p>
    </div>

    <!-- Service Type -->
    <fieldset>
      <legend class="block text-sm font-semibold text-white mb-3">
        Service Type <span class="text-red-400" aria-label="required">*</span>
      </legend>
      <div class="grid grid-cols-2 gap-4" role="radiogroup" aria-label="Service type selection">
        <label
          :class="[
            'flex items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all',
            formData.serviceType === 'individual'
              ? 'border-cyan-400 bg-cyan-500/10'
              : 'border-slate-600 hover:border-slate-500'
          ]"
        >
          <input
            type="radio"
            v-model="formData.serviceType"
            value="individual"
            class="sr-only"
            required
            aria-label="Individual games"
          />
          <span class="text-white font-semibold">Individual Games</span>
        </label>
        <label
          :class="[
            'flex items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all',
            formData.serviceType === 'tournament'
              ? 'border-cyan-400 bg-cyan-500/10'
              : 'border-slate-600 hover:border-slate-500'
          ]"
        >
          <input
            type="radio"
            v-model="formData.serviceType"
            value="tournament"
            class="sr-only"
            required
            aria-label="Tournaments"
          />
          <span class="text-white font-semibold">Tournaments</span>
        </label>
      </div>
    </fieldset>

    <!-- Event Location -->
    <div>
      <label for="eventLocation" class="block text-sm font-semibold text-white mb-2">
        Event Location <span class="text-red-400" aria-label="required">*</span>
      </label>
      <UiInput
        id="eventLocation"
        v-model="formData.eventLocation"
        type="text"
        required
        placeholder="City, State"
        :error="errors.eventLocation"
        @blur="validateEventLocation"
        aria-describedby="eventLocation-help"
      />
      <p id="eventLocation-help" class="mt-1 text-sm text-slate-400">
        Where will the event take place?
      </p>
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
        What sport or activity?
      </p>
    </div>

    <!-- Arena Name -->
    <div>
      <label for="arena" class="block text-sm font-semibold text-white mb-2">
        Arena / Venue Name <span class="text-red-400" aria-label="required">*</span>
      </label>
      <UiInput
        id="arena"
        v-model="formData.arena"
        type="text"
        required
        placeholder="Arena name"
        aria-describedby="arena-help"
      />
      <p id="arena-help" class="mt-1 text-sm text-slate-400">
        Name of the venue or facility
      </p>
    </div>

    <!-- Level(s) of Hockey -->
    <div>
      <label for="level" class="block text-sm font-semibold text-white mb-2">
        Level(s) of Play <span class="text-red-400" aria-label="required">*</span>
      </label>
      <UiInput
        id="level"
        v-model="formData.level"
        type="text"
        required
        placeholder="e.g., U15, U18, Adult Rec, etc."
        aria-describedby="level-help"
      />
      <p id="level-help" class="mt-1 text-sm text-slate-400">
        Age group or skill level of participants
      </p>
    </div>

    <!-- Game Length(s) -->
    <div>
      <label for="gameLength" class="block text-sm font-semibold text-white mb-2">
        Game Length(s) <span class="text-red-400" aria-label="required">*</span>
      </label>
      <UiInput
        id="gameLength"
        v-model="formData.gameLength"
        type="text"
        required
        placeholder="e.g., 3 x 15 min periods, 2 x 20 min halves"
        aria-describedby="gameLength-help"
      />
      <p id="gameLength-help" class="mt-1 text-sm text-slate-400">
        Duration and structure of games
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
        placeholder="Any special requirements or additional details..."
        aria-describedby="notes-help"
      />
      <p id="notes-help" class="mt-2 text-sm text-slate-400">
        Share any special requests, equipment needs, or other important details
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
  eventLocation: '',
  eventDate: ''
})

const eventTypeOptions = [
  { value: 'hockey', label: 'Hockey' },
  { value: 'lacrosse', label: 'Lacrosse' },
  { value: 'basketball', label: 'Basketball' },
  { value: 'baseball', label: 'Baseball' },
  { value: 'soccer', label: 'Soccer' },
  { value: 'other', label: 'Other' }
]

// Initialize with defaults
const defaultFormData = {
  packageId: 'game-day-dj',
  serviceType: '',
  eventLocation: '',
  eventDate: '',
  eventType: '',
  arena: '',
  level: '',
  gameLength: '',
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
  return (
    formData.serviceType.trim().length > 0 &&
    formData.eventLocation.trim().length > 0 &&
    formData.eventDate.trim().length > 0 &&
    formData.eventType.trim().length > 0 &&
    formData.arena.trim().length > 0 &&
    formData.level.trim().length > 0 &&
    formData.gameLength.trim().length > 0 &&
    isContactValid.value
  )
})

function validateEventLocation() {
  if (!formData.eventLocation || formData.eventLocation.trim().length === 0) {
    errors.eventLocation = 'Event location is required'
  } else {
    errors.eventLocation = ''
  }
}

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
  
  console.log('=== GAMEDAYDJFORM VALIDATION CHECK ===')
  console.log('formData.serviceType:', formData.serviceType)
  console.log('formData.eventLocation:', formData.eventLocation)
  console.log('formData.eventDate:', formData.eventDate)
  console.log('formData.eventType:', formData.eventType)
  console.log('isContactValid:', isContactValid.value)
  console.log('isFormValid:', isFormValid.value)
  
  if (!isFormValid.value) {
    console.log('❌ VALIDATION FAILED - Form will not submit')
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }
  
  console.log('✅ VALIDATION PASSED - Proceeding with submission')

  isSubmitting.value = true
  try {
    console.log('=== GAMEDAYDJFORM SUBMIT ===')
    console.log('formData.contactInfo:', formData.contactInfo)
    
    // Merge contact info into top level for compatibility
    const submitData = {
      ...formData,
      contactName: formData.contactInfo.name,
      contactEmail: formData.contactInfo.email,
      contactPhone: formData.contactInfo.phone
    }
    
    console.log('submitData being emitted:', submitData)
    emit('submit', submitData)
  } finally {
    isSubmitting.value = false
  }
}
</script>
