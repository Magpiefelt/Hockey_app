<template>
  <div class="flex flex-col items-center justify-center py-16 px-4 text-center">
    <!-- Icon -->
    <div 
      :class="[
        'mb-6 flex h-20 w-20 items-center justify-center rounded-full',
        variant === 'dark' 
          ? 'bg-dark-secondary border border-white/10' 
          : 'bg-slate-100 border border-slate-200'
      ]"
    >
      <Icon 
        :name="icon" 
        :class="[
          'h-10 w-10',
          variant === 'dark' ? 'text-slate-500' : 'text-slate-400'
        ]"
      />
    </div>
    
    <!-- Title -->
    <h3 
      :class="[
        'mb-2 text-xl font-bold',
        variant === 'dark' ? 'text-white' : 'text-slate-900'
      ]"
    >
      {{ title }}
    </h3>
    
    <!-- Description -->
    <p 
      :class="[
        'mb-6 max-w-md',
        variant === 'dark' ? 'text-slate-400' : 'text-slate-600'
      ]"
    >
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
  variant?: 'dark' | 'light'
}

withDefaults(defineProps<Props>(), {
  icon: 'mdi:inbox',
  variant: 'light'
})
</script>
