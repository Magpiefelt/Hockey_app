import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    // Test environment
    environment: 'node',
    
    // Test file patterns
    include: ['tests/**/*.{test,spec}.ts'],
    exclude: ['node_modules', '.nuxt', '.output'],
    
    // Global test setup
    globals: true,
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: ['server/**/*.ts', 'composables/**/*.ts'],
      exclude: [
        'node_modules',
        '.nuxt',
        '.output',
        'tests',
        '**/*.d.ts',
        '**/*.spec.ts',
        '**/*.test.ts'
      ],
      // Minimum coverage thresholds
      thresholds: {
        lines: 50,
        functions: 50,
        branches: 50,
        statements: 50
      }
    },
    
    // Test timeout
    testTimeout: 10000,
    
    // Hooks timeout
    hookTimeout: 10000,
    
    // Retry failed tests
    retry: 0,
    
    // Reporter configuration
    reporters: ['verbose'],
    
    // Mock configuration
    mockReset: true,
    clearMocks: true,
    restoreMocks: true,
    
    // Alias resolution
    alias: {
      '~': resolve(__dirname, './'),
      '@': resolve(__dirname, './')
    },
    
    // Pool configuration for parallel tests
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false
      }
    },
    
    // Sequence configuration
    sequence: {
      shuffle: false
    }
  },
  
  resolve: {
    alias: {
      '~': resolve(__dirname, './'),
      '@': resolve(__dirname, './')
    }
  }
})
