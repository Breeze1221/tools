/** 占位图尺寸上限，与 UI 的 number 输入范围保持一致 */
export const PLACEHOLDER_MIN_SIZE = 1
export const PLACEHOLDER_MAX_SIZE = 4000

export type PlaceholderOptions = {
  width: number
  height: number
  background: string
  textColor: string
  /** 留空时显示「宽×高」 */
  text?: string
  fontSize: number
  radius: number
  borderWidth: number
  borderColor: string
  fontFamily: string
}

const XML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
}

/** 转义 XML 文本与属性里会破坏结构的五个字符 */
export function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => XML_ESCAPES[char] ?? char)
}

function assertSize(value: number, name: string): void {
  if (!Number.isFinite(value) || value < PLACEHOLDER_MIN_SIZE || value > PLACEHOLDER_MAX_SIZE) {
    throw new Error(
      `svg placeholder: ${name} must be between ${PLACEHOLDER_MIN_SIZE} and ${PLACEHOLDER_MAX_SIZE}, received ${value}`,
    )
  }
}

function clampNonNegative(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0
}

/**
 * 生成占位图 SVG 源码。尺寸限制在 1–4000，字号必须大于 0；
 * 圆角与边框宽度按画布短边收口，避免出现负尺寸。
 */
export function buildPlaceholderSvg(options: PlaceholderOptions): string {
  const { width, height, background, textColor, text, fontSize, borderColor, fontFamily } = options
  assertSize(width, 'width')
  assertSize(height, 'height')

  if (!Number.isFinite(fontSize) || fontSize <= 0) {
    throw new Error(`svg placeholder: fontSize must be greater than 0, received ${fontSize}`)
  }

  const shortSide = Math.min(width, height)
  const borderWidth = Math.min(clampNonNegative(options.borderWidth), shortSide / 2)
  const radius = Math.min(clampNonNegative(options.radius), shortSide / 2)
  const inset = borderWidth / 2
  const label = text !== undefined && text.trim() !== '' ? text : `${width}×${height}`

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `  <rect x="${inset}" y="${inset}" width="${width - borderWidth}" height="${height - borderWidth}" rx="${radius}" fill="${escapeXml(background)}" stroke="${escapeXml(borderColor)}" stroke-width="${borderWidth}" />`,
    `  <text x="${width / 2}" y="${height / 2}" fill="${escapeXml(textColor)}" font-family="${escapeXml(fontFamily)}" font-size="${fontSize}" text-anchor="middle" dominant-baseline="central">${escapeXml(label)}</text>`,
    '</svg>',
  ].join('\n')
}

/** 编码成 data URI，可直接放进 img 的 src，避免把 SVG 当 HTML 解析 */
export function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}
