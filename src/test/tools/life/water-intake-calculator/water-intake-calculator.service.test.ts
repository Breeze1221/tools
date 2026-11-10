import { describe, expect, it } from 'vitest'

import {
  calculateWaterIntake,
  CLIMATE_FACTORS,
  lbToKg,
  type WaterClimate,
} from '@/tools/life/water-intake-calculator/water-intake-calculator.service'

describe('calculateWaterIntake', () => {
  it('uses the 35 ml/kg baseline with a temperate climate', () => {
    const result = calculateWaterIntake({ weightKg: 65 })
    expect(result.baseMilliliters).toBe(2275)
    expect(result.activityMilliliters).toBe(0)
    expect(result.climateFactor).toBe(1)
    expect(result.milliliters).toBe(2280)
    expect(result.liters).toBe(2.28)
    expect(result.cups).toBe(9.1)
  })

  it('adds 350 ml for every completed 30 minutes of activity', () => {
    const result = calculateWaterIntake({ weightKg: 65, activityMinutes: 60 })
    expect(result.activityMilliliters).toBe(700)
    expect(result.milliliters).toBe(2980)
    expect(result.cups).toBe(11.9)
  })

  it('counts only completed 30-minute blocks', () => {
    expect(calculateWaterIntake({ weightKg: 60, activityMinutes: 29 }).activityMilliliters).toBe(0)
    expect(calculateWaterIntake({ weightKg: 60, activityMinutes: 45 }).activityMilliliters).toBe(
      350,
    )
  })

  it('applies the hot and cold climate factors', () => {
    const hot = calculateWaterIntake({ weightKg: 60, climate: 'hot' })
    expect(hot.climateFactor).toBe(1.1)
    expect(hot.milliliters).toBe(2310)

    const cold = calculateWaterIntake({ weightKg: 60, climate: 'cold' })
    expect(cold.climateFactor).toBe(0.95)
    expect(cold.milliliters).toBe(2000)
    expect(CLIMATE_FACTORS.temperate).toBe(1)
  })

  it('combines activity and climate', () => {
    const result = calculateWaterIntake({ weightKg: 70, activityMinutes: 90, climate: 'hot' })
    expect(result.activityMilliliters).toBe(1050)
    expect(result.milliliters).toBe(3850)
  })

  it('accepts the weight boundaries', () => {
    expect(calculateWaterIntake({ weightKg: 20 }).baseMilliliters).toBe(700)
    expect(calculateWaterIntake({ weightKg: 400 }).baseMilliliters).toBe(14000)
  })

  it('accepts a full day of activity and the zero boundary', () => {
    expect(calculateWaterIntake({ weightKg: 70, activityMinutes: 0 }).activityMilliliters).toBe(0)
    expect(calculateWaterIntake({ weightKg: 70, activityMinutes: 1440 }).activityMilliliters).toBe(
      16800,
    )
  })

  it('rejects an out-of-range or non-numeric weight', () => {
    expect(() => calculateWaterIntake({ weightKg: 19.9 })).toThrow()
    expect(() => calculateWaterIntake({ weightKg: 400.1 })).toThrow()
    expect(() => calculateWaterIntake({ weightKg: 0 })).toThrow()
    expect(() => calculateWaterIntake({ weightKg: -10 })).toThrow()
    expect(() => calculateWaterIntake({ weightKg: Number.NaN })).toThrow()
  })

  it('rejects invalid activity minutes', () => {
    expect(() => calculateWaterIntake({ weightKg: 70, activityMinutes: -1 })).toThrow()
    expect(() => calculateWaterIntake({ weightKg: 70, activityMinutes: 1441 })).toThrow()
    expect(() => calculateWaterIntake({ weightKg: 70, activityMinutes: Number.NaN })).toThrow()
  })

  it('rejects an unknown climate', () => {
    expect(() =>
      calculateWaterIntake({ weightKg: 70, climate: 'arid' as unknown as WaterClimate }),
    ).toThrow()
  })
})

describe('lbToKg', () => {
  it('converts pounds to kilograms with two decimals', () => {
    expect(lbToKg(1)).toBe(0.45)
    expect(lbToKg(154)).toBe(69.85)
    expect(lbToKg(220)).toBe(99.79)
  })

  it('rejects non-positive or non-finite input', () => {
    expect(() => lbToKg(0)).toThrow()
    expect(() => lbToKg(-5)).toThrow()
    expect(() => lbToKg(Number.NaN)).toThrow()
  })
})
