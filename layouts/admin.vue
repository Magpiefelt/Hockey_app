<template>
  <div class="min-h-screen bg-slate-950">
    <!-- Admin Header -->
    <header class="fixed top-0 left-0 right-0 z-40 h-16 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
      <div class="flex items-center justify-between h-full px-4 lg:px-6">
        <!-- Left: Logo and Toggle -->
        <div class="flex items-center gap-4">
          <button
            @click="toggleSidebar"
            class="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
            aria-label="Toggle sidebar"
          >
            <Icon :name="sidebarOpen ? 'mdi:close' : 'mdi:menu'" class="w-6 h-6" />
          </button>
          
          <NuxtLink to="/admin/dashboard" class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Icon name="mdi:hockey-sticks" class="w-6 h-6 text-white" />
            </div>
            <div class="hidden sm:block">
              <span class="text-lg font-bold text-white">Elite Sports DJ</span>
              <span class="text-xs text-slate-500 block -mt-0.5">Admin Portal</span>
            </div>
          </NuxtLink>
        </div>

        <!-- Center: Global Search -->
        <div class="hidden md:flex flex-1 max-w-md mx-8">
          <div class="relative w-full group">
            <Icon name="mdi:magnify" class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
            <input
              v-model="globalSearch"
              type="text"
              placeholder="Search orders, customers..."
              class="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
              @keydown.enter="handleGlobalSearch"
            />
            <kbd v-if="!globalSearch" class="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 text-xs text-slate-500 bg-slate-700/50 border border-slate-600 rounded-md">
              ⌘K
            </kbd>
          </div>
        </div>

        <!-- Right: Actions -->
        <div class="flex items-center gap-2">
          <!-- View Site -->
          <NuxtLink
            to="/"
            target="_blank"
            class="hidden sm:flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all text-sm"
          >
            <Icon name="mdi:open-in-new" class="w-4 h-4" />
            <span>View Site</span>
          </NuxtLink>

          <!-- Notifications -->
          <button
            class="relative p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
            aria-label="Notifications"
          >
            <Icon name="mdi:bell-outline" class="w-5 h-5" />
            <span v-if="unreadNotifications > 0" class="absolute top-1.5 right-1.5 w-2 h-2 bg-cyan-500 rounded-full ring-2 ring-slate-900"></span>
          </button>

          <!-- User Menu -->
          <div class="relative" ref="userMenuRef">
            <button
              @click="userMenuOpen = !userMenuOpen"
              class="flex items-center gap-2 p-1.5 pr-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
            >
              <div class="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                <span class="text-white text-sm font-bold">{{ userInitials }}</span>
              </div>
              <Icon name="mdi:chevron-down" class="w-4 h-4 hidden sm:block transition-transform" :class="{ 'rotate-180': userMenuOpen }" />
            </button>

            <Transition
              enter-active-class="transition duration-200 ease-out"
              enter-from-class="opacity-0 scale-95 translate-y-1"
              enter-to-class="opacity-100 scale-100 translate-y-0"
              leave-active-class="transition duration-150 ease-in"
              leave-from-class="opacity-100 scale-100 translate-y-0"
              leave-to-class="opacity-0 scale-95 translate-y-1"
            >
              <div
                v-if="userMenuOpen"
                class="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-2 overflow-hidden"
              >
                <div class="px-4 py-3 border-b border-slate-700">
                  <p class="text-white font-semibold">{{ userName }}</p>
                  <p class="text-sm text-slate-400">{{ userEmail }}</p>
                </div>
                <div class="py-2">
                  <NuxtLink
                    to="/"
                    class="flex items-center gap-3 px-4 py-2.5 text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors"
                  >
                    <Icon name="mdi:open-in-new" class="w-5 h-5 text-slate-500" />
                    View Public Site
                  </NuxtLink>
                </div>
                <div class="border-t border-slate-700 pt-2">
                  <button
                    @click="handleLogout"
                    class="w-full flex items-center gap-3 px-4 py-2.5 text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Icon name="mdi:logout" class="w-5 h-5" />
                    Sign Out
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </header>

    <!-- Sidebar -->
    <aside
      :class="[
        'fixed top-16 left-0 z-30 h-[calc(100vh-4rem)] w-64 bg-slate-900/95 backdrop-blur-sm border-r border-slate-800 transition-transform duration-300 ease-out',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      ]"
    >
      <nav class="h-full flex flex-col py-6 px-3 overflow-hidden">
        <!-- Main Navigation -->
        <div class="flex-1 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          <!-- Dashboard -->
          <NuxtLink
            to="/admin/dashboard"
            :class="[
              'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
              isActiveRoute('/admin/dashboard')
                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-400 shadow-lg shadow-cyan-500/5'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            ]"
            @click="closeSidebarOnMobile"
          >
            <div :class="[
              'w-9 h-9 rounded-lg flex items-center justify-center transition-all',
              isActiveRoute('/admin/dashboard') 
                ? 'bg-cyan-500/20' 
                : 'bg-slate-800'
            ]">
              <Icon name="mdi:view-dashboard" class="w-5 h-5" />
            </div>
            <span class="font-medium">Dashboard</span>
          </NuxtLink>

          <!-- Orders -->
          <NuxtLink
            to="/admin/orders"
            :class="[
              'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
              isActiveRoute('/admin/orders')
                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-400 shadow-lg shadow-cyan-500/5'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            ]"
            @click="closeSidebarOnMobile"
          >
            <div :class="[
              'w-9 h-9 rounded-lg flex items-center justify-center transition-all',
              isActiveRoute('/admin/orders') 
                ? 'bg-cyan-500/20' 
                : 'bg-slate-800'
            ]">
              <Icon name="mdi:clipboard-list" class="w-5 h-5" />
            </div>
            <span class="font-medium">Orders</span>
            <span
              v-if="pendingOrdersCount > 0"
              class="ml-auto px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-500/20 text-amber-400"
            >
              {{ pendingOrdersCount }}
            </span>
          </NuxtLink>

          <!-- Customers -->
          <NuxtLink
            to="/admin/customers"
            :class="[
              'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
              isActiveRoute('/admin/customers')
                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-400 shadow-lg shadow-cyan-500/5'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            ]"
            @click="closeSidebarOnMobile"
          >
            <div :class="[
              'w-9 h-9 rounded-lg flex items-center justify-center transition-all',
              isActiveRoute('/admin/customers') 
                ? 'bg-cyan-500/20' 
                : 'bg-slate-800'
            ]">
              <Icon name="mdi:account-group" class="w-5 h-5" />
            </div>
            <span class="font-medium">Customers</span>
          </NuxtLink>

          <!-- Divider -->
          <div class="my-4 mx-4 border-t border-slate-800"></div>

          <!-- Packages -->
          <NuxtLink
            to="/admin/packages"
            :class="[
              'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
              isActiveRoute('/admin/packages')
                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-400 shadow-lg shadow-cyan-500/5'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            ]"
            @click="closeSidebarOnMobile"
          >
            <div :class="[
              'w-9 h-9 rounded-lg flex items-center justify-center transition-all',
              isActiveRoute('/admin/packages') 
                ? 'bg-cyan-500/20' 
                : 'bg-slate-800'
            ]">
              <Icon name="mdi:package-variant" class="w-5 h-5" />
            </div>
            <span class="font-medium">Packages</span>
          </NuxtLink>

          <!-- Calendar -->
          <NuxtLink
            to="/admin/calendar"
            :class="[
              'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
              isActiveRoute('/admin/calendar')
                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-400 shadow-lg shadow-cyan-500/5'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            ]"
            @click="closeSidebarOnMobile"
          >
            <div :class="[
              'w-9 h-9 rounded-lg flex items-center justify-center transition-all',
              isActiveRoute('/admin/calendar') 
                ? 'bg-cyan-500/20' 
                : 'bg-slate-800'
            ]">
              <Icon name="mdi:calendar-month" class="w-5 h-5" />
            </div>
            <span class="font-medium">Calendar</span>
          </NuxtLink>

          <!-- Divider -->
          <div class="my-4 mx-4 border-t border-slate-800"></div>

          <!-- Emails -->
          <NuxtLink
            to="/admin/emails"
            :class="[
              'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
              isActiveRoute('/admin/emails')
                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-400 shadow-lg shadow-cyan-500/5'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            ]"
            @click="closeSidebarOnMobile"
          >
            <div :class="[
              'w-9 h-9 rounded-lg flex items-center justify-center transition-all',
              isActiveRoute('/admin/emails') 
                ? 'bg-cyan-500/20' 
                : 'bg-slate-800'
            ]">
              <Icon name="mdi:email-multiple" class="w-5 h-5" />
            </div>
            <span class="font-medium">Emails</span>
          </NuxtLink>

          <!-- Contact -->
          <NuxtLink
            to="/admin/contact"
            :class="[
              'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
              isActiveRoute('/admin/contact')
                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-400 shadow-lg shadow-cyan-500/5'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            ]"
            @click="closeSidebarOnMobile"
          >
            <div :class="[
              'w-9 h-9 rounded-lg flex items-center justify-center transition-all',
              isActiveRoute('/admin/contact') 
                ? 'bg-cyan-500/20' 
                : 'bg-slate-800'
            ]">
              <Icon name="mdi:message-text" class="w-5 h-5" />
            </div>
            <span class="font-medium">Contact</span>
            <span
              v-if="newContactCount > 0"
              class="ml-auto px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-500/20 text-amber-400"
            >
              {{ newContactCount }}
            </span>
          </NuxtLink>

          <!-- Site Content -->
          <NuxtLink
            to="/admin/content"
            :class="[
              'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
              isActiveRoute('/admin/content')
                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-400 shadow-lg shadow-cyan-500/5'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            ]"
            @click="closeSidebarOnMobile"
          >
            <div :class="[
              'w-9 h-9 rounded-lg flex items-center justify-center transition-all',
              isActiveRoute('/admin/content') 
                ? 'bg-cyan-500/20' 
                : 'bg-slate-800'
            ]">
              <Icon name="mdi:text-box-edit" class="w-5 h-5" />
            </div>
            <span class="font-medium">Site Content</span>
          </NuxtLink>

          <!-- Finance -->
          <NuxtLink
            to="/admin/finance"
            :class="[
              'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
              isActiveRoute('/admin/finance')
                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-400 shadow-lg shadow-cyan-500/5'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            ]"
            @click="closeSidebarOnMobile"
          >
            <div :class="[
              'w-9 h-9 rounded-lg flex items-center justify-center transition-all',
              isActiveRoute('/admin/finance') 
                ? 'bg-cyan-500/20' 
                : 'bg-slate-800'
            ]">
              <Icon name="mdi:chart-line" class="w-5 h-5" />
            </div>
            <span class="font-medium">Finance</span>
          </NuxtLink>
        </div>

        <!-- Bottom Section -->
        <div class="pt-4 border-t border-slate-800">
          <NuxtLink
            to="/"
            class="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-white hover:bg-slate-800/50 rounded-xl transition-all"
          >
            <Icon name="mdi:arrow-left" class="w-5 h-5" />
            <span class="font-medium">Back to Site</span>
          </NuxtLink>
        </div>
      </nav>
    </aside>

    <!-- Mobile Sidebar Overlay -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="sidebarOpen"
        class="fixed inset-0 z-20 bg-slate-950/80 backdrop-blur-sm lg:hidden"
        @click="sidebarOpen = false"
      ></div>
    </Transition>

    <!-- Main Content -->
    <main class="lg:ml-64 pt-16 min-h-screen bg-slate-950">
      <div class="p-4 lg:p-8">
        <slot />
      </div>
    </main>

    <!-- Toast Container -->
    <UiToastContainer />
  </div>
</template>

<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { mockLogout } = useMockAuth()
const { showSuccess } = useNotification()

// Sidebar state
const sidebarOpen = ref(false)

// Menu states
const userMenuOpen = ref(false)
const userMenuRef = ref(null)

// Search
const globalSearch = ref('')

// Real notification count: new contact submissions + submitted orders
const unreadNotifications = computed(() => pendingOrdersCount.value + newContactCount.value)

// Pending orders count (will be fetched — uses 'submitted' to match dashboard)
const pendingOrdersCount = ref(0)

// New contact submissions count
const newContactCount = ref(0)

// User info
const userName = computed(() => authStore.user?.name || authStore.user?.email?.split('@')[0] || 'Admin')
const userEmail = computed(() => authStore.user?.email || '')
const userInitials = computed(() => {
  const name = userName.value
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
})

// Route matching
const isActiveRoute = (path: string) => {
  if (path === '/admin/dashboard') {
    return route.path === '/admin/dashboard' || route.path === '/admin'
  }
  return route.path.startsWith(path)
}

// Actions
const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

const closeSidebarOnMobile = () => {
  if (window.innerWidth < 1024) {
    sidebarOpen.value = false
  }
}

const handleGlobalSearch = () => {
  if (globalSearch.value.trim()) {
    router.push({ path: '/admin/orders', query: { search: globalSearch.value } })
    globalSearch.value = ''
  }
}

const handleLogout = async () => {
  mockLogout()
  userMenuOpen.value = false
  showSuccess('Logged out successfully')
  router.push('/')
}

// Close menus on outside click
onClickOutside(userMenuRef, () => {
  userMenuOpen.value = false
})

// Keyboard shortcut for search
onMounted(() => {
  const handleKeydown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement
      searchInput?.focus()
    }
  }
  
  window.addEventListener('keydown', handleKeydown)
  
  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
  })
})

// Fetch pending orders count
const trpc = useTrpc()

const fetchPendingCount = async () => {
  try {
    // Use 'submitted' status to match what the dashboard considers "needs attention"
    const response = await trpc.orders.list.query({ status: 'submitted', limit: 1 })
    pendingOrdersCount.value = response.total || 0
  } catch (err) {
    // Silently fail
  }
}

const fetchNewContactCount = async () => {
  try {
    const response = await trpc.contact.list.query({ status: 'new', limit: 1 })
    newContactCount.value = response.total || 0
  } catch (err) {
    // Silently fail
  }
}

onMounted(() => {
  fetchPendingCount()
  fetchNewContactCount()
})

// Close sidebar on route change (mobile)
watch(() => route.path, () => {
  if (window.innerWidth < 1024) {
    sidebarOpen.value = false
  }
})
</script>

<style scoped>
/* Custom scrollbar for sidebar */
nav::-webkit-scrollbar {
  width: 4px;
}

nav::-webkit-scrollbar-track {
  background: transparent;
}

nav::-webkit-scrollbar-thumb {
  background: rgb(51, 65, 85);
  border-radius: 2px;
}

nav::-webkit-scrollbar-thumb:hover {
  background: rgb(71, 85, 105);
}
</style>
