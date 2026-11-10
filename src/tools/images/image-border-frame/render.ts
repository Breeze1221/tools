/**
 * 本文件是工具里唯一允许接触 DOM / Canvas 的地方：
 * 负责解码图片、绘制背景 / 边框 / 阴影并按圆角裁剪图片，最后编码导出。
 */

import {
  assertValidColor,
  computeFrameSize,
  type FrameConfig,
} from './image-border-frame.service'

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

export type FrameRenderOptions = {
  file: File
  config: FrameConfig
  format: OutputFormat
  quality?: number
}

export type FrameRenderResult = {
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

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2))
  context.beginPath()
  context.moveTo(x + r, y)
  context.lineTo(x + width - r, y)
  context.arcTo(x + width, y, x + width, y + r, r)
  context.lineTo(x + width, y + height - r)
  context.arcTo(x + width, y + height, x + width - r, y + height, r)
  context.lineTo(x + r, y + height)
  context.arcTo(x, y + height, x, y + height - r, r)
  context.lineTo(x, y + r)
  context.arcTo(x, y, x + r, y, r)
  context.closePath()
}

/** 主流程：原图 → 带边框与阴影的合成图 Blob */
export async function renderFramedImage(
  options: FrameRenderOptions,
): Promise<FrameRenderResult> {
  const image = await decodeImageFile(options.file)

  try {
    const size = computeFrameSize(
      { width: image.width, height: image.height },
      options.config,
    )
    const backgroundColor = assertValidColor(options.config.backgroundColor, 'backgroundColor')
    const borderColor = assertValidColor(options.config.borderColor, 'borderColor')

    const canvas = document.createElement('canvas')
    canvas.width = size.width
    canvas.height = size.height

    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error('Canvas 2D context is unavailable')
    }

    if (options.format === 'jpeg') {
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, canvas.width, canvas.height)
    }

    // 背景 + 阴影
    context.save()
    if (size.shadow > 0) {
      context.shadowColor = 'rgba(0, 0, 0, 0.35)'
      context.shadowBlur = size.shadow
      context.shadowOffsetY = Math.round(size.shadow / 3)
    }
    context.fillStyle = backgroundColor
    roundedRect(context, size.frameX, size.frameY, size.frameWidth, size.frameHeight, size.radius)
    context.fill()
    context.restore()

    // 边框
    if (size.borderWidth > 0) {
      const inset = size.borderWidth / 2
      context.strokeStyle = borderColor
      context.lineWidth = size.borderWidth
      roundedRect(
        context,
        size.frameX + inset,
        size.frameY + inset,
        size.frameWidth - size.borderWidth,
        size.frameHeight - size.borderWidth,
        Math.max(0, size.radius - inset),
      )
      context.stroke()
    }

    // 图片按内圆角裁剪
    context.save()
    roundedRect(
      context,
      size.imageX,
      size.imageY,
      size.imageWidth,
      size.imageHeight,
      size.imageRadius,
    )
    context.clip()
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    context.drawImage(image.source, size.imageX, size.imageY, size.imageWidth, size.imageHeight)
    context.restore()

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
