import { defineStore } from 'pinia'

/**
 * Calendar Store
 * Centralized state management for calendar availability data.
 * Provides unavailable dates to all components that need them,
 * with caching to minimize API calls.
 */

interface CalendarState {
  unavailableDates: Date[]
  unavailableDateStrings: string[] // YYYY-MM-DD format for easy comparison
  lastFetched: Date | null
  isLoading: boolean
  error: string | null
}

export const useCalendarStore = defineStore('calendar', {
  state: (): CalendarState => ({
    unavailableDates: [],
    unavailableDateStrings: [],
    lastFetched: null,
    isLoading: false,
    error: null
  }),

  getters: {
    /**
     * Check if the cached data is stale (older than 5 minutes)
     */
    isDataStale: (state): boolean => {
      if (!state.lastFetched) return true
      const fiveMinutes = 5 * 60 * 1000
      return (new Date().getTime() - state.lastFetched.getTime()) > fiveMinutes
    },

    /**
     * Check if data has been loaded at least once
     */
    hasData: (state): boolean => {
      return state.lastFetched !== null
    }
  },

  actions: {
    /**
     * Fetch unavailable dates from the API
     * @param forceRefresh - If true, bypasses the cache and fetches fresh data
     */
    async fetchUnavailableDates(forceRefresh = false) {
      // Skip if data is fresh and not forcing refresh
      if (!forceRefresh && !this.isDataStale && this.unavailableDates.length > 0) {
        return
      }

      // Prevent duplicate requests
      if (this.isLoading) {
        return
      }

      this.isLoading = true
      this.error = null

      try {
        const { $client } = useNuxtApp()
        const dates = await $client.calendar.getUnavailableDates.query()

        // Parse date strings into Date objects
        // Handle timezone issues by parsing as UTC
        this.unavailableDateStrings = dates
        this.unavailableDates = dates.map((dateStr: string) => {
          // Parse YYYY-MM-DD format correctly
          const [year, month, day] = dateStr.split('-').map(Number)
          // Create date at noon UTC to avoid timezone boundary issues
          return new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
        })

        this.lastFetched = new Date()
      } catch (error: any) {
        console.error('Failed to fetch unavailable dates:', error)
        this.error = error.message || 'Failed to load availability'
        // Don't clear existing data on error - keep showing stale data
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Check if a specific date is available
     * @param date - The date to check (Date object or YYYY-MM-DD string)
     * @returns true if the date is available, false if unavailable
     */
    isDateAvailable(date: Date | string): boolean {
      let dateStr: string

      if (typeof date === 'string') {
        dateStr = date
      } else if (date instanceof Date && !isNaN(date.getTime())) {
        // Format as YYYY-MM-DD
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        dateStr = `${year}-${month}-${day}`
      } else {
        return false // Invalid date
      }

      return !this.unavailableDateStrings.includes(dateStr)
    },

    /**
     * Force refresh the calendar data
     * Useful after admin makes changes or after a booking is submitted
     */
    async refresh() {
      await this.fetchUnavailableDates(true)
    },

    /**
     * Clear the store (useful for logout or testing)
     */
    clear() {
      this.unavailableDates = []
      this.unavailableDateStrings = []
      this.lastFetched = null
      this.error = null
    }
  }
})
