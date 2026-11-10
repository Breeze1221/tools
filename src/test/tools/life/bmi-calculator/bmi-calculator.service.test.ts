import { describe, expect, it } from 'vitest'

import {
  bmiCategory,
  calculateBmi,
  cmToFeetInches,
  kgToLb,
  lbToKg,
} from '@/tools/life/bmi-calculator/bmi-calculator.service'

describe('bmiCategory', () => {
  it('classifies the four WHO categories', () => {
    expect(bmiCategory(17)).toBe('underweight')
    expect(bmiCategory(22)).toBe('normal')
    expect(bmiCategory(27)).toBe('overweight')
    expect(bmiCategory(35)).toBe('obese')
  })

  it('handles every boundary value', () => {
    expect(bmiCategory(18.4)).toBe('underweight')
    expect(bmiCategory(18.5)).toBe('normal')
    expect(bmiCategory(24.9)).toBe('normal')
    expect(bmiCategory(25)).toBe('overweight')
    expect(bmiCategory(29.9)).toBe('overweight')
    expect(bmiCategory(30)).toBe('obese')
  })

  it('rejects non-positive or non-finite values', () => {
    expect(() => bmiCategory(0)).toThrow()
    expect(() => bmiCategory(-1)).toThrow()
    expect(() => bmiCategory(Number.NaN)).toThrow()
    expect(() => bmiCategory(Number.POSITIVE_INFINITY)).toThrow()
  })
})

describe('calculateBmi', () => {
  it('calculates a metric BMI with the healthy weight range', () => {
    const result = calculateBmi({ unitSystem: 'metric', heightCm: 175, weightKg: 70 })
    expect(result.bmi).toBe(22.9)
    expect(result.category).toBe('normal')
    expect(result.healthyWeightKg).toEqual({ min: 56.7, max: 76.3 })
    expect(result.healthyWeightLb).toEqual({ min: 125, max: 168.2 })
  })

  it('converts the healthy range from an exact height', () => {
    const result = calculateBmi({ unitSystem: 'metric', heightCm: 180, weightKg: 75 })
    expect(result.bmi).toBe(23.1)
    expect(result.healthyWeightKg).toEqual({ min: 59.9, max: 80.7 })
    expect(result.healthyWeightLb).toEqual({ min: 132.1, max: 177.9 })
  })

  it('calculates an imperial BMI from feet, inches and pounds', () => {
    const result = calculateBmi({
      unitSystem: 'imperial',
      heightFeet: 5,
      heightInches: 10,
      weightLb: 160,
    })
    expect(result.bmi).toBe(23)
    expect(result.category).toBe('normal')
  })

  it('treats a missing inches value as zero', () => {
    const result = calculateBmi({ unitSystem: 'imperial', heightFeet: 5, weightLb: 100 })
    expect(result.bmi).toBe(19.5)
    expect(result.category).toBe('normal')
  })

  it('rejects out-of-range metric height and weight', () => {
    expect(() =>
      calculateBmi({ unitSystem: 'metric', heightCm: 49.9, weightKg: 60 }),
    ).toThrow()
    expect(() =>
      calculateBmi({ unitSystem: 'metric', heightCm: 260.1, weightKg: 60 }),
    ).toThrow()
    expect(() =>
      calculateBmi({ unitSystem: 'metric', heightCm: 170, weightKg: 1.9 }),
    ).toThrow()
    expect(() =>
      calculateBmi({ unitSystem: 'metric', heightCm: 170, weightKg: 500.1 }),
    ).toThrow()
  })

  it('rejects non-positive or missing inputs', () => {
    expect(() => calculateBmi({ unitSystem: 'metric', heightCm: 0, weightKg: 60 })).toThrow()
    expect(() => calculateBmi({ unitSystem: 'metric', heightCm: 170 })).toThrow()
    expect(() => calculateBmi({ unitSystem: 'metric', heightCm: 170, weightKg: -5 })).toThrow()
    expect(() => calculateBmi({ unitSystem: 'metric', heightCm: 170, weightKg: Number.NaN })).toThrow()
  })

  it('rejects out-of-range imperial inputs', () => {
    expect(() =>
      calculateBmi({ unitSystem: 'imperial', heightFeet: 0, weightLb: 150 }),
    ).toThrow()
    expect(() =>
      calculateBmi({ unitSystem: 'imperial', heightFeet: 5, heightInches: 12, weightLb: 150 }),
    ).toThrow()
    expect(() =>
      calculateBmi({ unitSystem: 'imperial', heightFeet: 9, weightLb: 150 }),
    ).toThrow()
    expect(() =>
      calculateBmi({ unitSystem: 'imperial', heightFeet: 5, weightLb: 0 }),
    ).toThrow()
  })
})

describe('kgToLb / lbToKg', () => {
  it('converts kilograms to pounds with one decimal', () => {
    expect(kgToLb(1)).toBe(2.2)
    expect(kgToLb(70)).toBe(154.3)
  })

  it('converts pounds to kilograms with one decimal', () => {
    expect(lbToKg(1)).toBe(0.5)
    expect(lbToKg(154.3)).toBe(70)
  })
})

describe('cmToFeetInches', () => {
  it('converts exact feet without a leftover inch', () => {
    expect(cmToFeetInches(30.48)).toEqual({ feet: 1, inches: 0 })
    expect(cmToFeetInches(182.88)).toEqual({ feet: 6, inches: 0 })
  })

  it('converts the lower and upper height bounds', () => {
    expect(cmToFeetInches(50)).toEqual({ feet: 1, inches: 7.7 })
    expect(cmToFeetInches(260)).toEqual({ feet: 8, inches: 6.4 })
  })

  it('keeps zero height and rejects negative input', () => {
    expect(cmToFeetInches(0)).toEqual({ feet: 0, inches: 0 })
    expect(() => cmToFeetInches(-1)).toThrow()
    expect(() => cmToFeetInches(Number.NaN)).toThrow()
  })
})
