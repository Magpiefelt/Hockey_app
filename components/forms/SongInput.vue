<template>
  <div class="space-y-3">
    <label class="block text-sm font-semibold text-white">
      {{ label }} <span v-if="required" class="text-red-400">*</span>
    </label>

    <!-- Input Method Selection -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
      <button
        type="button"
        @click="inputMethod = 'youtube'"
        :class="[
          'py-2 px-3 rounded-lg text-sm font-semibold transition-all',
          inputMethod === 'youtube'
            ? 'bg-red-500/20 border-2 border-red-500 text-red-400'
            : 'bg-slate-800 border-2 border-slate-600 text-slate-400 hover:border-slate-500'
        ]"
      >
        <Icon name="mdi:youtube" class="w-4 h-4 inline mr-1" />
        YouTube
      </button>
      <button
        type="button"
        @click="inputMethod = 'spotify'"
        :class="[
          'py-2 px-3 rounded-lg text-sm font-semibold transition-all',
          inputMethod === 'spotify'
            ? 'bg-green-500/20 border-2 border-green-500 text-green-400'
            : 'bg-slate-800 border-2 border-slate-600 text-slate-400 hover:border-slate-500'
        ]"
      >
        <Icon name="mdi:spotify" class="w-4 h-4 inline mr-1" />
        Spotify
      </button>
      <button
        type="button"
        @click="inputMethod = 'upload'"
        :class="[
          'py-2 px-3 rounded-lg text-sm font-semibold transition-all',
          inputMethod === 'upload'
            ? 'bg-purple-500/20 border-2 border-purple-500 text-purple-400'
            : 'bg-slate-800 border-2 border-slate-600 text-slate-400 hover:border-slate-500'
        ]"
      >
        <Icon name="mdi:upload" class="w-4 h-4 inline mr-1" />
        Upload
      </button>
      <button
        type="button"
        @click="inputMethod = 'text'"
        :class="[
          'py-2 px-3 rounded-lg text-sm font-semibold transition-all',
          inputMethod === 'text'
            ? 'bg-cyan-500/20 border-2 border-cyan-500 text-cyan-400'
            : 'bg-slate-800 border-2 border-slate-600 text-slate-400 hover:border-slate-500'
        ]"
      >
        <Icon name="mdi:text" class="w-4 h-4 inline mr-1" />
        Describe
      </button>
    </div>

    <!-- YouTube Link -->
    <div v-if="inputMethod === 'youtube'">
      <UiInput
        v-model="songData.youtube"
        type="url"
        :required="required"
        placeholder="https://youtube.com/watch?v=..."
        :error="youtubeError"
        @input="validateYoutubeUrl"
      />
      <p class="text-xs text-slate-400 mt-1">Paste a YouTube link to your song</p>
    </div>

    <!-- Spotify Link -->
    <div v-if="inputMethod === 'spotify'">
      <UiInput
        v-model="songData.spotify"
        type="url"
        :required="required"
        placeholder="https://open.spotify.com/track/..."
        :error="spotifyError"
        @input="validateSpotifyUrl"
      />
      <p class="text-xs text-slate-400 mt-1">Paste a Spotify track link</p>
    </div>

    <!-- File Upload -->
    <div v-if="inputMethod === 'upload'">
      <div
        @click="triggerFileInput"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleFileDrop"
        :class="[
          'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all',
          isDragging ? 'border-purple-400 bg-purple-500/20 scale-105' : '',
          songData.uploadFile && !isDragging
            ? 'border-purple-400 bg-purple-500/10'
            : !isDragging ? 'border-slate-600 hover:border-purple-400' : '',
          isUploading ? 'pointer-events-none opacity-75' : ''
        ]"
      >
        <input
          ref="fileInput"
          type="file"
          accept=".mp3,.wav,.m4a,audio/mpeg,audio/wav,audio/x-m4a"
          @change="handleFileSelect"
          class="hidden"
        />
        
        <!-- Upload in progress -->
        <div v-if="isUploading" class="space-y-3">
          <Icon name="mdi:loading" class="w-10 h-10 mx-auto text-purple-400 animate-spin" />
          <p class="text-white font-semibold">Uploading...</p>
          <div class="w-48 mx-auto bg-slate-700 rounded-full h-2 overflow-hidden">
            <div 
              class="bg-purple-500 h-full transition-all duration-300"
              :style="{ width: `${uploadProgress}%` }"
            ></div>
          </div>
          <p class="text-sm text-slate-400">{{ uploadProgress }}%</p>
        </div>
        
        <!-- No file selected -->
        <template v-else-if="!songData.uploadFile">
          <Icon name="mdi:music-note-plus" class="w-10 h-10 mx-auto mb-2 text-purple-400" />
          <p class="text-white font-semibold mb-1">Click to upload or drag and drop</p>
          <p class="text-sm text-slate-400">MP3, WAV, M4A (max 50MB)</p>
        </template>
        
        <!-- File selected/uploaded -->
        <template v-else>
          <Icon name="mdi:music-note-check" class="w-10 h-10 mx-auto mb-2 text-green-400" />
          <p class="text-white font-semibold mb-1">{{ songData.uploadFile.name }}</p>
          <p class="text-sm text-slate-400">{{ formatFileSize(songData.uploadFile.size) }}</p>
          <p v-if="songData.uploadUrl" class="text-xs text-green-400 mt-2">
            <Icon name="mdi:check-circle" class="w-4 h-4 inline mr-1" />
            Uploaded successfully
          </p>
          <button
            @click.stop="removeFile"
            type="button"
            class="mt-3 px-4 py-2 text-sm bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
          >
            <Icon name="mdi:delete" class="w-4 h-4 inline mr-1" />
            Remove
          </button>
        </template>
      </div>
      
      <!-- Upload error -->
      <div v-if="uploadError" class="mt-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
        <p class="text-sm text-red-400 flex items-center gap-2">
          <Icon name="mdi:alert-circle" class="w-5 h-5" />
          {{ uploadError }}
        </p>
      </div>
    </div>

    <!-- Text Input -->
    <div v-if="inputMethod === 'text'">
      <UiInput
        v-model="songData.text"
        type="text"
        :required="required"
        placeholder="Artist - Song Title"
        @input="emitUpdate"
      />
      <p class="text-xs text-slate-400 mt-1">Describe the song you want (artist and title)</p>
    </div>

    <p v-if="hint" class="text-xs text-slate-400">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { useFileUpload } from '~/composables/useFileUpload'

interface Props {
  label: string
  modelValue?: {
    method: 'youtube' | 'spotify' | 'text' | 'upload'
    youtube?: string
    spotify?: string
    text?: string
    uploadFile?: File | null
    uploadUrl?: string
    uploadKey?: string
  }
  required?: boolean
  hint?: string
  orderId?: number
}

const props = withDefaults(defineProps<Props>(), {
  required: false,
  hint: ''
})

const emit = defineEmits<{
  'update:modelValue': [value: any]
}>()

// File upload composable
const { uploadFile: doUpload, clearProgress } = useFileUpload()

const inputMethod = ref<'youtube' | 'spotify' | 'text' | 'upload'>(
  props.modelValue?.method || 'youtube'
)

const songData = reactive({
  youtube: props.modelValue?.youtube || '',
  spotify: props.modelValue?.spotify || '',
  text: props.modelValue?.text || '',
  uploadFile: props.modelValue?.uploadFile || null as File | null,
  uploadUrl: props.modelValue?.uploadUrl || '',
  uploadKey: props.modelValue?.uploadKey || ''
})

const youtubeError = ref('')
const spotifyError = ref('')
const uploadError = ref('')
const isUploading = ref(false)
const uploadProgress = ref(0)
const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)

const validateYoutubeUrl = () => {
  const url = songData.youtube
  if (!url) {
    youtubeError.value = ''
    emitUpdate()
    return
  }
  
  // Check if it's a valid YouTube URL
  const youtubePattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/
  if (!youtubePattern.test(url)) {
    youtubeError.value = 'Please enter a valid YouTube URL'
  } else {
    youtubeError.value = ''
  }
  emitUpdate()
}

const validateSpotifyUrl = () => {
  const url = songData.spotify
  if (!url) {
    spotifyError.value = ''
    emitUpdate()
    return
  }
  
  // Check if it's a valid Spotify URL
  const spotifyPattern = /^(https?:\/\/)?(open\.)?spotify\.com\/(track|album|playlist)\/.+/
  if (!spotifyPattern.test(url)) {
    spotifyError.value = 'Please enter a valid Spotify URL'
  } else {
    spotifyError.value = ''
  }
  emitUpdate()
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
  target.value = ''
}

const handleFileDrop = async (event: DragEvent) => {
  isDragging.value = false
  if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
    await processAndUploadFile(event.dataTransfer.files[0])
  }
}

const processAndUploadFile = async (file: File) => {
  uploadError.value = ''
  
  // Validate file
  const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
  const ALLOWED_TYPES = ['audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/mp4', 'audio/x-wav']
  const ALLOWED_EXTENSIONS = /\.(mp3|wav|m4a)$/i
  
  if (file.size > MAX_FILE_SIZE) {
    uploadError.value = `File is too large. Maximum size is 50MB.`
    return
  }
  
  const hasValidType = ALLOWED_TYPES.includes(file.type)
  const hasValidExtension = ALLOWED_EXTENSIONS.test(file.name)
  
  if (!hasValidType && !hasValidExtension) {
    uploadError.value = 'Please upload an audio file (MP3, WAV, or M4A)'
    return
  }
  
  // Set file locally first
  songData.uploadFile = file
  
  // Upload to S3
  isUploading.value = true
  uploadProgress.value = 0
  clearProgress()
  
  try {
    const result = await doUpload(file, {
      orderId: props.orderId,
      kind: 'upload',
      fieldName: 'song_file',
      onProgress: (progress) => {
        uploadProgress.value = progress
      }
    })
    
    if (result.success) {
      songData.uploadUrl = result.url || ''
      songData.uploadKey = result.key || ''
      emitUpdate()
    } else {
      uploadError.value = result.error || 'Failed to upload file. Please try again.'
    }
  } catch (error: any) {
    uploadError.value = error.message || 'Failed to upload file. Please try again.'
  } finally {
    isUploading.value = false
  }
}

const removeFile = () => {
  songData.uploadFile = null
  songData.uploadUrl = ''
  songData.uploadKey = ''
  uploadError.value = ''
  uploadProgress.value = 0
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
  // Only emit the relevant field based on the selected method
  // This prevents data pollution with unused fields
  const cleanData: any = { method: inputMethod.value }
  
  switch (inputMethod.value) {
    case 'youtube':
      if (songData.youtube) cleanData.youtube = songData.youtube
      break
    case 'spotify':
      if (songData.spotify) cleanData.spotify = songData.spotify
      break
    case 'text':
      if (songData.text) cleanData.text = songData.text
      break
    case 'upload':
      if (songData.uploadFile) {
        cleanData.uploadFile = songData.uploadFile
        cleanData.uploadUrl = songData.uploadUrl
        cleanData.uploadKey = songData.uploadKey
      }
      break
  }
  
  emit('update:modelValue', cleanData)
}

watch(inputMethod, (newMethod, oldMethod) => {
  // Clear the old method's data when switching methods
  if (oldMethod === 'youtube') songData.youtube = ''
  if (oldMethod === 'spotify') songData.spotify = ''
  if (oldMethod === 'text') songData.text = ''
  if (oldMethod === 'upload') {
    songData.uploadFile = null
    songData.uploadUrl = ''
    songData.uploadKey = ''
    uploadError.value = ''
  }
  
  emitUpdate()
})
</script>
