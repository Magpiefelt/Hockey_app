<template>
  <div class="space-y-8">
    <form @submit.prevent="handleSubmit" class="space-y-8">
      <!-- Team Information -->
      <div class="space-y-4">
        <h3 class="text-2xl font-bold text-white flex items-center gap-2">
          <Icon name="mdi:shield-star" class="w-6 h-6 text-cyan-400" />
          Event Information
        </h3>

        <div class="grid md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">
              Team/Organization Name <span class="text-red-400">*</span>
            </label>
            <input
              v-model="localFormData.teamName"
              type="text"
              required
              class="w-full px-4 py-3 rounded-lg bg-dark-secondary border border-white/10 text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-colors"
              placeholder="Enter team or organization name"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">
              Event Type <span class="text-red-400">*</span>
            </label>
            <select
              v-model="localFormData.eventType"
              required
              class="w-full px-4 py-3 rounded-lg bg-dark-secondary border border-white/10 text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-colors"
            >
              <option value="">Select event type</option>
              <option value="tournament">Tournament</option>
              <option value="championship">Championship</option>
              <option value="playoff">Playoff Game</option>
              <option value="regular">Regular Season Game</option>
              <option value="exhibition">Exhibition Game</option>
              <option value="ceremony">Ceremony/Awards</option>
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
              class="w-full px-4 py-3 rounded-lg bg-dark-secondary border border-white/10 text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-colors"
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
              class="w-full px-4 py-3 rounded-lg bg-dark-secondary border border-white/10 text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-colors"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">
              Expected Attendance
            </label>
            <input
              v-model.number="localFormData.attendance"
              type="number"
              min="0"
              class="w-full px-4 py-3 rounded-lg bg-dark-secondary border border-white/10 text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-colors"
              placeholder="Estimated number of attendees"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">
              Venue Name <span class="text-red-400">*</span>
            </label>
            <input
              v-model="localFormData.venueName"
              type="text"
              required
              class="w-full px-4 py-3 rounded-lg bg-dark-secondary border border-white/10 text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-colors"
              placeholder="Enter venue name"
            />
          </div>
        </div>
      </div>

      <!-- Services Needed -->
      <div class="space-y-4">
        <h3 class="text-2xl font-bold text-white flex items-center gap-2">
          <Icon name="mdi:account-voice" class="w-6 h-6 text-cyan-400" />
          Services Needed
        </h3>

        <div class="space-y-3">
          <label class="flex items-center gap-3 p-4 rounded-lg bg-dark-secondary border border-white/10 hover:border-cyan-500/30 transition-colors cursor-pointer">
            <input
              v-model="localFormData.services.announcements"
              type="checkbox"
              class="w-5 h-5 rounded border-white/20 bg-dark-primary text-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            />
            <div class="flex-1">
              <div class="text-white font-semibold">Player Announcements</div>
              <div class="text-sm text-slate-400">Professional player introductions and announcements</div>
            </div>
          </label>

          <label class="flex items-center gap-3 p-4 rounded-lg bg-dark-secondary border border-white/10 hover:border-cyan-500/30 transition-colors cursor-pointer">
            <input
              v-model="localFormData.services.contests"
              type="checkbox"
              class="w-5 h-5 rounded border-white/20 bg-dark-primary text-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            />
            <div class="flex-1">
              <div class="text-white font-semibold">Contests & Games</div>
              <div class="text-sm text-slate-400">Interactive contests and fan engagement activities</div>
            </div>
          </label>

          <label class="flex items-center gap-3 p-4 rounded-lg bg-dark-secondary border border-white/10 hover:border-cyan-500/30 transition-colors cursor-pointer">
            <input
              v-model="localFormData.services.fanEngagement"
              type="checkbox"
              class="w-5 h-5 rounded border-white/20 bg-dark-primary text-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            />
            <div class="flex-1">
              <div class="text-white font-semibold">Fan Engagement</div>
              <div class="text-sm text-slate-400">Crowd interaction and hype building</div>
            </div>
          </label>

          <label class="flex items-center gap-3 p-4 rounded-lg bg-dark-secondary border border-white/10 hover:border-cyan-500/30 transition-colors cursor-pointer">
            <input
              v-model="localFormData.services.awards"
              type="checkbox"
              class="w-5 h-5 rounded border-white/20 bg-dark-primary text-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            />
            <div class="flex-1">
              <div class="text-white font-semibold">Awards Ceremony</div>
              <div class="text-sm text-slate-400">Professional ceremony hosting and presentations</div>
            </div>
          </label>

          <label class="flex items-center gap-3 p-4 rounded-lg bg-dark-secondary border border-white/10 hover:border-cyan-500/30 transition-colors cursor-pointer">
            <input
              v-model="localFormData.services.interviews"
              type="checkbox"
              class="w-5 h-5 rounded border-white/20 bg-dark-primary text-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            />
            <div class="flex-1">
              <div class="text-white font-semibold">Player/Coach Interviews</div>
              <div class="text-sm text-slate-400">On-ice or on-court interview hosting</div>
            </div>
          </label>
        </div>
      </div>

      <!-- Event Details -->
      <div class="space-y-4">
        <h3 class="text-2xl font-bold text-white flex items-center gap-2">
          <Icon name="mdi:calendar-clock" class="w-6 h-6 text-cyan-400" />
          Event Details
        </h3>

        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">
            Event Schedule/Timeline
          </label>
          <textarea
            v-model="localFormData.eventSchedule"
            rows="4"
            class="w-full px-4 py-3 rounded-lg bg-dark-secondary border border-white/10 text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-colors resize-none"
            placeholder="Please provide a rough timeline of the event (e.g., warmups, game start, intermissions, ceremonies)"
          ></textarea>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">
            Special Announcements or Requests
          </label>
          <textarea
            v-model="localFormData.specialAnnouncements"
            rows="4"
            class="w-full px-4 py-3 rounded-lg bg-dark-secondary border border-white/10 text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-colors resize-none"
            placeholder="Any special announcements, dedications, or specific requests?"
          ></textarea>
        </div>
      </div>

      <!-- Contact Information -->
      <div class="space-y-4">
        <h3 class="text-2xl font-bold text-white flex items-center gap-2">
          <Icon name="mdi:account" class="w-6 h-6 text-cyan-400" />
          Contact Information
        </h3>

        <div class="grid md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">
              Your Name <span class="text-red-400">*</span>
            </label>
            <input
              v-model="localFormData.contactName"
              type="text"
              required
              class="w-full px-4 py-3 rounded-lg bg-dark-secondary border border-white/10 text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-colors"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">
              Email Address <span class="text-red-400">*</span>
            </label>
            <input
              v-model="localFormData.contactEmail"
              type="email"
              required
              class="w-full px-4 py-3 rounded-lg bg-dark-secondary border border-white/10 text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-colors"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">
              Phone Number <span class="text-red-400">*</span>
            </label>
            <input
              v-model="localFormData.contactPhone"
              type="tel"
              required
              class="w-full px-4 py-3 rounded-lg bg-dark-secondary border border-white/10 text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-colors"
              placeholder="(555) 123-4567"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">
            Additional Notes or Questions
          </label>
          <textarea
            v-model="localFormData.notes"
            rows="4"
            class="w-full px-4 py-3 rounded-lg bg-dark-secondary border border-white/10 text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-colors resize-none"
            placeholder="Any other details we should know?"
          ></textarea>
        </div>
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
      teamName: '',
      eventType: '',
      eventDate: '',
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
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      notes: '',
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
