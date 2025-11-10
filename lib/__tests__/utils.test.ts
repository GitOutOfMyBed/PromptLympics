import { formatDate, formatCurrency } from '../utils'

describe('Utility Functions', () => {
  describe('formatDate', () => {
    it('formats date correctly', () => {
      const date = new Date('2024-01-15T12:00:00Z')
      const formatted = formatDate(date)
      expect(formatted).toMatch(/Jan/)
      expect(formatted).toMatch(/2024/)
      expect(formatted.length).toBeGreaterThan(0)
    })

    it('handles Date objects', () => {
      const date = new Date('2024-12-25T12:00:00Z')
      const result = formatDate(date)
      expect(result).toBeTruthy()
      expect(result).toMatch(/Dec/)
    })
  })

  describe('formatCurrency', () => {
    it('formats USD currency correctly', () => {
      expect(formatCurrency(1000)).toBe('$1,000.00')
      expect(formatCurrency(500.5)).toBe('$500.50')
      expect(formatCurrency(0)).toBe('$0.00')
    })

    it('handles large numbers', () => {
      expect(formatCurrency(1000000)).toBe('$1,000,000.00')
    })

    it('handles decimal numbers', () => {
      expect(formatCurrency(99.99)).toBe('$99.99')
    })
  })
})
