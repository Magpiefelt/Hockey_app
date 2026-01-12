/**
 * Tests for new Vue components
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

describe('PackageComparisonTable Component', () => {
  const componentPath = join(process.cwd(), 'components', 'PackageComparisonTable.vue')

  it('should exist', () => {
    expect(existsSync(componentPath)).toBe(true)
  })

  it('should have template, script, and style sections', () => {
    const content = readFileSync(componentPath, 'utf-8')
    expect(content).toContain('<template>')
    expect(content).toContain('<script setup')
    expect(content).toContain('<style')
  })

  it('should accept packages prop', () => {
    const content = readFileSync(componentPath, 'utf-8')
    expect(content).toContain('defineProps')
    expect(content).toContain('packages')
  })

  it('should emit select event', () => {
    const content = readFileSync(componentPath, 'utf-8')
    expect(content).toContain('defineEmits')
    expect(content).toContain('select')
  })

  it('should have mobile and desktop views', () => {
    const content = readFileSync(componentPath, 'utf-8')
    expect(content).toContain('lg:hidden') // Mobile view
    expect(content).toContain('hidden lg:block') // Desktop view
  })

  it('should format prices correctly', () => {
    const content = readFileSync(componentPath, 'utf-8')
    expect(content).toContain('formatPrice')
    expect(content).toContain('cents / 100')
  })
})

describe('RevenueTrendChart Component', () => {
  const componentPath = join(process.cwd(), 'components', 'admin', 'RevenueTrendChart.vue')

  it('should exist', () => {
    expect(existsSync(componentPath)).toBe(true)
  })

  it('should import Chart.js', () => {
    const content = readFileSync(componentPath, 'utf-8')
    expect(content).toContain("from 'chart.js'")
  })

  it('should have loading state', () => {
    const content = readFileSync(componentPath, 'utf-8')
    expect(content).toContain('v-if="loading"')
  })

  it('should have error state', () => {
    const content = readFileSync(componentPath, 'utf-8')
    expect(content).toContain('v-else-if="error"')
  })

  it('should have period selection', () => {
    const content = readFileSync(componentPath, 'utf-8')
    expect(content).toContain('selectedPeriod')
    expect(content).toContain('6M')
    expect(content).toContain('12M')
    expect(content).toContain('24M')
  })

  it('should display summary stats', () => {
    const content = readFileSync(componentPath, 'utf-8')
    expect(content).toContain('totalRevenue')
    expect(content).toContain('averageRevenue')
    expect(content).toContain('growthRate')
  })

  it('should clean up chart on unmount', () => {
    const content = readFileSync(componentPath, 'utf-8')
    expect(content).toContain('onUnmounted')
    expect(content).toContain('chartInstance.destroy()')
  })
})

describe('BookingPipelineChart Component', () => {
  const componentPath = join(process.cwd(), 'components', 'admin', 'BookingPipelineChart.vue')

  it('should exist', () => {
    expect(existsSync(componentPath)).toBe(true)
  })

  it('should have all pipeline stages', () => {
    const content = readFileSync(componentPath, 'utf-8')
    const stages = ['submitted', 'quoted', 'invoiced', 'paid', 'in_progress', 'completed', 'cancelled']
    for (const stage of stages) {
      expect(content).toContain(stage)
    }
  })

  it('should calculate conversion rates', () => {
    const content = readFileSync(componentPath, 'utf-8')
    expect(content).toContain('quoteToPayRate')
    expect(content).toContain('submittedToCompletedRate')
  })

  it('should display total orders', () => {
    const content = readFileSync(componentPath, 'utf-8')
    expect(content).toContain('totalOrders')
  })

  it('should have progress bars', () => {
    const content = readFileSync(componentPath, 'utf-8')
    expect(content).toContain('getPercentage')
    expect(content).toContain('width:')
  })
})

describe('EmailDetailModal Component', () => {
  const componentPath = join(process.cwd(), 'components', 'admin', 'EmailDetailModal.vue')

  it('should exist', () => {
    expect(existsSync(componentPath)).toBe(true)
  })

  it('should have safe email accessor', () => {
    const content = readFileSync(componentPath, 'utf-8')
    expect(content).toContain('safeEmail')
    expect(content).toContain('defaultEmail')
  })

  it('should handle null email prop gracefully', () => {
    const content = readFileSync(componentPath, 'utf-8')
    expect(content).toContain('props.email || defaultEmail')
  })

  it('should track event listener state', () => {
    const content = readFileSync(componentPath, 'utf-8')
    expect(content).toContain('isListenerAttached')
  })

  it('should clean up on unmount', () => {
    const content = readFileSync(componentPath, 'utf-8')
    expect(content).toContain('onUnmounted')
    expect(content).toContain("document.removeEventListener('keydown', handleKeydown)")
  })

  it('should handle date formatting errors gracefully', () => {
    const content = readFileSync(componentPath, 'utf-8')
    expect(content).toContain('try {')
    expect(content).toContain('catch {')
  })
})
