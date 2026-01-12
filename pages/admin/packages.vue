<template>
  <div class="max-w-7xl mx-auto">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div>
        <h1 class="text-2xl lg:text-3xl font-bold text-white mb-1">Packages</h1>
        <p class="text-slate-400">Create, edit, and manage service packages</p>
      </div>
      <button 
        @click="openCreateModal" 
        class="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2"
      >
        <Icon name="mdi:plus" class="w-5 h-5" />
        Create Package
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-20">
      <div class="flex flex-col items-center gap-4">
        <div class="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
        <p class="text-slate-400">Loading packages...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center">
      <div class="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center mx-auto mb-4">
        <Icon name="mdi:alert-circle" class="w-8 h-8 text-red-400" />
      </div>
      <p class="text-red-400 text-lg mb-4">{{ error }}</p>
      <button 
        @click="fetchPackages"
        class="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-all"
      >
        Try Again
      </button>
    </div>

    <!-- Packages Table -->
    <div v-else class="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-slate-800 bg-slate-800/30">
              <th class="text-left py-4 px-6 text-slate-300 font-semibold text-xs uppercase tracking-wide">Icon</th>
              <th class="text-left py-4 px-6 text-slate-300 font-semibold text-xs uppercase tracking-wide">Name</th>
              <th class="text-left py-4 px-6 text-slate-300 font-semibold text-xs uppercase tracking-wide">Slug</th>
              <th class="text-left py-4 px-6 text-slate-300 font-semibold text-xs uppercase tracking-wide">Price</th>
              <th class="text-left py-4 px-6 text-slate-300 font-semibold text-xs uppercase tracking-wide">Status</th>
              <th class="text-left py-4 px-6 text-slate-300 font-semibold text-xs uppercase tracking-wide">Features</th>
              <th class="text-left py-4 px-6 text-slate-300 font-semibold text-xs uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="packages.length === 0">
              <td colspan="7" class="py-16 text-center">
                <div class="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
                  <Icon name="mdi:package-variant" class="w-8 h-8 text-slate-600" />
                </div>
                <p class="text-slate-400 mb-1">No packages found</p>
                <p class="text-sm text-slate-500">Create your first package to get started</p>
              </td>
            </tr>
            <tr
              v-for="pkg in packages"
              :key="pkg.slug"
              class="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group"
            >
              <td class="py-4 px-6">
                <div class="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xl">
                  {{ pkg.icon || '📦' }}
                </div>
              </td>
              <td class="py-4 px-6 text-white font-medium">{{ pkg.name }}</td>
              <td class="py-4 px-6 text-slate-400 font-mono text-sm">{{ pkg.slug }}</td>
              <td class="py-4 px-6 text-white font-semibold">
                {{ pkg.price_cents === 0 ? 'Contact' : formatPrice(pkg.price_cents) }}
              </td>
              <td class="py-4 px-6">
                <span v-if="pkg.popular" class="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-semibold">
                  Popular
                </span>
                <span v-else class="px-3 py-1 rounded-full bg-slate-700/50 text-slate-500 text-xs font-semibold">
                  Standard
                </span>
              </td>
              <td class="py-4 px-6 text-slate-400 text-sm">
                {{ pkg.features?.length || 0 }} features
              </td>
              <td class="py-4 px-6">
                <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    @click="openEditModal(pkg)"
                    class="p-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-lg transition-colors"
                    title="Edit package"
                  >
                    <Icon name="mdi:pencil" class="w-4 h-4" />
                  </button>
                  <button
                    @click="confirmDelete(pkg)"
                    class="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                    title="Delete package"
                  >
                    <Icon name="mdi:delete" class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

      <!-- Info Section -->
      <div class="mt-6 card p-6 bg-blue-500/10 border-blue-500/30">
        <div class="flex gap-3">
          <Icon name="mdi:information" class="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div class="text-sm text-slate-300 space-y-2">
            <p>
              <strong class="text-white">Note:</strong> Changes to packages will be reflected immediately on the public request form.
            </p>
            <p>
              The package slug is used as the unique identifier and cannot be changed after creation.
            </p>
          </div>
        </div>
      </div>

    <!-- Create/Edit Modal -->
    <AdminPackageFormModal
      v-if="showModal"
      v-model="showModal"
      :package="editingPackage"
      @saved="handlePackageSaved"
    />

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <div
        v-if="showDeleteConfirm"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div class="absolute inset-0 bg-black/70" @click="showDeleteConfirm = false"></div>
        <div class="relative bg-dark-secondary border border-white/10 rounded-xl p-6 max-w-md w-full">
          <h3 class="text-xl font-bold text-white mb-4">Delete Package</h3>
          <p class="text-slate-300 mb-6">
            Are you sure you want to delete <strong class="text-white">{{ deletingPackage?.name }}</strong>?
            This action cannot be undone.
          </p>
          <div class="flex justify-end gap-3">
            <UiButton @click="showDeleteConfirm = false" variant="outline">
              Cancel
            </UiButton>
            <UiButton
              @click="deletePackage"
              variant="primary"
              class="!bg-red-600 hover:!bg-red-700"
              :loading="isDeleting"
            >
              Delete
            </UiButton>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
interface Package {
  id: number
  slug: string
  name: string
  description: string | null
  price_cents: number
  currency: string
  popular: boolean
  features: string[]
  icon: string | null
}

definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

const trpc = useTrpc()
const { showError, showSuccess } = useNotification()

const loading = ref(true)
const error = ref<string | null>(null)
const packages = ref<Package[]>([])

const showModal = ref(false)
const editingPackage = ref<Package | null>(null)

const showDeleteConfirm = ref(false)
const deletingPackage = ref<Package | null>(null)
const isDeleting = ref(false)

const formatPrice = (cents: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0
  }).format(cents / 100)
}

const fetchPackages = async () => {
  loading.value = true
  error.value = null

  try {
    const data = await trpc.packages.getAll.query()
    packages.value = data
  } catch (err: any) {
    const { handleTrpcError } = await import('~/composables/useTrpc')
    error.value = handleTrpcError(err)
    showError('Failed to load packages')
  } finally {
    loading.value = false
  }
}

const openCreateModal = () => {
  editingPackage.value = null
  showModal.value = true
}

const openEditModal = (pkg: Package) => {
  editingPackage.value = pkg
  showModal.value = true
}

const handlePackageSaved = () => {
  showModal.value = false
  fetchPackages()
}

const confirmDelete = (pkg: Package) => {
  deletingPackage.value = pkg
  showDeleteConfirm.value = true
}

const deletePackage = async () => {
  if (!deletingPackage.value) return

  isDeleting.value = true

  try {
    await trpc.packages.delete.mutate({ slug: deletingPackage.value.slug })
    showSuccess('Package deleted successfully')
    showDeleteConfirm.value = false
    deletingPackage.value = null
    fetchPackages()
  } catch (err: any) {
    const { handleTrpcError } = await import('~/composables/useTrpc')
    showError(handleTrpcError(err) || 'Failed to delete package')
  } finally {
    isDeleting.value = false
  }
}

onMounted(() => {
  fetchPackages()
})

useHead({
  title: 'Package Management - Elite Sports DJ Admin',
  meta: [
    { name: 'description', content: 'Manage service packages' }
  ]
})
</script>
