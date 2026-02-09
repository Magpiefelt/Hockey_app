/**
 * Utility functions for formatting and display
 */
export const useUtils = () => {
  return {
    /**
     * Format currency value
     */
    formatCurrency: (value: number | null) => {
      if (value === null || value === undefined) return 'N/A'
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(value / 100) // Assuming value is in cents
    },

    /**
     * Format price (alias for formatCurrency for consistency)
     */
    formatPrice: (value: number | null) => {
      if (value === null || value === undefined) return 'N/A'
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(value / 100) // Assuming value is in cents
    },

    /**
     * Format date (simple)
     * FIX: Handle YYYY-MM-DD strings with timezone-safe parsing.
     * new Date("2026-03-15") parses as UTC midnight, which displays as
     * the previous day in timezones behind UTC (MST, PST, etc).
     */
    formatDate: (date: string | Date | null) => {
      if (!date) return 'N/A'
      let d: Date
      if (typeof date === 'string') {
        // FIX: For YYYY-MM-DD format, parse as local date to avoid timezone shift
        const isoMatch = date.match(/^(\d{4})-(\d{2})-(\d{2})$/)
        if (isoMatch) {
          d = new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3]))
        } else {
          d = new Date(date)
        }
      } else {
        d = date
      }
      if (isNaN(d.getTime())) return 'Invalid date'
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    },

    /**
     * Format date with time
     */
    formatDateTime: (date: string | Date | null) => {
      if (!date) return 'N/A'
      const d = typeof date === 'string' ? new Date(date) : date
      return d.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },

    /**
     * Format file size from bytes to human-readable format
     */
    formatFileSize: (bytes: number | null) => {
      if (bytes === null || bytes === undefined) return 'N/A'
      if (bytes === 0) return '0 Bytes'
      
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      
      return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
    },

    /**
     * Get Tailwind color classes for order status
     */
    getStatusColor: (status: string) => {
      const colors: Record<string, string> = {
        'submitted': 'bg-blue-100 text-blue-800 border-blue-200',
        'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
        'quoted': 'bg-purple-100 text-purple-800 border-purple-200',
        'in_progress': 'bg-indigo-100 text-indigo-800 border-indigo-200',
        'paid': 'bg-green-100 text-green-800 border-green-200',
        'completed': 'bg-green-100 text-green-800 border-green-200',
        'delivered': 'bg-green-100 text-green-800 border-green-200',
        'cancelled': 'bg-red-100 text-red-800 border-red-200',
        'refunded': 'bg-gray-100 text-gray-800 border-gray-200'
      }
      return colors[status.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200'
    },

    /**
     * Get human-readable label for order status
     */
    getStatusLabel: (status: string) => {
      const labels: Record<string, string> = {
        'submitted': 'Submitted',
        'pending': 'Pending',
        'quoted': 'Quoted',
        'in_progress': 'In Progress',
        'paid': 'Paid',
        'completed': 'Completed',
        'delivered': 'Delivered',
        'cancelled': 'Cancelled',
        'refunded': 'Refunded'
      }
      return labels[status.toLowerCase()] || status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ')
    }
  }
}
