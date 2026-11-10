/**
 * 图片主色提取：纯函数，零 DOM / React 依赖。
 *
 * 思路：像素按 4bit/通道量化后装桶计数，按出现次数降序排列，
 * 相邻（RGB 欧氏距离小于阈值）的颜色合并成一个色板条目，取前 N 个。
 * 输出的颜色取桶内原始像素的平均值，比量化后的桶中心更接近肉眼所见。
 */

export type QuantizedColor = {
  r: number
  g: number
  b: number
}

export type PaletteColor = {
  hex: string
  r: number
  g: number
  b: number
  count: number
  /** 占全部不透明像素的比例，0–1 */
  ratio: number
}

export type ExtractPaletteOptions = {
  count: number
  /** 两个颜色的 RGB 距离小于该值时合并，默认 30 */
  mergeDistance?: number
}

export const DEFAULT_PALETTE_COLORS = 6
export const MIN_PALETTE_COLORS = 3
export const MAX_PALETTE_COLORS = 12
export const DEFAULT_MERGE_DISTANCE = 30
export const OPAQUE_ALPHA_THRESHOLD = 128

type Bucket = {
  count: number
  /** 桶内原始通道值之和，用来还原平均色 */
  r: number
  g: number
  b: number
}

type MergedColor = {
  r: number
  g: number
  b: number
  count: number
}

const clampChannel = (value: number): number => {
  if (!Number.isFinite(value)) return 0
  return Math.min(255, Math.max(0, Math.round(value)))
}

/** 量化到 4bit/通道，再还原成 8bit 的桶值（0 → 0，15 → 255） */
export function quantizeColor(r: number, g: number, b: number): QuantizedColor {
  return {
    r: (clampChannel(r) >> 4) * 17,
    g: (clampChannel(g) >> 4) * 17,
    b: (clampChannel(b) >> 4) * 17,
  }
}

function validatePixels(pixels: Uint8ClampedArray): void {
  if (pixels.length % 4 !== 0) {
    throw new Error('Pixel array length must be a multiple of 4')
  }
}

function channelHex(value: number): string {
  return clampChannel(value).toString(16).padStart(2, '0').toUpperCase()
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${channelHex(r)}${channelHex(g)}${channelHex(b)}`
}

export function extractPalette(
  pixels: Uint8ClampedArray,
  options: ExtractPaletteOptions,
): PaletteColor[] {
  validatePixels(pixels)

  const { count, mergeDistance = DEFAULT_MERGE_DISTANCE } = options
  if (!Number.isInteger(count) || count < MIN_PALETTE_COLORS || count > MAX_PALETTE_COLORS) {
    throw new Error(
      `Palette size must be an integer between ${MIN_PALETTE_COLORS} and ${MAX_PALETTE_COLORS}`,
    )
  }

  const buckets = new Map<number, Bucket>()
  let opaqueCount = 0

  for (let index = 0; index < pixels.length; index += 4) {
    const alpha = pixels[index + 3] ?? 0
    if (alpha < OPAQUE_ALPHA_THRESHOLD) continue

    const r = pixels[index] ?? 0
    const g = pixels[index + 1] ?? 0
    const b = pixels[index + 2] ?? 0
    const quantized = quantizeColor(r, g, b)
    const key = (quantized.r << 16) | (quantized.g << 8) | quantized.b
    const bucket = buckets.get(key)

    if (bucket) {
      bucket.count += 1
      bucket.r += r
      bucket.g += g
      bucket.b += b
    } else {
      buckets.set(key, { count: 1, r, g, b })
    }
    opaqueCount += 1
  }

  if (opaqueCount === 0) {
    throw new Error('Image has no opaque pixels')
  }

  const sorted: MergedColor[] = Array.from(buckets.values())
    .map((bucket) => ({
      r: bucket.r / bucket.count,
      g: bucket.g / bucket.count,
      b: bucket.b / bucket.count,
      count: bucket.count,
    }))
    .sort((a, b) => b.count - a.count)

  const merged: MergedColor[] = []
  for (const color of sorted) {
    let target: MergedColor | undefined
    let nearest = Number.POSITIVE_INFINITY

    for (const candidate of merged) {
      const distance = Math.hypot(
        candidate.r - color.r,
        candidate.g - color.g,
        candidate.b - color.b,
      )
      if (distance < mergeDistance && distance < nearest) {
        nearest = distance
        target = candidate
      }
    }

    if (target) {
      const total = target.count + color.count
      target.r = (target.r * target.count + color.r * color.count) / total
      target.g = (target.g * target.count + color.g * color.count) / total
      target.b = (target.b * target.count + color.b * color.count) / total
      target.count = total
    } else {
      merged.push({ ...color })
    }
  }

  return merged
    .sort((a, b) => b.count - a.count)
    .slice(0, count)
    .map((color) => ({
      hex: rgbToHex(color.r, color.g, color.b),
      r: Math.round(color.r),
      g: Math.round(color.g),
      b: Math.round(color.b),
      count: color.count,
      ratio: color.count / opaqueCount,
    }))
}

/** 生成可直接粘贴的 CSS 变量块 */
export function toCssVariables(palette: readonly PaletteColor[]): string {
  const lines = palette.map((color, index) => `  --color-${index + 1}: ${color.hex};`)
  return `:root {\n${lines.join('\n')}\n}`
}

/** 导出调色板 JSON（保留色值、原始计数与占比） */
export function toPaletteJson(palette: readonly PaletteColor[]): string {
  return JSON.stringify(
    {
      colors: palette.map((color) => ({
        hex: color.hex,
        rgb: { r: color.r, g: color.g, b: color.b },
        count: color.count,
        ratio: Number(color.ratio.toFixed(4)),
      })),
    },
    null,
    2,
  )
}

/** 全部不透明像素的平均色 */
export function averageColor(pixels: Uint8ClampedArray): string {
  validatePixels(pixels)

  let total = 0
  let r = 0
  let g = 0
  let b = 0

  for (let index = 0; index < pixels.length; index += 4) {
    const alpha = pixels[index + 3] ?? 0
    if (alpha < OPAQUE_ALPHA_THRESHOLD) continue
    r += pixels[index] ?? 0
    g += pixels[index + 1] ?? 0
    b += pixels[index + 2] ?? 0
    total += 1
  }

  if (total === 0) {
    throw new Error('Image has no opaque pixels')
  }

  return rgbToHex(r / total, g / total, b / total)
}
