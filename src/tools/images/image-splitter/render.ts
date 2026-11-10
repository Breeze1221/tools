/**
 * 本文件是工具里唯一允许接触 DOM / Canvas 的地方：
 * 负责解码图片、逐块裁剪编码，以及用 JSZip 打包切片。
 */

import JSZip from 'jszip'

import type { Tile } from './image-splitter.service'

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

export type TileFile = {
  name: string
  blob: Blob
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

/** 从已解码的图片裁出一块并编码成 Blob */
export async function renderTile(
  image: DecodedImage,
  tile: Tile,
  format: OutputFormat,
  quality?: number,
): Promise<Blob> {
  if (tile.width < 1 || tile.height < 1) {
    throw new Error('Tile width and height must be at least 1px')
  }

  const canvas = document.createElement('canvas')
  canvas.width = tile.width
  canvas.height = tile.height

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Canvas 2D context is unavailable')
  }

  if (format === 'jpeg') {
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, canvas.width, canvas.height)
  }

  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(
    image.source,
    tile.x,
    tile.y,
    tile.width,
    tile.height,
    0,
    0,
    tile.width,
    tile.height,
  )

  return canvasToBlob(
    canvas,
    MIME_TYPES[format],
    format === 'png' ? undefined : (quality ?? 0.92),
  )
}

/** 一次解码、循环切出所有块，返回带文件名的 Blob 列表 */
export async function renderTiles(
  file: File,
  tiles: readonly Tile[],
  format: OutputFormat,
  quality?: number,
): Promise<TileFile[]> {
  if (tiles.length === 0) {
    throw new Error('At least one tile is required')
  }

  const image = await decodeImageFile(file)
  const extension = format === 'jpeg' ? 'jpg' : format
  const baseName = file.name.replace(/\.[^.]+$/, '')
  const colCount = tiles.filter((tile) => tile.row === 0).length

  try {
    const files: TileFile[] = []
    for (const tile of tiles) {
      const blob = await renderTile(image, tile, format, quality)
      const index = tile.row * colCount + tile.col + 1
      files.push({ name: `${baseName}-${index}.${extension}`, blob })
    }
    return files
  } finally {
    image.close()
  }
}

/** 把切片打包成一个 zip blob，纯本地生成 */
export async function buildTilesZip(files: readonly TileFile[]): Promise<Blob> {
  const zip = new JSZip()
  for (const file of files) {
    zip.file(file.name, file.blob)
  }
  return zip.generateAsync({ type: 'blob' })
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
