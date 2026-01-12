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

    <!-- Error Message -->
    <div
      v-if="errorMessage"
      class="p-3 rounded-lg bg-red-500/10 border border-red-500/30"
      role="alert"
      aria-live="assertive"
    >
      <p class="text-sm text-red-400 flex items-center gap-2">
        <Icon name="mdi:alert-circle" class="w-5 h-5" />
        {{ errorMessage }}
      </p>
    </div>

    <!-- PDF Upload -->
    <div v-if="inputMethod === 'pdf'">
      <div
        @click="triggerFileInput"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleFileDrop"
        :class="[
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all',
          isDragging ? 'border-cyan-400 bg-cyan-500/20 scale-105' : '',
          pdfFile && !isDragging
            ? 'border-cyan-400 bg-cyan-500/10'
            : !isDragging ? 'border-slate-600 hover:border-cyan-400' : ''
        ]"
      >
        <input
          ref="fileInput"
          type="file"
          accept=".pdf"
          @change="handleFileSelect"
          class="hidden"
        />
        
        <!-- Upload in progress -->
        <div v-if="isUploading" class="space-y-3">
          <Icon name="mdi:loading" class="w-12 h-12 mx-auto text-cyan-400 animate-spin" />
          <p class="text-white font-semibold">Uploading...</p>
          <div class="w-48 mx-auto bg-slate-700 rounded-full h-2 overflow-hidden">
            <div 
              class="bg-cyan-500 h-full transition-all duration-300"
              :style="{ width: `${currentUploadProgress}%` }"
            ></div>
          </div>
          <p class="text-sm text-slate-400">{{ currentUploadProgress }}%</p>
        </div>
        
        <!-- No file selected -->
        <template v-else-if="!pdfFile">
          <Icon name="mdi:cloud-upload" class="w-12 h-12 mx-auto mb-3 text-cyan-400" />
          <p class="text-white font-semibold mb-1">Click to upload or drag and drop</p>
          <p class="text-sm text-slate-400">PDF file (max 10MB)</p>
        </template>
        
        <!-- File selected/uploaded -->
        <template v-else>
          <Icon name="mdi:file-check" class="w-12 h-12 mx-auto mb-3 text-green-400" />
          <p class="text-white font-semibold mb-1">{{ pdfFile.name }}</p>
          <p class="text-sm text-slate-400">{{ formatFileSize(pdfFile.size) }}</p>
          <p v-if="uploadedFileUrl" class="text-xs text-green-400 mt-2">
            <Icon name="mdi:check-circle" class="w-4 h-4 inline mr-1" />
            File uploaded successfully
          </p>
          <button
            @click.stop="removePdfFile"
            type="button"
            class="mt-3 px-4 py-2 text-sm bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
          >
            <Icon name="mdi:delete" class="w-4 h-4 inline mr-1" />
            Remove File
          </button>
        </template>
      </div>
      
      <!-- Upload error -->
      <div v-if="uploadError" class="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
        <p class="text-sm text-red-400 flex items-center gap-2">
          <Icon name="mdi:alert-circle" class="w-5 h-5" />
          {{ uploadError }}
        </p>
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
import { ref, watch, computed } from 'vue'
import { useFileUpload } from '~/composables/useFileUpload'

interface Props {
  modelValue: {
    method: 'manual' | 'pdf' | 'weblink'
    players?: string[]
    pdfFile?: File | null
    pdfUrl?: string | null
    webLink?: string
  }
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: any]
}>()

// File upload composable
const { uploadFile, isUploading, uploadProgress, clearProgress } = useFileUpload()

const inputMethod = ref<'manual' | 'pdf' | 'weblink'>(props.modelValue?.method || 'manual')
const players = ref<string[]>(props.modelValue?.players || [''])
const pdfFile = ref<File | null>(props.modelValue?.pdfFile || null)
const uploadedFileUrl = ref<string | null>(props.modelValue?.pdfUrl || null)
const rosterWebLink = ref<string>(props.modelValue?.webLink || '')
const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const errorMessage = ref<string>('')
const uploadError = ref<string>('')

// Computed progress for current upload
const currentUploadProgress = computed(() => {
  if (uploadProgress.value.length === 0) return 0
  const current = uploadProgress.value[uploadProgress.value.length - 1]
  return current?.progress || 0
})

const addPlayer = () => {
  if (players.value.length < 20) {
    players.value.push('')
  }
}

const removePlayer = (index: number) => {
  players.value.splice(index, 1)
}

const triggerFileInput = () => {
  if (!isUploading.value) {
    fileInput.value?.click()
  }
}

const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    await processAndUploadFile(target.files[0])
  }
  // Reset input so same file can be selected again
  target.value = ''
}

const handleFileDrop = async (event: DragEvent) => {
  isDragging.value = false
  if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
    await processAndUploadFile(event.dataTransfer.files[0])
  }
}

const processAndUploadFile = async (file: File) => {
  // Clear previous errors
  errorMessage.value = ''
  uploadError.value = ''
  
  // Validate file
  const validationError = validatePdf(file)
  if (validationError) {
    errorMessage.value = validationError
    setTimeout(() => errorMessage.value = '', 5000)
    return
  }
  
  // Set the file locally first (for display)
  pdfFile.value = file
  
  // Upload to S3
  clearProgress()
  const result = await uploadFile(file, {
    kind: 'upload',
    fieldName: 'roster_pdf'
  })
  
  if (result.success) {
    uploadedFileUrl.value = result.url || null
    emitUpdate()
  } else {
    uploadError.value = result.error || 'Failed to upload file. Please try again.'
    // Keep the file selected so user can retry
  }
}

const validatePdf = (file: File): string | null => {
  const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB in bytes
  
  // Check file type
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    return 'Please upload a PDF file.'
  }
  
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return `File is too large. Maximum size is 10MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`
  }
  
  return null
}

const removePdfFile = () => {
  pdfFile.value = null
  uploadedFileUrl.value = null
  uploadError.value = ''
  clearProgress()
  emitUpdate()
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

const updateWebLink = () => {
  emitUpdate()
}

const emitUpdate = () => {
  emit('update:modelValue', {
    method: inputMethod.value,
    players: inputMethod.value === 'manual' ? players.value : undefined,
    pdfFile: inputMethod.value === 'pdf' ? pdfFile.value : undefined,
    pdfUrl: inputMethod.value === 'pdf' ? uploadedFileUrl.value : undefined,
    webLink: inputMethod.value === 'weblink' ? rosterWebLink.value : undefined
  })
}

watch([inputMethod, players], () => {
  emitUpdate()
}, { deep: true })

// Watch for method changes to clear upload state
watch(inputMethod, (newMethod) => {
  if (newMethod !== 'pdf') {
    pdfFile.value = null
    uploadedFileUrl.value = null
    uploadError.value = ''
    clearProgress()
  }
})
</script>
