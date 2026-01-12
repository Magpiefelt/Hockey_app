<template>
  <div class="min-h-screen bg-dark-primary flex items-center justify-center">
    <div class="animate-spin h-12 w-12 border-4 border-brand-600 border-t-transparent rounded-full"></div>
  </div>
</template>

<script setup lang="ts">
/**
 * Admin Index Page
 * Redirects /admin to /admin/dashboard
 */

definePageMeta({
  middleware: 'admin'
})

// Use onMounted to ensure proper client-side navigation
onMounted(() => {
  navigateTo('/admin/dashboard', { replace: true })
})
</script>
