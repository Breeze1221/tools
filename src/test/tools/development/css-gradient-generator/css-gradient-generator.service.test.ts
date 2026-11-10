import { describe, expect, it } from 'vitest'

import {
  buildGradient,
  buildGradientCss,
  gradientPresets,
  randomGradient,
  type GradientConfig,
} from '@/tools/development/css-gradient-generator/css-gradient-generator.service'

const baseConfig: GradientConfig = {
  type: 'linear',
  stops: [
    { id: 'red', color: '#ff0000', position: 0 },
    { id: 'blue', color: '#0000ff', position: 100 },
  ],
  angle: 90,
  shape: 'circle',
  position: 'center',
  startAngle: 45,
  repeating: false,
}

describe('css-gradient-generator service', () => {
  describe('buildGradient', () => {
    it('builds a linear gradient with angle and stops', () => {
      const css = buildGradient(baseConfig)
      expect(css).toContain('linear-gradient(90deg')
      expect(css).toContain('#ff0000 0%')
      expect(css).toContain('#0000ff 100%')
    })

    it('uses the radial keyword with shape and position', () => {
      const circle = buildGradient({ ...baseConfig, type: 'radial', position: 'top left' })
      expect(circle).toContain('radial-gradient(circle at top left')
      const ellipse = buildGradient({ ...baseConfig, type: 'radial', shape: 'ellipse' })
      expect(ellipse).toContain('radial-gradient(ellipse at center')
    })

    it('uses the conic keyword with start angle', () => {
      const css = buildGradient({ ...baseConfig, type: 'conic', startAngle: 45 })
      expect(css).toContain('conic-gradient(from 45deg at center')
    })

    it('prefixes repeating gradients', () => {
      expect(buildGradient({ ...baseConfig, repeating: true })).toContain(
        'repeating-linear-gradient(',
      )
      expect(buildGradient({ ...baseConfig, type: 'conic', repeating: true })).toContain(
        'repeating-conic-gradient(',
      )
    })

    it('sorts stops by position', () => {
      const css = buildGradient({
        ...baseConfig,
        stops: [
          { id: 'late', color: '#0000ff', position: 100 },
          { id: 'early', color: '#ff0000', position: 0 },
        ],
      })
      expect(css.indexOf('#ff0000')).toBeLessThan(css.indexOf('#0000ff'))
    })

    it('throws when fewer than 2 stops are provided', () => {
      expect(() => buildGradient({ ...baseConfig, stops: [] })).toThrow()
      expect(() =>
        buildGradient({ ...baseConfig, stops: [{ id: 'only', color: '#fff', position: 0 }] }),
      ).toThrow()
    })

    it('normalizes angles beyond a full turn', () => {
      expect(buildGradient({ ...baseConfig, angle: 450 })).toContain('90deg')
    })
  })

  describe('buildGradientCss', () => {
    it('wraps the gradient in a background declaration', () => {
      expect(buildGradientCss(baseConfig, 'background')).toMatch(/^background: linear-gradient\(/)
      expect(buildGradientCss(baseConfig, 'background').endsWith(';')).toBe(true)
    })

    it('supports the background-image declaration', () => {
      expect(buildGradientCss(baseConfig, 'background-image')).toMatch(
        /^background-image: linear-gradient\(/,
      )
    })
  })

  describe('randomGradient', () => {
    it('always produces a parseable gradient value', () => {
      for (let index = 0; index < 20; index += 1) {
        const config = randomGradient()
        expect(config.stops.length).toBeGreaterThanOrEqual(2)
        expect(buildGradient(config)).toMatch(
          /^(repeating-)?(linear|radial|conic)-gradient\(.+\)$/,
        )
      }
    })
  })

  describe('gradientPresets', () => {
    it('ships at least four presets', () => {
      expect(gradientPresets.length).toBeGreaterThanOrEqual(4)
    })

    it('every preset builds a valid gradient', () => {
      for (const preset of gradientPresets) {
        expect(buildGradient(preset.config)).toMatch(/^linear-gradient\(.+\)$/)
      }
    })
  })
})
