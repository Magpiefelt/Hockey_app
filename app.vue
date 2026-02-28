<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <UiToastContainer />
  </div>
</template>

<script setup lang="ts">
// Root application component
// NuxtLayout switches between layouts/default.vue and layouts/admin.vue
// based on definePageMeta({ layout: '...' }) in each page
</script>

<style>
/* Global styles are imported via nuxt.config.ts */
/* Additional global styles can be added here if needed */
</style>
