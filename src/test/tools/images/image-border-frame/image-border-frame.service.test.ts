import { describe, expect, it } from 'vitest'

import {
  FRAME_DEFAULTS,
  FRAME_LIMITS,
  assertValidColor,
  buildFrameStyle,
  computeFrameSize,
} from '@/tools/images/image-border-frame/image-border-frame.service'

describe('image-border-frame service', () => {
  it('computes frame geometry with the default config', () => {
    expect(computeFrameSize({ width: 100, height: 80 }, FRAME_DEFAULTS)).toEqual({
      width: 212,
      height: 192,
      frameX: 24,
      frameY: 24,
      frameWidth: 164,
      frameHeight: 144,
      imageX: 56,
      imageY: 56,
      imageWidth: 100,
      imageHeight: 80,
      radius: 20,
      imageRadius: 12,
      shadow: 24,
      borderWidth: 8,
    })
  })

  it('clamps negative values to zero', () => {
    const size = computeFrameSize(
      { width: 100, height: 80 },
      { ...FRAME_DEFAULTS, padding: -10, borderWidth: -5, radius: -1, shadow: -4 },
    )
    expect(size).toMatchObject({
      width: 100,
      height: 80,
      frameWidth: 100,
      frameHeight: 80,
      imageX: 0,
      imageY: 0,
      radius: 0,
      imageRadius: 0,
      shadow: 0,
      borderWidth: 0,
    })
  })

  it('caps the corner radius at half of the frame size', () => {
    const size = computeFrameSize(
      { width: 100, height: 100 },
      { ...FRAME_DEFAULTS, padding: 0, borderWidth: 0, shadow: 0, radius: 400 },
    )
    expect(size.radius).toBe(50)
    expect(size.imageRadius).toBe(50)
  })

  it('clamps oversized numbers to the declared limits', () => {
    const size = computeFrameSize(
      { width: 100, height: 100 },
      { ...FRAME_DEFAULTS, padding: 9999, borderWidth: 999, shadow: 999, radius: 20 },
    )
    expect(size.imageX).toBe(FRAME_LIMITS.shadow + FRAME_LIMITS.padding + FRAME_LIMITS.borderWidth)
    expect(size.borderWidth).toBe(FRAME_LIMITS.borderWidth)
    expect(size.shadow).toBe(FRAME_LIMITS.shadow)
    expect(size.width).toBe(100 + 2 * (400 + 100) + 2 * 200)
  })

  it('rejects invalid colors', () => {
    expect(() => assertValidColor('white', 'borderColor')).toThrow(/hex color/)
    expect(() => buildFrameStyle({ ...FRAME_DEFAULTS, backgroundColor: 'red' })).toThrow(
      /hex color/,
    )
    expect(assertValidColor('#FFF', 'borderColor')).toBe('#FFF')
  })

  it('rejects non-finite numbers and invalid source sizes', () => {
    expect(() =>
      computeFrameSize({ width: 100, height: 80 }, { ...FRAME_DEFAULTS, padding: Number.NaN }),
    ).toThrow(/finite number/)
    expect(() => computeFrameSize({ width: 0, height: 80 }, FRAME_DEFAULTS)).toThrow(/positive/)
    expect(() => computeFrameSize({ width: 100, height: Number.NaN }, FRAME_DEFAULTS)).toThrow(
      /positive/,
    )
  })

  it('builds a CSS style string including the shadow', () => {
    expect(buildFrameStyle(FRAME_DEFAULTS)).toBe(
      'padding: 24px; border: 8px solid #ffffff; border-radius: 20px; background-color: #ffffff; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35)',
    )
  })

  it('omits the shadow when it is zero', () => {
    const style = buildFrameStyle({ ...FRAME_DEFAULTS, shadow: 0 })
    expect(style).not.toContain('box-shadow')
  })
})
