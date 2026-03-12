<template>
  <div class="min-h-screen bg-dark-primary flex items-center justify-center px-4">
    <div class="max-w-lg w-full text-center">
      <!-- Logo -->
      <div class="mb-8 flex justify-center">
        <picture>
          <source srcset="/logo.webp" type="image/webp" />
          <img src="/logo.png" alt="Elite Sports DJ" width="96" height="96" class="h-24 w-auto object-contain" />
        </picture>
      </div>

      <!-- Error Code -->
      <div class="mb-4">
        <span class="text-8xl font-black bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
          {{ error?.statusCode || 500 }}
        </span>
      </div>

      <!-- Error Message -->
      <h1 class="mb-4 text-2xl font-bold text-white">
        {{ is404 ? 'Page Not Found' : 'Something Went Wrong' }}
      </h1>
      <p class="mb-8 text-slate-400 leading-relaxed">
        {{ is404
          ? "The page you're looking for doesn't exist or has been moved."
          : "We encountered an unexpected error. Please try again or contact us if the problem persists."
        }}
      </p>

      <!-- Actions -->
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <NuxtLink
          to="/"
          class="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 font-semibold text-white rounded-lg hover:scale-105 transition-transform"
        >
          <Icon name="mdi:home" class="h-5 w-5" />
          Go Home
        </NuxtLink>
        <NuxtLink
          to="/contact"
          class="inline-flex items-center justify-center gap-2 border-2 border-cyan-400/50 bg-slate-900/50 px-6 py-3 font-semibold text-white rounded-lg hover:border-cyan-400 transition-colors"
        >
          <Icon name="mdi:email-outline" class="h-5 w-5" />
          Contact Us
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface NuxtError {
  statusCode?: number
  statusMessage?: string
  message?: string
}

const props = defineProps<{ error: NuxtError | null }>()

const is404 = computed(() => props.error?.statusCode === 404)

useHead({
  title: computed(() =>
    props.error?.statusCode === 404
      ? '404 – Page Not Found | Elite Sports DJ'
      : 'Error | Elite Sports DJ'
  ),
  meta: [
    { name: 'robots', content: 'noindex, nofollow' }
  ]
})
</script>
