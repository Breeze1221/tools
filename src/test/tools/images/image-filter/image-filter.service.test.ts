import { describe, expect, it } from 'vitest'

import {
  FILTER_DEFAULTS,
  FILTER_KEYS,
  FILTER_PRESETS,
  FILTER_RANGES,
  buildFilter,
  clampFilterConfig,
  clampFilterValue,
} from '@/tools/images/image-filter/image-filter.service'

describe('image-filter service', () => {
  it('builds the neutral filter string from defaults', () => {
    expect(buildFilter(FILTER_DEFAULTS)).toBe(
      'brightness(100%) contrast(100%) saturate(100%) hue-rotate(0deg) grayscale(0%) sepia(0%) blur(0px)',
    )
  })

  it('builds a filter string from custom values', () => {
    expect(
      buildFilter({
        brightness: 120.5,
        contrast: 0,
        saturate: 200,
        hueRotate: -45,
        grayscale: 30,
        sepia: 10,
        blur: 2.5,
      }),
    ).toBe(
      'brightness(120.5%) contrast(0%) saturate(200%) hue-rotate(-45deg) grayscale(30%) sepia(10%) blur(2.5px)',
    )
  })

  it('clamps every value into its declared range', () => {
    expect(clampFilterValue('brightness', 999)).toBe(200)
    expect(clampFilterValue('brightness', -20)).toBe(0)
    expect(clampFilterValue('hueRotate', -999)).toBe(-180)
    expect(clampFilterValue('blur', 999)).toBe(20)
    expect(clampFilterValue('grayscale', 42)).toBe(42)
  })

  it('falls back to defaults for non-finite values', () => {
    expect(clampFilterValue('contrast', Number.NaN)).toBe(FILTER_DEFAULTS.contrast)
    expect(clampFilterValue('sepia', Number.POSITIVE_INFINITY)).toBe(FILTER_DEFAULTS.sepia)
  })

  it('fills missing config keys with defaults', () => {
    expect(clampFilterConfig({})).toEqual(FILTER_DEFAULTS)
    expect(clampFilterConfig({ grayscale: 100 })).toEqual({
      ...FILTER_DEFAULTS,
      grayscale: 100,
    })
  })

  it('clamps out-of-range values inside the built string', () => {
    const filter = buildFilter({ brightness: 999, grayscale: -30, blur: Number.NaN })
    expect(filter).toContain('brightness(200%)')
    expect(filter).toContain('grayscale(0%)')
    expect(filter).toContain('blur(0px)')
  })

  it('keeps presets unique and within range', () => {
    const ids = FILTER_PRESETS.map((preset) => preset.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const preset of FILTER_PRESETS) {
      for (const key of FILTER_KEYS) {
        const value = preset.config[key]
        expect(value).toBeGreaterThanOrEqual(FILTER_RANGES[key].min)
        expect(value).toBeLessThanOrEqual(FILTER_RANGES[key].max)
      }
    }
  })

  it('starts the original preset at neutral defaults', () => {
    const original = FILTER_PRESETS.find((preset) => preset.id === 'original')
    expect(original?.config).toEqual(FILTER_DEFAULTS)
  })
})
