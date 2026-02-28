<template>
  <div class="px-6 py-8">
    <div class="container mx-auto max-w-7xl">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl md:text-4xl font-bold text-white mb-2">
          Site <span class="gradient-text">Content</span>
        </h1>
        <p class="text-lg text-slate-400">
          Manage FAQ items and testimonials displayed on the public website
        </p>
      </div>

      <!-- Tab Navigation -->
      <div class="flex gap-1 mb-8 bg-slate-900/50 border border-slate-800 rounded-xl p-1 w-fit">
        <button
          @click="activeTab = 'faq'"
          :class="[
            'px-5 py-2.5 rounded-lg text-sm font-semibold transition-all',
            activeTab === 'faq'
              ? 'bg-cyan-500/20 text-cyan-400'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          ]"
        >
          <Icon name="mdi:frequently-asked-questions" class="w-4 h-4 mr-1.5 inline" />
          FAQ Items ({{ faqItems.length }})
        </button>
        <button
          @click="activeTab = 'testimonials'"
          :class="[
            'px-5 py-2.5 rounded-lg text-sm font-semibold transition-all',
            activeTab === 'testimonials'
              ? 'bg-cyan-500/20 text-cyan-400'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          ]"
        >
          <Icon name="mdi:format-quote-close" class="w-4 h-4 mr-1.5 inline" />
          Testimonials ({{ testimonials.length }})
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center py-20">
        <div class="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
      </div>

      <!-- ─── FAQ TAB ─── -->
      <div v-else-if="activeTab === 'faq'">
        <div class="flex justify-between items-center mb-6">
          <p class="text-slate-400 text-sm">{{ faqItems.filter(f => f.isVisible).length }} visible on site</p>
          <button
            @click="openFaqModal(null)"
            class="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2"
          >
            <Icon name="mdi:plus" class="w-5 h-5" />
            Add FAQ Item
          </button>
        </div>

        <!-- FAQ List -->
        <div v-if="faqItems.length === 0" class="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center">
          <Icon name="mdi:frequently-asked-questions" class="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 class="text-xl font-bold text-white mb-2">No FAQ Items</h3>
          <p class="text-slate-400">Add your first FAQ item to display on the website.</p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="item in faqItems"
            :key="item.id"
            class="bg-slate-900/50 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-xs font-mono text-slate-500">#{{ item.displayOrder }}</span>
                  <span
                    :class="item.isVisible
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-yellow-500/20 text-yellow-400'"
                    class="px-2 py-0.5 rounded-full text-xs font-semibold"
                  >
                    {{ item.isVisible ? 'Visible' : 'Hidden' }}
                  </span>
                </div>
                <h3 class="text-white font-semibold mb-1">{{ item.question }}</h3>
                <p class="text-slate-400 text-sm line-clamp-2">{{ item.answer }}</p>
              </div>
              <div class="flex items-center gap-2 flex-shrink-0">
                <button
                  @click="toggleFaqVisibility(item)"
                  class="p-2 rounded-lg transition-colors"
                  :class="item.isVisible
                    ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                    : 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20'"
                  :title="item.isVisible ? 'Hide from site' : 'Show on site'"
                >
                  <Icon :name="item.isVisible ? 'mdi:eye' : 'mdi:eye-off'" class="w-4 h-4" />
                </button>
                <button
                  @click="openFaqModal(item)"
                  class="p-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Icon name="mdi:pencil" class="w-4 h-4" />
                </button>
                <button
                  @click="deleteFaq(item)"
                  class="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Icon name="mdi:delete" class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ─── TESTIMONIALS TAB ─── -->
      <div v-else-if="activeTab === 'testimonials'">
        <div class="flex justify-between items-center mb-6">
          <p class="text-slate-400 text-sm">{{ testimonials.filter(t => t.isVisible).length }} visible on site</p>
          <button
            @click="openTestimonialModal(null)"
            class="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2"
          >
            <Icon name="mdi:plus" class="w-5 h-5" />
            Add Testimonial
          </button>
        </div>

        <!-- Testimonials List -->
        <div v-if="testimonials.length === 0" class="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center">
          <Icon name="mdi:format-quote-close" class="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 class="text-xl font-bold text-white mb-2">No Testimonials</h3>
          <p class="text-slate-400">Add your first testimonial to display on the website.</p>
        </div>

        <div v-else class="grid md:grid-cols-2 gap-4">
          <div
            v-for="item in testimonials"
            :key="item.id"
            class="bg-slate-900/50 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors"
          >
            <div class="flex items-start justify-between gap-3 mb-3">
              <div class="flex items-center gap-2">
                <span class="text-xs font-mono text-slate-500">#{{ item.displayOrder }}</span>
                <span
                  :class="item.isVisible
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-yellow-500/20 text-yellow-400'"
                  class="px-2 py-0.5 rounded-full text-xs font-semibold"
                >
                  {{ item.isVisible ? 'Visible' : 'Hidden' }}
                </span>
              </div>
              <div class="flex items-center gap-1 flex-shrink-0">
                <button
                  @click="toggleTestimonialVisibility(item)"
                  class="p-1.5 rounded-lg transition-colors"
                  :class="item.isVisible
                    ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                    : 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20'"
                  :title="item.isVisible ? 'Hide from site' : 'Show on site'"
                >
                  <Icon :name="item.isVisible ? 'mdi:eye' : 'mdi:eye-off'" class="w-4 h-4" />
                </button>
                <button
                  @click="openTestimonialModal(item)"
                  class="p-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Icon name="mdi:pencil" class="w-4 h-4" />
                </button>
                <button
                  @click="deleteTestimonial(item)"
                  class="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Icon name="mdi:delete" class="w-4 h-4" />
                </button>
              </div>
            </div>
            <p class="text-slate-300 text-sm italic mb-3 line-clamp-3">"{{ item.content }}"</p>
            <div class="flex items-center gap-2">
              <div class="flex text-amber-400">
                <Icon v-for="s in item.rating" :key="s" name="mdi:star" class="w-4 h-4" />
              </div>
              <span class="text-slate-500 text-xs">—</span>
              <span class="text-white text-sm font-medium">{{ item.authorName }}</span>
              <span v-if="item.authorRole" class="text-slate-500 text-xs">{{ item.authorRole }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ─── FAQ MODAL ─── -->
      <Teleport to="body">
        <div v-if="showFaqModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/70" @click="showFaqModal = false"></div>
          <div class="relative bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h3 class="text-xl font-bold text-white mb-6">
              {{ editingFaq ? 'Edit FAQ Item' : 'Add FAQ Item' }}
            </h3>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-1">Question</label>
                <input
                  v-model="faqForm.question"
                  type="text"
                  class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20"
                  placeholder="e.g. What types of events do you cover?"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-1">Answer</label>
                <textarea
                  v-model="faqForm.answer"
                  rows="4"
                  class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 resize-y"
                  placeholder="The answer to the question..."
                ></textarea>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-slate-300 mb-1">Display Order</label>
                  <input
                    v-model.number="faqForm.displayOrder"
                    type="number"
                    min="0"
                    class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>
                <div class="flex items-end">
                  <label class="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" v-model="faqForm.isVisible" class="w-5 h-5 rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-cyan-500/20" />
                    <span class="text-sm text-slate-300">Visible on site</span>
                  </label>
                </div>
              </div>
            </div>
            <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
              <button
                @click="showFaqModal = false"
                class="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                @click="saveFaq"
                :disabled="savingFaq"
                class="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
              >
                <Icon v-if="savingFaq" name="mdi:loading" class="w-4 h-4 animate-spin" />
                {{ editingFaq ? 'Save Changes' : 'Add FAQ Item' }}
              </button>
            </div>
          </div>
        </div>
      </Teleport>

      <!-- ─── TESTIMONIAL MODAL ─── -->
      <Teleport to="body">
        <div v-if="showTestimonialModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/70" @click="showTestimonialModal = false"></div>
          <div class="relative bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h3 class="text-xl font-bold text-white mb-6">
              {{ editingTestimonial ? 'Edit Testimonial' : 'Add Testimonial' }}
            </h3>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-1">Author Name</label>
                <input
                  v-model="testimonialForm.authorName"
                  type="text"
                  class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20"
                  placeholder="e.g. Coach Mike Thompson"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-1">Author Role (optional)</label>
                <input
                  v-model="testimonialForm.authorRole"
                  type="text"
                  class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20"
                  placeholder="e.g. Midget AAA Head Coach"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-1">Testimonial Content</label>
                <textarea
                  v-model="testimonialForm.content"
                  rows="4"
                  class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 resize-y"
                  placeholder="What the customer said..."
                ></textarea>
              </div>
              <div class="grid grid-cols-3 gap-4">
                <div>
                  <label class="block text-sm font-medium text-slate-300 mb-1">Rating</label>
                  <select
                    v-model.number="testimonialForm.rating"
                    class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20"
                  >
                    <option :value="5">5 Stars</option>
                    <option :value="4">4 Stars</option>
                    <option :value="3">3 Stars</option>
                    <option :value="2">2 Stars</option>
                    <option :value="1">1 Star</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-300 mb-1">Display Order</label>
                  <input
                    v-model.number="testimonialForm.displayOrder"
                    type="number"
                    min="0"
                    class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>
                <div class="flex items-end">
                  <label class="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" v-model="testimonialForm.isVisible" class="w-5 h-5 rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-cyan-500/20" />
                    <span class="text-sm text-slate-300">Visible</span>
                  </label>
                </div>
              </div>
            </div>
            <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
              <button
                @click="showTestimonialModal = false"
                class="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                @click="saveTestimonial"
                :disabled="savingTestimonial"
                class="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
              >
                <Icon v-if="savingTestimonial" name="mdi:loading" class="w-4 h-4 animate-spin" />
                {{ editingTestimonial ? 'Save Changes' : 'Add Testimonial' }}
              </button>
            </div>
          </div>
        </div>
      </Teleport>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

interface FaqItem {
  id: number
  question: string
  answer: string
  displayOrder: number
  isVisible: boolean
  createdAt: string | null
  updatedAt: string | null
}

interface Testimonial {
  id: number
  authorName: string
  authorRole: string | null
  content: string
  rating: number
  displayOrder: number
  isVisible: boolean
  createdAt: string | null
  updatedAt: string | null
}

const trpc = useTrpc()
const { showSuccess, showError } = useNotification()

const loading = ref(true)
const activeTab = ref<'faq' | 'testimonials'>('faq')

// FAQ state
const faqItems = ref<FaqItem[]>([])
const showFaqModal = ref(false)
const editingFaq = ref<FaqItem | null>(null)
const savingFaq = ref(false)
const faqForm = ref({
  question: '',
  answer: '',
  displayOrder: 0,
  isVisible: true
})

// Testimonial state
const testimonials = ref<Testimonial[]>([])
const showTestimonialModal = ref(false)
const editingTestimonial = ref<Testimonial | null>(null)
const savingTestimonial = ref(false)
const testimonialForm = ref({
  authorName: '',
  authorRole: '',
  content: '',
  rating: 5,
  displayOrder: 0,
  isVisible: true
})

// ─── FAQ Methods ─────────────────────────────────────────

async function fetchFaq() {
  try {
    faqItems.value = await trpc.content.faqList.query()
  } catch (err: any) {
    console.error('Failed to fetch FAQ:', err)
  }
}

function openFaqModal(item: FaqItem | null) {
  editingFaq.value = item
  if (item) {
    faqForm.value = {
      question: item.question,
      answer: item.answer,
      displayOrder: item.displayOrder,
      isVisible: item.isVisible
    }
  } else {
    faqForm.value = {
      question: '',
      answer: '',
      displayOrder: faqItems.value.length + 1,
      isVisible: true
    }
  }
  showFaqModal.value = true
}

async function saveFaq() {
  if (!faqForm.value.question || !faqForm.value.answer) {
    showError('Question and answer are required')
    return
  }
  savingFaq.value = true
  try {
    if (editingFaq.value) {
      await trpc.content.faqUpdate.mutate({
        id: editingFaq.value.id,
        ...faqForm.value
      })
      showSuccess('FAQ item updated')
    } else {
      await trpc.content.faqCreate.mutate(faqForm.value)
      showSuccess('FAQ item created')
    }
    showFaqModal.value = false
    await fetchFaq()
  } catch (err: any) {
    showError(err.message || 'Failed to save FAQ item')
  } finally {
    savingFaq.value = false
  }
}

async function toggleFaqVisibility(item: FaqItem) {
  try {
    await trpc.content.faqUpdate.mutate({
      id: item.id,
      isVisible: !item.isVisible
    })
    item.isVisible = !item.isVisible
  } catch (err: any) {
    showError('Failed to update visibility')
  }
}

async function deleteFaq(item: FaqItem) {
  if (!confirm(`Delete FAQ: "${item.question}"?`)) return
  try {
    await trpc.content.faqDelete.mutate({ id: item.id })
    faqItems.value = faqItems.value.filter(f => f.id !== item.id)
    showSuccess('FAQ item deleted')
  } catch (err: any) {
    showError('Failed to delete FAQ item')
  }
}

// ─── Testimonial Methods ─────────────────────────────────

async function fetchTestimonials() {
  try {
    testimonials.value = await trpc.content.testimonialsList.query()
  } catch (err: any) {
    console.error('Failed to fetch testimonials:', err)
  }
}

function openTestimonialModal(item: Testimonial | null) {
  editingTestimonial.value = item
  if (item) {
    testimonialForm.value = {
      authorName: item.authorName,
      authorRole: item.authorRole || '',
      content: item.content,
      rating: item.rating,
      displayOrder: item.displayOrder,
      isVisible: item.isVisible
    }
  } else {
    testimonialForm.value = {
      authorName: '',
      authorRole: '',
      content: '',
      rating: 5,
      displayOrder: testimonials.value.length + 1,
      isVisible: true
    }
  }
  showTestimonialModal.value = true
}

async function saveTestimonial() {
  if (!testimonialForm.value.authorName || !testimonialForm.value.content) {
    showError('Author name and content are required')
    return
  }
  savingTestimonial.value = true
  try {
    if (editingTestimonial.value) {
      await trpc.content.testimonialUpdate.mutate({
        id: editingTestimonial.value.id,
        ...testimonialForm.value,
        authorRole: testimonialForm.value.authorRole || undefined
      })
      showSuccess('Testimonial updated')
    } else {
      await trpc.content.testimonialCreate.mutate({
        ...testimonialForm.value,
        authorRole: testimonialForm.value.authorRole || undefined
      })
      showSuccess('Testimonial created')
    }
    showTestimonialModal.value = false
    await fetchTestimonials()
  } catch (err: any) {
    showError(err.message || 'Failed to save testimonial')
  } finally {
    savingTestimonial.value = false
  }
}

async function toggleTestimonialVisibility(item: Testimonial) {
  try {
    await trpc.content.testimonialUpdate.mutate({
      id: item.id,
      isVisible: !item.isVisible
    })
    item.isVisible = !item.isVisible
  } catch (err: any) {
    showError('Failed to update visibility')
  }
}

async function deleteTestimonial(item: Testimonial) {
  if (!confirm(`Delete testimonial by "${item.authorName}"?`)) return
  try {
    await trpc.content.testimonialDelete.mutate({ id: item.id })
    testimonials.value = testimonials.value.filter(t => t.id !== item.id)
    showSuccess('Testimonial deleted')
  } catch (err: any) {
    showError('Failed to delete testimonial')
  }
}

// ─── Lifecycle ───────────────────────────────────────────

onMounted(async () => {
  await Promise.all([fetchFaq(), fetchTestimonials()])
  loading.value = false
})

useHead({
  title: 'Site Content - Elite Sports DJ Admin',
  meta: [{ name: 'description', content: 'Manage FAQ and testimonials' }]
})
</script>

<style scoped>
.gradient-text {
  background: linear-gradient(to right, rgb(96, 165, 250), rgb(34, 211, 238));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
</style>
