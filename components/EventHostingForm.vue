<template>
  <div class="space-y-8">
    <div class="text-center mb-8">
      <h2 class="text-3xl font-bold text-white mb-2">Event Hosting Service</h2>
      <p class="text-slate-400">Professional event hosting and MC services</p>
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
            Organization Name <span class="text-red-400">*</span>
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
            <option value="tournament">Tournament</option>
            <option value="championship">Championship Game</option>
            <option value="fundraiser">Fundraiser Event</option>
            <option value="awards">Awards Ceremony</option>
            <option value="banquet">Banquet</option>
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
            placeholder="4"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">
            Expected Attendance
          </label>
          <input
            v-model.number="localFormData.attendance"
            type="number"
            min="10"
            class="w-full px-4 py-3 rounded-lg bg-dark-secondary border border-white/10 text-white focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
            placeholder="200"
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

      <!-- Hosting Services Needed -->
      <div class="space-y-4">
        <h3 class="text-xl font-bold text-white flex items-center gap-2">
          <Icon name="mdi:microphone" class="w-5 h-5 text-cyan-400" />
          Hosting Services Needed
        </h3>
        
        <div class="space-y-3">
          <label class="flex items-center gap-3 p-3 rounded-lg bg-dark-secondary border border-white/10 hover:border-cyan-400/30 cursor-pointer transition-colors">
            <input
              v-model="localFormData.services.announcements"
              type="checkbox"
              class="w-5 h-5 rounded border-white/20 text-cyan-500 focus:ring-cyan-400"
            />
            <span class="text-white">Live Announcements</span>
          </label>

          <label class="flex items-center gap-3 p-3 rounded-lg bg-dark-secondary border border-white/10 hover:border-cyan-400/30 cursor-pointer transition-colors">
            <input
              v-model="localFormData.services.contests"
              type="checkbox"
              class="w-5 h-5 rounded border-white/20 text-cyan-500 focus:ring-cyan-400"
            />
            <span class="text-white">Contest Hosting</span>
          </label>

          <label class="flex items-center gap-3 p-3 rounded-lg bg-dark-secondary border border-white/10 hover:border-cyan-400/30 cursor-pointer transition-colors">
            <input
              v-model="localFormData.services.fanEngagement"
              type="checkbox"
              class="w-5 h-5 rounded border-white/20 text-cyan-500 focus:ring-cyan-400"
            />
            <span class="text-white">Fan Engagement Activities</span>
          </label>

          <label class="flex items-center gap-3 p-3 rounded-lg bg-dark-secondary border border-white/10 hover:border-cyan-400/30 cursor-pointer transition-colors">
            <input
              v-model="localFormData.services.awards"
              type="checkbox"
              class="w-5 h-5 rounded border-white/20 text-cyan-500 focus:ring-cyan-400"
            />
            <span class="text-white">Awards Presentation</span>
          </label>

          <label class="flex items-center gap-3 p-3 rounded-lg bg-dark-secondary border border-white/10 hover:border-cyan-400/30 cursor-pointer transition-colors">
            <input
              v-model="localFormData.services.interviews"
              type="checkbox"
              class="w-5 h-5 rounded border-white/20 text-cyan-500 focus:ring-cyan-400"
            />
            <span class="text-white">Player/Coach Interviews</span>
          </label>
        </div>
      </div>

      <!-- Event Details -->
      <div class="space-y-4">
        <h3 class="text-xl font-bold text-white flex items-center gap-2">
          <Icon name="mdi:clipboard-text" class="w-5 h-5 text-cyan-400" />
          Event Details
        </h3>
        
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">
            Event Schedule/Agenda
          </label>
          <textarea
            v-model="localFormData.eventSchedule"
            rows="4"
            class="w-full px-4 py-3 rounded-lg bg-dark-secondary border border-white/10 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
            placeholder="Provide a brief schedule or agenda for the event..."
          ></textarea>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">
            Special Announcements or Messages
          </label>
          <textarea
            v-model="localFormData.specialAnnouncements"
            rows="3"
            class="w-full px-4 py-3 rounded-lg bg-dark-secondary border border-white/10 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
            placeholder="Any special announcements, sponsor messages, or dedications..."
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
import { ref, watch } from 'vue'

const props = defineProps<{
  modelValue: any
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void
  (e: 'submit'): void
  (e: 'back'): void
}>()

const localFormData = ref({ 
  eventType: '',
  eventDuration: 4,
  attendance: null,
  venueName: '',
  services: {
    announcements: false,
    contests: false,
    fanEngagement: false,
    awards: false,
    interviews: false
  },
  eventSchedule: '',
  specialAnnouncements: '',
  ...props.modelValue 
})

watch(localFormData, (newVal) => {
  emit('update:modelValue', newVal)
}, { deep: true })

watch(() => props.modelValue, (newVal) => {
  localFormData.value = { ...newVal }
}, { deep: true })

const handleSubmit = () => {
  emit('submit')
}
</script>
