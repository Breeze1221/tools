import { describe, expect, it } from 'vitest'

import { contrastRatio, wcagLevel } from '@/utils/color'
import { adjustLightness, hexToRgba, rgbaToHex, suggestAltColors } from '@/tools/development/wcag-contrast-checker/service'

describe('wcag-contrast-checker service', () => {
  describe('hexToRgba', () => {
    it('parses 6-digit hex', () => {
      expect(hexToRgba('#FF0000')).toEqual({ r: 1, g: 0, b: 0, a: 1 })
      expect(hexToRgba('00ff00')).toEqual({ r: 0, g: 1, b: 0, a: 1 })
    })

    it('parses 3-digit hex (expanded)', () => {
      expect(hexToRgba('#F00')).toEqual({ r: 1, g: 0, b: 0, a: 1 })
    })

    it('parses 8-digit hex with alpha', () => {
      const result = hexToRgba('#FF000080')
      expect(result).not.toBeNull()
      expect(result?.a).toBeCloseTo(0.5, 1)
    })

    it('returns null for invalid input', () => {
      expect(hexToRgba('')).toBeNull()
      expect(hexToRgba('invalid')).toBeNull()
      expect(hexToRgba('#GGGGGG')).toBeNull()
    })
  })

  describe('rgbaToHex', () => {
    it('converts Rgba back to hex', () => {
      expect(rgbaToHex({ r: 1, g: 0, b: 0, a: 1 })).toBe('#FF0000')
      expect(rgbaToHex({ r: 0, g: 1, b: 0, a: 1 })).toBe('#00FF00')
    })

    it('clamps values outside 0-1', () => {
      expect(rgbaToHex({ r: 2, g: -1, b: 0.5, a: 1 })).toBe('#FF0080')
    })
  })

  describe('adjustLightness', () => {
    it('lightens black toward white', () => {
      const result = adjustLightness('#000000', 0.5)
      expect(result).not.toBeNull()
      const rgba = hexToRgba(result!)
      expect(rgba?.r).toBeGreaterThan(0)
    })

    it('darkens white toward black', () => {
      const result = adjustLightness('#FFFFFF', -0.5)
      expect(result).not.toBeNull()
      const rgba = hexToRgba(result!)
      expect(rgba?.r).toBeLessThan(1)
    })

    it('returns null for invalid input', () => {
      expect(adjustLightness('', 0.1)).toBeNull()
      expect(adjustLightness('not-hex', 0.1)).toBeNull()
    })
  })

  describe('suggestAltColors', () => {
    it('returns two colors for valid input', () => {
      const [lighter, darker] = suggestAltColors('#333333')
      expect(lighter).toMatch(/^#[0-9A-F]{6}$/)
      expect(darker).toMatch(/^#[0-9A-F]{6}$/)
      expect(lighter).not.toBe('#333333')
      expect(darker).not.toBe('#333333')
    })
  })

  describe('wcagLevel + contrastRatio (from utils/color)', () => {
    it('AAA for pure white on pure black', () => {
      const ratio = contrastRatio({ r: 1, g: 1, b: 1, a: 1 }, { r: 0, g: 0, b: 0, a: 1 })
      expect(ratio).toBeGreaterThanOrEqual(20)
      expect(wcagLevel(ratio)).toBe('aaa')
    })

    it('fail for very similar colors', () => {
      const ratio = contrastRatio(
        { r: 0.5, g: 0.5, b: 0.5, a: 1 },
        { r: 0.52, g: 0.52, b: 0.52, a: 1 },
      )
      expect(wcagLevel(ratio)).toBe('fail')
    })

    it('returns correct levels at thresholds', () => {
      expect(wcagLevel(7)).toBe('aaa')
      expect(wcagLevel(4.5)).toBe('aa')
      expect(wcagLevel(3)).toBe('aaLarge')
      expect(wcagLevel(2.9)).toBe('fail')
    })
  })
})
