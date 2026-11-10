/**
 * 本文件是工具里唯一允许接触 DOM / Canvas 的地方：
 * 负责解码图片、把水印画到画布上，并编码成 PNG / JPEG。
 */

import {
  assertValidFontSize,
  assertValidOpacity,
  assertValidScale,
  buildTilePositions,
  clampRotation,
  computeWatermarkPosition,
  type WatermarkAnchor,
} from './image-watermarker.service'

export type TextWatermarkOptions = {
  text: string
  fontSize: number
  color: string
  opacity: number
  rotation: number
  anchor: WatermarkAnchor
  margin: number
  tile: boolean
}

export type ImageWatermarkOptions = {
  scale: number
  opacity: number
  anchor: WatermarkAnchor
  margin: number
}

export type DecodedImage = {
  source: CanvasImageSource
  width: number
  height: number
  close: () => void
}

export type WatermarkResult = {
  blob: Blob
  width: number
  height: number
}

export type ComposeWatermarkOptions = {
  file: File
  format: 'png' | 'jpeg'
  quality?: number
  text?: TextWatermarkOptions
  watermark?: {
    file: File
    options: ImageWatermarkOptions
  }
}

const FALLBACK_SIZE = 1

const TEXT_FONT_STACK = '600 {size}px system-ui, -apple-system, "Segoe UI", sans-serif'

/** 在已有画布内容上叠加文字水印（支持旋转与平铺） */
export function drawTextWatermark(
  context: CanvasRenderingContext2D,
  canvasW: number,
  canvasH: number,
  options: TextWatermarkOptions,
): void {
  const text = options.text.trim()
  if (text === '') {
    return
  }

  const fontSize = assertValidFontSize(options.fontSize)
  const opacity = assertValidOpacity(options.opacity)
  const rotation = clampRotation(options.rotation)

  context.save()
  context.globalAlpha = opacity
  context.fillStyle = options.color
  context.font = TEXT_FONT_STACK.replace('{size}', String(fontSize))
  context.textAlign = 'center'
  context.textBaseline = 'middle'

  const textWidth = Math.max(1, Math.ceil(context.measureText(text).width))
  const textHeight = Math.max(1, Math.ceil(fontSize * 1.2))
  const radians = (rotation * Math.PI) / 180
  const cos = Math.abs(Math.cos(radians))
  const sin = Math.abs(Math.sin(radians))
  const boxW = Math.max(1, Math.ceil(textWidth * cos + textHeight * sin))
  const boxH = Math.max(1, Math.ceil(textWidth * sin + textHeight * cos))

  const drawAt = (x: number, y: number) => {
    context.save()
    context.translate(x + boxW / 2, y + boxH / 2)
    context.rotate(radians)
    context.fillText(text, 0, 0)
    context.restore()
  }

  if (options.tile) {
    for (const tile of buildTilePositions({
      canvasW,
      canvasH,
      wmW: boxW,
      wmH: boxH,
      gapX: options.margin,
      gapY: options.margin,
    })) {
      drawAt(tile.x, tile.y)
    }
  } else {
    const position = computeWatermarkPosition({
      canvasW,
      canvasH,
      wmW: boxW,
      wmH: boxH,
      anchor: options.anchor,
      margin: options.margin,
    })
    drawAt(position.x, position.y)
  }

  context.restore()
}

/** 在已有画布内容上叠加图片水印 */
export function drawImageWatermark(
  context: CanvasRenderingContext2D,
  canvasW: number,
  canvasH: number,
  watermark: Pick<DecodedImage, 'source' | 'width' | 'height'>,
  options: ImageWatermarkOptions,
): void {
  const scale = assertValidScale(options.scale)
  const opacity = assertValidOpacity(options.opacity)
  const width = Math.max(1, Math.round(watermark.width * scale))
  const height = Math.max(1, Math.round(watermark.height * scale))

  const position = computeWatermarkPosition({
    canvasW,
    canvasH,
    wmW: width,
    wmH: height,
    anchor: options.anchor,
    margin: options.margin,
  })

  context.save()
  context.globalAlpha = opacity
  context.drawImage(watermark.source, position.x, position.y, width, height)
  context.restore()
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

/** 主流程：原图 + 水印 → 目标格式的 Blob */
export async function renderWatermarkedImage(
  options: ComposeWatermarkOptions,
): Promise<WatermarkResult> {
  const base = await decodeImageFile(options.file)
  const watermark = options.watermark ? await decodeImageFile(options.watermark.file) : null

  try {
    const canvas = document.createElement('canvas')
    canvas.width = base.width
    canvas.height = base.height

    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error('Canvas 2D context is unavailable')
    }

    // JPEG 没有透明通道，先铺白底避免透明区域变黑
    if (options.format === 'jpeg') {
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, canvas.width, canvas.height)
    }
    context.drawImage(base.source, 0, 0, canvas.width, canvas.height)

    if (options.text) {
      drawTextWatermark(context, canvas.width, canvas.height, options.text)
    } else if (watermark && options.watermark) {
      drawImageWatermark(context, canvas.width, canvas.height, watermark, options.watermark.options)
    }

    const blob = await canvasToBlob(
      canvas,
      options.format === 'jpeg' ? 'image/jpeg' : 'image/png',
      options.quality ?? 0.92,
    )
    return { blob, width: canvas.width, height: canvas.height }
  } finally {
    base.close()
    watermark?.close()
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

function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality: number): Promise<Blob> {
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
