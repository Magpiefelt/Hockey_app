<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/70" @click="close"></div>

      <!-- Modal -->
      <div class="relative bg-dark-secondary border border-white/10 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <!-- Header -->
        <div class="sticky top-0 bg-dark-secondary border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <h2 class="text-xl font-bold text-white">
            {{ isEditing ? 'Edit Package' : 'Create Package' }}
          </h2>
          <button
            @click="close"
            class="text-slate-400 hover:text-white transition-colors"
          >
            <Icon name="mdi:close" class="w-6 h-6" />
          </button>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="p-6 space-y-6">
          <!-- Name -->
          <UiInput
            v-model="form.name"
            label="Package Name *"
            placeholder="e.g., Ultimate Game Day Package"
            :error="errors.name"
          />

          <!-- Slug -->
          <UiInput
            v-model="form.slug"
            label="Slug *"
            placeholder="e.g., ultimate-game-day"
            :error="errors.slug"
            :disabled="isEditing"
            hint="Unique identifier used in URLs. Cannot be changed after creation."
          />

          <!-- Description -->
          <UiTextarea
            v-model="form.description"
            label="Description"
            placeholder="Describe what's included in this package..."
            rows="3"
          />

          <!-- Price and Icon Row -->
          <div class="grid md:grid-cols-2 gap-4">
            <UiInput
              v-model.number="form.priceCents"
              label="Price (in cents) *"
              type="number"
              placeholder="e.g., 19000 for $190"
              :error="errors.priceCents"
              hint="Enter 0 for 'Contact for pricing'"
            />

            <UiInput
              v-model="form.icon"
              label="Icon (Emoji)"
              placeholder="e.g., 🏆"
              maxlength="10"
            />
          </div>

          <!-- Popular Checkbox -->
          <div class="flex items-center gap-3">
            <input
              id="popular"
              v-model="form.isPopular"
              type="checkbox"
              class="w-5 h-5 rounded border-white/20 text-brand-500 focus:ring-brand-500 focus:ring-offset-0 bg-dark-tertiary"
            />
            <label for="popular" class="text-white font-medium cursor-pointer">
              Mark as Popular
            </label>
          </div>

          <!-- Features -->
          <div class="space-y-3">
            <label class="block text-sm font-medium text-slate-300">
              Features
            </label>

            <div
              v-for="(feature, index) in form.features"
              :key="index"
              class="flex items-center gap-2"
            >
              <input
                v-model="form.features[index]"
                type="text"
                placeholder="Enter a feature..."
                class="flex-1 px-4 py-2.5 bg-dark-tertiary border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
              />
              <button
                type="button"
                @click="removeFeature(index)"
                class="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                title="Remove feature"
              >
                <Icon name="mdi:close" class="w-5 h-5" />
              </button>
            </div>

            <button
              type="button"
              @click="addFeature"
              class="flex items-center gap-2 text-brand-400 hover:text-brand-300 text-sm font-medium transition-colors"
            >
              <Icon name="mdi:plus" class="w-4 h-4" />
              Add Feature
            </button>
          </div>

          <!-- Form Actions -->
          <div class="flex justify-end gap-3 pt-4 border-t border-white/10">
            <UiButton @click="close" variant="outline" type="button">
              Cancel
            </UiButton>
            <UiButton
              type="submit"
              variant="primary"
              :loading="isSubmitting"
              :disabled="isSubmitting"
            >
              {{ isEditing ? 'Save Changes' : 'Create Package' }}
            </UiButton>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
interface Package {
  id?: number
  slug: string
  name: string
  description: string | null
  price_cents: number
  currency: string
  popular: boolean
  features: string[]
  icon: string | null
}

interface Props {
  modelValue: boolean
  package?: Package | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: []
}>()

const trpc = useTrpc()
const { showError, showSuccess } = useNotification()

const isEditing = computed(() => !!props.package)
const isSubmitting = ref(false)

const form = ref({
  name: '',
  slug: '',
  description: '',
  priceCents: 0,
  icon: '',
  isPopular: false,
  features: [''] as string[]
})

const errors = ref({
  name: '',
  slug: '',
  priceCents: ''
})

// Initialize form when package prop changes
watch(
  () => props.package,
  (pkg) => {
    if (pkg) {
      form.value = {
        name: pkg.name,
        slug: pkg.slug,
        description: pkg.description || '',
        priceCents: pkg.price_cents,
        icon: pkg.icon || '',
        isPopular: pkg.popular,
        features: pkg.features?.length ? [...pkg.features] : ['']
      }
    } else {
      resetForm()
    }
  },
  { immediate: true }
)

const resetForm = () => {
  form.value = {
    name: '',
    slug: '',
    description: '',
    priceCents: 0,
    icon: '',
    isPopular: false,
    features: ['']
  }
  errors.value = {
    name: '',
    slug: '',
    priceCents: ''
  }
}

const close = () => {
  emit('update:modelValue', false)
}

const addFeature = () => {
  form.value.features.push('')
}

const removeFeature = (index: number) => {
  if (form.value.features.length > 1) {
    form.value.features.splice(index, 1)
  } else {
    form.value.features[0] = ''
  }
}

const validate = (): boolean => {
  errors.value = {
    name: '',
    slug: '',
    priceCents: ''
  }

  let isValid = true

  if (!form.value.name.trim()) {
    errors.value.name = 'Package name is required'
    isValid = false
  }

  if (!form.value.slug.trim()) {
    errors.value.slug = 'Slug is required'
    isValid = false
  } else if (!/^[a-z0-9-]+$/.test(form.value.slug)) {
    errors.value.slug = 'Slug can only contain lowercase letters, numbers, and hyphens'
    isValid = false
  }

  if (form.value.priceCents < 0) {
    errors.value.priceCents = 'Price cannot be negative'
    isValid = false
  }

  return isValid
}

const handleSubmit = async () => {
  if (!validate()) return

  isSubmitting.value = true

  try {
    // Filter out empty features
    const features = form.value.features.filter(f => f.trim())

    if (isEditing.value) {
      await trpc.packages.update.mutate({
        slug: form.value.slug,
        name: form.value.name,
        description: form.value.description || undefined,
        priceCents: form.value.priceCents,
        icon: form.value.icon || undefined,
        isPopular: form.value.isPopular,
        features
      })
      showSuccess('Package updated successfully')
    } else {
      await trpc.packages.create.mutate({
        slug: form.value.slug,
        name: form.value.name,
        description: form.value.description || undefined,
        priceCents: form.value.priceCents,
        icon: form.value.icon || undefined,
        isPopular: form.value.isPopular,
        features
      })
      showSuccess('Package created successfully')
    }

    emit('saved')
  } catch (err: any) {
    const { handleTrpcError } = await import('~/composables/useTrpc')
    const errorMessage = handleTrpcError(err)

    if (errorMessage?.includes('already exists')) {
      errors.value.slug = 'A package with this slug already exists'
    } else {
      showError(errorMessage || 'Failed to save package')
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>
