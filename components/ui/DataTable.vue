<template>
  <div class="card overflow-hidden">
    <!-- Table Header with optional title and actions -->
    <div v-if="title || $slots.actions" class="px-6 py-4 border-b border-white/10 flex items-center justify-between">
      <h3 v-if="title" class="text-lg font-bold text-white">{{ title }}</h3>
      <div v-if="$slots.actions" class="flex items-center gap-2">
        <slot name="actions" />
      </div>
    </div>
    
    <!-- Table Container -->
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="border-b border-white/10">
            <slot name="header" />
          </tr>
        </thead>
        <tbody>
          <!-- Loading State -->
          <tr v-if="loading">
            <td :colspan="columnCount" class="py-12 text-center">
              <div class="flex flex-col items-center gap-3">
                <div class="animate-spin h-8 w-8 border-4 border-brand-600 border-t-transparent rounded-full"></div>
                <span class="text-slate-400">Loading...</span>
              </div>
            </td>
          </tr>
          
          <!-- Empty State -->
          <tr v-else-if="empty">
            <td :colspan="columnCount" class="py-12 text-center">
              <div class="flex flex-col items-center gap-2">
                <Icon :name="emptyIcon" class="w-12 h-12 text-slate-600" />
                <span class="text-slate-400">{{ emptyMessage }}</span>
                <slot name="empty-action" />
              </div>
            </td>
          </tr>
          
          <!-- Table Rows -->
          <slot v-else name="body" />
        </tbody>
      </table>
    </div>
    
    <!-- Footer with pagination -->
    <div v-if="$slots.footer" class="px-6 py-4 border-t border-white/10">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title?: string
  loading?: boolean
  empty?: boolean
  emptyMessage?: string
  emptyIcon?: string
  columnCount?: number
}

withDefaults(defineProps<Props>(), {
  loading: false,
  empty: false,
  emptyMessage: 'No data found',
  emptyIcon: 'mdi:inbox',
  columnCount: 5
})
</script>
