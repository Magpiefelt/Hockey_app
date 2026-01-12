<template>
  <div class="min-h-screen bg-dark-primary">
    <!-- Admin Header -->
    <header class="fixed top-0 left-0 right-0 z-40 h-16 bg-dark-secondary border-b border-white/10">
      <div class="flex items-center justify-between h-full px-4">
        <!-- Left: Logo and Toggle -->
        <div class="flex items-center gap-4">
          <button
            @click="toggleSidebar"
            class="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            aria-label="Toggle sidebar"
          >
            <Icon :name="sidebarOpen ? 'mdi:close' : 'mdi:menu'" class="w-6 h-6" />
          </button>
          
          <NuxtLink to="/admin/dashboard" class="flex items-center gap-3">
            <img src="/logo.png" alt="Elite Sports DJ" class="h-10 w-auto" />
            <div class="hidden sm:block">
              <span class="text-lg font-bold text-white">Admin Portal</span>
            </div>
          </NuxtLink>
        </div>

        <!-- Center: Global Search -->
        <div class="hidden md:flex flex-1 max-w-xl mx-8">
          <div class="relative w-full">
            <Icon name="mdi:magnify" class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              v-model="globalSearch"
              type="text"
              placeholder="Search orders, customers, packages..."
              class="w-full pl-10 pr-4 py-2 bg-dark-primary border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
              @keydown.enter="handleGlobalSearch"
            />
            <kbd v-if="!globalSearch" class="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 text-xs text-slate-500 bg-dark-secondary border border-white/10 rounded">
              ⌘K
            </kbd>
          </div>
        </div>

        <!-- Right: Actions -->
        <div class="flex items-center gap-3">
          <!-- Notifications -->
          <button
            class="relative p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            aria-label="Notifications"
          >
            <Icon name="mdi:bell-outline" class="w-6 h-6" />
            <span v-if="unreadNotifications > 0" class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          <!-- Quick Actions -->
          <div class="relative" ref="quickActionsRef">
            <button
              @click="quickActionsOpen = !quickActionsOpen"
              class="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              aria-label="Quick actions"
            >
              <Icon name="mdi:lightning-bolt" class="w-6 h-6" />
            </button>
            
            <div
              v-if="quickActionsOpen"
              class="absolute right-0 mt-2 w-56 bg-dark-secondary border border-white/10 rounded-lg shadow-xl py-2"
            >
              <button
                @click="navigateTo('/admin/orders?status=pending')"
                class="w-full px-4 py-2 text-left text-slate-300 hover:bg-white/5 hover:text-white flex items-center gap-3"
              >
                <Icon name="mdi:clock-outline" class="w-5 h-5 text-yellow-400" />
                View Pending Orders
              </button>
              <button
                @click="navigateTo('/admin/packages')"
                class="w-full px-4 py-2 text-left text-slate-300 hover:bg-white/5 hover:text-white flex items-center gap-3"
              >
                <Icon name="mdi:package-variant-plus" class="w-5 h-5 text-purple-400" />
                Create Package
              </button>
              <button
                @click="navigateTo('/admin/calendar')"
                class="w-full px-4 py-2 text-left text-slate-300 hover:bg-white/5 hover:text-white flex items-center gap-3"
              >
                <Icon name="mdi:calendar-plus" class="w-5 h-5 text-cyan-400" />
                Block Dates
              </button>
              <hr class="my-2 border-white/10" />
              <NuxtLink
                to="/"
                class="w-full px-4 py-2 text-left text-slate-300 hover:bg-white/5 hover:text-white flex items-center gap-3"
              >
                <Icon name="mdi:open-in-new" class="w-5 h-5 text-slate-400" />
                View Public Site
              </NuxtLink>
            </div>
          </div>

          <!-- User Menu -->
          <div class="relative" ref="userMenuRef">
            <button
              @click="userMenuOpen = !userMenuOpen"
              class="flex items-center gap-2 p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <div class="w-8 h-8 bg-brand-500 rounded-full flex items-center justify-center">
                <span class="text-white text-sm font-bold">{{ userInitials }}</span>
              </div>
              <Icon name="mdi:chevron-down" class="w-4 h-4 hidden sm:block" />
            </button>

            <div
              v-if="userMenuOpen"
              class="absolute right-0 mt-2 w-56 bg-dark-secondary border border-white/10 rounded-lg shadow-xl py-2"
            >
              <div class="px-4 py-2 border-b border-white/10">
                <p class="text-white font-medium">{{ userName }}</p>
                <p class="text-sm text-slate-400">{{ userEmail }}</p>
              </div>
              <button
                @click="handleLogout"
                class="w-full px-4 py-2 text-left text-red-400 hover:bg-red-500/10 flex items-center gap-3"
              >
                <Icon name="mdi:logout" class="w-5 h-5" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Sidebar -->
    <aside
      :class="[
        'fixed top-16 left-0 z-30 h-[calc(100vh-4rem)] w-64 bg-dark-secondary border-r border-white/10 transition-transform duration-300',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      ]"
    >
      <nav class="h-full flex flex-col py-4">
        <!-- Main Navigation -->
        <div class="flex-1 px-3 space-y-1">
          <p class="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Main
          </p>
          
          <NuxtLink
            v-for="item in mainNavItems"
            :key="item.to"
            :to="item.to"
            :class="[
              'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
              isActiveRoute(item.to)
                ? 'bg-brand-500/10 text-brand-400 border border-brand-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            ]"
            @click="closeSidebarOnMobile"
          >
            <Icon :name="item.icon" class="w-5 h-5" />
            <span class="font-medium">{{ item.label }}</span>
            <span
              v-if="item.badge"
              :class="[
                'ml-auto px-2 py-0.5 text-xs font-semibold rounded-full',
                item.badgeColor || 'bg-brand-500/20 text-brand-400'
              ]"
            >
              {{ item.badge }}
            </span>
          </NuxtLink>

          <p class="px-3 py-2 mt-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Management
          </p>

          <NuxtLink
            v-for="item in managementNavItems"
            :key="item.to"
            :to="item.to"
            :class="[
              'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
              isActiveRoute(item.to)
                ? 'bg-brand-500/10 text-brand-400 border border-brand-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            ]"
            @click="closeSidebarOnMobile"
          >
            <Icon :name="item.icon" class="w-5 h-5" />
            <span class="font-medium">{{ item.label }}</span>
          </NuxtLink>

          <p class="px-3 py-2 mt-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Reports
          </p>

          <NuxtLink
            v-for="item in reportNavItems"
            :key="item.to"
            :to="item.to"
            :class="[
              'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
              isActiveRoute(item.to)
                ? 'bg-brand-500/10 text-brand-400 border border-brand-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            ]"
            @click="closeSidebarOnMobile"
          >
            <Icon :name="item.icon" class="w-5 h-5" />
            <span class="font-medium">{{ item.label }}</span>
          </NuxtLink>
        </div>

        <!-- Bottom Section -->
        <div class="px-3 pt-4 border-t border-white/10">
          <NuxtLink
            to="/"
            class="flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            <Icon name="mdi:arrow-left" class="w-5 h-5" />
            <span class="font-medium">Back to Site</span>
          </NuxtLink>
        </div>
      </nav>
    </aside>

    <!-- Mobile Sidebar Overlay -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-20 bg-black/50 lg:hidden"
      @click="sidebarOpen = false"
    ></div>

    <!-- Main Content -->
    <main class="lg:ml-64 pt-16 min-h-screen">
      <slot />
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
const quickActionsOpen = ref(false)
const userMenuOpen = ref(false)
const quickActionsRef = ref(null)
const userMenuRef = ref(null)

// Search
const globalSearch = ref('')

// Notifications (placeholder)
const unreadNotifications = ref(3)

// Pending orders count (will be fetched)
const pendingOrdersCount = ref(0)

// User info
const userName = computed(() => authStore.user?.name || authStore.user?.email?.split('@')[0] || 'Admin')
const userEmail = computed(() => authStore.user?.email || '')
const userInitials = computed(() => {
  const name = userName.value
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
})

// Navigation items
const mainNavItems = computed(() => [
  { to: '/admin/dashboard', label: 'Dashboard', icon: 'mdi:view-dashboard' },
  { 
    to: '/admin/orders', 
    label: 'Orders', 
    icon: 'mdi:clipboard-list',
    badge: pendingOrdersCount.value > 0 ? pendingOrdersCount.value : undefined,
    badgeColor: 'bg-yellow-500/20 text-yellow-400'
  },
  { to: '/admin/customers', label: 'Customers', icon: 'mdi:account-group' },
])

const managementNavItems = [
  { to: '/admin/packages', label: 'Packages', icon: 'mdi:package-variant' },
  { to: '/admin/calendar', label: 'Calendar', icon: 'mdi:calendar-month' },
  { to: '/admin/emails', label: 'Emails', icon: 'mdi:email-multiple' },
  { to: '/admin/contact', label: 'Contact', icon: 'mdi:message-text' },
]

const reportNavItems = [
  { to: '/admin/finance', label: 'Finance', icon: 'mdi:chart-line' },
]

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
    // Navigate to orders with search query
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
onClickOutside(quickActionsRef, () => {
  quickActionsOpen.value = false
})

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
    const response = await trpc.orders.list.query({ status: 'pending', limit: 1 })
    pendingOrdersCount.value = response.total || 0
  } catch (err) {
    // Silently fail
  }
}

onMounted(() => {
  fetchPendingCount()
})

// Close sidebar on route change (mobile)
watch(() => route.path, () => {
  if (window.innerWidth < 1024) {
    sidebarOpen.value = false
  }
})
</script>
