<template>
  <th 
    class="text-left py-4 px-6 text-slate-200 font-semibold text-xs uppercase cursor-pointer hover:text-brand-400 transition-colors select-none"
    @click="handleClick"
  >
    <span class="flex items-center gap-1">
      <slot>{{ label }}</slot>
      <Icon 
        v-if="active" 
        :name="direction === 'asc' ? 'mdi:arrow-up' : 'mdi:arrow-down'" 
        class="w-4 h-4" 
      />
      <Icon 
        v-else 
        name="mdi:unfold-more-horizontal" 
        class="w-4 h-4 opacity-50" 
      />
    </span>
  </th>
</template>

<script setup lang="ts">
interface Props {
  label?: string
  column: string
  active?: boolean
  direction?: 'asc' | 'desc'
}

const props = withDefaults(defineProps<Props>(), {
  active: false,
  direction: 'asc'
})

const emit = defineEmits<{
  sort: [column: string]
}>()

const handleClick = () => {
  emit('sort', props.column)
}
</script>
