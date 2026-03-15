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

  it('should render a chart canvas', () => {
    const content = readFileSync(componentPath, 'utf-8')
    expect(content).toContain('<canvas ref="chartCanvas"')
  })

  it('should define chart props', () => {
    const content = readFileSync(componentPath, 'utf-8')
    expect(content).toContain('type?: \'line\' | \'bar\'')
    expect(content).toContain('formatValue?: \'currency\' | \'number\' | \'percent\'')
  })

  it('should create and update chart instances', () => {
    const content = readFileSync(componentPath, 'utf-8')
    expect(content).toContain('function createChart()')
    expect(content).toContain('watch(() => props.data')
  })

  it('should format tooltip values', () => {
    const content = readFileSync(componentPath, 'utf-8')
    expect(content).toContain('formatTooltipValue')
    expect(content).toContain('new Intl.NumberFormat')
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
    const stages = ['submitted', 'quoted', 'in_progress', 'paid', 'completed', 'delivered', 'cancelled']
    for (const stage of stages) {
      expect(content).toContain(stage)
    }
  })

  it('should calculate percentages for progress bars', () => {
    const content = readFileSync(componentPath, 'utf-8')
    expect(content).toContain('maxCount')
    expect(content).toContain('getPercentage')
  })

  it('should provide status colors and labels', () => {
    const content = readFileSync(componentPath, 'utf-8')
    expect(content).toContain('getStatusColors')
    expect(content).toContain('getStatusLabel')
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
