/**
 * 本文件是工具里唯一允许接触 DOM / Canvas 的地方：
 * 负责解码图片并把它按目标尺寸重绘、编码成 PNG / JPEG / WebP。
 */

import { MAX_DIMENSION } from './image-resizer.service'

export const OUTPUT_FORMATS = ['png', 'jpeg', 'webp'] as const

export type OutputFormat = (typeof OUTPUT_FORMATS)[number]

const MIME_TYPES: Record<OutputFormat, string> = {
  png: 'image/png',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
}

const FALLBACK_SIZE = 1

export type DecodedImage = {
  source: CanvasImageSource
  width: number
  height: number
  close: () => void
}

export type ResizeRenderOptions = {
  file: File
  width: number
  height: number
  format: OutputFormat
  /** 0–1，PNG 会忽略该值 */
  quality?: number
}

export type ResizeRenderResult = {
  blob: Blob
  width: number
  height: number
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

/** 主流程：原图 → 目标尺寸与格式的 Blob */
export async function renderResizedImage(
  options: ResizeRenderOptions,
): Promise<ResizeRenderResult> {
  if (!Number.isFinite(options.width) || !Number.isFinite(options.height)) {
    throw new Error('Target width and height must be finite numbers')
  }

  const width = Math.max(1, Math.round(options.width))
  const height = Math.max(1, Math.round(options.height))
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    throw new Error(`Target dimension exceeds the ${MAX_DIMENSION}px limit`)
  }

  const image = await decodeImageFile(options.file)

  try {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error('Canvas 2D context is unavailable')
    }

    // JPEG 没有透明通道，先铺白底避免透明区域变黑
    if (options.format === 'jpeg') {
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, width, height)
    }

    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    context.drawImage(image.source, 0, 0, width, height)

    const blob = await canvasToBlob(
      canvas,
      MIME_TYPES[options.format],
      options.format === 'png' ? undefined : (options.quality ?? 0.92),
    )
    return { blob, width, height }
  } finally {
    image.close()
  }
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

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mime: string,
  quality: number | undefined,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
          return
        }
        reject(new Error(`Failed to encode ${mime}`))
      },
      mime,
      quality,
    )
  })
}
