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
          : !isDragging ? 'border-slate-600 hover:border-cyan-400' : '',
        isUploading ? 'pointer-events-none opacity-75' : ''
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
    <div v-if="filesWithProgress.length > 0" class="space-y-2" role="list" aria-label="Uploaded files">
      <div
        v-for="(fileItem, index) in filesWithProgress"
        :key="index"
        class="rounded-lg bg-slate-800 border border-slate-700 overflow-hidden"
        role="listitem"
      >
        <div class="flex items-center justify-between p-3">
          <div class="flex items-center gap-3 flex-1 min-w-0">
            <Icon 
              :name="getFileStatusIcon(fileItem.status)" 
              :class="[
                'w-5 h-5 flex-shrink-0',
                getFileStatusColor(fileItem.status),
                fileItem.status === 'uploading' ? 'animate-spin' : ''
              ]" 
              aria-hidden="true"
            />
            <div class="flex-1 min-w-0">
              <span class="text-white text-sm truncate block">{{ fileItem.file.name }}</span>
              <div class="flex items-center gap-2 mt-1">
                <span class="text-slate-400 text-xs flex-shrink-0">
                  {{ formatFileSize(fileItem.file.size) }}
                </span>
                <span v-if="fileItem.status === 'uploading'" class="text-cyan-400 text-xs">
                  {{ fileItem.progress }}%
                </span>
                <span v-else-if="fileItem.status === 'success'" class="text-green-400 text-xs">
                  ✓ Uploaded
                </span>
                <span v-else-if="fileItem.status === 'error'" class="text-red-400 text-xs">
                  ✗ {{ fileItem.error || 'Failed' }}
                </span>
                <span v-else class="text-slate-400 text-xs">
                  Pending
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            @click="removeFile(index)"
            :disabled="fileItem.status === 'uploading'"
            class="ml-2 p-1 rounded hover:bg-red-500/20 text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            :aria-label="`Remove ${fileItem.file.name}`"
          >
            <Icon name="mdi:close" class="w-5 h-5" />
          </button>
        </div>
        
        <!-- Progress Bar -->
        <div v-if="fileItem.status === 'uploading' || fileItem.status === 'pending'" class="h-1 bg-slate-900">
          <div 
            class="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
            :style="{ width: fileItem.progress + '%' }"
            role="progressbar"
            :aria-valuenow="fileItem.progress"
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-label="`Upload progress: ${fileItem.progress}%`"
          />
        </div>
      </div>
    </div>

    <!-- Upload All Button (when files are pending) -->
    <div v-if="hasPendingFiles && !isUploading" class="flex gap-2">
      <button
        type="button"
        @click="uploadAllFiles"
        class="flex-1 py-2 px-4 rounded-lg bg-cyan-500 text-white font-semibold hover:bg-cyan-600 transition-colors flex items-center justify-center gap-2"
      >
        <Icon name="mdi:cloud-upload" class="w-5 h-5" />
        Upload {{ pendingFilesCount }} File{{ pendingFilesCount > 1 ? 's' : '' }}
      </button>
    </div>

    <!-- File Format Help -->
    <div class="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
      <p class="text-sm text-slate-300 flex items-start gap-2">
        <Icon name="mdi:information" class="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <span>
          <strong>Accepted formats:</strong> MP3, WAV, M4A. 
          <strong>Max size:</strong> {{ maxSizeMB }}MB per file.
          Files are uploaded securely to our servers.
        </span>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useFileUpload } from '~/composables/useFileUpload'

interface FileWithProgress {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
  url?: string
  key?: string
}

interface Props {
  label: string
  description?: string
  modelValue?: Array<{ file: File; url?: string; key?: string }>
  required?: boolean
  acceptedFormats?: string
  maxSizeMB?: number
  orderId?: number
  autoUpload?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  description: '',
  required: false,
  acceptedFormats: '.mp3,.wav,.m4a',
  maxSizeMB: 50,
  autoUpload: false
})

const emit = defineEmits<{
  'update:modelValue': [value: Array<{ file: File; url?: string; key?: string }>]
  'validation': [isValid: boolean]
  'upload-complete': [results: Array<{ file: File; url?: string; key?: string; success: boolean }>]
}>()

// File upload composable
const { uploadFile, isUploading: composableUploading, clearProgress } = useFileUpload()

const inputId = `audio-upload-${Math.random().toString(36).substr(2, 9)}`
const uploadType = ref<'single' | 'multiple'>('single')
const files = ref<File[]>([])
const filesWithProgress = ref<FileWithProgress[]>([])
const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const errorMessage = ref('')
const isUploading = ref(false)

// Computed properties
const hasPendingFiles = computed(() => {
  return filesWithProgress.value.some(f => f.status === 'pending')
})

const pendingFilesCount = computed(() => {
  return filesWithProgress.value.filter(f => f.status === 'pending').length
})

// Helper functions
const getFileStatusIcon = (status: FileWithProgress['status']): string => {
  switch (status) {
    case 'success': return 'mdi:check-circle'
    case 'error': return 'mdi:alert-circle'
    case 'uploading': return 'mdi:loading'
    default: return 'mdi:music-note'
  }
}

const getFileStatusColor = (status: FileWithProgress['status']): string => {
  switch (status) {
    case 'success': return 'text-green-400'
    case 'error': return 'text-red-400'
    case 'uploading': return 'text-cyan-400'
    default: return 'text-slate-400'
  }
}

const triggerFileInput = () => {
  if (!isUploading.value) {
    fileInput.value?.click()
  }
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
    
    // Check for duplicates
    const isDuplicate = files.value.some(f => f.name === file.name && f.size === file.size)
    if (isDuplicate) {
      validationErrors.push(`"${file.name}" is already added`)
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
    filesWithProgress.value = [{
      file: validFiles[0],
      progress: 0,
      status: 'pending'
    }]
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
    filesWithProgress.value = [
      ...filesWithProgress.value,
      ...validFiles.map(file => ({
        file,
        progress: 0,
        status: 'pending' as const
      }))
    ]
  }
  
  emitUpdate()
  
  // Auto upload if enabled
  if (props.autoUpload) {
    uploadAllFiles()
  }
}

const removeFile = (index: number) => {
  const fileItem = filesWithProgress.value[index]
  if (fileItem.status === 'uploading') return
  
  files.value.splice(index, 1)
  filesWithProgress.value.splice(index, 1)
  emitUpdate()
}

const uploadAllFiles = async () => {
  if (isUploading.value) return
  
  isUploading.value = true
  clearProgress()
  
  const results: Array<{ file: File; url?: string; key?: string; success: boolean }> = []
  
  for (let i = 0; i < filesWithProgress.value.length; i++) {
    const fileItem = filesWithProgress.value[i]
    
    if (fileItem.status !== 'pending') {
      results.push({
        file: fileItem.file,
        url: fileItem.url,
        key: fileItem.key,
        success: fileItem.status === 'success'
      })
      continue
    }
    
    // Update status to uploading
    filesWithProgress.value[i] = { ...fileItem, status: 'uploading', progress: 0 }
    
    try {
      const result = await uploadFile(fileItem.file, {
        orderId: props.orderId,
        kind: 'upload',
        fieldName: 'audio_file',
        onProgress: (progress) => {
          filesWithProgress.value[i] = { 
            ...filesWithProgress.value[i], 
            progress 
          }
        }
      })
      
      if (result.success) {
        filesWithProgress.value[i] = {
          ...filesWithProgress.value[i],
          status: 'success',
          progress: 100,
          url: result.url,
          key: result.key
        }
        results.push({
          file: fileItem.file,
          url: result.url,
          key: result.key,
          success: true
        })
      } else {
        filesWithProgress.value[i] = {
          ...filesWithProgress.value[i],
          status: 'error',
          error: result.error || 'Upload failed'
        }
        results.push({
          file: fileItem.file,
          success: false
        })
      }
    } catch (error: any) {
      filesWithProgress.value[i] = {
        ...filesWithProgress.value[i],
        status: 'error',
        error: error.message || 'Upload failed'
      }
      results.push({
        file: fileItem.file,
        success: false
      })
    }
  }
  
  isUploading.value = false
  emitUpdate()
  emit('upload-complete', results)
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

const emitUpdate = () => {
  const uploadedFiles = filesWithProgress.value
    .filter(f => f.status === 'success' || f.status === 'pending')
    .map(f => ({
      file: f.file,
      url: f.url,
      key: f.key
    }))
  
  emit('update:modelValue', uploadedFiles)
  const isValid = !props.required || uploadedFiles.length > 0
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
  if (newValue && newValue.length > 0) {
    // Sync from external value if different
    const currentFiles = files.value.map(f => f.name).sort().join(',')
    const newFiles = newValue.map(f => f.file.name).sort().join(',')
    
    if (currentFiles !== newFiles) {
      files.value = newValue.map(f => f.file)
      filesWithProgress.value = newValue.map(f => ({
        file: f.file,
        progress: f.url ? 100 : 0,
        status: f.url ? 'success' as const : 'pending' as const,
        url: f.url,
        key: f.key
      }))
    }
  }
}, { deep: true })

// Expose upload method for parent components
defineExpose({
  uploadAllFiles,
  isUploading,
  hasPendingFiles
})
</script>
