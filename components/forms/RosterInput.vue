<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between mb-4">
      <h4 class="text-lg font-bold text-white">Team Roster (Up to 20 Players)</h4>
      <span class="text-sm text-slate-400">{{ players.length }} / 20</span>
    </div>

    <!-- Roster Input Method Selection -->
    <div class="mb-6">
      <label class="block text-sm font-semibold text-white mb-3">
        How would you like to provide your roster?
      </label>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <label
          :class="[
            'flex flex-col items-center p-4 rounded-lg border-2 cursor-pointer transition-all',
            inputMethod === 'manual'
              ? 'border-cyan-400 bg-cyan-500/10'
              : 'border-slate-600 hover:border-slate-500'
          ]"
        >
          <input
            type="radio"
            v-model="inputMethod"
            value="manual"
            class="sr-only"
          />
          <Icon name="mdi:keyboard" class="w-6 h-6 mb-2 text-cyan-400" />
          <span class="text-white font-semibold text-sm">Manual Entry</span>
        </label>
        <label
          :class="[
            'flex flex-col items-center p-4 rounded-lg border-2 cursor-pointer transition-all',
            inputMethod === 'pdf'
              ? 'border-cyan-400 bg-cyan-500/10'
              : 'border-slate-600 hover:border-slate-500'
          ]"
        >
          <input
            type="radio"
            v-model="inputMethod"
            value="pdf"
            class="sr-only"
          />
          <Icon name="mdi:file-pdf-box" class="w-6 h-6 mb-2 text-cyan-400" />
          <span class="text-white font-semibold text-sm">Upload PDF</span>
        </label>
        <label
          :class="[
            'flex flex-col items-center p-4 rounded-lg border-2 cursor-pointer transition-all',
            inputMethod === 'weblink'
              ? 'border-cyan-400 bg-cyan-500/10'
              : 'border-slate-600 hover:border-slate-500'
          ]"
        >
          <input
            type="radio"
            v-model="inputMethod"
            value="weblink"
            class="sr-only"
          />
          <Icon name="mdi:link-variant" class="w-6 h-6 mb-2 text-cyan-400" />
          <span class="text-white font-semibold text-sm">Web Link</span>
        </label>
      </div>
    </div>

    <!-- Manual Entry -->
    <div v-if="inputMethod === 'manual'" class="space-y-3">
      <div v-for="(player, index) in players" :key="index" class="flex gap-2">
        <UiInput
          v-model="players[index]"
          :placeholder="`Player ${index + 1} name`"
          class="flex-1"
        />
        <button
          v-if="players.length > 1"
          @click="removePlayer(index)"
          type="button"
          class="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors"
        >
          <Icon name="mdi:delete" class="w-5 h-5" />
        </button>
      </div>
      <button
        v-if="players.length < 20"
        @click="addPlayer"
        type="button"
        class="w-full py-2 px-4 rounded-lg border-2 border-dashed border-slate-600 text-slate-400 hover:border-cyan-400 hover:text-cyan-400 transition-colors"
      >
        <Icon name="mdi:plus" class="w-5 h-5 inline mr-2" />
        Add Player
      </button>
    </div>

    <!-- PDF Upload -->
    <div v-if="inputMethod === 'pdf'">
      <div
        @click="triggerFileInput"
        @dragover.prevent
        @drop.prevent="handleFileDrop"
        :class="[
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all',
          pdfFile
            ? 'border-cyan-400 bg-cyan-500/10'
            : 'border-slate-600 hover:border-cyan-400'
        ]"
      >
        <input
          ref="fileInput"
          type="file"
          accept=".pdf"
          @change="handleFileSelect"
          class="hidden"
        />
        <Icon
          :name="pdfFile ? 'mdi:file-check' : 'mdi:cloud-upload'"
          class="w-12 h-12 mx-auto mb-3 text-cyan-400"
        />
        <p v-if="!pdfFile" class="text-white font-semibold mb-1">
          Click to upload or drag and drop
        </p>
        <p v-else class="text-white font-semibold mb-1">
          {{ pdfFile.name }}
        </p>
        <p class="text-sm text-slate-400">PDF file (max 10MB)</p>
      </div>
    </div>

    <!-- Web Link -->
    <div v-if="inputMethod === 'weblink'">
      <UiInput
        v-model="rosterWebLink"
        type="url"
        placeholder="https://example.com/roster"
        @input="updateWebLink"
      />
      <p class="text-xs text-slate-400 mt-2">
        Provide a link to your online roster (e.g., team website, Google Docs, etc.)
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  modelValue: {
    method: 'manual' | 'pdf' | 'weblink'
    players?: string[]
    pdfFile?: File | null
    webLink?: string
  }
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: any]
}>()

const inputMethod = ref<'manual' | 'pdf' | 'weblink'>(props.modelValue?.method || 'manual')
const players = ref<string[]>(props.modelValue?.players || [''])
const pdfFile = ref<File | null>(props.modelValue?.pdfFile || null)
const rosterWebLink = ref<string>(props.modelValue?.webLink || '')
const fileInput = ref<HTMLInputElement | null>(null)

const addPlayer = () => {
  if (players.value.length < 20) {
    players.value.push('')
  }
}

const removePlayer = (index: number) => {
  players.value.splice(index, 1)
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    validateAndSetPdf(target.files[0])
  }
}

const handleFileDrop = (event: DragEvent) => {
  if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
    validateAndSetPdf(event.dataTransfer.files[0])
  }
}

const validateAndSetPdf = (file: File) => {
  const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB in bytes
  
  // Check file type
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    alert('Please upload a PDF file.')
    return
  }
  
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    alert(`File is too large. Maximum size is 10MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`)
    return
  }
  
  pdfFile.value = file
  emitUpdate()
}

const updateWebLink = () => {
  emitUpdate()
}

const emitUpdate = () => {
  emit('update:modelValue', {
    method: inputMethod.value,
    players: inputMethod.value === 'manual' ? players.value : undefined,
    pdfFile: inputMethod.value === 'pdf' ? pdfFile.value : undefined,
    webLink: inputMethod.value === 'weblink' ? rosterWebLink.value : undefined
  })
}

watch([inputMethod, players], () => {
  emitUpdate()
}, { deep: true })
</script>
