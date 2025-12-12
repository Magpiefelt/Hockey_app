<template>
  <div class="space-y-4">
    <label class="block text-sm font-semibold text-white" :for="inputId">
      {{ label }}
      <span v-if="required" class="text-red-400" aria-label="required">*</span>
    </label>
    <p v-if="description" class="text-sm text-slate-400" :id="`${inputId}-description`">
      {{ description }}
    </p>

    <!-- Upload Type Selection -->
    <div class="flex gap-3 mb-4" role="group" aria-label="Upload type selection">
      <button
        type="button"
        @click="uploadType = 'single'"
        :class="[
          'flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all',
          uploadType === 'single'
            ? 'bg-cyan-500/20 border-2 border-cyan-500 text-cyan-400'
            : 'bg-slate-800 border-2 border-slate-600 text-slate-400 hover:border-slate-500'
        ]"
        :aria-pressed="uploadType === 'single'"
      >
        <Icon name="mdi:file-music" class="w-4 h-4 inline mr-1" />
        Single File
      </button>
      <button
        type="button"
        @click="uploadType = 'multiple'"
        :class="[
          'flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all',
          uploadType === 'multiple'
            ? 'bg-cyan-500/20 border-2 border-cyan-500 text-cyan-400'
            : 'bg-slate-800 border-2 border-slate-600 text-slate-400 hover:border-slate-500'
        ]"
        :aria-pressed="uploadType === 'multiple'"
      >
        <Icon name="mdi:file-multiple" class="w-4 h-4 inline mr-1" />
        Multiple Files
      </button>
    </div>

    <!-- File Upload Area -->
    <div
      @click="triggerFileInput"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleFileDrop"
      :class="[
        'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all',
        isDragging ? 'border-cyan-400 bg-cyan-500/20 scale-105' : '',
        files.length > 0 && !isDragging
          ? 'border-cyan-400 bg-cyan-500/10'
          : !isDragging ? 'border-slate-600 hover:border-cyan-400' : ''
      ]"
      role="button"
      :aria-label="`Upload ${uploadType === 'single' ? 'single' : 'multiple'} audio file${uploadType === 'multiple' ? 's' : ''}`"
      tabindex="0"
      @keydown.enter="triggerFileInput"
      @keydown.space.prevent="triggerFileInput"
    >
      <input
        :id="inputId"
        ref="fileInput"
        type="file"
        :accept="acceptedFormats"
        :multiple="uploadType === 'multiple'"
        @change="handleFileSelect"
        class="hidden"
        :aria-describedby="description ? `${inputId}-description` : undefined"
      />
      <Icon
        :name="files.length > 0 ? 'mdi:file-check' : 'mdi:cloud-upload'"
        class="w-10 h-10 mx-auto mb-3 text-cyan-400"
        aria-hidden="true"
      />
      <p v-if="files.length === 0" class="text-white font-semibold mb-1">
        Click to upload or drag and drop
      </p>
      <p v-else class="text-white font-semibold mb-1">
        {{ files.length }} file{{ files.length > 1 ? 's' : '' }} selected
      </p>
      <p class="text-sm text-slate-400">
        {{ uploadType === 'single' ? 'Single audio file' : 'Multiple audio files' }} (MP3, WAV, M4A - max {{ maxSizeMB }}MB each)
      </p>
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

    <!-- File List with Progress -->
    <div v-if="files.length > 0" class="space-y-2" role="list" aria-label="Uploaded files">
      <div
        v-for="(file, index) in filesWithProgress"
        :key="index"
        class="rounded-lg bg-slate-800 border border-slate-700 overflow-hidden"
        role="listitem"
      >
        <div class="flex items-center justify-between p-3">
          <div class="flex items-center gap-3 flex-1 min-w-0">
            <Icon 
              :name="file.progress === 100 ? 'mdi:check-circle' : 'mdi:music-note'" 
              :class="[
                'w-5 h-5 flex-shrink-0',
                file.progress === 100 ? 'text-green-400' : 'text-cyan-400'
              ]" 
              aria-hidden="true"
            />
            <div class="flex-1 min-w-0">
              <span class="text-white text-sm truncate block">{{ file.file.name }}</span>
              <div class="flex items-center gap-2 mt-1">
                <span class="text-slate-400 text-xs flex-shrink-0">
                  {{ formatFileSize(file.file.size) }}
                </span>
                <span v-if="file.progress < 100" class="text-cyan-400 text-xs">
                  {{ file.progress }}%
                </span>
                <span v-else class="text-green-400 text-xs">
                  ✓ Ready
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            @click="removeFile(index)"
            class="ml-2 p-1 rounded hover:bg-red-500/20 text-red-400 transition-colors"
            :aria-label="`Remove ${file.file.name}`"
          >
            <Icon name="mdi:close" class="w-5 h-5" />
          </button>
        </div>
        
        <!-- Progress Bar -->
        <div v-if="file.progress < 100" class="h-1 bg-slate-900">
          <div 
            class="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
            :style="{ width: file.progress + '%' }"
            role="progressbar"
            :aria-valuenow="file.progress"
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-label="`Upload progress: ${file.progress}%`"
          />
        </div>
      </div>
    </div>

    <!-- File Format Help -->
    <div class="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
      <p class="text-sm text-slate-300 flex items-start gap-2">
        <Icon name="mdi:information" class="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <span>
          <strong>Accepted formats:</strong> MP3, WAV, M4A. 
          <strong>Max size:</strong> {{ maxSizeMB }}MB per file.
          Files are validated before upload.
        </span>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'

interface Props {
  label: string
  description?: string
  modelValue?: File[]
  required?: boolean
  acceptedFormats?: string
  maxSizeMB?: number
}

const props = withDefaults(defineProps<Props>(), {
  description: '',
  required: false,
  acceptedFormats: '.mp3,.wav,.m4a',
  maxSizeMB: 50
})

const emit = defineEmits<{
  'update:modelValue': [value: File[]]
  'validation': [isValid: boolean]
}>()

const inputId = `audio-upload-${Math.random().toString(36).substr(2, 9)}`
const uploadType = ref<'single' | 'multiple'>('single')
const files = ref<File[]>(props.modelValue || [])
const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const errorMessage = ref('')

// Simulate upload progress for UX (in real implementation, this would track actual upload)
const filesWithProgress = ref<Array<{ file: File; progress: number }>>([])

// Watch files and create progress tracking
watch(files, (newFiles) => {
  filesWithProgress.value = newFiles.map((file, index) => {
    const existing = filesWithProgress.value.find(f => f.file === file)
    if (existing) return existing
    
    // Simulate upload progress
    const progressItem = { file, progress: 0 }
    simulateProgress(progressItem)
    return progressItem
  })
}, { immediate: true })

function simulateProgress(item: { file: File; progress: number }) {
  const interval = setInterval(() => {
    if (item.progress < 100) {
      item.progress += 10
    } else {
      clearInterval(interval)
    }
  }, 100)
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    addFiles(Array.from(target.files))
  }
  // Reset input so same file can be selected again
  target.value = ''
}

const handleFileDrop = (event: DragEvent) => {
  isDragging.value = false
  if (event.dataTransfer?.files) {
    addFiles(Array.from(event.dataTransfer.files))
  }
}

const addFiles = (newFiles: File[]) => {
  errorMessage.value = ''
  const MAX_FILE_SIZE = props.maxSizeMB * 1024 * 1024 // Convert MB to bytes
  const ALLOWED_TYPES = ['audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/mp4', 'audio/x-wav']
  const ALLOWED_EXTENSIONS = /\.(mp3|wav|m4a)$/i
  
  const validationErrors: string[] = []
  
  // Validate files
  const validFiles = newFiles.filter(file => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      validationErrors.push(`"${file.name}" exceeds ${props.maxSizeMB}MB limit`)
      return false
    }
    
    // Check file size minimum (at least 1KB)
    if (file.size < 1024) {
      validationErrors.push(`"${file.name}" is too small to be a valid audio file`)
      return false
    }
    
    // Check file type
    const hasValidType = ALLOWED_TYPES.includes(file.type)
    const hasValidExtension = ALLOWED_EXTENSIONS.test(file.name)
    
    if (!hasValidType && !hasValidExtension) {
      validationErrors.push(`"${file.name}" is not a valid audio format (MP3, WAV, M4A only)`)
      return false
    }
    
    return true
  })
  
  if (validationErrors.length > 0) {
    errorMessage.value = validationErrors[0] // Show first error
    setTimeout(() => {
      errorMessage.value = ''
    }, 5000)
  }
  
  if (validFiles.length === 0) return
  
  if (uploadType.value === 'single') {
    files.value = [validFiles[0]]
  } else {
    // Check total file count
    const totalFiles = files.value.length + validFiles.length
    if (totalFiles > 20) {
      errorMessage.value = 'Maximum 20 files allowed'
      setTimeout(() => {
        errorMessage.value = ''
      }, 5000)
      return
    }
    files.value = [...files.value, ...validFiles]
  }
  
  emitUpdate()
}

const removeFile = (index: number) => {
  files.value.splice(index, 1)
  filesWithProgress.value.splice(index, 1)
  emitUpdate()
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

const emitUpdate = () => {
  emit('update:modelValue', files.value)
  const isValid = !props.required || files.value.length > 0
  emit('validation', isValid)
}

watch(uploadType, () => {
  if (uploadType.value === 'single' && files.value.length > 1) {
    files.value = [files.value[0]]
    filesWithProgress.value = filesWithProgress.value.slice(0, 1)
    emitUpdate()
  }
})

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    files.value = newValue
  }
}, { deep: true })
</script>
