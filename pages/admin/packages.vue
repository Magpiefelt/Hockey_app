<template>
  <div class="px-6 py-8">
    <div class="container mx-auto max-w-7xl">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl md:text-4xl font-bold text-white mb-2">
            Package <span class="gradient-text">Management</span>
          </h1>
          <p class="text-lg text-slate-400">
            Create, edit, and manage service packages
          </p>
        </div>
        <UiButton @click="openCreateModal" variant="primary">
          <Icon name="mdi:plus" class="w-5 h-5 mr-2" />
          Create Package
        </UiButton>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center py-20">
        <div class="animate-spin h-12 w-12 border-4 border-brand-600 border-t-transparent rounded-full"></div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="p-6 rounded-xl border border-error-500/30 bg-error-500/10 text-center">
        <p class="text-error-400 text-lg mb-4">{{ error }}</p>
        <UiButton @click="fetchPackages" variant="outline">
          Try Again
        </UiButton>
      </div>

      <!-- Packages Table -->
      <div v-else class="card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-white/10">
                <th class="text-left py-4 px-6 text-slate-200 font-semibold text-xs uppercase">Icon</th>
                <th class="text-left py-4 px-6 text-slate-200 font-semibold text-xs uppercase">Name</th>
                <th class="text-left py-4 px-6 text-slate-200 font-semibold text-xs uppercase">Slug</th>
                <th class="text-left py-4 px-6 text-slate-200 font-semibold text-xs uppercase">Price</th>
                <th class="text-left py-4 px-6 text-slate-200 font-semibold text-xs uppercase">Status</th>
                <th class="text-left py-4 px-6 text-slate-200 font-semibold text-xs uppercase">Features</th>
                <th class="text-left py-4 px-6 text-slate-200 font-semibold text-xs uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="packages.length === 0">
                <td colspan="7" class="py-12 text-center text-slate-400">
                  No packages found. Create your first package to get started.
                </td>
              </tr>
              <tr
                v-for="pkg in packages"
                :key="pkg.slug"
                class="border-b border-white/5 hover:bg-dark-secondary transition-colors"
              >
                <td class="py-4 px-6 text-2xl">{{ pkg.icon || '📦' }}</td>
                <td class="py-4 px-6 text-white font-medium">{{ pkg.name }}</td>
                <td class="py-4 px-6 text-slate-400 font-mono text-sm">{{ pkg.slug }}</td>
                <td class="py-4 px-6 text-white font-semibold">
                  {{ pkg.price_cents === 0 ? 'Contact' : formatPrice(pkg.price_cents) }}
                </td>
                <td class="py-4 px-6">
                  <UiBadge v-if="pkg.popular" variant="brand" size="sm">
                    Popular
                  </UiBadge>
                  <span v-else class="text-slate-500 text-sm">Standard</span>
                </td>
                <td class="py-4 px-6 text-slate-400 text-sm">
                  {{ pkg.features?.length || 0 }} features
                </td>
                <td class="py-4 px-6">
                  <div class="flex items-center gap-2">
                    <button
                      @click="openEditModal(pkg)"
                      class="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-md transition-colors flex items-center gap-1"
                      title="Edit package"
                    >
                      <Icon name="mdi:pencil" class="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      @click="confirmDelete(pkg)"
                      class="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-md transition-colors flex items-center gap-1"
                      title="Delete package"
                    >
                      <Icon name="mdi:delete" class="w-4 h-4" />
                      Delete
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
