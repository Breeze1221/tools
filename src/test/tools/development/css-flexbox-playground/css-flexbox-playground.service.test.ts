import { describe, expect, it } from 'vitest'

import {
  FLEX_PRESETS,
  buildFlexCss,
  buildFlexStyle,
  type FlexConfig,
} from '@/tools/development/css-flexbox-playground/css-flexbox-playground.service'

const baseConfig: FlexConfig = {
  direction: 'row',
  wrap: 'nowrap',
  justifyContent: 'flex-start',
  alignItems: 'stretch',
  alignContent: 'stretch',
  gap: 16,
  children: 4,
}

describe('css-flexbox-playground service', () => {
  describe('buildFlexCss', () => {
    it('emits every container declaration', () => {
      const css = buildFlexCss({
        ...baseConfig,
        direction: 'column',
        wrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        alignContent: 'space-between',
        gap: 24,
      })

      expect(css).toContain('.container {')
      expect(css).toContain('display: flex;')
      expect(css).toContain('flex-direction: column;')
      expect(css).toContain('flex-wrap: wrap;')
      expect(css).toContain('justify-content: center;')
      expect(css).toContain('align-items: center;')
      expect(css).toContain('align-content: space-between;')
      expect(css).toContain('gap: 24px;')
    })

    it('clamps the gap into the allowed range', () => {
      expect(buildFlexCss({ ...baseConfig, gap: -10 })).toContain('gap: 0px;')
      expect(buildFlexCss({ ...baseConfig, gap: 999 })).toContain('gap: 120px;')
      expect(buildFlexCss({ ...baseConfig, gap: 12.6 })).toContain('gap: 13px;')
    })

    it('throws when there are no children', () => {
      expect(() => buildFlexCss({ ...baseConfig, children: 0 })).toThrow(
        'At least one child is required',
      )
      expect(() => buildFlexCss({ ...baseConfig, children: -2 })).toThrow(
        'At least one child is required',
      )
      expect(() => buildFlexCss({ ...baseConfig, children: 2.5 })).toThrow(
        'At least one child is required',
      )
    })

    it('throws for a non-finite gap and unknown option values', () => {
      expect(() => buildFlexCss({ ...baseConfig, gap: Number.NaN })).toThrow(
        'Gap must be a finite number',
      )
      expect(() =>
        buildFlexCss({ ...baseConfig, direction: 'diagonal' as FlexConfig['direction'] }),
      ).toThrow('Invalid flex direction')
      expect(() =>
        buildFlexCss({ ...baseConfig, justifyContent: 'middle' as FlexConfig['justifyContent'] }),
      ).toThrow('Invalid justify-content')
    })
  })

  describe('buildFlexStyle', () => {
    it('returns camelCase style properties', () => {
      const style = buildFlexStyle(baseConfig)

      expect(style.display).toBe('flex')
      expect(style.flexDirection).toBe('row')
      expect(style.gap).toBe('16px')
    })
  })

  describe('FLEX_PRESETS', () => {
    it('produces valid css for every preset', () => {
      for (const preset of FLEX_PRESETS) {
        expect(buildFlexCss(preset.config)).toContain('display: flex;')
      }
    })

    it('includes the documented preset ids', () => {
      expect(FLEX_PRESETS.map((preset) => preset.id)).toEqual([
        'center',
        'horizontal-list',
        'card-grid',
        'space-between',
      ])
    })
  })
})
