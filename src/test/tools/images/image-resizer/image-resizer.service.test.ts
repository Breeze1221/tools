import { describe, expect, it } from 'vitest'

import {
  MAX_DIMENSION,
  RESIZE_PERCENT_PRESETS,
  computeTargetSize,
  parseDimension,
} from '@/tools/images/image-resizer/image-resizer.service'

const source = { width: 4000, height: 3000 }

describe('computeTargetSize', () => {
  it('returns the requested size in exact mode', () => {
    expect(computeTargetSize(source, { mode: 'exact', width: 800, height: 600 })).toEqual({
      width: 800,
      height: 600,
    })
  })

  it('rounds exact dimensions and keeps them at least 1px', () => {
    expect(computeTargetSize(source, { mode: 'exact', width: 800.6, height: 0.4 })).toEqual({
      width: 801,
      height: 1,
    })
  })

  it('fits inside the box while preserving the aspect ratio', () => {
    expect(computeTargetSize(source, { mode: 'fit', width: 1000, height: 1000 })).toEqual({
      width: 1000,
      height: 750,
    })
    expect(computeTargetSize(source, { mode: 'fit', width: 500, height: 1000 })).toEqual({
      width: 500,
      height: 375,
    })
  })

  it('covers the box while preserving the aspect ratio', () => {
    expect(computeTargetSize(source, { mode: 'cover', width: 1000, height: 1000 })).toEqual({
      width: 1333,
      height: 1000,
    })
  })

  it('scales by percent', () => {
    expect(computeTargetSize(source, { mode: 'percent', percent: 25 })).toEqual({
      width: 1000,
      height: 750,
    })
    expect(computeTargetSize({ width: 3, height: 3 }, { mode: 'percent', percent: 10 })).toEqual({
      width: 1,
      height: 1,
    })
  })

  it('never upscales when allowUpscale is false', () => {
    expect(
      computeTargetSize(source, {
        mode: 'fit',
        width: 8000,
        height: 8000,
        allowUpscale: false,
      }),
    ).toEqual({ width: 4000, height: 3000 })
    expect(
      computeTargetSize(source, {
        mode: 'cover',
        width: 8000,
        height: 8000,
        allowUpscale: false,
      }),
    ).toEqual({ width: 4000, height: 3000 })
    expect(
      computeTargetSize(source, { mode: 'percent', percent: 200, allowUpscale: false }),
    ).toEqual({ width: 4000, height: 3000 })
  })

  it('upscales proportional modes by default', () => {
    expect(computeTargetSize(source, { mode: 'fit', width: 8000, height: 8000 })).toEqual({
      width: 8000,
      height: 6000,
    })
  })

  it('ignores allowUpscale for exact mode', () => {
    expect(
      computeTargetSize(
        { width: 100, height: 100 },
        { mode: 'exact', width: 500, height: 500, allowUpscale: false },
      ),
    ).toEqual({ width: 500, height: 500 })
  })

  it('throws for a zero, negative or non-finite percent', () => {
    expect(() => computeTargetSize(source, { mode: 'percent', percent: 0 })).toThrow()
    expect(() => computeTargetSize(source, { mode: 'percent', percent: -10 })).toThrow()
    expect(() => computeTargetSize(source, { mode: 'percent', percent: Number.NaN })).toThrow()
    expect(() => computeTargetSize(source, { mode: 'percent' })).toThrow()
  })

  it('throws for invalid exact dimensions', () => {
    expect(() => computeTargetSize(source, { mode: 'exact', width: 0, height: 100 })).toThrow()
    expect(() => computeTargetSize(source, { mode: 'exact', width: -5, height: 100 })).toThrow()
    expect(() => computeTargetSize(source, { mode: 'exact', height: 100 })).toThrow()
  })

  it('throws when the target exceeds MAX_DIMENSION', () => {
    expect(() =>
      computeTargetSize(source, { mode: 'exact', width: MAX_DIMENSION + 1, height: 100 }),
    ).toThrow()
    expect(() => computeTargetSize(source, { mode: 'percent', percent: 400 })).toThrow()
  })

  it('throws for an empty or invalid source size', () => {
    expect(() =>
      computeTargetSize({ width: 0, height: 0 }, { mode: 'percent', percent: 50 }),
    ).toThrow()
    expect(() =>
      computeTargetSize({ width: Number.NaN, height: 100 }, { mode: 'percent', percent: 50 }),
    ).toThrow()
    expect(() =>
      computeTargetSize({ width: -1, height: 100 }, { mode: 'percent', percent: 50 }),
    ).toThrow()
  })

  it('exposes the percent presets', () => {
    expect(RESIZE_PERCENT_PRESETS).toEqual([25, 50, 75, 100])
  })
})

describe('parseDimension', () => {
  it('accepts a positive integer string', () => {
    expect(parseDimension('1920')).toBe(1920)
    expect(parseDimension(' 42 ')).toBe(42)
    expect(parseDimension(String(MAX_DIMENSION))).toBe(MAX_DIMENSION)
  })

  it('rejects empty, non-integer and out-of-range values', () => {
    expect(() => parseDimension('')).toThrow()
    expect(() => parseDimension('  ')).toThrow()
    expect(() => parseDimension('abc')).toThrow()
    expect(() => parseDimension('1.5')).toThrow()
    expect(() => parseDimension('0')).toThrow()
    expect(() => parseDimension('-1')).toThrow()
    expect(() => parseDimension(String(MAX_DIMENSION + 1))).toThrow()
  })
})
