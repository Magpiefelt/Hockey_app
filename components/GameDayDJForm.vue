<template>
  <div class="space-y-8">
    <div class="text-center mb-8">
      <h2 class="text-3xl font-bold text-white mb-2">Game Day DJ Service</h2>
      <p class="text-slate-400">Full game day DJ services with custom music selection</p>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Event Information -->
      <div class="space-y-4">
        <h3 class="text-xl font-bold text-white flex items-center gap-2">
          <Icon name="mdi:calendar-star" class="w-5 h-5 text-cyan-400" />
          Event Information
        </h3>
        
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">
            Team/Organization Name <span class="text-red-400">*</span>
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
            Event Date <span class="text-red-400">*</span>
          </label>
          <input
            v-model="localFormData.eventDate"
            type="date"
            required
            class="w-full px-4 py-3 rounded-lg bg-dark-secondary border border-white/10 text-white focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">
            Game Time <span class="text-red-400">*</span>
          </label>
          <input
            v-model="localFormData.gameTime"
            type="time"
            required
            class="w-full px-4 py-3 rounded-lg bg-dark-secondary border border-white/10 text-white focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">
            Venue Name & Address <span class="text-red-400">*</span>
          </label>
          <textarea
            v-model="localFormData.venueAddress"
            rows="3"
            required
            class="w-full px-4 py-3 rounded-lg bg-dark-secondary border border-white/10 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
            placeholder="City Sports Arena, 123 Main St, Anytown, USA"
          ></textarea>
        </div>
      </div>

      <!-- Music Preferences -->
      <div class="space-y-4">
        <h3 class="text-xl font-bold text-white flex items-center gap-2">
          <Icon name="mdi:music-box-multiple" class="w-5 h-5 text-cyan-400" />
          Music Preferences
        </h3>
        
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">
            Music Genres (select multiple)
          </label>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <label v-for="genre in genres" :key="genre" class="flex items-center gap-2 p-2 rounded-lg bg-dark-secondary border border-white/10 hover:border-cyan-400/30 cursor-pointer transition-colors">
              <input
                type="checkbox"
                :value="genre"
                v-model="localFormData.musicGenres"
                class="w-4 h-4 rounded border-white/20 text-cyan-500 focus:ring-cyan-400"
              />
              <span class="text-sm text-white">{{ genre }}</span>
            </label>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">
            Specific Song Requests (optional)
          </label>
          <textarea
            v-model="localFormData.songRequests"
            rows="4"
            class="w-full px-4 py-3 rounded-lg bg-dark-secondary border border-white/10 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
            placeholder="e.g., Thunderstruck - AC/DC, We Will Rock You - Queen"
          ></textarea>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">
            Do Not Play List (optional)
          </label>
          <textarea
            v-model="localFormData.doNotPlay"
            rows="3"
            class="w-full px-4 py-3 rounded-lg bg-dark-secondary border border-white/10 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
            placeholder="e.g., Baby Shark, Macarena"
          ></textarea>
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
          @click="$emit(\'back\')"
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
import { computed } from \'vue\'

const props = defineProps<{
  modelValue: any
}>()

const emit = defineEmits<{
  (e: \'update:modelValue\', value: any): void
  (e: \'submit\'): void
  (e: \'back\'): void
}>()

const genres = [
  \'Top 40\	,
  \'Hip Hop\	,
  \'Rock\	,
  \'Pop\	,
  \'EDM\	,
  \'Country\	,
  \'80s\	,
  \'90s\	,
  \'2000s\	
]

const localFormData = computed({
  get: () => {
    return {
      teamName: \'\	,
      eventDate: \'\	,
      gameTime: \'\	,
      venueAddress: \'\	,
      musicGenres: [],
      songRequests: \'\	,
      doNotPlay: \'\	,
      contactName: \'\	,
      contactEmail: \'\	,
      contactPhone: \'\	,
      notes: \'\	,
      ...props.modelValue
    }
  },
  set: (value) => {
    emit(\'update:modelValue\', value)
  }
})

const handleSubmit = () => {
  emit(\'submit\')
}
</script>
