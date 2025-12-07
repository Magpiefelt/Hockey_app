<template>
  <form @submit.prevent="handleSubmit" class="space-y-8">
    <div class="mb-8">
      <h3 class="text-2xl font-bold text-white mb-2">Package #1 - Basic Package ($80)</h3>
      <p class="text-slate-400">Professional player introductions for up to 20 players.</p>
    </div>

    <!-- Team Name -->
    <div>
      <label for="teamName" class="block text-sm font-semibold text-white mb-2">
        Team Name <span class="text-red-400" aria-label="required">*</span>
      </label>
      <UiInput
        id="teamName"
        v-model="formData.teamName"
        type="text"
        required
        placeholder="Enter your team name"
        :error="errors.teamName"
        @blur="validateTeamName"
        aria-describedby="teamName-help"
      />
      <p id="teamName-help" class="mt-1 text-sm text-slate-400">
        The name of your team or organization
      </p>
    </div>

    <!-- Roster Section -->
    <fieldset class="p-6 rounded-lg bg-slate-900/50 border border-slate-700">
      <legend class="text-lg font-semibold text-white mb-4 px-2">
        <Icon name="mdi:account-group" class="w-5 h-5 inline-block mr-2" />
        Team Roster
      </legend>
      <RosterInput v-model="formData.roster" />
    </fieldset>

    <!-- Audio Pronunciation Help -->
    <fieldset class="p-6 rounded-lg bg-slate-900/50 border border-slate-700">
      <legend class="text-lg font-semibold text-white mb-2 px-2">
        <Icon name="mdi:file-music" class="w-5 h-5 inline-block mr-2" />
        Pronunciation Audio (Optional)
      </legend>
      <p class="text-sm text-slate-400 mb-4">
        Upload audio clips to help us pronounce difficult names correctly. 
        Accepted formats: MP3, WAV (max 50MB per file)
      </p>
      <AudioUpload
        v-model="formData.audioFiles"
        label="Pronunciation Audio"
        description="You can upload individual files for each player or one longer file with all pronunciations."
      />
    </fieldset>

    <!-- Intro Song Choice -->
    <fieldset class="p-6 rounded-lg bg-slate-900/50 border border-slate-700">
      <legend class="text-lg font-semibold text-white mb-2 px-2">
        <Icon name="mdi:music" class="w-5 h-5 inline-block mr-2" />
        Intro Song Choice <span class="text-red-400" aria-label="required">*</span>
      </legend>
      <p class="text-sm text-slate-400 mb-4">
        Choose the song you want played during player introductions
      </p>
      <SongInput
        v-model="formData.introSong"
        label="Intro Song"
        :required="true"
        hint="This will be played as players are introduced"
      />
    </fieldset>

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
        Let us know about any special requests, pronunciation notes, or other details
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
  teamName: ''
})

const formData = reactive({
  packageId: 'player-intros-basic',
  teamName: props.modelValue?.teamName || '',
  roster: props.modelValue?.roster || {
    method: 'manual' as 'manual' | 'pdf' | 'weblink',
    players: [''],
    pdfFile: null as File | null,
    webLink: ''
  },
  audioFiles: props.modelValue?.audioFiles || [] as File[],
  introSong: props.modelValue?.introSong || {
    method: 'youtube' as 'youtube' | 'spotify' | 'text',
    youtube: '',
    spotify: '',
    text: ''
  },
  contactInfo: props.modelValue?.contactInfo || {
    name: '',
    email: '',
    phone: ''
  },
  contactName: props.modelValue?.contactName || '',
  contactEmail: props.modelValue?.contactEmail || '',
  contactPhone: props.modelValue?.contactPhone || '',
  notes: props.modelValue?.notes || ''
})

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    Object.assign(formData, newValue)
  }
}, { deep: true })

const isFormValid = computed(() => {
  return (
    formData.teamName.trim().length > 0 &&
    isContactValid.value &&
    hasSongData(formData.introSong)
  )
})

function hasSongData(song: any): boolean {
  if (!song) return false
  if (song.method === 'youtube') return !!song.youtube
  if (song.method === 'spotify') return !!song.spotify
  if (song.method === 'text') return !!song.text
  return false
}

function validateTeamName() {
  if (!formData.teamName || formData.teamName.trim().length === 0) {
    errors.teamName = 'Team name is required'
  } else {
    errors.teamName = ''
  }
}

function handleContactValidation(isValid: boolean) {
  isContactValid.value = isValid
}

const handleSubmit = async () => {
  hasAttemptedSubmit.value = true
  
  if (!isFormValid.value) {
    // Scroll to first error
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
