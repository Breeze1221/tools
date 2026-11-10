/**
 * 本文件是工具里唯一允许接触 DOM / Canvas / PDF 的地方：
 * 负责解码图片、转成 JPEG 数据并以 jsPDF 逐图一页写入。
 */

import { computePdfLayout, type PdfLayoutOptions } from './image-to-pdf.service'

const FALLBACK_SIZE = 1
const JPEG_QUALITY = 0.92

export type DecodedImage = {
  source: CanvasImageSource
  width: number
  height: number
  close: () => void
}

export type PdfRenderResult = {
  blob: Blob
  pageCount: number
}

type PdfPage = {
  dataUrl: string
  x: number
  y: number
  width: number
  height: number
  pageWidth: number
  pageHeight: number
}

/** 解码一张图片；优先用 createImageBitmap，失败时退回 <img> */
export async function decodeImageFile(file: File): Promise<DecodedImage> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
      return {
        source: bitmap,
        width: bitmap.width || FALLBACK_SIZE,
        height: bitmap.height || FALLBACK_SIZE,
        close: () => bitmap.close(),
      }
    } catch {
      // 某些浏览器对该格式或 imageOrientation 选项支持不好，退回 <img> 解码
    }
  }

  const url = URL.createObjectURL(file)
  try {
    const image = await loadImage(url)
    return {
      source: image,
      width: image.naturalWidth || image.width || FALLBACK_SIZE,
      height: image.naturalHeight || image.height || FALLBACK_SIZE,
      close: () => undefined,
    }
  } finally {
    URL.revokeObjectURL(url)
  }
}

function toJpegDataUrl(image: DecodedImage): string {
  const canvas = document.createElement('canvas')
  canvas.width = image.width
  canvas.height = image.height

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Canvas 2D context is unavailable')
  }
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(image.source, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', JPEG_QUALITY)
}

/** 主流程：每张图片一页，输出 PDF Blob */
export async function renderImagesToPdf(
  files: readonly File[],
  options: PdfLayoutOptions,
): Promise<PdfRenderResult> {
  if (files.length === 0) {
    throw new Error('At least one image is required')
  }

  const pages: PdfPage[] = []
  for (const file of files) {
    const image = await decodeImageFile(file)
    try {
      const layout = computePdfLayout({ width: image.width, height: image.height }, options)
      pages.push({
        dataUrl: toJpegDataUrl(image),
        x: layout.x,
        y: layout.y,
        width: layout.width,
        height: layout.height,
        pageWidth: layout.pageWidth,
        pageHeight: layout.pageHeight,
      })
    } finally {
      image.close()
    }
  }

  const first = pages[0]
  if (!first) {
    throw new Error('At least one page is required')
  }

  const { jsPDF } = await import('jspdf')
  // jsPDF 会按 orientation 交换宽高，所以横向页要显式标记 landscape，页面尺寸才不会被转回去
  const orientationOf = (page: PdfPage): 'portrait' | 'landscape' =>
    page.pageWidth > page.pageHeight ? 'landscape' : 'portrait'
  const pdf = new jsPDF({
    orientation: orientationOf(first),
    unit: 'mm',
    format: [first.pageWidth, first.pageHeight],
  })

  pages.forEach((page, index) => {
    if (index > 0) {
      pdf.addPage([page.pageWidth, page.pageHeight], orientationOf(page))
    }
    pdf.addImage(page.dataUrl, 'JPEG', page.x, page.y, page.width, page.height)
  })

  return { blob: pdf.output('blob'), pageCount: pages.length }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.decoding = 'async'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('The image could not be decoded'))
    image.src = url
  })
}
