import { describe, expect, it } from 'vitest'

import {
  averageColor,
  DEFAULT_MERGE_DISTANCE,
  extractPalette,
  quantizeColor,
  toCssVariables,
  toPaletteJson,
} from '@/tools/images/image-color-extractor/image-color-extractor.service'

/** 生成纯色 RGBA 像素 */
function solid(width: number, height: number, [r, g, b, a = 255]: readonly number[]) {
  const pixels = new Uint8ClampedArray(width * height * 4)
  for (let index = 0; index < pixels.length; index += 4) {
    pixels[index] = r
    pixels[index + 1] = g
    pixels[index + 2] = b
    pixels[index + 3] = a
  }
  return pixels
}

/** 按顺序铺开若干颜色，每个颜色重复 repeat 次 */
function stripes(colors: readonly (readonly number[])[], repeat = 1) {
  const pixels = new Uint8ClampedArray(colors.length * repeat * 4)
  let offset = 0
  for (const [r = 0, g = 0, b = 0, a = 255] of colors) {
    for (let i = 0; i < repeat; i += 1) {
      pixels[offset] = r
      pixels[offset + 1] = g
      pixels[offset + 2] = b
      pixels[offset + 3] = a
      offset += 4
    }
  }
  return pixels
}

describe('quantizeColor', () => {
  it('maps 8-bit channels onto the 4-bit bucket grid', () => {
    expect(quantizeColor(0, 120, 255)).toEqual({ r: 0, g: 119, b: 255 })
  })
})

describe('extractPalette', () => {
  it('returns one color covering the whole image for a solid image', () => {
    const palette = extractPalette(solid(2, 2, [10, 20, 30]), { count: 6 })

    expect(palette).toHaveLength(1)
    expect(palette[0]).toMatchObject({ hex: '#0A141E', r: 10, g: 20, b: 30, count: 4 })
    expect(palette[0]?.ratio).toBeCloseTo(1, 5)
  })

  it('merges two nearby colors into a single swatch', () => {
    const pixels = stripes([
      [120, 120, 120],
      [120, 120, 120],
      [135, 135, 135],
      [135, 135, 135],
    ])
    const palette = extractPalette(pixels, { count: 6, mergeDistance: DEFAULT_MERGE_DISTANCE })

    expect(palette).toHaveLength(1)
    expect(palette[0]?.count).toBe(4)
    expect(palette[0]?.hex).toBe('#808080')
  })

  it('keeps distant colors as separate swatches', () => {
    const pixels = stripes([
      [255, 0, 0],
      [0, 0, 255],
    ])
    const palette = extractPalette(pixels, { count: 6 })

    expect(palette).toHaveLength(2)
    expect(palette.map((color) => color.hex).sort()).toEqual(['#0000FF', '#FF0000'])
  })

  it('caps the palette at the requested count, strongest first', () => {
    const pixels = stripes(
      [
        [255, 0, 0],
        [255, 0, 0],
        [0, 255, 0],
        [0, 0, 255],
        [255, 255, 0],
      ],
      1,
    )
    const palette = extractPalette(pixels, { count: 3 })

    expect(palette).toHaveLength(3)
    expect(palette[0]?.hex).toBe('#FF0000')
    expect(palette[0]?.count).toBe(2)
  })

  it('ignores transparent pixels and computes the ratio over opaque ones', () => {
    const pixels = stripes([
      [255, 0, 0],
      [255, 0, 0],
      [0, 255, 0, 0],
    ])
    const palette = extractPalette(pixels, { count: 6 })

    expect(palette).toHaveLength(1)
    expect(palette[0]?.count).toBe(2)
    expect(palette[0]?.ratio).toBe(1)
  })

  it('throws when every pixel is transparent', () => {
    expect(() => extractPalette(solid(2, 2, [0, 0, 0, 0]), { count: 6 })).toThrow(
      'Image has no opaque pixels',
    )
  })

  it('throws when count is below the supported range', () => {
    expect(() => extractPalette(solid(1, 1, [0, 0, 0]), { count: 2 })).toThrow(
      'Palette size must be an integer between 3 and 12',
    )
  })

  it('throws when count is above the supported range', () => {
    expect(() => extractPalette(solid(1, 1, [0, 0, 0]), { count: 13 })).toThrow(
      'Palette size must be an integer between 3 and 12',
    )
  })

  it('throws when the pixel array is not RGBA-aligned', () => {
    expect(() => extractPalette(new Uint8ClampedArray(6), { count: 6 })).toThrow(
      'Pixel array length must be a multiple of 4',
    )
  })
})

describe('toCssVariables', () => {
  it('writes one numbered variable per swatch', () => {
    const palette = extractPalette(solid(1, 1, [255, 0, 0]), { count: 6 })
    const css = toCssVariables(palette)

    expect(css).toContain(':root {')
    expect(css).toContain('--color-1: #FF0000;')
  })
})

describe('toPaletteJson', () => {
  it('serializes hex, rgb, count and ratio', () => {
    const palette = extractPalette(solid(1, 1, [0, 128, 255]), { count: 6 })
    const parsed = JSON.parse(toPaletteJson(palette)) as {
      colors: { hex: string; rgb: { r: number; g: number; b: number }; ratio: number }[]
    }

    expect(parsed.colors).toHaveLength(1)
    expect(parsed.colors[0]?.hex).toBe('#0080FF')
    expect(parsed.colors[0]?.rgb).toEqual({ r: 0, g: 128, b: 255 })
    expect(parsed.colors[0]?.ratio).toBe(1)
  })
})

describe('averageColor', () => {
  it('averages opaque pixels to the expected hex', () => {
    const pixels = stripes([
      [0, 0, 0],
      [255, 255, 255],
    ])

    expect(averageColor(pixels)).toBe('#808080')
  })

  it('ignores transparent pixels', () => {
    const pixels = stripes([
      [255, 0, 0],
      [0, 255, 0, 0],
    ])

    expect(averageColor(pixels)).toBe('#FF0000')
  })

  it('throws when there is nothing opaque to average', () => {
    expect(() => averageColor(solid(1, 1, [0, 0, 0, 0]))).toThrow('Image has no opaque pixels')
  })
})
