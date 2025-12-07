<template>
  <div class="flex flex-col items-center justify-center py-16 px-4 text-center">
    <!-- Icon -->
    <div class="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-dark-secondary border border-white/10">
      <Icon 
        :name="icon" 
        class="h-10 w-10 text-slate-500" 
      />
    </div>
    
    <!-- Title -->
    <h3 class="mb-2 text-xl font-bold text-white">
      {{ title }}
    </h3>
    
    <!-- Description -->
    <p class="mb-6 max-w-md text-slate-400">
      {{ description }}
    </p>
    
    <!-- Action Button -->
    <slot name="action">
      <UiButton 
        v-if="actionText && actionTo"
        :to="actionTo"
        variant="primary"
      >
        {{ actionText }}
      </UiButton>
    </slot>
  </div>
</template>

<script setup lang="ts">
interface Props {
  icon?: string
  title: string
  description: string
  actionText?: string
  actionTo?: string
}

withDefaults(defineProps<Props>(), {
  icon: 'mdi:inbox'
})
</script>
