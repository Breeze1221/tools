/** 需要导出的 PNG 尺寸（正方形） */
export const faviconPngSizes = [16, 32, 48, 96, 152, 167, 180, 192, 512] as const

/** 打进 favicon.ico 的尺寸 */
export const icoSizes = [16, 32, 48] as const

export type FaviconPng = {
  size: number
  data: Uint8Array
}

const ICONDIR_SIZE = 6
const ICONDIRENTRY_SIZE = 16
const ICO_TYPE_ICON = 1
const ICO_PLANES = 1
const ICO_BIT_COUNT = 32
const ICO_MAX_DIMENSION = 256

/**
 * 手工拼 ICO 容器：ICONDIR + 每张图一条 ICONDIRENTRY + PNG 原始字节。
 * 现代浏览器都支持 ICO 内嵌 PNG，因此不需要再转 BMP。
 */
export function buildIco(pngs: readonly FaviconPng[]): Uint8Array<ArrayBuffer> {
  if (pngs.length === 0) {
    throw new Error('ICO requires at least one image')
  }

  const sorted = [...pngs].sort((a, b) => a.size - b.size)
  for (const png of sorted) {
    if (!Number.isInteger(png.size) || png.size < 1 || png.size > ICO_MAX_DIMENSION) {
      throw new Error(
        `ICO image size must be an integer between 1 and ${ICO_MAX_DIMENSION}, received ${png.size}`,
      )
    }
  }

  const directorySize = ICONDIR_SIZE + sorted.length * ICONDIRENTRY_SIZE
  const totalSize = directorySize + sorted.reduce((sum, png) => sum + png.data.length, 0)
  const buffer = new Uint8Array(totalSize)
  const view = new DataView(buffer.buffer)

  // ICONDIR：reserved=0, type=1(icon), count
  view.setUint16(0, 0, true)
  view.setUint16(2, ICO_TYPE_ICON, true)
  view.setUint16(4, sorted.length, true)

  let offset = directorySize
  sorted.forEach((png, index) => {
    const entry = ICONDIR_SIZE + index * ICONDIRENTRY_SIZE
    // 宽高字节为 0 时表示 256
    const dimension = png.size >= ICO_MAX_DIMENSION ? 0 : png.size
    buffer[entry] = dimension
    buffer[entry + 1] = dimension
    buffer[entry + 2] = 0 // 调色板颜色数，PNG 不用
    buffer[entry + 3] = 0 // reserved
    view.setUint16(entry + 4, ICO_PLANES, true)
    view.setUint16(entry + 6, ICO_BIT_COUNT, true)
    view.setUint32(entry + 8, png.data.length, true)
    view.setUint32(entry + 12, offset, true)
    buffer.set(png.data, offset)
    offset += png.data.length
  })

  return buffer
}

export type WebManifestOptions = {
  name?: string
  shortName?: string
  themeColor?: string
  backgroundColor?: string
}

/** 生成 site.webmanifest 文本（2 空格缩进，便于直接阅读与编辑） */
export function buildWebManifest(options: WebManifestOptions = {}): string {
  const {
    name = 'My App',
    shortName = 'App',
    themeColor = '#ffffff',
    backgroundColor = '#ffffff',
  } = options

  return JSON.stringify(
    {
      name,
      short_name: shortName,
      icons: faviconPngSizes.map((size) => ({
        src: `/favicon-${size}x${size}.png`,
        sizes: `${size}x${size}`,
        type: 'image/png',
      })),
      theme_color: themeColor,
      background_color: backgroundColor,
      display: 'standalone',
      start_url: '/',
    },
    null,
    2,
  )
}

/** 生成可直接粘到 <head> 的 favicon 引用片段 */
export function buildHtmlSnippet(): string {
  return [
    '<link rel="icon" href="/favicon.ico" sizes="any" />',
    ...faviconPngSizes.map(
      (size) =>
        `<link rel="icon" type="image/png" sizes="${size}x${size}" href="/favicon-${size}x${size}.png" />`,
    ),
    '<link rel="apple-touch-icon" sizes="180x180" href="/favicon-180x180.png" />',
    '<link rel="manifest" href="/site.webmanifest" />',
  ].join('\n')
}
