import { describe, expect, it } from 'vitest'

import {
  FLIP_MODES,
  ROTATION_STEPS,
  assertValidSize,
  flipFromSwitches,
  normalizeRotation,
  rotateDimensions,
} from '@/tools/images/image-rotate-flip/image-rotate-flip.service'

describe('image-rotate-flip service', () => {
  it('exposes the four supported rotation steps', () => {
    expect(ROTATION_STEPS).toEqual([0, 90, 180, 270])
    expect(FLIP_MODES).toEqual(['none', 'horizontal', 'vertical', 'both'])
  })

  it('normalizes rotations into the 0–270 range', () => {
    expect(normalizeRotation(0)).toBe(0)
    expect(normalizeRotation(90)).toBe(90)
    expect(normalizeRotation(270)).toBe(270)
    expect(normalizeRotation(360)).toBe(0)
    expect(normalizeRotation(450)).toBe(90)
    expect(normalizeRotation(-90)).toBe(270)
    expect(normalizeRotation(-450)).toBe(270)
  })

  it('rejects rotations that are not multiples of 90', () => {
    expect(() => normalizeRotation(45)).toThrow(/multiple of 90/)
    expect(() => normalizeRotation(-30)).toThrow(/multiple of 90/)
  })

  it('rejects non-finite rotations', () => {
    expect(() => normalizeRotation(Number.NaN)).toThrow(/finite number/)
    expect(() => normalizeRotation(Number.POSITIVE_INFINITY)).toThrow(/finite number/)
  })

  it('swaps width and height only for quarter turns', () => {
    const source = { width: 640, height: 480 }
    expect(rotateDimensions(source, 0)).toEqual({ width: 640, height: 480 })
    expect(rotateDimensions(source, 90)).toEqual({ width: 480, height: 640 })
    expect(rotateDimensions(source, 180)).toEqual({ width: 640, height: 480 })
    expect(rotateDimensions(source, 270)).toEqual({ width: 480, height: 640 })
  })

  it('rejects invalid source sizes', () => {
    expect(() => rotateDimensions({ width: 0, height: 100 }, 0)).toThrow(/positive/)
    expect(() => rotateDimensions({ width: 100, height: -1 }, 0)).toThrow(/positive/)
    expect(() => assertValidSize({ width: Number.NaN, height: 10 })).toThrow(/positive/)
  })

  it('rounds fractional source sizes', () => {
    expect(assertValidSize({ width: 100.4, height: 50.6 })).toEqual({ width: 100, height: 51 })
  })

  it('combines flip switches into a single mode', () => {
    expect(flipFromSwitches(false, false)).toBe('none')
    expect(flipFromSwitches(true, false)).toBe('horizontal')
    expect(flipFromSwitches(false, true)).toBe('vertical')
    expect(flipFromSwitches(true, true)).toBe('both')
  })
})
