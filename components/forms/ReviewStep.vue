<template>
  <div class="space-y-6">
    <div class="text-center mb-8">
      <h3 class="text-3xl font-bold text-white mb-2">Review Your Request</h3>
      <p class="text-slate-400">Please review all details before submitting</p>
    </div>

    <!-- Package Information -->
    <div class="card p-6 border-2 border-cyan-500/30">
      <div class="flex items-center justify-between mb-4">
        <h4 class="text-xl font-bold text-white flex items-center gap-2">
          <Icon name="mdi:package-variant" class="w-6 h-6 text-cyan-400" />
          Package Details
        </h4>
        <button
          type="button"
          @click="$emit('edit', 'selection')"
          class="text-sm text-cyan-400 hover:text-cyan-300 underline"
        >
          Change Package
        </button>
      </div>
      <div class="space-y-2 text-slate-300">
        <p><strong class="text-white">Package:</strong> {{ packageName }}</p>
        <p v-if="packagePrice"><strong class="text-white">Price:</strong> {{ packagePrice }}</p>
      </div>
    </div>

    <!-- Team Information -->
    <div v-if="formData.teamName" class="card p-6">
      <div class="flex items-center justify-between mb-4">
        <h4 class="text-xl font-bold text-white flex items-center gap-2">
          <Icon name="mdi:shield-star" class="w-6 h-6 text-cyan-400" />
          Team Information
        </h4>
        <button
          type="button"
          @click="$emit('edit', 'team-info')"
          class="text-sm text-cyan-400 hover:text-cyan-300 underline"
          aria-label="Edit team information"
        >
          Edit
        </button>
      </div>
      <div class="space-y-2 text-slate-300">
        <p><strong class="text-white">Team Name:</strong> {{ formData.teamName }}</p>
        <p v-if="formData.organization">
          <strong class="text-white">Organization:</strong> {{ formData.organization }}
        </p>
        <p v-if="formData.eventDate">
          <strong class="text-white">Event Date:</strong> {{ formatDate(formData.eventDate) }}
        </p>
      </div>
    </div>

    <!-- Roster Information -->
    <div v-if="formData.roster" class="card p-6">
      <div class="flex items-center justify-between mb-4">
        <h4 class="text-xl font-bold text-white flex items-center gap-2">
          <Icon name="mdi:account-group" class="w-6 h-6 text-cyan-400" />
          Roster
        </h4>
        <button
          type="button"
          @click="$emit('edit', 'roster-upload')"
          class="text-sm text-cyan-400 hover:text-cyan-300 underline"
          aria-label="Edit roster"
        >
          Edit
        </button>
      </div>
      <div class="space-y-2 text-slate-300">
        <p>
          <strong class="text-white">Method:</strong> 
          {{ formData.roster.method === 'manual' ? 'Manual Entry' : formData.roster.method === 'pdf' ? 'PDF Upload' : 'Web Link' }}
        </p>
        <div v-if="formData.roster.method === 'manual' && formData.roster.players">
          <strong class="text-white">Players ({{ formData.roster.players.filter(p => p.trim()).length }}):</strong>
          <ul class="mt-2 space-y-1 ml-4 list-disc">
            <li v-for="(player, idx) in formData.roster.players.filter(p => p.trim())" :key="idx">
              {{ player }}
            </li>
          </ul>
        </div>
        <p v-if="formData.roster.method === 'pdf' && formData.roster.pdfFile">
          <strong class="text-white">File:</strong> {{ formData.roster.pdfFile.name }}
        </p>
        <p v-if="formData.roster.method === 'weblink' && formData.roster.webLink">
          <strong class="text-white">Link:</strong> 
          <a :href="formData.roster.webLink" target="_blank" class="text-cyan-400 hover:underline">
            {{ formData.roster.webLink }}
          </a>
        </p>
      </div>
    </div>

    <!-- Song Selections -->
    <div v-if="hasSongs" class="card p-6">
      <div class="flex items-center justify-between mb-4">
        <h4 class="text-xl font-bold text-white flex items-center gap-2">
          <Icon name="mdi:music" class="w-6 h-6 text-cyan-400" />
          Song Selections
        </h4>
        <button
          type="button"
          @click="$emit('edit', 'songs')"
          class="text-sm text-cyan-400 hover:text-cyan-300 underline"
          aria-label="Edit songs"
        >
          Edit
        </button>
      </div>
      <div class="space-y-3 text-slate-300">
        <div v-if="formData.introSong">
          <strong class="text-white">Intro Song:</strong> {{ formatSong(formData.introSong) }}
        </div>
        <div v-if="formData.warmupSong1">
          <strong class="text-white">Warmup Song #1:</strong> {{ formatSong(formData.warmupSong1) }}
        </div>
        <div v-if="formData.warmupSong2">
          <strong class="text-white">Warmup Song #2:</strong> {{ formatSong(formData.warmupSong2) }}
        </div>
        <div v-if="formData.warmupSong3">
          <strong class="text-white">Warmup Song #3:</strong> {{ formatSong(formData.warmupSong3) }}
        </div>
        <div v-if="formData.goalHorn">
          <strong class="text-white">Goal Horn:</strong> {{ formatSong(formData.goalHorn) }}
        </div>
        <div v-if="formData.winSong">
          <strong class="text-white">Win Song:</strong> {{ formatSong(formData.winSong) }}
        </div>
      </div>
    </div>

    <!-- Audio Files -->
    <div v-if="formData.audioFiles && formData.audioFiles.length > 0" class="card p-6">
      <div class="flex items-center justify-between mb-4">
        <h4 class="text-xl font-bold text-white flex items-center gap-2">
          <Icon name="mdi:file-music" class="w-6 h-6 text-cyan-400" />
          Audio Files
        </h4>
        <button
          type="button"
          @click="$emit('edit', 'songs')"
          class="text-sm text-cyan-400 hover:text-cyan-300 underline"
          aria-label="Edit audio files"
        >
          Edit
        </button>
      </div>
      <div class="space-y-2 text-slate-300">
        <p><strong class="text-white">Files ({{ formData.audioFiles.length }}):</strong></p>
        <ul class="mt-2 space-y-1 ml-4 list-disc">
          <li v-for="(file, idx) in formData.audioFiles" :key="idx">
            {{ file.name }} <span class="text-slate-500">({{ formatFileSize(file.size) }})</span>
          </li>
        </ul>
      </div>
    </div>

    <!-- Contact Information -->
    <div class="card p-6">
      <div class="flex items-center justify-between mb-4">
        <h4 class="text-xl font-bold text-white flex items-center gap-2">
          <Icon name="mdi:account" class="w-6 h-6 text-cyan-400" />
          Contact Information
        </h4>
        <button
          type="button"
          @click="$emit('edit', 'team-info')"
          class="text-sm text-cyan-400 hover:text-cyan-300 underline"
          aria-label="Edit contact information"
        >
          Edit
        </button>
      </div>
      <div class="space-y-2 text-slate-300">
        <p><strong class="text-white">Name:</strong> {{ formData.contactInfo?.name || formData.contactName || 'Not provided' }}</p>
        <p><strong class="text-white">Email:</strong> {{ formData.contactInfo?.email || formData.contactEmail || 'Not provided' }}</p>
        <p><strong class="text-white">Phone:</strong> {{ formData.contactInfo?.phone || formData.contactPhone || 'Not provided' }}</p>
      </div>
    </div>

    <!-- Additional Notes -->
    <div v-if="formData.notes" class="card p-6">
      <div class="flex items-center justify-between mb-4">
        <h4 class="text-xl font-bold text-white flex items-center gap-2">
          <Icon name="mdi:note-text" class="w-6 h-6 text-cyan-400" />
          Additional Notes
        </h4>
        <button
          type="button"
          @click="$emit('edit', 'songs')"
          class="text-sm text-cyan-400 hover:text-cyan-300 underline"
          aria-label="Edit notes"
        >
          Edit
        </button>
      </div>
      <p class="text-slate-300 whitespace-pre-wrap">{{ formData.notes }}</p>
    </div>

    <!-- Action Buttons -->
    <div class="flex gap-4 pt-6 border-t border-slate-700">
      <UiButton
        type="button"
        variant="outline"
        @click="$emit('back')"
        class="flex-1"
      >
        <Icon name="mdi:arrow-left" class="w-5 h-5 mr-2" />
        Back
      </UiButton>
      <UiButton
        type="button"
        variant="primary"
        @click="$emit('submit')"
        class="flex-1"
        :disabled="isSubmitting"
      >
        <Icon v-if="isSubmitting" name="mdi:loading" class="w-5 h-5 mr-2 animate-spin" />
        <Icon v-else name="mdi:check-circle" class="w-5 h-5 mr-2" />
        {{ isSubmitting ? 'Submitting...' : 'Confirm & Submit' }}
      </UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  formData: any
  packageName: string
  packagePrice?: string
  isSubmitting?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isSubmitting: false
})

defineEmits<{
  edit: [step: string]
  back: []
  submit: []
}>()

const hasSongs = computed(() => {
  return props.formData.introSong || 
         props.formData.warmupSong1 || 
         props.formData.warmupSong2 || 
         props.formData.warmupSong3 ||
         props.formData.goalHorn ||
         props.formData.winSong
})

function formatSong(song: any): string {
  if (!song) return 'Not specified'
  
  if (song.method === 'youtube' && song.youtube) {
    return `YouTube: ${song.youtube}`
  } else if (song.method === 'spotify' && song.spotify) {
    return `Spotify: ${song.spotify}`
  } else if (song.method === 'text' && song.text) {
    return song.text
  } else if (typeof song === 'string') {
    return song
  }
  
  return 'Not specified'
}

function formatDate(date: string): string {
  if (!date) return ''
  try {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch {
    return date
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}
</script>
