<template>
  <div class="space-y-8">
    <div class="text-center mb-8">
      <h2 class="text-3xl font-bold text-white mb-2">Package #1 - Basic</h2>
      <p class="text-slate-400">Professional player introductions for up to 20 players</p>
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
          <input
            v-model="localFormData.eventDate"
            type="date"
            required
            class="w-full px-4 py-3 rounded-lg bg-dark-secondary border border-white/10 text-white focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
          />
        </div>
      </div>

      <!-- Player Roster -->
      <div class="space-y-4">
        <h3 class="text-xl font-bold text-white flex items-center gap-2">
          <Icon name="mdi:account-group" class="w-5 h-5 text-cyan-400" />
          Player Roster (Up to 20 Players)
        </h3>
        
        <div class="space-y-3">
          <div v-for="(player, index) in localFormData.roster.players" :key="index" class="flex gap-2">
            <input
              v-model="localFormData.roster.players[index]"
              type="text"
              :placeholder="`Player ${index + 1} name`"
              class="flex-1 px-4 py-3 rounded-lg bg-dark-secondary border border-white/10 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
            />
            <button
              v-if="localFormData.roster.players.length > 1"
              @click="removePlayer(index)"
              type="button"
              class="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors"
            >
              <Icon name="mdi:close" class="w-5 h-5" />
            </button>
          </div>
        </div>

        <button
          v-if="localFormData.roster.players.length < 20"
          @click="addPlayer"
          type="button"
          class="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 transition-colors"
        >
          <Icon name="mdi:plus" class="w-5 h-5" />
          Add Player
        </button>
      </div>

      <!-- Intro Song Selection -->
      <div class="space-y-4">
        <h3 class="text-xl font-bold text-white flex items-center gap-2">
          <Icon name="mdi:music" class="w-5 h-5 text-cyan-400" />
          Team Intro Song
        </h3>
        
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">
            Song Selection Method
          </label>
          <select
            v-model="localFormData.introSong.method"
            class="w-full px-4 py-3 rounded-lg bg-dark-secondary border border-white/10 text-white focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
          >
            <option value="youtube">YouTube Link</option>
            <option value="spotify">Spotify Link</option>
            <option value="text">Song Name/Artist</option>
          </select>
        </div>

        <div v-if="localFormData.introSong.method === 'youtube'">
          <label class="block text-sm font-medium text-slate-300 mb-2">
            YouTube URL
          </label>
          <input
            v-model="localFormData.introSong.youtube"
            type="url"
            placeholder="https://youtube.com/watch?v=..."
            class="w-full px-4 py-3 rounded-lg bg-dark-secondary border border-white/10 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
          />
        </div>

        <div v-else-if="localFormData.introSong.method === 'spotify'">
          <label class="block text-sm font-medium text-slate-300 mb-2">
            Spotify URL
          </label>
          <input
            v-model="localFormData.introSong.spotify"
            type="url"
            placeholder="https://open.spotify.com/track/..."
            class="w-full px-4 py-3 rounded-lg bg-dark-secondary border border-white/10 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
          />
        </div>

        <div v-else>
          <label class="block text-sm font-medium text-slate-300 mb-2">
            Song Name and Artist
          </label>
          <input
            v-model="localFormData.introSong.text"
            type="text"
            placeholder="Song Name - Artist Name"
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
  get: () => {
    return {
...props.modelValue
    }
  },
  set: (value) => {
    emit('update:modelValue', value)
  }
})



const addPlayer = () => {
  if (localFormData.value.roster.players.length < 20) {
    localFormData.value.roster.players.push('')
  }
}

const removePlayer = (index: number) => {
  localFormData.value.roster.players.splice(index, 1)
}

const handleSubmit = () => {
  // Validate required fields before submission
  if (!localFormData.value.teamName || !localFormData.value.teamName.trim()) {
    alert('Please enter your team name')
    return
  }
  
  if (!localFormData.value.eventDate) {
    alert('Please select an event date')
    return
  }
  
  // Validate at least one player
  const hasPlayers = localFormData.value.roster.players.some((p: string) => p && p.trim())
  if (!hasPlayers) {
    alert('Please add at least one player')
    return
  }
  
  // Validate intro song
  if (localFormData.value.introSong.method === 'youtube' && !localFormData.value.introSong.youtube) {
    alert('Please provide a YouTube link for your intro song')
    return
  }
  if (localFormData.value.introSong.method === 'spotify' && !localFormData.value.introSong.spotify) {
    alert('Please provide a Spotify link for your intro song')
    return
  }
  if (localFormData.value.introSong.method === 'text' && !localFormData.value.introSong.text) {
    alert('Please describe your intro song')
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
