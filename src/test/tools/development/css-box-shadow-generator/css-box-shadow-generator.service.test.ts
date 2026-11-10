import { describe, expect, it } from 'vitest'

import {
  SHADOW_LIMITS,
  SHADOW_PRESETS,
  buildBoxShadow,
  buildBoxShadowCss,
  clampLayer,
  createLayer,
  hexToRgba,
  type ShadowLayer,
} from '@/tools/development/css-box-shadow-generator/css-box-shadow-generator.service'

const baseLayer: ShadowLayer = {
  id: 'base',
  x: 0,
  y: 4,
  blur: 12,
  spread: 0,
  color: '#000000',
  opacity: 0.25,
  inset: false,
}

describe('css-box-shadow-generator service', () => {
  describe('hexToRgba', () => {
    it('converts a six-digit hex color', () => {
      expect(hexToRgba('#ff0000', 0.5)).toBe('rgba(255, 0, 0, 0.5)')
    })

    it('expands shorthand hex colors', () => {
      expect(hexToRgba('#fff', 1)).toBe('rgba(255, 255, 255, 1)')
    })

    it('clamps and rounds opacity', () => {
      expect(hexToRgba('#000000', 2)).toBe('rgba(0, 0, 0, 1)')
      expect(hexToRgba('#000000', -1)).toBe('rgba(0, 0, 0, 0)')
      expect(hexToRgba('#000000', 0.257)).toBe('rgba(0, 0, 0, 0.26)')
    })

    it('throws on an invalid hex color', () => {
      expect(() => hexToRgba('red', 1)).toThrow(/Invalid hex color/)
    })
  })

  describe('buildBoxShadow', () => {
    it('builds a single layer', () => {
      expect(buildBoxShadow([baseLayer])).toBe('0px 4px 12px 0px rgba(0, 0, 0, 0.25)')
    })

    it('preserves layer order when joining multiple layers', () => {
      const second: ShadowLayer = {
        ...baseLayer,
        id: 'second',
        x: 1,
        y: 2,
        blur: 3,
        spread: 4,
        inset: true,
      }
      const value = buildBoxShadow([baseLayer, second])
      expect(value.indexOf('0px 4px 12px')).toBeLessThan(value.indexOf('inset 1px 2px 3px 4px'))
      expect(value.match(/rgba\(/g)).toHaveLength(2)
    })

    it('prefixes inset shadows', () => {
      expect(buildBoxShadow([{ ...baseLayer, inset: true }])).toMatch(/^inset 0px 4px/)
    })

    it('throws when no layers are provided', () => {
      expect(() => buildBoxShadow([])).toThrow(/At least one shadow layer/)
    })
  })

  describe('buildBoxShadowCss', () => {
    it('wraps the value in a box-shadow declaration', () => {
      expect(buildBoxShadowCss([baseLayer], 'box-shadow')).toBe(
        'box-shadow: 0px 4px 12px 0px rgba(0, 0, 0, 0.25);',
      )
    })

    it('uses drop-shadow filters and ignores inset and spread', () => {
      const css = buildBoxShadowCss([{ ...baseLayer, spread: 8, inset: true }], 'filter')
      expect(css).toBe('filter: drop-shadow(0px 4px 12px rgba(0, 0, 0, 0.25));')
      expect(css).not.toContain('inset')
      expect(css).not.toContain('8px')
    })

    it('throws when no layers are provided', () => {
      expect(() => buildBoxShadowCss([], 'filter')).toThrow(/At least one shadow layer/)
    })
  })

  describe('clampLayer', () => {
    it('clamps offsets, blur, spread and opacity to their ranges', () => {
      const layer = clampLayer({
        ...baseLayer,
        x: 500,
        y: -500,
        blur: -4,
        spread: 999,
        opacity: 2,
      })
      expect(layer.x).toBe(SHADOW_LIMITS.offset)
      expect(layer.y).toBe(-SHADOW_LIMITS.offset)
      expect(layer.blur).toBe(0)
      expect(layer.spread).toBe(SHADOW_LIMITS.spread)
      expect(layer.opacity).toBe(1)
    })

    it('rounds numbers and repairs invalid colors', () => {
      const layer = clampLayer({ ...baseLayer, x: 3.7, color: 'not-a-color' })
      expect(layer.x).toBe(4)
      expect(layer.color).toBe('#000000')
    })

    it('handles non-finite numbers', () => {
      const layer = clampLayer({ ...baseLayer, x: Number.NaN, opacity: Number.NaN })
      expect(layer.x).toBe(0)
      expect(layer.opacity).toBe(0)
    })
  })

  describe('createLayer', () => {
    it('returns a usable default layer', () => {
      const layer = createLayer()
      expect(layer.id).toBe('layer-0')
      expect(layer.inset).toBe(false)
      expect(layer.opacity).toBeGreaterThan(0)
      expect(buildBoxShadow([layer])).toMatch(/^0px 4px 12px/)
    })

    it('seeds unique ids from the index', () => {
      expect(createLayer(3).id).toBe('layer-3')
    })
  })

  describe('SHADOW_PRESETS', () => {
    it('ships at least six presets with unique ids', () => {
      expect(SHADOW_PRESETS.length).toBeGreaterThanOrEqual(6)
      const ids = SHADOW_PRESETS.map((preset) => preset.id)
      expect(new Set(ids).size).toBe(ids.length)
    })

    it('every preset builds valid box-shadow and filter output', () => {
      for (const preset of SHADOW_PRESETS) {
        expect(buildBoxShadow(preset.layers)).toMatch(/rgba\(/)
        expect(buildBoxShadowCss(preset.layers, 'box-shadow')).toMatch(/^box-shadow: .+;$/)
        expect(buildBoxShadowCss(preset.layers, 'filter')).toMatch(/^filter: .+;$/)
      }
    })
  })
})
