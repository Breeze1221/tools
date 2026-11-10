/**
 * 本文件是工具里唯一允许接触 DOM / Canvas 的地方：
 * 负责解码图片、按角度旋转并翻转，再编码成目标格式。
 */

import { normalizeRotation, rotateDimensions } from './image-rotate-flip.service'

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

export type RotateRenderOptions = {
  file: File
  rotation: number
  flipHorizontal: boolean
  flipVertical: boolean
  format: OutputFormat
  /** 0–1，PNG 会忽略该值 */
  quality?: number
}

export type RotateRenderResult = {
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

/** 主流程：原图 → 旋转 / 翻转后的目标格式 Blob */
export async function renderRotatedImage(
  options: RotateRenderOptions,
): Promise<RotateRenderResult> {
  const rotation = normalizeRotation(options.rotation)
  const image = await decodeImageFile(options.file)

  try {
    const target = rotateDimensions(
      { width: image.width, height: image.height },
      rotation,
    )
    const canvas = document.createElement('canvas')
    canvas.width = target.width
    canvas.height = target.height

    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error('Canvas 2D context is unavailable')
    }

    if (options.format === 'jpeg') {
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, canvas.width, canvas.height)
    }

    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    context.translate(canvas.width / 2, canvas.height / 2)
    context.rotate((rotation * Math.PI) / 180)
    context.scale(options.flipHorizontal ? -1 : 1, options.flipVertical ? -1 : 1)
    context.drawImage(image.source, -image.width / 2, -image.height / 2, image.width, image.height)

    const blob = await canvasToBlob(
      canvas,
      MIME_TYPES[options.format],
      options.format === 'png' ? undefined : (options.quality ?? 0.92),
    )
    return { blob, width: canvas.width, height: canvas.height }
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
