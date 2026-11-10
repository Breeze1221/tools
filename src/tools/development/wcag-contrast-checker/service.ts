import { oklchToRgb, rgbToOklch, type Rgba } from '@/utils/color'

/** 从 hex 颜色字符串解析到 Rgba，失败返回 null */
export function hexToRgba(hex: string): Rgba | null {
  const cleaned = hex.trim().replace('#', '').toLowerCase()
  if (/^[0-9a-f]{3}$/.test(cleaned)) {
    const r = parseInt(cleaned[0] + cleaned[0], 16)
    const g = parseInt(cleaned[1] + cleaned[1], 16)
    const b = parseInt(cleaned[2] + cleaned[2], 16)
    return { r: r / 255, g: g / 255, b: b / 255, a: 1 }
  }
  if (/^[0-9a-f]{6}$/.test(cleaned)) {
    const r = parseInt(cleaned.slice(0, 2), 16)
    const g = parseInt(cleaned.slice(2, 4), 16)
    const b = parseInt(cleaned.slice(4, 6), 16)
    return { r: r / 255, g: g / 255, b: b / 255, a: 1 }
  }
  if (/^[0-9a-f]{8}$/.test(cleaned)) {
    const r = parseInt(cleaned.slice(0, 2), 16)
    const g = parseInt(cleaned.slice(2, 4), 16)
    const b = parseInt(cleaned.slice(4, 6), 16)
    const a = parseInt(cleaned.slice(6, 8), 16) / 255
    return { r: r / 255, g: g / 255, b: b / 255, a }
  }
  return null
}

/** Rgba 转为 6 位 hex 字符串（丢弃 alpha） */
export function rgbaToHex(rgba: Rgba): string {
  const byte = (v: number) => Math.max(0, Math.min(255, Math.round(v * 255)))
  const h = (n: number) => byte(n).toString(16).padStart(2, '0')
  return `#${h(rgba.r)}${h(rgba.g)}${h(rgba.b)}`.toUpperCase()
}

/**
 * 对颜色进行亮度调整：正值变亮，负值变暗。
 * 在 OKLCH 空间操作以保持色相与饱和度。
 *
 * @param hex 颜色 hex
 * @param delta 亮度调整量（-0.5 ~ 0.5）
 * @returns 调整后的 hex，若输入无效返回 null
 */
export function adjustLightness(hex: string, delta: number): string | null {
  const rgba = hexToRgba(hex)
  if (!rgba) return null
  const { l, c, h } = rgbToOklch(rgba)
  const newL = Math.max(0, Math.min(1, l + delta))
  const adjusted = oklchToRgb({ l: newL, c, h }, rgba.a)
  return rgbaToHex(adjusted)
}

/**
 * 生成对比度优化的备选颜色：在 OKLCH 空间对前景色
 * 分别调暗 / 调亮 10%，返回两个备选 hex。
 *
 * @param foreground 前景 hex
 * @returns [调亮备选, 调暗备选]
 */
export function suggestAltColors(foreground: string): [string, string] {
  const lighter = adjustLightness(foreground, 0.1) ?? foreground
  const darker = adjustLightness(foreground, -0.1) ?? foreground
  return [lighter, darker]
}
