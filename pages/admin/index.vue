<template>
  <div></div>
</template>

<script setup lang="ts">
/**
 * Admin Index Page
 * Redirects /admin to /admin/dashboard
 */

definePageMeta({
  middleware: 'admin'
})

// Redirect to dashboard
navigateTo('/admin/dashboard', { replace: true })
</script>
