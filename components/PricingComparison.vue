<template>
  <div class="pricing-comparison">
    <div class="comparison-table">
      <!-- Feature Column -->
      <div class="feature-column">
        <div class="column-header">Features</div>
        <div v-for="feature in features" :key="feature" class="feature-row">
          {{ feature }}
        </div>
      </div>
      
      <!-- Package Columns -->
      <div
        v-for="(pkg, index) in packages"
        :key="index"
        :class="['package-column', { featured: pkg.featured }]"
      >
        <div class="column-header">
          <div v-if="pkg.featured" class="featured-badge">Most Popular</div>
          <div class="package-name">{{ pkg.name }}</div>
          <div class="package-price">{{ pkg.price }}</div>
        </div>
        <div v-for="feature in features" :key="feature" class="feature-row">
          <Icon
            v-if="pkg.features[feature]"
            name="mdi:check-circle"
            class="w-6 h-6 text-green-400"
          />
          <Icon
            v-else
            name="mdi:close-circle"
            class="w-6 h-6 text-slate-600"
          />
        </div>
        <div class="cta-row">
          <NuxtLink :to="pkg.ctaLink" class="package-cta">
            {{ pkg.ctaText }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Package {
  name: string
  price: string
  features: Record<string, boolean>
  ctaText: string
  ctaLink: string
  featured?: boolean
}

interface Props {
  features: string[]
  packages: Package[]
}

defineProps<Props>()
</script>

<style scoped>
.pricing-comparison {
  width: 100%;
  overflow-x: auto;
}

.comparison-table {
  display: grid;
  grid-template-columns: 2fr repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  min-width: 800px;
}

.feature-column,
.package-column {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.package-column {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.5), rgba(15, 23, 42, 0.5));
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 1rem;
  overflow: hidden;
}

.package-column.featured {
  border-color: #3b82f6;
  border-width: 2px;
  transform: scale(1.05);
  box-shadow: 0 20px 25px -5px rgba(59, 130, 246, 0.3);
}

.column-header {
  padding: 1.5rem;
  font-weight: 700;
  color: white;
  position: relative;
}

.feature-column .column-header {
  font-size: 1.25rem;
  background: transparent;
}

.package-column .column-header {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(6, 182, 212, 0.2));
  text-align: center;
}

.package-column.featured .column-header {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.4), rgba(6, 182, 212, 0.4));
}

.featured-badge {
  position: absolute;
  top: -0.75rem;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #3b82f6, #06b6d4);
  color: white;
  font-size: 0.75rem;
  font-weight: 900;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.package-name {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.package-price {
  font-size: 2rem;
  font-weight: 900;
  background: linear-gradient(135deg, #3b82f6, #06b6d4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.feature-row {
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(148, 163, 184, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 3.5rem;
}

.feature-column .feature-row {
  justify-content: flex-start;
  color: #cbd5e1;
  font-weight: 500;
}

.cta-row {
  padding: 1.5rem;
  margin-top: auto;
}

.package-cta {
  display: block;
  width: 100%;
  padding: 0.875rem 1.5rem;
  background: linear-gradient(135deg, #3b82f6, #06b6d4);
  color: white;
  font-weight: 700;
  text-align: center;
  border-radius: 0.75rem;
  transition: all 0.3s;
}

.package-cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.4);
}

.package-column.featured .package-cta {
  background: linear-gradient(135deg, #2563eb, #0891b2);
  box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.3);
}

@media (max-width: 1024px) {
  .comparison-table {
    grid-template-columns: 1.5fr repeat(auto-fit, minmax(180px, 1fr));
  }
  
  .package-name {
    font-size: 1.25rem;
  }
  
  .package-price {
    font-size: 1.5rem;
  }
}
</style>
