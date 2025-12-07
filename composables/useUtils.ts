export const useUtils = () => {
  return {
    formatCurrency: (value: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(value)
    },
    formatDate: (date: Date) => {
      return date.toLocaleDateString()
    }
  }
}
