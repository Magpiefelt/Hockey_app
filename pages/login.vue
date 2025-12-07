<template>
  <div class="min-h-screen flex items-center justify-center px-4 py-12 bg-dark-primary">
    <div class="w-full max-w-md">
      <!-- Logo/Header -->
      <div class="text-center mb-8">
        <div class="mb-6 flex justify-center">
          <img 
            src="/logo.png" 
            alt="Elite Sports DJ" 
            class="h-20 w-auto object-contain" 
          />
        </div>
        <h1 class="text-3xl font-bold text-white mb-2">
          Welcome Back
        </h1>
        <p class="text-slate-400">Sign in to your account</p>
      </div>

      <!-- Login Form -->
      <div class="card p-8">
        <form @submit.prevent="handleLogin" class="space-y-6">
          <!-- Email -->
          <UiInput
            v-model="form.email"
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            required
            :disabled="isLoading"
          />

          <!-- Password -->
          <UiInput
            v-model="form.password"
            label="Password"
            type="password"
            placeholder="••••••••"
            required
            :disabled="isLoading"
          />

          <!-- Error Message -->
          <div v-if="error" class="p-4 bg-error-500/10 border border-error-500/30 rounded-lg">
            <p class="text-error-400 text-sm">{{ error }}</p>
          </div>

          <!-- Submit Button -->
          <UiButton
            type="submit"
            variant="primary"
            size="lg"
            full-width
            :disabled="isLoading"
          >
            <span v-if="isLoading">Signing in...</span>
            <span v-else>Sign In</span>
          </UiButton>
        </form>

        <!-- Demo Hint -->
        <div class="mt-6 p-4 bg-cyan-500/10 border border-cyan-400/30 rounded-lg">
          <p class="text-cyan-300 text-sm font-semibold mb-2">🎮 Demo Credentials</p>
          <p class="text-slate-300 text-xs leading-relaxed">
            <strong>Admin:</strong> admin@elitesportsdj.com / admin123<br/>
            <strong>Note:</strong> Database must be set up first. See README for instructions.
          </p>
        </div>

        <!-- Back to Home -->
        <div class="mt-6 text-center">
          <NuxtLink to="/" class="text-brand-400 hover:text-brand-300 text-sm transition-colors">
            ← Back to Home
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { showSuccess, showError } = useNotification()
const isLoading = ref(false)

const form = ref({
  email: '',
  password: ''
})

const error = ref<string | null>(null)

const handleLogin = async () => {
  error.value = null
  isLoading.value = true

  try {
    const result = await authStore.login(form.value.email, form.value.password)

    if (result.success) {
      showSuccess('Login successful!')
      
      // Redirect based on user role
      const redirect = route.query.redirect as string
      if (redirect) {
        router.push(redirect)
      } else {
        router.push(authStore.isAdmin ? '/admin' : '/orders')
      }
    } else {
      error.value = result.error || 'Login failed. Please check your credentials.'
      showError(error.value)
    }
  } catch (e: any) {
    error.value = e.message || 'An error occurred during login'
    showError(error.value)
  } finally {
    isLoading.value = false
  }
}

// Clear form on mount
onMounted(() => {
  form.value = { email: '', password: '' }
  error.value = null
})

useHead({
  title: 'Login - Elite Sports DJ',
  meta: [
    { name: 'description', content: 'Sign in to your Elite Sports DJ account' }
  ]
})
</script>
