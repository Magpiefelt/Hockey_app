import { defineStore } from 'pinia'

/**
 * Calendar Store
 * Centralized state management for calendar availability data.
 * Provides unavailable dates to all components that need them,
 * with caching to minimize API calls.
 * 
 * FIX: Updated to properly handle API response format which returns
 * objects with { date, source } instead of plain date strings.
 */

interface UnavailableDateInfo {
  date: string  // YYYY-MM-DD format
  source: string  // 'blocked' or 'booked'
}

interface CalendarState {
  unavailableDates: Date[]
  unavailableDateStrings: string[] // YYYY-MM-DD format for easy comparison
  unavailableDateMap: Record<string, string> // date -> source mapping for UI differentiation
  lastFetched: Date | null
  isLoading: boolean
  error: string | null
}

export const useCalendarStore = defineStore('calendar', {
  state: (): CalendarState => ({
    unavailableDates: [],
    unavailableDateStrings: [],
    unavailableDateMap: {},
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
     * 
     * FIX: The API returns objects with { date, source } format.
     * Previously this was incorrectly treating the response as plain strings,
     * which caused Date parsing to fail and calendar to not show unavailable dates.
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
        const response = await $client.calendar.getUnavailableDates.query()

        // FIX: Handle both response formats for backwards compatibility
        // API returns: { date: string, source: string }[]
        // Previously expected: string[]
        const dateInfos: UnavailableDateInfo[] = response.map((item: any) => {
          if (typeof item === 'string') {
            // Legacy format: plain date string
            return { date: item, source: 'blocked' }
          }
          // Current format: object with date and source
          return {
            date: typeof item.date === 'string' ? item.date : String(item.date),
            source: item.source || 'blocked'
          }
        })

        // Extract date strings for comparison
        this.unavailableDateStrings = dateInfos.map(info => {
          // Normalize date format - handle both "YYYY-MM-DD" and Date ISO strings
          const dateStr = info.date
          if (dateStr.includes('T')) {
            // ISO format - extract just the date part
            return dateStr.split('T')[0]
          }
          return dateStr
        })

        // Build date -> source map for UI color-coding
        this.unavailableDateMap = {}
        dateInfos.forEach(info => {
          const dateStr = info.date.includes('T') ? info.date.split('T')[0] : info.date
          this.unavailableDateMap[dateStr] = info.source
        })

        // Parse date strings into Date objects for VueDatePicker
        // Handle timezone issues by parsing as UTC noon
        this.unavailableDates = this.unavailableDateStrings.map((dateStr: string) => {
          const parts = dateStr.split('-').map(Number)
          if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
            // Create date at noon UTC to avoid timezone boundary issues
            return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 12, 0, 0))
          }
          // Fallback: try direct parsing
          const d = new Date(dateStr + 'T12:00:00Z')
          return isNaN(d.getTime()) ? new Date() : d
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
        // Normalize - extract date part if ISO string
        dateStr = date.includes('T') ? date.split('T')[0] : date
      } else if (date instanceof Date && !isNaN(date.getTime())) {
        // Format as YYYY-MM-DD using local date parts
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
     * Get the source/reason for a date being unavailable
     * @param date - The date to check
     * @returns 'blocked', 'booked', or null if available
     */
    getDateSource(date: Date | string): string | null {
      let dateStr: string

      if (typeof date === 'string') {
        dateStr = date.includes('T') ? date.split('T')[0] : date
      } else if (date instanceof Date && !isNaN(date.getTime())) {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        dateStr = `${year}-${month}-${day}`
      } else {
        return null
      }

      return this.unavailableDateMap[dateStr] || null
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
      this.unavailableDateMap = {}
      this.lastFetched = null
      this.error = null
    }
  }
})
