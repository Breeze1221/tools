import { describe, expect, it } from 'vitest'

import {
  buildGridCss,
  buildGridStyle,
  generateTrack,
  type GridConfig,
} from '@/tools/development/css-grid-generator/css-grid-generator.service'

const baseConfig: GridConfig = {
  columns: 3,
  rows: 2,
  unit: 'fr',
  trackSize: 1,
  customColumns: '',
  gap: 16,
  autoFlow: 'row',
  justifyItems: 'stretch',
  alignItems: 'stretch',
}

describe('css-grid-generator service', () => {
  describe('generateTrack', () => {
    it('formats fr and px tracks', () => {
      expect(generateTrack(1, 'fr')).toBe('1fr')
      expect(generateTrack(2.25, 'fr')).toBe('2.25fr')
      expect(generateTrack(120, 'px')).toBe('120px')
    })

    it('throws for non-positive or non-finite sizes', () => {
      expect(() => generateTrack(0, 'fr')).toThrow('Track size must be a positive number')
      expect(() => generateTrack(Number.NaN, 'px')).toThrow(
        'Track size must be a positive number',
      )
    })
  })

  describe('buildGridCss', () => {
    it('builds repeat templates from column and row counts', () => {
      const css = buildGridCss(baseConfig)

      expect(css).toContain('display: grid;')
      expect(css).toContain('grid-template-columns: repeat(3, 1fr);')
      expect(css).toContain('grid-template-rows: repeat(2, 1fr);')
      expect(css).toContain('gap: 16px;')
    })

    it('supports px tracks', () => {
      const css = buildGridCss({ ...baseConfig, unit: 'px', trackSize: 120 })

      expect(css).toContain('grid-template-columns: repeat(3, 120px);')
      expect(css).toContain('grid-template-rows: repeat(2, 80px);')
    })

    it('prefers a custom column template', () => {
      const css = buildGridCss({ ...baseConfig, customColumns: '200px 1fr 2fr' })

      expect(css).toContain('grid-template-columns: 200px 1fr 2fr;')
    })

    it('clamps gap and clamps the track size into the unit range', () => {
      expect(buildGridCss({ ...baseConfig, gap: -4 })).toContain('gap: 0px;')
      expect(buildGridCss({ ...baseConfig, gap: 500 })).toContain('gap: 120px;')
      expect(buildGridCss({ ...baseConfig, trackSize: 99 })).toContain(
        'grid-template-columns: repeat(3, 6fr);',
      )
    })

    it('throws for out-of-range columns, rows and unsafe custom tracks', () => {
      expect(() => buildGridCss({ ...baseConfig, columns: 0 })).toThrow(
        'Columns must be an integer between 1 and 12',
      )
      expect(() => buildGridCss({ ...baseConfig, columns: 13 })).toThrow(
        'Columns must be an integer between 1 and 12',
      )
      expect(() => buildGridCss({ ...baseConfig, rows: 0 })).toThrow(
        'Rows must be an integer between 1 and 12',
      )
      expect(() => buildGridCss({ ...baseConfig, customColumns: '1fr; color: red' })).toThrow(
        'Custom track contains invalid characters',
      )
    })

    it('throws for an unknown auto-flow value', () => {
      expect(() =>
        buildGridCss({ ...baseConfig, autoFlow: 'diagonal' as GridConfig['autoFlow'] }),
      ).toThrow('Invalid grid-auto-flow')
    })
  })

  describe('buildGridStyle', () => {
    it('returns camelCase styles for previews', () => {
      const style = buildGridStyle(baseConfig)

      expect(style.display).toBe('grid')
      expect(style.gridTemplateColumns).toBe('repeat(3, 1fr)')
      expect(style.gap).toBe('16px')
    })
  })
})
