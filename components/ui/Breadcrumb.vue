<template>
  <nav aria-label="Breadcrumb" class="mb-4">
    <ol class="flex items-center space-x-2 text-sm">
      <li v-for="(crumb, index) in crumbs" :key="crumb.path" class="flex items-center">
        <!-- Separator -->
        <Icon 
          v-if="index > 0" 
          name="mdi:chevron-right" 
          class="w-4 h-4 text-slate-500 mx-2" 
        />
        
        <!-- Link or Current -->
        <NuxtLink
          v-if="index < crumbs.length - 1"
          :to="crumb.path"
          class="text-slate-400 hover:text-brand-400 transition-colors"
        >
          <span class="flex items-center gap-1">
            <Icon v-if="crumb.icon" :name="crumb.icon" class="w-4 h-4" />
            {{ crumb.label }}
          </span>
        </NuxtLink>
        <span 
          v-else 
          class="text-white font-medium"
          aria-current="page"
        >
          <span class="flex items-center gap-1">
            <Icon v-if="crumb.icon" :name="crumb.icon" class="w-4 h-4" />
            {{ crumb.label }}
          </span>
        </span>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
interface Crumb {
  label: string
  path: string
  icon?: string
}

interface Props {
  crumbs: Crumb[]
}

defineProps<Props>()
</script>
