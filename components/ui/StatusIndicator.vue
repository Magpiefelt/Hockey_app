<template>
  <div class="flex items-center gap-2">
    <!-- Status Dot -->
    <span 
      class="w-2 h-2 rounded-full flex-shrink-0"
      :class="dotColorClass"
    />
    
    <!-- Status Text -->
    <span 
      class="text-sm font-medium"
      :class="textColorClass"
    >
      {{ label || formattedStatus }}
    </span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  status: string
  label?: string
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md'
})

const statusConfig: Record<string, { dot: string; text: string; label: string }> = {
  // Order statuses
  submitted: { dot: 'bg-blue-500', text: 'text-blue-400', label: 'Submitted' },
  pending: { dot: 'bg-blue-500', text: 'text-blue-400', label: 'Pending' },
  quoted: { dot: 'bg-yellow-500', text: 'text-yellow-400', label: 'Quoted' },
  in_progress: { dot: 'bg-cyan-500', text: 'text-cyan-400', label: 'In Progress' },
  ready: { dot: 'bg-purple-500', text: 'text-purple-400', label: 'Ready' },
  delivered: { dot: 'bg-green-500', text: 'text-green-400', label: 'Delivered' },
  completed: { dot: 'bg-green-500', text: 'text-green-400', label: 'Completed' },
  paid: { dot: 'bg-green-500', text: 'text-green-400', label: 'Paid' },
  cancelled: { dot: 'bg-red-500', text: 'text-red-400', label: 'Cancelled' },
  refunded: { dot: 'bg-red-500', text: 'text-red-400', label: 'Refunded' },
  
  // Generic statuses
  active: { dot: 'bg-green-500', text: 'text-green-400', label: 'Active' },
  inactive: { dot: 'bg-slate-500', text: 'text-slate-400', label: 'Inactive' },
  draft: { dot: 'bg-slate-500', text: 'text-slate-400', label: 'Draft' },
  published: { dot: 'bg-green-500', text: 'text-green-400', label: 'Published' },
  
  // Contact statuses
  new: { dot: 'bg-blue-500', text: 'text-blue-400', label: 'New' },
  read: { dot: 'bg-slate-500', text: 'text-slate-400', label: 'Read' },
  replied: { dot: 'bg-green-500', text: 'text-green-400', label: 'Replied' },
  archived: { dot: 'bg-slate-500', text: 'text-slate-400', label: 'Archived' }
}

const config = computed(() => {
  return statusConfig[props.status] || { 
    dot: 'bg-slate-500', 
    text: 'text-slate-400', 
    label: props.status 
  }
})

const dotColorClass = computed(() => config.value.dot)
const textColorClass = computed(() => config.value.text)
const formattedStatus = computed(() => config.value.label)
</script>
