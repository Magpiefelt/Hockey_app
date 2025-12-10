<template>
  <div class="space-y-8">
    <div class="text-center mb-8">
      <h2 class="text-3xl font-bold text-white mb-2">Game Day DJ Service</h2>
      <p class="text-slate-400">Professional DJ services for your entire event</p>
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
            Event Type <span class="text-red-400">*</span>
          </label>
          <select
            v-model="localFormData.eventType"
            required
            class="w-full px-4 py-3 rounded-lg bg-dark-secondary border border-white/10 text-white focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
          >
            <option value="">Select event type...</option>
            <option value="hockey">Hockey Game</option>
            <option value="lacrosse">Lacrosse Game</option>
            <option value="baseball">Baseball Game</option>
            <option value="basketball">Basketball Game</option>
            <option value="tournament">Tournament</option>
            <option value="other">Other</option>
          </select>
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
            Event Duration (hours) <span class="text-red-400">*</span>
          </label>
          <input
            v-model.number="localFormData.eventDuration"
            type="number"
            min="1"
            max="12"
            required
            class="w-full px-4 py-3 rounded-lg bg-dark-secondary border border-white/10 text-white focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
            placeholder="3"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">
            Venue Name
          </label>
          <input
            v-model="localFormData.venueName"
            type="text"
            class="w-full px-4 py-3 rounded-lg bg-dark-secondary border border-white/10 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
            placeholder="City Sports Arena"
          />
        </div>
      </div>

      <!-- Music Preferences -->
      <div class="space-y-4">
        <h3 class="text-xl font-bold text-white flex items-center gap-2">
          <Icon name="mdi:music-note" class="w-5 h-5 text-cyan-400" />
          Music Preferences
        </h3>
        
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">
            Preferred Music Genres
          </label>
          <textarea
            v-model="localFormData.musicGenres"
            rows="3"
            class="w-full px-4 py-3 rounded-lg bg-dark-secondary border border-white/10 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
            placeholder="e.g., Rock, Hip-Hop, Pop, Electronic..."
          ></textarea>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">
            Songs/Artists to Include
          </label>
          <textarea
            v-model="localFormData.mustPlaySongs"
            rows="3"
            class="w-full px-4 py-3 rounded-lg bg-dark-secondary border border-white/10 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
            placeholder="List any specific songs or artists you want included..."
          ></textarea>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">
            Songs/Artists to Avoid
          </label>
          <textarea
            v-model="localFormData.avoidSongs"
            rows="2"
            class="w-full px-4 py-3 rounded-lg bg-dark-secondary border border-white/10 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
            placeholder="Any songs or artists to avoid..."
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
  (e: 'submit'): void
  (e: 'back'): void
}>()

const localFormData = computed({
  get: () => {
    return {
eventType: '',
  eventDuration: 3,
  venueName: '',
  musicGenres: '',
  mustPlaySongs: '',
  avoidSongs: '',
  ...props.modelValue
    }
  },
  set: (value) => {
    emit('update:modelValue', value)
  }
})



const handleSubmit = () => {
  emit('submit')
}
</script>
