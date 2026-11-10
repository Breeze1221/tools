import { describe, expect, it } from 'vitest'

import {
  DEFAULT_UNIT_CONFIG,
  convertUnits,
  formatNumber,
  type UnitConfig,
} from '@/tools/development/css-unit-converter/css-unit-converter.service'

const customConfig: UnitConfig = {
  rootFontSize: 20,
  parentFontSize: 24,
  viewportWidth: 1920,
  viewportHeight: 1080,
}

describe('css-unit-converter service', () => {
  describe('convertUnits', () => {
    it('converts 16px to 1rem with the default root font size', () => {
      expect(convertUnits(16, 'px').rem).toBe(1)
      expect(convertUnits(16, 'px').em).toBe(1)
    })

    it('converts 12pt to 16px', () => {
      expect(convertUnits(12, 'pt').px).toBe(16)
      expect(convertUnits(16, 'px').pt).toBe(12)
    })

    it('converts 192px to 10vw on a 1920px viewport', () => {
      expect(convertUnits(192, 'px').vw).toBe(10)
      expect(convertUnits(10, 'vw').px).toBe(192)
    })

    it('uses the parent font size for em and percent', () => {
      expect(convertUnits(2, 'em', customConfig).px).toBe(48)
      expect(convertUnits(48, 'px', customConfig).em).toBe(2)
      expect(convertUnits(50, '%', customConfig).px).toBe(12)
      expect(convertUnits(48, 'px', customConfig)['%']).toBe(200)
    })

    it('uses the root font size for rem', () => {
      expect(convertUnits(2, 'rem', customConfig).px).toBe(40)
      expect(convertUnits(40, 'px', customConfig).rem).toBe(2)
    })

    it('converts vh, vmin and vmax against the configured viewport', () => {
      expect(convertUnits(100, 'vh').px).toBe(1080)
      expect(convertUnits(100, 'vmin').px).toBe(1080)
      expect(convertUnits(100, 'vmax').px).toBe(1920)
      expect(convertUnits(1080, 'px').vh).toBe(100)
      expect(convertUnits(1920, 'px').vmax).toBe(100)
    })

    it('keeps negative values', () => {
      expect(convertUnits(-16, 'px').rem).toBe(-1)
      expect(convertUnits(-12, 'pt').px).toBe(-16)
      expect(convertUnits(-10, 'vw').px).toBe(-192)
    })

    it('returns every unit at once', () => {
      expect(Object.keys(convertUnits(16, 'px'))).toEqual([
        'px',
        'rem',
        'em',
        'pt',
        '%',
        'vw',
        'vh',
        'vmin',
        'vmax',
      ])
    })

    it('throws for a non-numeric value', () => {
      expect(() => convertUnits(Number.NaN, 'px')).toThrow('Value must be a finite number')
      expect(() => convertUnits(Number.POSITIVE_INFINITY, 'px')).toThrow()
    })

    it('throws for an unknown unit', () => {
      expect(() => convertUnits(16, 'ch')).toThrow('Unknown unit: ch')
      expect(() => convertUnits(16, '')).toThrow('Unknown unit')
    })

    it('throws for non-positive configuration values', () => {
      expect(() => convertUnits(16, 'px', { ...DEFAULT_UNIT_CONFIG, rootFontSize: 0 })).toThrow()
      expect(() =>
        convertUnits(16, 'px', { ...DEFAULT_UNIT_CONFIG, viewportWidth: Number.NaN }),
      ).toThrow()
    })
  })

  describe('formatNumber', () => {
    it('strips trailing zeros', () => {
      expect(formatNumber(1.5)).toBe('1.5')
      expect(formatNumber(1.0)).toBe('1')
      expect(formatNumber(10)).toBe('10')
      expect(formatNumber(0.5)).toBe('0.5')
    })

    it('keeps at most four decimal places', () => {
      expect(formatNumber(1 / 3)).toBe('0.3333')
      expect(formatNumber(2 / 3)).toBe('0.6667')
      expect(formatNumber(1.23456)).toBe('1.2346')
    })

    it('normalizes negative zero', () => {
      expect(formatNumber(-0)).toBe('0')
      expect(formatNumber(-0.00001)).toBe('0')
    })

    it('returns an empty string for non-finite values', () => {
      expect(formatNumber(Number.NaN)).toBe('')
      expect(formatNumber(Number.POSITIVE_INFINITY)).toBe('')
    })
  })
})
