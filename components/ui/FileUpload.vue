<template>
  <div class="w-full">
    <!-- Drop zone -->
    <div
      ref="dropZone"
      :class="[
        'relative border-2 border-dashed rounded-lg p-6 transition-all duration-200',
        isDragging
          ? 'border-cyan-500 bg-cyan-50'
          : 'border-slate-300 hover:border-slate-400 bg-slate-50',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      ]"
      @click="triggerFileInput"
      @dragenter.prevent="handleDragEnter"
      @dragleave.prevent="handleDragLeave"
      @dragover.prevent
      @drop.prevent="handleDrop"
    >
      <!-- Hidden file input -->
      <input
        ref="fileInput"
        type="file"
        :accept="acceptedTypes"
        :multiple="multiple"
        :disabled="disabled"
        class="hidden"
        @change="handleFileSelect"
      />

      <!-- Upload icon and text -->
      <div class="text-center">
        <div class="mx-auto h-12 w-12 text-slate-400 mb-4">
          <svg fill="none" stroke="currentColor" viewBox="0 0 48 48" aria-hidden="true">
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
        
        <div class="text-sm text-slate-600">
          <span class="font-semibold text-cyan-600 hover:text-cyan-500">
            Click to upload
          </span>
          <span> or drag and drop</span>
        </div>
        
        <p class="text-xs text-slate-500 mt-1">
          {{ acceptLabel || 'Any file type' }}
          <span v-if="maxSizeMB"> up to {{ maxSizeMB }}MB</span>
        </p>
      </div>

      <!-- Loading overlay -->
      <div
        v-if="uploading"
        class="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg"
      >
        <div class="text-center">
          <UiLoadingSpinner size="lg" />
          <p class="mt-2 text-sm text-slate-600">Uploading...</p>
          <div v-if="uploadProgress > 0" class="mt-2 w-48 mx-auto">
            <div class="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                class="h-full bg-cyan-500 transition-all duration-300"
                :style="{ width: `${uploadProgress}%` }"
              />
            </div>
            <p class="text-xs text-slate-500 mt-1">{{ uploadProgress }}%</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Error message -->
    <p v-if="error" class="mt-2 text-sm text-red-600">
      {{ error }}
    </p>

    <!-- Selected files list -->
    <ul v-if="selectedFiles.length > 0" class="mt-4 space-y-2">
      <li
        v-for="(file, index) in selectedFiles"
        :key="index"
        class="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg"
      >
        <div class="flex items-center gap-3 min-w-0">
          <!-- File type icon -->
          <div :class="['flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center', getFileIconBg(file.type)]">
            <UiIcon :name="getFileIcon(file.type)" size="sm" :class="getFileIconColor(file.type)" />
          </div>
          
          <!-- File info -->
          <div class="min-w-0">
            <p class="text-sm font-medium text-slate-900 truncate">
              {{ file.name }}
            </p>
            <p class="text-xs text-slate-500">
              {{ formatFileSize(file.size) }}
            </p>
          </div>
        </div>

        <!-- Remove button -->
        <button
          v-if="!uploading"
          @click.stop="removeFile(index)"
          class="flex-shrink-0 p-1 text-slate-400 hover:text-red-500 transition-colors"
          aria-label="Remove file"
        >
          <UiIcon name="x" size="sm" />
        </button>
        
        <!-- Upload status -->
        <div v-else-if="file.status" class="flex-shrink-0">
          <UiIcon
            v-if="file.status === 'success'"
            name="check-circle"
            size="sm"
            class="text-green-500"
          />
          <UiIcon
            v-else-if="file.status === 'error'"
            name="alert-circle"
            size="sm"
            class="text-red-500"
          />
          <UiLoadingSpinner v-else size="sm" />
        </div>
      </li>
    </ul>

    <!-- Upload button -->
    <div v-if="selectedFiles.length > 0 && showUploadButton" class="mt-4">
      <UiButton
        :loading="uploading"
        :disabled="uploading || selectedFiles.length === 0"
        @click="uploadFiles"
        class="w-full"
      >
        Upload {{ selectedFiles.length }} file{{ selectedFiles.length > 1 ? 's' : '' }}
      </UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface SelectedFile {
  file: File
  name: string
  size: number
  type: string
  status?: 'pending' | 'uploading' | 'success' | 'error'
}

interface Props {
  accept?: string[]
  maxSizeMB?: number
  multiple?: boolean
  disabled?: boolean
  showUploadButton?: boolean
  autoUpload?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  accept: () => [],
  maxSizeMB: 50,
  multiple: false,
  disabled: false,
  showUploadButton: true,
  autoUpload: false
})

const emit = defineEmits<{
  (e: 'select', files: File[]): void
  (e: 'upload', files: File[]): void
  (e: 'error', message: string): void
}>()

// Refs
const fileInput = ref<HTMLInputElement | null>(null)
const dropZone = ref<HTMLDivElement | null>(null)
const isDragging = ref(false)
const uploading = ref(false)
const uploadProgress = ref(0)
const error = ref('')
const selectedFiles = ref<SelectedFile[]>([])

// Computed
const acceptedTypes = computed(() => {
  if (props.accept.length === 0) return undefined
  return props.accept.join(',')
})

const acceptLabel = computed(() => {
  if (props.accept.length === 0) return ''
  
  const labels: Record<string, string> = {
    'image/*': 'Images',
    'video/*': 'Videos',
    'audio/*': 'Audio files',
    'application/pdf': 'PDF',
    '.doc,.docx': 'Word documents',
    '.xls,.xlsx': 'Excel files'
  }
  
  return props.accept.map(type => labels[type] || type).join(', ')
})

// Methods
function triggerFileInput() {
  if (!props.disabled) {
    fileInput.value?.click()
  }
}

function handleDragEnter(event: DragEvent) {
  if (props.disabled) return
  isDragging.value = true
}

function handleDragLeave(event: DragEvent) {
  // Only set to false if leaving the drop zone entirely
  if (event.relatedTarget && dropZone.value?.contains(event.relatedTarget as Node)) {
    return
  }
  isDragging.value = false
}

function handleDrop(event: DragEvent) {
  if (props.disabled) return
  isDragging.value = false
  
  const files = event.dataTransfer?.files
  if (files) {
    processFiles(Array.from(files))
  }
}

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files) {
    processFiles(Array.from(input.files))
  }
  // Reset input so same file can be selected again
  input.value = ''
}

function processFiles(files: File[]) {
  error.value = ''
  
  // Filter by accepted types
  if (props.accept.length > 0) {
    files = files.filter(file => {
      return props.accept.some(accept => {
        if (accept.endsWith('/*')) {
          return file.type.startsWith(accept.replace('/*', '/'))
        }
        if (accept.startsWith('.')) {
          return file.name.toLowerCase().endsWith(accept.toLowerCase())
        }
        return file.type === accept
      })
    })
  }
  
  // Check file size
  const maxBytes = props.maxSizeMB * 1024 * 1024
  const oversizedFiles = files.filter(f => f.size > maxBytes)
  
  if (oversizedFiles.length > 0) {
    error.value = `Some files exceed the ${props.maxSizeMB}MB limit`
    files = files.filter(f => f.size <= maxBytes)
  }
  
  if (files.length === 0) {
    if (!error.value) {
      error.value = 'No valid files selected'
    }
    emit('error', error.value)
    return
  }
  
  // Add to selected files
  const newFiles: SelectedFile[] = files.map(file => ({
    file,
    name: file.name,
    size: file.size,
    type: file.type,
    status: 'pending'
  }))
  
  if (props.multiple) {
    selectedFiles.value = [...selectedFiles.value, ...newFiles]
  } else {
    selectedFiles.value = newFiles.slice(0, 1)
  }
  
  emit('select', selectedFiles.value.map(f => f.file))
  
  // Auto upload if enabled
  if (props.autoUpload) {
    uploadFiles()
  }
}

function removeFile(index: number) {
  selectedFiles.value.splice(index, 1)
  emit('select', selectedFiles.value.map(f => f.file))
}

async function uploadFiles() {
  if (selectedFiles.value.length === 0) return
  
  uploading.value = true
  uploadProgress.value = 0
  
  emit('upload', selectedFiles.value.map(f => f.file))
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('audio/')) return 'music'
  if (mimeType === 'application/pdf') return 'file-text'
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'table'
  if (mimeType.includes('document') || mimeType.includes('word')) return 'file-text'
  return 'file'
}

function getFileIconBg(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'bg-purple-100'
  if (mimeType.startsWith('video/')) return 'bg-pink-100'
  if (mimeType.startsWith('audio/')) return 'bg-green-100'
  if (mimeType === 'application/pdf') return 'bg-red-100'
  return 'bg-slate-100'
}

function getFileIconColor(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'text-purple-600'
  if (mimeType.startsWith('video/')) return 'text-pink-600'
  if (mimeType.startsWith('audio/')) return 'text-green-600'
  if (mimeType === 'application/pdf') return 'text-red-600'
  return 'text-slate-600'
}

// Expose methods for parent component
defineExpose({
  triggerFileInput,
  clearFiles: () => { selectedFiles.value = [] },
  setUploading: (value: boolean) => { uploading.value = value },
  setProgress: (value: number) => { uploadProgress.value = value },
  setFileStatus: (index: number, status: SelectedFile['status']) => {
    if (selectedFiles.value[index]) {
      selectedFiles.value[index].status = status
    }
  }
})
</script>
