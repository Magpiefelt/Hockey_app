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

describe('TrendChart Component', () => {
  const componentPath = join(process.cwd(), 'components', 'admin', 'TrendChart.vue')

  it('should exist', () => {
    expect(existsSync(componentPath)).toBe(true)
  })

  it('should import Chart.js', () => {
    const content = readFileSync(componentPath, 'utf-8')
    expect(content).toContain("from 'chart.js'")
  })

  it('should support value formatting options', () => {
    const content = readFileSync(componentPath, 'utf-8')
    expect(content).toContain('formatTooltipValue')
    expect(content).toContain("currency: 'CAD'")
  })

  it('should clean up chart on unmount', () => {
    const content = readFileSync(componentPath, 'utf-8')
    expect(content).toContain('onUnmounted')
    expect(content).toContain('chartInstance.destroy()')
  })
})

describe('PipelineChart Component', () => {
  const componentPath = join(process.cwd(), 'components', 'admin', 'PipelineChart.vue')

  it('should exist', () => {
    expect(existsSync(componentPath)).toBe(true)
  })

  it('should have all pipeline stages', () => {
    const content = readFileSync(componentPath, 'utf-8')
    const stages = ['submitted', 'pending', 'quoted', 'in_progress', 'paid', 'completed', 'delivered', 'cancelled', 'refunded']
    for (const stage of stages) {
      expect(content).toContain(stage)
    }
  })

  it('should calculate stage percentages', () => {
    const content = readFileSync(componentPath, 'utf-8')
    expect(content).toContain('maxCount')
    expect(content).toContain('getPercentage')
  })

  it('should use shared order status mapping', () => {
    const content = readFileSync(componentPath, 'utf-8')
    expect(content).toContain('useOrderStatus')
    expect(content).toContain('getStatusColors')
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

describe('BulkActionsToolbar Component', () => {
  const componentPath = join(process.cwd(), 'components', 'admin', 'BulkActionsToolbar.vue')

  it('should exist', () => {
    expect(existsSync(componentPath)).toBe(true)
  })

  it('should load dynamic status options from API', () => {
    const content = readFileSync(componentPath, 'utf-8')
    expect(content).toContain('getBulkStatusOptions')
    expect(content).toContain('loadAvailableStatuses')
  })

  it('should show loading and empty-state messaging for status options', () => {
    const content = readFileSync(componentPath, 'utf-8')
    expect(content).toContain('statusOptionsLoading')
    expect(content).toContain('No common status transition is valid for all selected orders')
  })

  it('should return structured email bulk action results', () => {
    const content = readFileSync(componentPath, 'utf-8')
    expect(content).toContain("emit('actionComplete', 'email', results)")
    expect(content).toContain('results.failed.length')
  })
})

describe('OrderStatusHistory Component', () => {
  const componentPath = join(process.cwd(), 'components', 'admin', 'OrderStatusHistory.vue')

  it('should exist', () => {
    expect(existsSync(componentPath)).toBe(true)
  })

  it('should react to order id changes and allow retry', () => {
    const content = readFileSync(componentPath, 'utf-8')
    expect(content).toContain('watch(')
    expect(content).toContain('props.orderId')
    expect(content).toContain('@click="loadHistory"')
  })
})

describe('OrderEmailHistory Component', () => {
  const componentPath = join(process.cwd(), 'components', 'admin', 'OrderEmailHistory.vue')

  it('should exist', () => {
    expect(existsSync(componentPath)).toBe(true)
  })

  it('should react to order id changes and show retry action', () => {
    const content = readFileSync(componentPath, 'utf-8')
    expect(content).toContain('watch(')
    expect(content).toContain('props.orderId')
    expect(content).toContain('@click="loadEmails"')
  })
})
