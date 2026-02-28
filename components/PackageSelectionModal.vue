<template>
  <div class="package-selection">
    <div class="mb-12 text-center">
      <h2 class="text-3xl md:text-4xl font-bold text-white mb-4">
        Choose Your <span class="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Package</span>
      </h2>
      <p class="text-lg text-slate-300">
        Select the package that best fits your needs
      </p>
    </div>

    <!-- Empty state -->
    <div v-if="!packages || packages.length === 0" class="text-center py-12">
      <Icon name="mdi:package-variant" class="w-12 h-12 text-slate-500 mx-auto mb-4" />
      <p class="text-slate-400">No packages available at this time.</p>
    </div>

    <div v-else class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="pkg in packages"
        :key="pkg.id || pkg.slug || pkg.name"
        :class="[
          'package-card relative rounded-xl p-6 transition-all duration-300',
          pkg.popular
            ? 'border-2 border-cyan-400 bg-gradient-to-br from-slate-900 to-slate-800 shadow-2xl shadow-cyan-500/20 scale-105'
            : 'border-2 border-blue-500/30 bg-gradient-to-br from-slate-900 to-slate-800 hover:border-cyan-400 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/20'
        ]"
      >
        <!-- Most Popular Ribbon -->
        <div v-if="pkg.popular" class="absolute -top-3 left-1/2 -translate-x-1/2 transform">
          <span class="inline-flex items-center gap-1 rounded-full border-2 border-cyan-400 bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/50">
            <Icon name="mdi:star" class="h-4 w-4 animate-pulse" />
            MOST POPULAR
          </span>
        </div>

        <div class="text-center">
          <!-- Package Icon - with fallback for missing/broken emojis -->
          <div class="mb-4 flex items-center justify-center" role="img" :aria-label="`${pkg.name} icon`">
            <div v-if="getPackageIcon(pkg)" class="text-4xl">{{ getPackageIcon(pkg) }}</div>
            <div v-else class="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
              <Icon :name="getPackageIconFallback(pkg.slug || pkg.id)" class="w-7 h-7 text-white" />
            </div>
          </div>
          
          <!-- Package Name -->
          <h3 class="mb-2 text-xl font-bold text-white" :class="pkg.popular ? 'mt-2' : ''">
            {{ pkg.name }}
          </h3>
          
          <!-- Package Description -->
          <p class="mb-4 text-sm text-slate-400">{{ pkg.description }}</p>
          
          <!-- Pricing -->
          <div class="mb-4">
            <div v-if="pkg.price_cents === 0" class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
              <Icon name="mdi:email" class="w-4 h-4 text-cyan-400" />
              <span class="text-sm font-semibold text-cyan-400">Contact for pricing</span>
            </div>
            <div v-else>
              <span class="text-3xl font-bold text-white">{{ formatPrice(pkg.price_cents) }}</span>
            </div>
          </div>

          <!-- Features Preview (first 3) -->
          <div v-if="pkg.features && pkg.features.length > 0" class="mb-4 text-left">
            <ul class="space-y-2 text-sm text-slate-300">
              <li
                v-for="(feature, idx) in pkg.features.slice(0, 3)"
                :key="idx"
                class="flex items-start gap-2"
              >
                <Icon name="mdi:check" class="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <span>{{ feature }}</span>
              </li>
            </ul>
            <button
              v-if="pkg.features.length > 3"
              @click.stop="showDetails(pkg)"
              class="mt-3 text-sm text-cyan-400 hover:text-cyan-300 underline flex items-center gap-1"
              :aria-label="`View all features for ${pkg.name}`"
            >
              <span>View all {{ pkg.features.length }} features</span>
              <Icon name="mdi:arrow-right" class="w-4 h-4" />
            </button>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-col gap-2 mt-4">
            <UiButton
              variant="primary"
              full-width
              @click="selectPackage(pkg.id)"
              :aria-label="`Select ${pkg.name} package`"
            >
              <Icon name="mdi:check-circle" class="w-5 h-5 mr-2" />
              Select Package
            </UiButton>
            
            <button
              v-if="pkg.features && pkg.features.length > 0"
              @click.stop="showDetails(pkg)"
              class="text-sm text-slate-400 hover:text-white transition-colors py-2"
              :aria-label="`View details for ${pkg.name}`"
            >
              View Details
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Package Details Modal -->
    <PackageDetailsModal
      :isOpen="isDetailsModalOpen"
      :package="selectedPackageForDetails"
      @close="closeDetailsModal"
      @select="handlePackageSelectFromModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Package {
  id: string
  slug?: string
  name: string
  description: string
  price_cents: number
  icon?: string | null
  features?: string[]
  popular?: boolean
}

interface Props {
  packages: Package[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  select: [packageId: string]
}>()

const isDetailsModalOpen = ref(false)
const selectedPackageForDetails = ref<Package | null>(null)

// Map of package slugs to fallback MDI icons
const packageIconMap: Record<string, string> = {
  'player-intros-basic': 'mdi:microphone',
  'player-intros-warmup': 'mdi:microphone-variant',
  'player-intros-ultimate': 'mdi:trophy',
  'game-day-dj': 'mdi:music-note',
  'event-hosting': 'mdi:calendar-star',
  'default': 'mdi:package-variant'
}

// Check if icon is a valid emoji (not just text like "microphone")
const isValidEmoji = (icon: string | null | undefined): boolean => {
  if (!icon || typeof icon !== 'string') return false
  // Reject plain text that looks like icon names (e.g., "microphone")
  if (/^[a-zA-Z_-]+$/.test(icon)) return false
  // Check for actual emoji characters (emoji regex pattern)
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]/u
  return emojiRegex.test(icon)
}

// Get package icon - returns emoji if valid, null otherwise
const getPackageIcon = (pkg: Package): string | null => {
  if (isValidEmoji(pkg.icon)) {
    return pkg.icon!
  }
  return null
}

// Get fallback MDI icon name based on package slug
const getPackageIconFallback = (slug: string): string => {
  return packageIconMap[slug] || packageIconMap['default']
}

const formatPrice = (cents: number | null | undefined): string => {
  if (cents == null || isNaN(cents)) return '$0'
  return `$${(cents / 100).toFixed(0)}`
}

const selectPackage = (packageId: string) => {
  emit('select', packageId)
}

const showDetails = (pkg: Package) => {
  selectedPackageForDetails.value = pkg
  isDetailsModalOpen.value = true
}

const closeDetailsModal = () => {
  isDetailsModalOpen.value = false
  selectedPackageForDetails.value = null
}

const handlePackageSelectFromModal = (packageId: string) => {
  emit('select', packageId)
}
</script>

<style scoped>
.package-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.package-card:hover {
  transform: translateY(-4px);
}
</style>
