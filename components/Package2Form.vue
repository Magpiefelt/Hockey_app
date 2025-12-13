<template>
  <div class="space-y-8">
    <div class="text-center mb-8">
      <div class="inline-block px-4 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 text-sm font-bold mb-3">
        MOST POPULAR
      </div>
      <h2 class="text-3xl font-bold text-white mb-2">Package #2 - Warmup</h2>
      <p class="text-slate-400">Everything in Package #1 plus custom warmup mix</p>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Team Information -->
      <div class="space-y-4">
        <h3 class="text-xl font-bold text-white flex items-center gap-2">
          <Icon name="mdi:shield-account" class="w-5 h-5 text-cyan-400" />
          Team Information
        </h3>
        
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">
            Team Name <span class="text-red-400">*</span>
          </label>
          <input
            v-model="localFormData.teamName"
            type="text"
            required
            class="w-full px-4 py-3 rounded-lg bg-dark-secondary border border-white/10 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
            placeholder="Thunder Hockey"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">
            Organization/League
          </label>
          <input
            v-model="localFormData.organization"
            type="text"
            class="w-full px-4 py-3 rounded-lg bg-dark-secondary border border-white/10 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
            placeholder="City Sports League"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">
            Event Date <span class="text-red-400">*</span>
          </label>
          <UiDatePicker
            v-model="localFormData.eventDate"
            placeholder="Select event date"
            :required="true"
          />
        </div>
      </div>

      <!-- Player Roster - REPLACED WITH COMPONENT -->
      <div class="space-y-4">
        <h3 class="text-xl font-bold text-white flex items-center gap-2">
          <Icon name="mdi:account-group" class="w-5 h-5 text-cyan-400" />
          Player Roster (Up to 20 Players)
        </h3>
        
        <FormsRosterInput v-model="localFormData.roster" />
      </div>

      <!-- Intro Song Selection - REPLACED WITH COMPONENT -->
      <div class="space-y-4">
        <h3 class="text-xl font-bold text-white flex items-center gap-2">
          <Icon name="mdi:music" class="w-5 h-5 text-cyan-400" />
          Team Intro Song
        </h3>
        
        <FormsSongInput 
          v-model="localFormData.introSong"
          label="Team Intro Song"
          :required="true"
          hint="Choose how you'd like to provide your team's intro song"
        />
      </div>

      <!-- Warmup Songs (Package #2 Feature) -->
      <div class="space-y-4 p-6 rounded-lg bg-cyan-500/5 border-2 border-cyan-500/30">
        <h3 class="text-xl font-bold text-white flex items-center gap-2">
          <Icon name="mdi:playlist-music" class="w-5 h-5 text-cyan-400" />
          Warmup Mix (2-3 Songs)
        </h3>
        <p class="text-sm text-slate-400">Select 2-3 high-energy songs for your warmup mix</p>
        
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">
            Warmup Song #1 <span class="text-red-400">*</span>
          </label>
          <input
            v-model="localFormData.warmupSong1"
            type="text"
            required
            placeholder="Song Name - Artist"
            class="w-full px-4 py-3 rounded-lg bg-dark-secondary border border-white/10 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">
            Warmup Song #2 <span class="text-red-400">*</span>
          </label>
          <input
            v-model="localFormData.warmupSong2"
            type="text"
            required
            placeholder="Song Name - Artist"
            class="w-full px-4 py-3 rounded-lg bg-dark-secondary border border-white/10 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">
            Warmup Song #3 (Optional)
          </label>
          <input
            v-model="localFormData.warmupSong3"
            type="text"
            placeholder="Song Name - Artist"
            class="w-full px-4 py-3 rounded-lg bg-dark-secondary border border-white/10 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
          />
        </div>
      </div>

      <!-- Contact Information -->
      <div class="space-y-4">
        <h3 class="text-xl font-bold text-white flex items-center gap-2">
          <Icon name="mdi:account-circle" class="w-5 h-5 text-cyan-400" />
          Contact Information
        </h3>
        
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">
            Your Name <span class="text-red-400">*</span>
          </label>
          <input
            v-model="localFormData.contactName"
            type="text"
            required
            class="w-full px-4 py-3 rounded-lg bg-dark-secondary border border-white/10 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">
            Email <span class="text-red-400">*</span>
          </label>
          <input
            v-model="localFormData.contactEmail"
            type="email"
            required
            class="w-full px-4 py-3 rounded-lg bg-dark-secondary border border-white/10 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
            placeholder="john@example.com"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">
            Phone <span class="text-red-400">*</span>
          </label>
          <input
            v-model="localFormData.contactPhone"
            type="tel"
            required
            class="w-full px-4 py-3 rounded-lg bg-dark-secondary border border-white/10 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
            placeholder="(555) 123-4567"
          />
        </div>
      </div>

      <!-- Additional Notes -->
      <div>
        <label class="block text-sm font-medium text-slate-300 mb-2">
          Additional Notes or Special Requests
        </label>
        <textarea
          v-model="localFormData.notes"
          rows="4"
          class="w-full px-4 py-3 rounded-lg bg-dark-secondary border border-white/10 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
          placeholder="Any special requests or additional information..."
        ></textarea>
      </div>

      <!-- Form Actions -->
      <div class="flex gap-4 pt-4">
        <button
          @click="$emit('back')"
          type="button"
          class="flex-1 px-6 py-3 rounded-lg border-2 border-white/10 text-white font-semibold hover:bg-white/5 transition-colors"
        >
          Back
        </button>
        <button
          type="submit"
          class="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold hover:scale-105 transition-transform"
        >
          Continue to Review
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelValue: any
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void
  (e: 'submit', data: any): void
  (e: 'back'): void
}>()

const localFormData = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit('update:modelValue', value)
  }
})

const handleSubmit = () => {
  // Validate required fields
  if (!localFormData.value.teamName || !localFormData.value.teamName.trim()) {
    alert('Please enter your team name')
    return
  }
  
  if (!localFormData.value.eventDate) {
    alert('Please select an event date')
    return
  }
  
  // Validate roster - check based on method
  if (localFormData.value.roster.method === 'manual') {
    const hasPlayers = localFormData.value.roster.players?.some((p: string) => p && p.trim())
    if (!hasPlayers) {
      alert('Please add at least one player')
      return
    }
  } else if (localFormData.value.roster.method === 'pdf') {
    if (!localFormData.value.roster.pdfFile) {
      alert('Please upload a roster PDF file')
      return
    }
  } else if (localFormData.value.roster.method === 'weblink') {
    if (!localFormData.value.roster.webLink || !localFormData.value.roster.webLink.trim()) {
      alert('Please provide a web link to your roster')
      return
    }
  }
  
  // Validate intro song
  if (!localFormData.value.introSong || !localFormData.value.introSong.method) {
    alert('Please select your intro song')
    return
  }
  
  const method = localFormData.value.introSong.method
  if (method === 'youtube' && !localFormData.value.introSong.youtube) {
    alert('Please provide a YouTube link for your intro song')
    return
  }
  if (method === 'spotify' && !localFormData.value.introSong.spotify) {
    alert('Please provide a Spotify link for your intro song')
    return
  }
  if (method === 'text' && !localFormData.value.introSong.text) {
    alert('Please describe your intro song')
    return
  }
  
  // Validate warmup songs (Package #2 specific)
  if (!localFormData.value.warmupSong1 || !localFormData.value.warmupSong1.trim()) {
    alert('Please provide Warmup Song #1')
    return
  }
  
  if (!localFormData.value.warmupSong2 || !localFormData.value.warmupSong2.trim()) {
    alert('Please provide Warmup Song #2')
    return
  }
  
  // Validate contact info
  if (!localFormData.value.contactName || !localFormData.value.contactName.trim()) {
    alert('Please enter your name')
    return
  }
  
  if (!localFormData.value.contactEmail || !localFormData.value.contactEmail.trim()) {
    alert('Please enter your email address')
    return
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(localFormData.value.contactEmail)) {
    alert('Please enter a valid email address')
    return
  }
  
  if (!localFormData.value.contactPhone || !localFormData.value.contactPhone.trim()) {
    alert('Please enter your phone number')
    return
  }
  
  // Emit form data to parent
  emit('submit', localFormData.value)
}
</script>
