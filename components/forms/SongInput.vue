<template>
  <div class="space-y-3">
    <label class="block text-sm font-semibold text-white">
      {{ label }} <span v-if="required" class="text-red-400">*</span>
    </label>

    <!-- Input Method Selection -->
    <div class="grid grid-cols-3 gap-2 mb-3">
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
        @click="inputMethod = 'text'"
        :class="[
          'py-2 px-3 rounded-lg text-sm font-semibold transition-all',
          inputMethod === 'text'
            ? 'bg-cyan-500/20 border-2 border-cyan-500 text-cyan-400'
            : 'bg-slate-800 border-2 border-slate-600 text-slate-400 hover:border-slate-500'
        ]"
      >
        <Icon name="mdi:text" class="w-4 h-4 inline mr-1" />
        Type
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
    </div>

    <p v-if="hint" class="text-xs text-slate-400">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'

interface Props {
  label: string
  modelValue?: {
    method: 'youtube' | 'spotify' | 'text'
    youtube?: string
    spotify?: string
    text?: string
  }
  required?: boolean
  hint?: string
}

const props = withDefaults(defineProps<Props>(), {
  required: false,
  hint: ''
})

const emit = defineEmits<{
  'update:modelValue': [value: any]
}>()

const inputMethod = ref<'youtube' | 'spotify' | 'text'>(
  props.modelValue?.method || 'youtube'
)

const songData = reactive({
  youtube: props.modelValue?.youtube || '',
  spotify: props.modelValue?.spotify || '',
  text: props.modelValue?.text || ''
})

const youtubeError = ref('')
const spotifyError = ref('')

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

const emitUpdate = () => {
  emit('update:modelValue', {
    method: inputMethod.value,
    youtube: inputMethod.value === 'youtube' ? songData.youtube : undefined,
    spotify: inputMethod.value === 'spotify' ? songData.spotify : undefined,
    text: inputMethod.value === 'text' ? songData.text : undefined
  })
}

watch(inputMethod, () => {
  emitUpdate()
})
</script>
