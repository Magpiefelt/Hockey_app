<template>
  <div class="package-comparison">
    <div class="mb-8 text-center">
      <h2 class="text-3xl md:text-4xl font-bold text-white mb-4">
        Compare <span class="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Packages</span>
      </h2>
      <p class="text-lg text-slate-300">
        Find the perfect package for your event
      </p>
    </div>

    <!-- Mobile View: Card Layout -->
    <div class="lg:hidden space-y-6">
      <div
        v-for="pkg in packages"
        :key="pkg.id"
        :class="[
          'rounded-xl p-6 transition-all duration-300',
          pkg.popular
            ? 'border-2 border-cyan-400 bg-gradient-to-br from-slate-900 to-slate-800 shadow-2xl shadow-cyan-500/20'
            : 'border-2 border-blue-500/30 bg-gradient-to-br from-slate-900 to-slate-800'
        ]"
      >
        <div v-if="pkg.popular" class="mb-4">
          <span class="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 px-3 py-1 text-xs font-bold text-white">
            <Icon name="mdi:star" class="h-3 w-3" />
            MOST POPULAR
          </span>
        </div>
        
        <h3 class="text-xl font-bold text-white mb-2">{{ pkg.name }}</h3>
        <p class="text-slate-400 text-sm mb-4">{{ pkg.description }}</p>
        
        <div class="mb-4">
          <span v-if="pkg.price_cents === 0" class="text-cyan-400 font-semibold">Contact for pricing</span>
          <span v-else class="text-3xl font-bold text-white">{{ formatPrice(pkg.price_cents) }}</span>
        </div>
        
        <ul class="space-y-2 mb-6">
          <li
            v-for="(feature, idx) in pkg.features"
            :key="idx"
            class="flex items-start gap-2 text-sm text-slate-300"
          >
            <Icon name="mdi:check-circle" class="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
            <span>{{ feature }}</span>
          </li>
        </ul>
        
        <button
          @click="selectPackage(pkg.id)"
          :class="[
            'w-full py-3 rounded-lg font-semibold transition-all',
            pkg.popular
              ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700'
              : 'bg-slate-700 text-white hover:bg-slate-600'
          ]"
        >
          Select Package
        </button>
      </div>
    </div>

    <!-- Desktop View: Comparison Table -->
    <div class="hidden lg:block overflow-x-auto">
      <table class="w-full border-collapse">
        <thead>
          <tr>
            <th class="p-4 text-left text-slate-400 font-medium border-b border-slate-700 w-1/4">
              Features
            </th>
            <th
              v-for="pkg in packages"
              :key="pkg.id"
              :class="[
                'p-4 text-center border-b w-1/5',
                pkg.popular ? 'border-cyan-400/50 bg-cyan-500/5' : 'border-slate-700'
              ]"
            >
              <div v-if="pkg.popular" class="mb-2">
                <span class="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 px-3 py-1 text-xs font-bold text-white">
                  <Icon name="mdi:star" class="h-3 w-3" />
                  MOST POPULAR
                </span>
              </div>
              <h3 class="text-lg font-bold text-white mb-1">{{ pkg.name }}</h3>
              <div class="mb-2">
                <span v-if="pkg.price_cents === 0" class="text-cyan-400 font-semibold text-sm">Contact for pricing</span>
                <span v-else class="text-2xl font-bold text-white">{{ formatPrice(pkg.price_cents) }}</span>
              </div>
              <button
                @click="selectPackage(pkg.id)"
                :class="[
                  'px-4 py-2 rounded-lg font-semibold text-sm transition-all',
                  pkg.popular
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700'
                    : 'bg-slate-700 text-white hover:bg-slate-600'
                ]"
              >
                Select
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(feature, idx) in allFeatures"
            :key="idx"
            :class="idx % 2 === 0 ? 'bg-slate-800/30' : ''"
          >
            <td class="p-4 text-slate-300 border-b border-slate-700/50">
              {{ feature }}
            </td>
            <td
              v-for="pkg in packages"
              :key="pkg.id"
              :class="[
                'p-4 text-center border-b',
                pkg.popular ? 'border-cyan-400/20 bg-cyan-500/5' : 'border-slate-700/50'
              ]"
            >
              <Icon
                v-if="hasFeature(pkg, feature)"
                name="mdi:check-circle"
                class="w-6 h-6 text-cyan-400 mx-auto"
              />
              <Icon
                v-else
                name="mdi:minus"
                class="w-6 h-6 text-slate-600 mx-auto"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

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

// Get all unique features across all packages
const allFeatures = computed(() => {
  const features = new Set<string>()
  for (const pkg of props.packages) {
    if (pkg.features) {
      for (const feature of pkg.features) {
        features.add(feature)
      }
    }
  }
  return Array.from(features)
})

// Check if a package has a specific feature
const hasFeature = (pkg: Package, feature: string): boolean => {
  if (!pkg.features) return false
  return pkg.features.some(f => 
    f.toLowerCase().includes(feature.toLowerCase()) || 
    feature.toLowerCase().includes(f.toLowerCase())
  )
}

const formatPrice = (cents: number): string => {
  return `$${(cents / 100).toFixed(0)}`
}

const selectPackage = (packageId: string) => {
  emit('select', packageId)
}
</script>

<style scoped>
.package-comparison table {
  border-spacing: 0;
}
</style>
