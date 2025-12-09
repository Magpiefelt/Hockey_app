<template>
  <form @submit.prevent="handleSubmit" class="space-y-8">
    <div class="mb-8">
      <h3 class="text-2xl font-bold text-white mb-2">Package #3 - Ultimate Game Day Package ($190)</h3>
      <p class="text-slate-400">Complete game-day audio experience with all features from Package #2 plus goal horns, win songs, and custom audio packages.</p>
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
      />
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
        hint="Choose the song you want played during player introductions"
      />
    </fieldset>

    <!-- Warmup Songs Section -->
    <fieldset class="p-6 rounded-lg bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border-2 border-cyan-500/30">
      <legend class="text-xl font-bold text-white mb-2 px-2">
        <Icon name="mdi:fire" class="w-6 h-6 inline-block mr-2 text-cyan-400" />
        Warmup Mix Songs
      </legend>
      <p class="text-slate-300 mb-6">Choose 2-3 songs for your custom warmup mix</p>

      <div class="space-y-6">
        <!-- Warmup Song #1 -->
        <SongInput
          v-model="formData.warmupSong1"
          label="Warmup Song #1"
          :required="true"
        />

        <!-- Warmup Song #2 -->
        <SongInput
          v-model="formData.warmupSong2"
          label="Warmup Song #2"
          :required="true"
        />

        <!-- Warmup Song #3 -->
        <SongInput
          v-model="formData.warmupSong3"
          label="Warmup Song #3 (Optional)"
          :required="false"
        />
      </div>
    </fieldset>

    <!-- Goal Horn & Songs Section -->
    <fieldset class="p-6 rounded-lg bg-gradient-to-br from-yellow-900/20 to-orange-900/20 border-2 border-yellow-500/30">
      <legend class="text-xl font-bold text-white mb-2 px-2">
        <Icon name="mdi:bullhorn" class="w-6 h-6 inline-block mr-2 text-yellow-400" />
        Goal Horn & Celebration Songs
      </legend>
      <p class="text-slate-300 mb-6">Choose your team's goal horn and celebration songs</p>

      <div class="space-y-6">
        <!-- Goal Horn Choice -->
        <div>
          <label class="block text-sm font-semibold text-white mb-2">
            Goal Horn Choice <span class="text-red-400" aria-label="required">*</span>
          </label>
          <p class="text-sm text-slate-400 mb-3">
            Choose from any NHL, AHL, PWHL, or CJHL team horn
          </p>
          <SongInput
            v-model="formData.goalHorn"
            label=""
            :required="true"
            hint="Provide YouTube/Spotify link or type the team name"
          />
        </div>

        <!-- Goal Song Choice -->
        <SongInput
          v-model="formData.goalSong"
          label="Goal Song Choice"
          :required="true"
          hint="The song played after your team scores"
        />

        <!-- Win Song Choice -->
        <SongInput
          v-model="formData.winSong"
          label="Win Song Choice"
          :required="true"
          hint="The song played when your team wins"
        />
      </div>
    </fieldset>

    <!-- Sponsors Section -->
    <fieldset class="p-6 rounded-lg bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-2 border-purple-500/30">
      <legend class="text-xl font-bold text-white mb-2 px-2">
        <Icon name="mdi:handshake" class="w-6 h-6 inline-block mr-2 text-purple-400" />
        Sponsors
      </legend>
      <p class="text-slate-300 mb-6">Add your team sponsors for custom audio announcements</p>

      <div class="space-y-3">
        <div v-for="(sponsor, index) in formData.sponsors" :key="index" class="flex gap-2">
          <UiInput
            v-model="formData.sponsors[index]"
            :placeholder="`Sponsor ${index + 1} name`"
            class="flex-1"
            :aria-label="`Sponsor ${index + 1}`"
          />
          <button
            v-if="formData.sponsors.length > 1"
            @click="removeSponsor(index)"
            type="button"
            class="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors"
            :aria-label="`Remove sponsor ${index + 1}`"
          >
            <Icon name="mdi:delete" class="w-5 h-5" />
          </button>
        </div>
        <button
          @click="addSponsor"
          type="button"
          class="w-full py-2 px-4 rounded-lg border-2 border-dashed border-slate-600 text-slate-400 hover:border-purple-400 hover:text-purple-400 transition-colors"
          aria-label="Add another sponsor"
        >
          <Icon name="mdi:plus" class="w-5 h-5 inline mr-2" />
          Add Sponsor
        </button>
      </div>
    </fieldset>

    <!-- Include Sample -->
    <div class="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
      <label class="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          v-model="formData.includeSample"
          class="mt-1 w-5 h-5 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900"
          aria-describedby="sample-description"
        />
        <div>
          <span class="text-white font-semibold block mb-1">Include Sample Audio</span>
          <span id="sample-description" class="text-sm text-slate-300">
            We'll provide you with samples of all custom audio before finalizing
          </span>
        </div>
      </label>
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
  teamName: ''
})

// Initialize with defaults
const defaultFormData = {
  packageId: 'player-intros-ultimate',
  teamName: '',
  roster: {
    method: 'manual' as 'manual' | 'pdf' | 'weblink',
    players: [''],
    pdfFile: null as File | null,
    webLink: ''
  },
  audioFiles: [] as File[],
  introSong: {
    method: 'youtube' as 'youtube' | 'spotify' | 'text',
    youtube: '',
    spotify: '',
    text: ''
  },
  warmupSong1: {
    method: 'youtube' as 'youtube' | 'spotify' | 'text',
    youtube: '',
    spotify: '',
    text: ''
  },
  warmupSong2: {
    method: 'youtube' as 'youtube' | 'spotify' | 'text',
    youtube: '',
    spotify: '',
    text: ''
  },
  warmupSong3: {
    method: 'youtube' as 'youtube' | 'spotify' | 'text',
    youtube: '',
    spotify: '',
    text: ''
  },
  goalHorn: {
    method: 'youtube' as 'youtube' | 'spotify' | 'text',
    youtube: '',
    spotify: '',
    text: ''
  },
  goalSong: {
    method: 'youtube' as 'youtube' | 'spotify' | 'text',
    youtube: '',
    spotify: '',
    text: ''
  },
  winSong: {
    method: 'youtube' as 'youtube' | 'spotify' | 'text',
    youtube: '',
    spotify: '',
    text: ''
  },
  sponsors: [''],
  includeSample: false,
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
    formData.teamName.trim().length > 0 &&
    isContactValid.value &&
    hasSongData(formData.introSong) &&
    hasSongData(formData.warmupSong1) &&
    hasSongData(formData.warmupSong2) &&
    hasSongData(formData.goalHorn) &&
    hasSongData(formData.goalSong) &&
    hasSongData(formData.winSong)
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

const addSponsor = () => {
  formData.sponsors.push('')
}

const removeSponsor = (index: number) => {
  formData.sponsors.splice(index, 1)
}

const handleSubmit = async () => {
  hasAttemptedSubmit.value = true
  
  console.log('=== PACKAGE3FORM VALIDATION CHECK ===')  
  console.log('formData.teamName:', formData.teamName, '(valid:', formData.teamName.trim().length > 0, ')')
  console.log('isContactValid:', isContactValid.value)
  console.log('formData.introSong:', formData.introSong)
  console.log('hasSongData(introSong):', hasSongData(formData.introSong))
  console.log('formData.warmupSong1:', formData.warmupSong1)
  console.log('hasSongData(warmupSong1):', hasSongData(formData.warmupSong1))
  console.log('formData.goalSong:', formData.goalSong)
  console.log('hasSongData(goalSong):', hasSongData(formData.goalSong))
  console.log('isFormValid:', isFormValid.value)
  
  if (!isFormValid.value) {
    console.log('❌ VALIDATION FAILED - Form will not submit')
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }
  
  console.log('✅ VALIDATION PASSED - Proceeding with submission')

  isSubmitting.value = true
  try {
    console.log('=== PACKAGE3FORM SUBMIT ===')    
    console.log('formData.contactInfo:', formData.contactInfo)
    console.log('formData.teamName:', formData.teamName)
    console.log('formData.goalSong:', formData.goalSong)
    
    // Merge contact info into top level for compatibility
    const submitData = {
      ...formData,
      contactName: formData.contactInfo.name,
      contactEmail: formData.contactInfo.email,
      contactPhone: formData.contactInfo.phone
    }
    
    console.log('submitData being emitted:', JSON.parse(JSON.stringify(submitData)))
    emit('submit', submitData)
  } finally {
    isSubmitting.value = false
  }
}
</script>
