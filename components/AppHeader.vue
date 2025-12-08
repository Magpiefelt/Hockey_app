<template>
  <header class="sticky top-0 z-50 w-full border-b border-white/10 bg-black/80 backdrop-blur-md">
    <div class="container mx-auto">
      <div class="flex h-16 items-center justify-between">
        <!-- Logo -->
        <NuxtLink to="/" class="flex items-center gap-3 transition-opacity hover:opacity-80">
          <div class="relative h-16 w-16 flex items-center justify-center">
            <img 
              src="/logo.png" 
              alt="Elite Sports DJ" 
              class="h-full w-auto object-contain"
              style="background-color: transparent; mix-blend-mode: normal;"
            />
          </div>
          <span class="hidden text-xl font-bold text-white sm:inline">
            Elite Sports DJ
          </span>
        </NuxtLink>

        <!-- Desktop Navigation -->
        <nav class="hidden items-center gap-1 md:flex">
          <NuxtLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
            :class="{ 'bg-white/10 text-white': isActive(item.to) }"
          >
            {{ item.label }}
          </NuxtLink>
        </nav>

        <!-- CTA & User Menu -->
        <div class="flex items-center gap-3">
          <UiButton
            v-if="!session?.user"
            to="/request"
            variant="primary"
            size="sm"
            class="hidden sm:inline-flex"
          >
            Request Service
          </UiButton>

          <!-- User Menu (if logged in) -->
          <div v-if="session?.user" class="relative" ref="userMenuRef">
            <button
              @click="userMenuOpen = !userMenuOpen"
              class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
            >
              <Icon name="mdi:account-circle" class="h-6 w-6" />
              <span class="hidden sm:inline">{{ session.user.email }}</span>
              <Icon name="mdi:chevron-down" class="h-4 w-4" />
            </button>

            <!-- Dropdown Menu -->
            <div
              v-if="userMenuOpen"
              class="absolute right-0 mt-2 w-48 rounded-lg border border-white/10 bg-dark-secondary shadow-xl"
            >
              <div class="p-2">
                <button
                  @click="navigateToOrders"
                  class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
                >
                  <Icon name="mdi:clipboard-list" class="h-4 w-4" />
                  My Orders
                </button>
                <button
                  v-if="session.user.role === 'admin'"
                  @click="navigateToAdmin"
                  class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
                >
                  <Icon name="mdi:shield-crown" class="h-4 w-4" />
                  Admin Dashboard
                </button>
                <hr class="my-2 border-white/10" />
                <button
                  @click="handleLogout"
                  class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-error-400 transition-colors hover:bg-error-500/10"
                >
                  <Icon name="mdi:logout" class="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>

          <NuxtLink
            v-if="!session?.user"
            to="/login"
            class="text-sm font-medium text-slate-300 transition-colors hover:text-white"
          >
            Login
          </NuxtLink>

          <!-- Mobile Menu Button -->
          <button
            @click="mobileMenuOpen = !mobileMenuOpen"
            class="rounded-lg p-2 text-slate-300 transition-colors hover:bg-white/5 hover:text-white md:hidden"
            aria-label="Toggle menu"
          >
            <Icon :name="mobileMenuOpen ? 'mdi:close' : 'mdi:menu'" class="h-6 w-6" />
          </button>
        </div>
      </div>

      <!-- Mobile Navigation -->
      <div
        v-if="mobileMenuOpen"
        class="border-t border-white/10 py-4 md:hidden"
      >
        <nav class="flex flex-col gap-1">
          <NuxtLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
            :class="{ 'bg-white/10 text-white': isActive(item.to) }"
            @click="mobileMenuOpen = false"
          >
            {{ item.label }}
          </NuxtLink>
          <UiButton
            v-if="!session?.user"
            to="/request"
            variant="primary"
            size="sm"
            class="mt-2"
            full-width
          >
            Request Service
          </UiButton>
        </nav>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { mockLogout } = useMockAuth()
const { showSuccess } = useNotification()

// Create session computed from authStore
const session = computed(() => ({
  user: authStore.user
}))

const mobileMenuOpen = ref(false)
const userMenuOpen = ref(false)
const userMenuRef = ref(null)

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Services', to: '/#services' },
  { label: 'Packages', to: '/#packages' },
  { label: 'Testimonials', to: '/#testimonials' },
  { label: 'Contact', to: '/request' },
]

const isActive = (path: string) => {
  if (path === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(path.split('#')[0])
}

const navigateToOrders = () => {
  userMenuOpen.value = false
  router.push('/orders')
}

const navigateToAdmin = () => {
  userMenuOpen.value = false
  router.push('/admin')
}

const handleLogout = async () => {
  mockLogout()
  userMenuOpen.value = false
  showSuccess('Logged out successfully')
  router.push('/')
}

// Close user menu when clicking outside
onClickOutside(userMenuRef, () => {
  userMenuOpen.value = false
})

// Close mobile menu on route change
watch(() => route.path, () => {
  mobileMenuOpen.value = false
})
</script>
