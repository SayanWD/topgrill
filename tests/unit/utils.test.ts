import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils/dates'
import { calculateAttribution } from '@/lib/marketing/attribution'

describe('Utility Functions', () => {
  describe('formatCurrency', () => {
    it('should format USD correctly', () => {
      expect(formatCurrency(1234.56, 'USD')).toBe('$1,234.56')
    })

    it('should handle zero', () => {
      expect(formatCurrency(0, 'USD')).toBe('$0.00')
    })

    it('should handle large numbers', () => {
      expect(formatCurrency(1000000, 'USD')).toBe('$1,000,000.00')
    })
  })

  describe('formatNumber', () => {
    it('should format with thousand separators', () => {
      expect(formatNumber(1234567)).toBe('1,234,567')
    })
  })

  describe('formatPercent', () => {
    it('should format percentage with 1 decimal', () => {
      expect(formatPercent(12.345)).toBe('12.3%')
    })

    it('should format percentage with custom decimals', () => {
      expect(formatPercent(12.345, 2)).toBe('12.35%')
    })
  })
})

describe('Attribution Models', () => {
  const touchPoints = [
    {
      channel: 'facebook',
      source: 'facebook',
      medium: 'cpc',
      timestamp: new Date('2024-01-01'),
      eventType: 'click',
    },
    {
      channel: 'google',
      source: 'google',
      medium: 'organic',
      timestamp: new Date('2024-01-05'),
      eventType: 'click',
    },
    {
      channel: 'email',
      source: 'newsletter',
      medium: 'email',
      timestamp: new Date('2024-01-10'),
      eventType: 'click',
    },
  ]

  describe('Last-touch attribution', () => {
    it('should give 100% credit to last touch', () => {
      const result = calculateAttribution(touchPoints, 'last-touch')
      expect(result.email).toBe(1.0)
      expect(result.facebook).toBeUndefined()
      expect(result.google).toBeUndefined()
    })
  })

  describe('First-touch attribution', () => {
    it('should give 100% credit to first touch', () => {
      const result = calculateAttribution(touchPoints, 'first-touch')
      expect(result.facebook).toBe(1.0)
      expect(result.email).toBeUndefined()
      expect(result.google).toBeUndefined()
    })
  })

  describe('Linear attribution', () => {
    it('should distribute credit equally', () => {
      const result = calculateAttribution(touchPoints, 'linear')
      expect(result.facebook).toBeCloseTo(0.333, 2)
      expect(result.google).toBeCloseTo(0.333, 2)
      expect(result.email).toBeCloseTo(0.333, 2)
    })
  })

  describe('Position-based attribution', () => {
    it('should give 40% to first and last, 20% to middle', () => {
      const result = calculateAttribution(touchPoints, 'position-based')
      expect(result.facebook).toBe(0.4)
      expect(result.google).toBe(0.2)
      expect(result.email).toBe(0.4)
    })
  })
})

