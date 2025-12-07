<template>
  <Teleport to="body">
    <Transition name="mobile-menu">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 lg:hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation menu"
      >
        <!-- Backdrop -->
        <div
          class="fixed inset-0 bg-slate-900/80 backdrop-blur-sm"
          @click="close"
          aria-hidden="true"
        />

        <!-- Menu Panel -->
        <div class="fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-xl">
          <div class="flex flex-col h-full">
            <!-- Header -->
            <div class="flex items-center justify-between p-4 border-b border-slate-200">
              <h2 class="text-lg font-bold text-slate-900">Menu</h2>
              <button
                @click="close"
                class="p-2 rounded-lg hover:bg-slate-100 transition-colors touch-target"
                aria-label="Close menu"
              >
                <Icon name="mdi:close" class="w-6 h-6 text-slate-600" />
              </button>
            </div>

            <!-- Navigation Links -->
            <nav class="flex-1 overflow-y-auto p-4" aria-label="Main navigation">
              <ul class="space-y-2">
                <li v-for="item in navigationItems" :key="item.path">
                  <NuxtLink
                    :to="item.path"
                    class="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 hover:bg-cyan-50 hover:text-cyan-600 transition-colors touch-target"
                    active-class="bg-cyan-50 text-cyan-600 font-semibold"
                    @click="close"
                  >
                    <Icon :name="item.icon" class="w-5 h-5" />
                    <span>{{ item.label }}</span>
                  </NuxtLink>
                </li>
              </ul>

              <!-- Divider -->
              <div class="my-6 border-t border-slate-200" />

              <!-- User Section (if authenticated) -->
              <div v-if="isAuthenticated" class="space-y-2">
                <p class="px-4 text-sm font-semibold text-slate-500 uppercase tracking-wide">
                  Account
                </p>
                <ul class="space-y-2">
                  <li v-for="item in accountItems" :key="item.path">
                    <NuxtLink
                      :to="item.path"
                      class="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 hover:bg-cyan-50 hover:text-cyan-600 transition-colors touch-target"
                      active-class="bg-cyan-50 text-cyan-600 font-semibold"
                      @click="close"
                    >
                      <Icon :name="item.icon" class="w-5 h-5" />
                      <span>{{ item.label }}</span>
                    </NuxtLink>
                  </li>
                </ul>
              </div>
            </nav>

            <!-- Footer Actions -->
            <div class="p-4 border-t border-slate-200 space-y-2">
              <NuxtLink
                v-if="!isAuthenticated"
                to="/login"
                class="block w-full px-4 py-3 text-center bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors touch-target"
                @click="close"
              >
                Sign In
              </NuxtLink>
              <button
                v-else
                @click="handleLogout"
                class="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 font-semibold rounded-lg transition-colors touch-target"
              >
                <Icon name="mdi:logout" class="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
interface Props {
  isOpen: boolean
  isAuthenticated?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isAuthenticated: false
})

const emit = defineEmits<{
  close: []
  logout: []
}>()

const navigationItems = [
  { path: '/', label: 'Home', icon: 'mdi:home' },
  { path: '/services', label: 'Services', icon: 'mdi:music-box-multiple' },
  { path: '/request', label: 'Request Quote', icon: 'mdi:file-document-edit' },
  { path: '/about', label: 'About', icon: 'mdi:information' },
  { path: '/contact', label: 'Contact', icon: 'mdi:email' }
]

const accountItems = [
  { path: '/orders', label: 'My Orders', icon: 'mdi:file-document-multiple' },
  { path: '/profile', label: 'Profile', icon: 'mdi:account' },
  { path: '/settings', label: 'Settings', icon: 'mdi:cog' }
]

function close() {
  emit('close')
}

function handleLogout() {
  emit('logout')
  close()
}

// Close menu on escape key
onMounted(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && props.isOpen) {
      close()
    }
  }
  window.addEventListener('keydown', handleEscape)
  
  onUnmounted(() => {
    window.removeEventListener('keydown', handleEscape)
  })
})

// Prevent body scroll when menu is open
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})
</script>

<style scoped>
.mobile-menu-enter-active,
.mobile-menu-leave-active {
  transition: opacity 0.3s ease;
}

.mobile-menu-enter-from,
.mobile-menu-leave-to {
  opacity: 0;
}

.mobile-menu-enter-active .fixed.inset-y-0,
.mobile-menu-leave-active .fixed.inset-y-0 {
  transition: transform 0.3s ease;
}

.mobile-menu-enter-from .fixed.inset-y-0,
.mobile-menu-leave-to .fixed.inset-y-0 {
  transform: translateX(100%);
}
</style>
