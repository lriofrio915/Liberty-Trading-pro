import { describe, it, expect } from 'vitest'

// Extracted from AnalisisClient.tsx
function formatPriceNum(price: number): string {
  if (price === 0) return '—'
  if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  if (price >= 1) return price.toFixed(4)
  return price.toFixed(6)
}

describe('formatPriceNum', () => {
  it('returns em dash for zero price', () => {
    expect(formatPriceNum(0)).toBe('—')
  })

  it('formats large prices (>=1000) with commas and 2 decimals', () => {
    expect(formatPriceNum(65000)).toBe('65,000.00')
    expect(formatPriceNum(1234.5)).toBe('1,234.50')
  })

  it('formats mid prices (>=1, <1000) with 4 decimals', () => {
    expect(formatPriceNum(1.2345)).toBe('1.2345')
    expect(formatPriceNum(500)).toBe('500.0000')
  })

  it('formats small prices (<1) with 6 decimals', () => {
    expect(formatPriceNum(0.000123)).toBe('0.000123')
    expect(formatPriceNum(0.5)).toBe('0.500000')
  })
})

