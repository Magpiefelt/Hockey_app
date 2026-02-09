<template>
  <div class="min-h-screen bg-dark-primary px-4 py-16">
    <div class="container max-w-5xl">
      <!-- Header -->
      <RevealOnScroll animation="fade-up">
        <div class="text-center mb-12 space-y-4">
          <div class="badge-brand mx-auto w-fit mb-4">
            <Icon name="mdi:email-fast" class="w-4 h-4" />
            <span class="uppercase tracking-wider">Get In Touch</span>
          </div>
          
          <h1 class="text-5xl md:text-6xl font-bold text-white leading-tight">
            Request Your <span class="gradient-text">Service</span>
          </h1>
          
          <p class="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto">
            {{ currentStep === 'selection' ? 'Choose your package to get started' : 'Fill out the form below and we\'ll get back to you within 24 hours' }}
          </p>
        </div>
      </RevealOnScroll>

      <!-- Resume Form Prompt -->
      <div v-if="showResumePrompt" class="mb-6 p-4 rounded-lg bg-cyan-500/10 border-2 border-cyan-500/50 flex items-start gap-3">
        <Icon name="mdi:information" class="w-6 h-6 text-cyan-400 flex-shrink-0 mt-0.5" />
        <div class="flex-1">
          <h4 class="text-cyan-400 font-bold mb-1">Resume Your Form?</h4>
          <p class="text-slate-300 text-sm mb-3">We found a saved form from your previous visit. Would you like to continue where you left off?</p>
          <div class="flex gap-3">
            <button
              @click="resumeForm"
              class="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors text-sm"
            >
              Resume Form
            </button>
            <button
              @click="dismissResumePrompt"
              class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors text-sm"
            >
              Start Fresh
            </button>
          </div>
        </div>
        <button @click="dismissResumePrompt" class="text-cyan-400 hover:text-cyan-300">
          <Icon name="mdi:close" class="w-5 h-5" />
        </button>
      </div>

      <!-- Error Alert -->
      <div v-if="submissionError" class="mb-6 p-4 rounded-lg bg-red-500/10 border-2 border-red-500/50 flex items-start gap-3">
        <Icon name="mdi:alert-circle" class="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
        <div class="flex-1">
          <h4 class="text-red-400 font-bold mb-1">Submission Error</h4>
          <p class="text-slate-300 text-sm">{{ submissionError }}</p>
        </div>
        <button @click="submissionError = ''" class="text-red-400 hover:text-red-300">
          <Icon name="mdi:close" class="w-5 h-5" />
        </button>
      </div>

      <!-- Progress Bar (show when not on selection or review step) -->
      <div v-if="currentStep !== 'selection' && currentStep !== 'review'" class="mb-8">
        <ProgressBar
          :currentStep="currentStepNumber"
          :totalSteps="totalSteps"
          :stepLabels="stepLabels"
        />
      </div>

      <!-- Main Content Card -->
      <div class="card p-8 md:p-10">
          <!-- Package Selection -->
          <div v-if="currentStep === 'selection'">
            <!-- Loading State -->
            <div v-if="!packagesData || !packagesData.length" class="flex flex-col items-center justify-center py-20">
              <Icon name="mdi:loading" class="w-12 h-12 text-cyan-400 animate-spin mb-4" />
              <p class="text-slate-300">Loading packages...</p>
            </div>
            
            <!-- Error State -->
            <div v-else-if="packagesData && packagesData.length === 0" class="flex flex-col items-center justify-center py-20 text-center">
              <Icon name="mdi:alert-circle" class="w-16 h-16 text-red-400 mb-4" />
              <h3 class="text-2xl font-bold text-white mb-2">Unable to Load Packages</h3>
              <p class="text-slate-300 mb-6">We're having trouble loading our service packages. Please try again.</p>
              <UiButton @click="() => router.go(0)" variant="primary">
                Refresh Page
              </UiButton>
            </div>
            
            <!-- Packages Loaded -->
            <PackageSelectionModal
              v-else
              :packages="packages"
              @select="handlePackageSelect"
            />
          </div>

          <!-- Review Step -->
          <LazyFormsReviewStep
            v-else-if="currentStep === 'review'"
            :formData="formData"
            :packageName="selectedPackageName"
            :packagePrice="selectedPackagePrice"
            :isSubmitting="isSubmitting"
            @edit="handleEditStep"
            @back="handleBackFromReview"
            @submit="handleFinalSubmit"
          />

          <!-- Loading State -->
          <div v-else-if="isLoadingForm" class="flex flex-col items-center justify-center py-20">
            <Icon name="mdi:loading" class="w-12 h-12 text-cyan-400 animate-spin mb-4" />
            <p class="text-slate-300">Loading form...</p>
          </div>

          <!-- Event Hosting Form -->
          <LazyEventHostingForm
            v-else-if="selectedPackageId === 'event-hosting'"
            v-model="formData"
            @submit="handleFormStepComplete"
            @back="handleBack"
          />

          <!-- Game Day DJ Form -->
          <LazyGameDayDJForm
            v-else-if="selectedPackageId === 'game-day-dj'"
            v-model="formData"
            @submit="handleFormStepComplete"
            @back="handleBack"
          />

          <!-- Package #1 Form -->
          <LazyPackage1Form
            v-else-if="selectedPackageId === 'player-intros-basic'"
            v-model="formData"
            @submit="handleFormStepComplete"
            @back="handleBack"
          />

          <!-- Package #2 Form -->
          <LazyPackage2Form
            v-else-if="selectedPackageId === 'player-intros-warmup'"
            v-model="formData"
            @submit="handleFormStepComplete"
            @back="handleBack"
          />

          <!-- Package #3 Form -->
          <LazyPackage3Form
            v-else-if="selectedPackageId === 'player-intros-ultimate'"
            v-model="formData"
            @submit="handleFormStepComplete"
            @back="handleBack"
          />
      </div>

      <!-- Info Cards (only show on selection step) -->
      <RevealOnScroll v-if="currentStep === 'selection'" animation="fade-up">
        <div class="grid md:grid-cols-3 gap-6 mt-12">
          <div class="p-6 rounded-xl bg-dark-secondary border border-white/10 hover:border-brand-500/30 transition-colors text-center">
            <div class="w-14 h-14 mx-auto mb-4 rounded-lg bg-brand-600 flex items-center justify-center">
              <Icon name="mdi:clock-fast" class="w-7 h-7 text-white" />
            </div>
            <h3 class="text-lg font-bold text-white mb-2">Fast Response</h3>
            <p class="text-slate-400 text-sm">We respond to all inquiries within 24 hours</p>
          </div>

          <div class="p-6 rounded-xl bg-dark-secondary border border-white/10 hover:border-accent-500/30 transition-colors text-center">
            <div class="w-14 h-14 mx-auto mb-4 rounded-lg bg-accent-600 flex items-center justify-center">
              <Icon name="mdi:shield-check" class="w-7 h-7 text-white" />
            </div>
            <h3 class="text-lg font-bold text-white mb-2">Professional Service</h3>
            <p class="text-slate-400 text-sm">10+ years of experience in game day entertainment</p>
          </div>

          <div class="p-6 rounded-xl bg-dark-secondary border border-white/10 hover:border-success-500/30 transition-colors text-center">
            <div class="w-14 h-14 mx-auto mb-4 rounded-lg bg-success-600 flex items-center justify-center">
              <Icon name="mdi:star" class="w-7 h-7 text-white" />
            </div>
            <h3 class="text-lg font-bold text-white mb-2">100% Satisfaction</h3>
            <p class="text-slate-400 text-sm">Our clients love working with us</p>
          </div>
        </div>
      </RevealOnScroll>

      <!-- FAQ Section (only show on selection step) -->
      <RevealOnScroll v-if="currentStep === 'selection'" animation="fade-up">
        <div class="mt-20">
          <div class="text-center mb-10">
            <h2 class="text-3xl md:text-4xl font-bold text-white mb-4">
              Common Questions
            </h2>
            <p class="text-lg text-slate-400">
              Quick answers to questions you may have
            </p>
          </div>
          
          <LazyFAQAccordion :faqs="faqs" />
        </div>
      </RevealOnScroll>

      <!-- Contact Info (only show on selection step) -->
      <RevealOnScroll v-if="currentStep === 'selection'" animation="fade-up">
        <div class="mt-12 p-8 rounded-xl bg-gradient-to-br from-brand-600 to-brand-700 border border-brand-500/50 text-center">
          <h3 class="text-2xl md:text-3xl font-bold text-white mb-3">
            Prefer to talk directly?
          </h3>
          <p class="text-lg text-slate-300 mb-6">
            We're here to answer any questions you have
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="tel:+15551234567"
              class="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg border border-white/20 hover:border-white/30 transition-all duration-200 backdrop-blur-sm"
            >
              <Icon name="mdi:phone" class="w-5 h-5" />
              (555) 123-4567
            </a>
            <a
              href="mailto:info@elitesportsdj.com"
              class="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg border border-white/20 hover:border-white/30 transition-all duration-200 backdrop-blur-sm"
            >
              <Icon name="mdi:email" class="w-5 h-5" />
              info@elitesportsdj.com
            </a>
          </div>
        </div>
      </RevealOnScroll>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, shallowReactive, computed, watch } from 'vue'
import { deepMerge } from '~/utils/deepMerge'
import { useCalendarStore } from '~/stores/calendar'

definePageMeta({
  layout: 'default'
})

useHead({
  title: 'Request Service - Elite Sports DJ Services',
  meta: [
    { name: 'description', content: 'Contact us to book professional DJ services for your game day or event.' }
  ]
})

const router = useRouter()
const route = useRoute()

// Form persistence
const { hasStoredData, storedData, saveFormState, clearFormState } = useFormPersistence()
const showResumePrompt = ref(false)

// Current step in the form flow
type StepType = 'selection' | 'form' | 'review'
const currentStep = ref<StepType>('selection')
const selectedPackageId = ref<string>('')
const isLoadingForm = ref(false)
const isSubmitting = ref(false)

// Centralized form data
// Using shallowReactive to avoid const assignment warnings with v-model
const formData = shallowReactive<any>({
  packageId: '',
  teamName: '',
  organization: '',
  eventDate: '',
  roster: {
    method: 'manual',
    players: [''],
    pdfFile: null,
    webLink: ''
  },
  audioFiles: [],
  introSong: {
    method: 'youtube',
    youtube: '',
    spotify: '',
    text: ''
  },
  warmupSong1: undefined,
  warmupSong2: undefined,
  warmupSong3: undefined,
  goalHorn: undefined,
  goalSong: undefined,
  winSong: undefined,
  sponsors: undefined,
  includeSample: false,
  // Contact information (flat structure for consistency)
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  notes: ''
})

// Watch form data and auto-save to localStorage
watch(
  [() => selectedPackageId.value, () => currentStep.value, formData],
  () => {
    if (selectedPackageId.value && currentStep.value !== 'selection') {
      saveFormState({
        packageId: selectedPackageId.value,
        currentStep: currentStep.value,
        formData: JSON.parse(JSON.stringify(formData)),
        timestamp: Date.now()
      })
    }
  },
  { deep: true }
)

// FIX: Pre-fetch calendar availability data on mount so it's ready
// before the user opens any form. This prevents race conditions where
// the form renders before availability data is loaded, allowing users
// to select dates that are actually unavailable.
const calendarStoreInstance = useCalendarStore()

// Check for package query parameter and pre-select
onMounted(async () => {
  // Start fetching calendar data immediately (non-blocking)
  calendarStoreInstance.fetchUnavailableDates()

  const packageParam = route.query.package as string
  if (packageParam && ['game-day-dj', 'player-intros-basic', 'player-intros-warmup', 'player-intros-ultimate', 'event-hosting'].includes(packageParam)) {
    selectedPackageId.value = packageParam
    currentStep.value = 'form'
  }

  // Check for stored form data
  if (hasStoredData.value && storedData.value) {
    showResumePrompt.value = true
  }
})

// Package data - loaded from database via tRPC
const trpc = useTrpc()
const { data: packagesData, refresh: refreshPackages } = await useAsyncData('packages', () => 
  trpc.packages.getAll.query()
)

// Computed property with safe fallback
const packages = computed(() => packagesData.value || [])

const selectedPackage = computed(() => {
  if (!packagesData.value) return null
  return packagesData.value.find(pkg => pkg.id === selectedPackageId.value)
})

const selectedPackageName = computed(() => {
  return selectedPackage.value?.name || ''
})

const selectedPackagePrice = computed(() => {
  const pkg = selectedPackage.value
  if (!pkg) return ''
  if (pkg.price_cents === 0) return 'Contact for pricing'
  return `$${(pkg.price_cents / 100).toFixed(2)}`
})

// Step configuration
const totalSteps = computed(() => 3) // Form -> Review -> Submit
const currentStepNumber = computed(() => {
  if (currentStep.value === 'form') return 1
  if (currentStep.value === 'review') return 2
  return 1
})

const stepLabels = computed(() => ['Details', 'Review', 'Submit'])

const faqs = ref([
  {
    question: 'How far in advance should I book?',
    answer: 'We recommend booking at least 2-3 weeks in advance for single games, and 4-6 weeks for full season packages. However, we can often accommodate last-minute requests depending on availability.'
  },
  {
    question: 'What areas do you service?',
    answer: 'We service venues across the entire region. Travel fees may apply for locations outside our standard service area. Contact us for specific venue availability.'
  },
  {
    question: 'Can I customize the music selection?',
    answer: 'Absolutely! We work with you to create a custom playlist that matches your team\'s style and energy. We have an extensive music library spanning all genres and eras.'
  }
])

function resumeForm() {
  if (storedData.value) {
    selectedPackageId.value = storedData.value.packageId
    currentStep.value = storedData.value.currentStep as StepType
    Object.assign(formData, deepMerge(formData, storedData.value.formData))
    showResumePrompt.value = false
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

function dismissResumePrompt() {
  showResumePrompt.value = false
}

function startFresh() {
  clearFormState()
  showResumePrompt.value = false
  // Reset to selection step
  currentStep.value = 'selection'
  selectedPackageId.value = ''
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function clearSavedData() {
  if (confirm('Are you sure you want to clear your saved form data? This cannot be undone.')) {
    clearFormState()
    const { showSuccess } = useNotification()
    showSuccess('Saved form data cleared')
  }
}

const handlePackageSelect = async (packageId: string) => {
  isLoadingForm.value = true
  selectedPackageId.value = packageId
  formData.packageId = packageId
  
  // Small delay to show loading state
  await new Promise(resolve => setTimeout(resolve, 300))
  currentStep.value = 'form'
  isLoadingForm.value = false
  
  // Scroll to top of form
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleBack = () => {
  currentStep.value = 'selection'
  selectedPackageId.value = ''
  clearFormState()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleFormStepComplete = (data: any) => {
  if (!data) {
    // Show error to user if form data is missing
    submissionError.value = 'Form data is missing. Please try filling out the form again.'
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }
  
  // Deep merge form data to preserve nested objects
  const mergeResult = deepMerge(formData, data)
  
  // Assign each property individually to ensure Vue reactivity tracks all changes
  Object.keys(mergeResult).forEach(key => {
    formData[key] = mergeResult[key]
  })
  
  // Move to review step
  currentStep.value = 'review'
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleBackFromReview = () => {
  currentStep.value = 'form'
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleEditStep = (step: string) => {
  currentStep.value = 'form'
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const submissionError = ref('')

const handleFinalSubmit = async () => {
  submissionError.value = ''
  isSubmitting.value = true
  
  try {
    const trpc = useTrpc()
    const { showSuccess, showError } = useNotification()
    
    // Prepare submission data - extract contact info from flat structure
    const contactName = formData.contactName?.trim() || ''
    const contactEmail = formData.contactEmail?.trim() || ''
    const contactPhone = formData.contactPhone?.trim() || ''
    
    // Comprehensive validation before submission
    const validationErrors: string[] = []
    
    // Contact info validation
    if (!contactName || contactName.trim().length < 1) {
      validationErrors.push('Name is required')
    }
    if (!contactEmail || !contactEmail.includes('@')) {
      validationErrors.push('Valid email is required')
    }
    if (!contactPhone || contactPhone.replace(/\D/g, '').length < 10) {
      validationErrors.push('Valid phone number (10+ digits) is required')
    }
    
    // Package-specific validation
    if (selectedPackageId.value.includes('player-intros')) {
      if (!formData.teamName || !formData.teamName.trim()) {
        validationErrors.push('Team name is required')
      }
      if (!formData.eventDate) {
        validationErrors.push('Event date is required')
      }
    }
    
    // Date availability validation (final check before submission)
    if (formData.eventDate) {
      const calendarStore = useCalendarStore()
      if (!calendarStore.isDateAvailable(formData.eventDate)) {
        validationErrors.push('The selected date is no longer available. Please go back and choose another date.')
      }
    }
    
    // Data type validation for warmup songs
    if (formData.warmupSong1 && typeof formData.warmupSong1 !== 'string') {
      validationErrors.push('Warmup song 1 must be text')
    }
    if (formData.warmupSong2 && typeof formData.warmupSong2 !== 'string') {
      validationErrors.push('Warmup song 2 must be text')
    }
    if (formData.warmupSong3 && typeof formData.warmupSong3 !== 'string') {
      validationErrors.push('Warmup song 3 must be text')
    }
    
    // Throw error if validation fails
    if (validationErrors.length > 0) {
      throw new Error(validationErrors.join('. ') + '. Please go back and correct the form.')
    }
    
    // Prepare order data
    const orderData = {
      name: contactName,
      email: contactEmail,
      phone: contactPhone,
      organization: formData.organization || '',
      serviceType: selectedPackageId.value,
      packageId: selectedPackageId.value,
      eventDate: formData.eventDate || '',
      notes: formData.notes || '',
      // Form-specific data
      teamName: formData.teamName || '',
      roster: formData.roster ? {
        ...formData.roster,
        players: formData.roster.players?.filter((p: string) => p && p.trim()) || []
      } : null,
      introSong: formData.introSong || null,
      warmupSongs: {
        song1: formData.warmupSong1 || null,
        song2: formData.warmupSong2 || null,
        song3: formData.warmupSong3 || null
      },
      goalHorn: formData.goalHorn || null,
      goalSong: formData.goalSong || null,
      winSong: formData.winSong || null,
      sponsors: formData.sponsors || null,
      includeSample: formData.includeSample || false,
      audioFiles: formData.audioFiles || []
    }
    
    // Create order in database
    const result = await trpc.orders.create.mutate(orderData)
    
    // Clear form data from localStorage
    clearFormState()
    
    // Navigate to thank you page immediately
    // IMPORTANT: Do NOT show notifications before navigation as they can interfere
    // The thank you page itself serves as the success confirmation
    await router.push('/thanks')
    
    // Reset submitting state after navigation (though user won't see this)
    isSubmitting.value = false
  } catch (error: any) {
    // Show error to user
    const { showError } = useNotification()
    const errorMessage = error.data?.message || error.message || 'There was an error submitting your request. Please try again or contact us directly.'
    submissionError.value = errorMessage
    showError(errorMessage)
    isSubmitting.value = false
    
    // Scroll to top to show error
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}
</script>
