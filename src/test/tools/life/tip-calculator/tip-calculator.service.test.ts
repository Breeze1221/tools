import { describe, expect, it } from 'vitest'

import { calculateTip, TIP_PRESETS } from '@/tools/life/tip-calculator/tip-calculator.service'

describe('calculateTip', () => {
  it('calculates the tip, total and per-person share', () => {
    const result = calculateTip({ bill: 100, tipPercent: 15, people: 2 })
    expect(result).toEqual({ tip: 15, total: 115, perPerson: 57.5 })
  })

  it('supports a zero tip', () => {
    const result = calculateTip({ bill: 80, tipPercent: 0 })
    expect(result.tip).toBe(0)
    expect(result.total).toBe(80)
    expect(result.perPerson).toBe(80)
  })

  it('keeps two decimals for awkward amounts', () => {
    const result = calculateTip({ bill: 50.25, tipPercent: 12.5, people: 3 })
    expect(result.tip).toBe(6.28)
    expect(result.total).toBe(56.53)
    expect(result.perPerson).toBe(18.84)
  })

  it('splits between the maximum number of people', () => {
    const result = calculateTip({ bill: 20, tipPercent: 100, people: 100 })
    expect(result.tip).toBe(20)
    expect(result.total).toBe(40)
    expect(result.perPerson).toBe(0.4)
  })

  it('rounds the total up to a whole amount when asked', () => {
    const result = calculateTip({ bill: 43.5, tipPercent: 18, people: 2, roundUp: true })
    expect(result.tip).toBe(7.83)
    expect(result.total).toBe(51.33)
    expect(result.roundedTotal).toBe(52)
    expect(result.roundedPerPerson).toBe(26)
  })

  it('does not inflate an already whole total', () => {
    const result = calculateTip({ bill: 100, tipPercent: 15, people: 2, roundUp: true })
    expect(result.roundedTotal).toBe(115)
    expect(result.roundedPerPerson).toBe(57.5)
  })

  it('omits rounded fields when roundUp is off', () => {
    const result = calculateTip({ bill: 30, tipPercent: 20 })
    expect(result.roundedTotal).toBeUndefined()
    expect(result.roundedPerPerson).toBeUndefined()
  })

  it('accepts the percentage boundaries', () => {
    expect(calculateTip({ bill: 10, tipPercent: 0 }).tip).toBe(0)
    expect(calculateTip({ bill: 10, tipPercent: 100 }).tip).toBe(10)
  })

  it('rejects a non-positive or non-finite bill', () => {
    expect(() => calculateTip({ bill: 0, tipPercent: 10 })).toThrow()
    expect(() => calculateTip({ bill: -1, tipPercent: 10 })).toThrow()
    expect(() => calculateTip({ bill: Number.NaN, tipPercent: 10 })).toThrow()
    expect(() => calculateTip({ bill: Number.POSITIVE_INFINITY, tipPercent: 10 })).toThrow()
  })

  it('rejects a tip percentage outside 0–100', () => {
    expect(() => calculateTip({ bill: 10, tipPercent: -1 })).toThrow()
    expect(() => calculateTip({ bill: 10, tipPercent: 101 })).toThrow()
    expect(() => calculateTip({ bill: 10, tipPercent: Number.NaN })).toThrow()
  })

  it('rejects an invalid people count', () => {
    expect(() => calculateTip({ bill: 10, tipPercent: 10, people: 0 })).toThrow()
    expect(() => calculateTip({ bill: 10, tipPercent: 10, people: 101 })).toThrow()
    expect(() => calculateTip({ bill: 10, tipPercent: 10, people: 1.5 })).toThrow()
    expect(() => calculateTip({ bill: 10, tipPercent: 10, people: Number.NaN })).toThrow()
  })

  it('exposes the common presets', () => {
    expect(TIP_PRESETS).toEqual([10, 15, 18, 20])
  })
})
