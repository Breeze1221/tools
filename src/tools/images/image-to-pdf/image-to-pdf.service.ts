/** 常用页面尺寸，单位 mm */
export const PAGE_SIZES = {
  a4: { width: 210, height: 297 },
  letter: { width: 215.9, height: 279.4 },
} as const

export const PAGE_SIZE_KEYS = ['a4', 'letter'] as const

export type PageSizeKey = (typeof PAGE_SIZE_KEYS)[number]

export const PDF_ORIENTATIONS = ['portrait', 'landscape'] as const

export type PdfOrientation = (typeof PDF_ORIENTATIONS)[number]

export const PDF_FITS = ['contain', 'cover', 'stretch'] as const

/** contain：完整装进页面；cover：铺满页面并裁掉溢出；stretch：拉伸变形填满 */
export type PdfFit = (typeof PDF_FITS)[number]

export type PdfLayoutOptions = {
  pageSize: PageSizeKey
  orientation: PdfOrientation
  /** 页边距，mm */
  margin: number
  fit: PdfFit
}

export const PDF_DEFAULTS: PdfLayoutOptions = {
  pageSize: 'a4',
  orientation: 'portrait',
  margin: 12,
  fit: 'contain',
}

export type ImageSize = {
  readonly width: number
  readonly height: number
}

export type PdfLayout = {
  readonly pageWidth: number
  readonly pageHeight: number
  /** 去掉页边距后的内容区 */
  readonly contentX: number
  readonly contentY: number
  readonly contentWidth: number
  readonly contentHeight: number
  /** 图片绘制矩形（cover 时可能超出页面） */
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
  /** mm / px */
  readonly scale: number
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000
}

function assertImageSize(source: ImageSize): ImageSize {
  if (
    !Number.isFinite(source.width) ||
    !Number.isFinite(source.height) ||
    source.width <= 0 ||
    source.height <= 0
  ) {
    throw new Error('Image width and height must be positive numbers')
  }
  return { width: source.width, height: source.height }
}

function assertOptions(options: PdfLayoutOptions): void {
  if (!PAGE_SIZE_KEYS.includes(options.pageSize)) {
    throw new Error(`Unknown page size: ${String(options.pageSize)}`)
  }
  if (!PDF_ORIENTATIONS.includes(options.orientation)) {
    throw new Error(`Unknown orientation: ${String(options.orientation)}`)
  }
  if (!PDF_FITS.includes(options.fit)) {
    throw new Error(`Unknown fit mode: ${String(options.fit)}`)
  }
  if (!Number.isFinite(options.margin)) {
    throw new Error(`Margin must be a finite number, received ${String(options.margin)}`)
  }
}

/**
 * 计算一页 PDF 的页面尺寸与图片绘制矩形（单位 mm）。
 * 页边距会被夹紧，保证内容区至少还有 1mm 可用。
 */
export function computePdfLayout(imageSize: ImageSize, options: PdfLayoutOptions): PdfLayout {
  assertOptions(options)
  const image = assertImageSize(imageSize)
  const base = PAGE_SIZES[options.pageSize]

  const pageWidth =
    options.orientation === 'landscape' ? Math.max(base.width, base.height) : base.width
  const pageHeight =
    options.orientation === 'landscape' ? Math.min(base.width, base.height) : base.height

  const maxMargin = Math.max(0, Math.min(pageWidth, pageHeight) / 2 - 1)
  const margin = Math.min(maxMargin, Math.max(0, options.margin))

  const contentX = margin
  const contentY = margin
  const contentWidth = pageWidth - margin * 2
  const contentHeight = pageHeight - margin * 2

  const horizontal = contentWidth / image.width
  const vertical = contentHeight / image.height

  if (options.fit === 'stretch') {
    return {
      pageWidth,
      pageHeight,
      contentX,
      contentY,
      contentWidth,
      contentHeight,
      x: contentX,
      y: contentY,
      width: contentWidth,
      height: contentHeight,
      scale: horizontal,
    }
  }

  const scale =
    options.fit === 'cover' ? Math.max(horizontal, vertical) : Math.min(horizontal, vertical)
  const width = image.width * scale
  const height = image.height * scale

  return {
    pageWidth,
    pageHeight,
    contentX,
    contentY,
    contentWidth,
    contentHeight,
    x: round(contentX + (contentWidth - width) / 2),
    y: round(contentY + (contentHeight - height) / 2),
    width: round(width),
    height: round(height),
    scale,
  }
}
