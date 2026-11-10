/**
 * 本文件是工具里唯一允许接触 DOM / Canvas 的地方：
 * 把用户选择的图片按目标尺寸栅格化成 PNG，并提供浏览器下载。
 */

type LoadedImage = {
  image: HTMLImageElement
  width: number
  height: number
}

const FALLBACK_SIZE = 300
const SVG_MIME = 'image/svg+xml'

/** 把图片文件按正方形画布栅格化成 PNG（等比缩放、居中、透明留白） */
export async function renderPng(file: File, size: number): Promise<Blob> {
  if (!Number.isInteger(size) || size <= 0) {
    throw new Error(`Invalid favicon size: ${size}`)
  }

  const source = await loadImageSource(file)
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Canvas 2D context is unavailable')
  }

  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'

  const scale = Math.min(size / source.width, size / source.height)
  const width = Math.max(1, Math.round(source.width * scale))
  const height = Math.max(1, Math.round(source.height * scale))
  const x = Math.round((size - width) / 2)
  const y = Math.round((size - height) / 2)
  context.drawImage(source.image, x, y, width, height)

  return canvasToBlob(canvas)
}

async function loadImageSource(file: File): Promise<LoadedImage> {
  const isSvg = file.type === SVG_MIME || /\.svg$/i.test(file.name)
  const url = isSvg ? await createNormalizedSvgUrl(file) : URL.createObjectURL(file)

  try {
    const image = await loadImage(url)
    return {
      image,
      width: image.naturalWidth || image.width || FALLBACK_SIZE,
      height: image.naturalHeight || image.height || FALLBACK_SIZE,
    }
  } finally {
    URL.revokeObjectURL(url)
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

/**
 * SVG 没有显式宽度时浏览器会按 300×150 渲染，直接拿来画会带一圈透明留白。
 * 这里按 viewBox 补上 width / height，让浏览器按真实比例给出固有尺寸。
 */
async function createNormalizedSvgUrl(file: File): Promise<string> {
  const text = await file.text()
  const normalized = normalizeSvg(text)
  return URL.createObjectURL(new Blob([normalized], { type: SVG_MIME }))
}

function normalizeSvg(text: string): string {
  const documentNode = new DOMParser().parseFromString(text, SVG_MIME)
  const root = documentNode.documentElement
  if (root.nodeName.toLowerCase() !== 'svg') {
    return text
  }

  const viewBox = (root.getAttribute('viewBox') ?? '')
    .trim()
    .split(/[\s,]+/)
    .filter(Boolean)
    .map(Number)
  const viewWidth = viewBox.length === 4 ? viewBox[2] : undefined
  const viewHeight = viewBox.length === 4 ? viewBox[3] : undefined
  const hasViewBox =
    viewWidth !== undefined &&
    viewHeight !== undefined &&
    Number.isFinite(viewWidth) &&
    Number.isFinite(viewHeight) &&
    viewWidth > 0 &&
    viewHeight > 0

  const attrWidth = parseSvgLength(root.getAttribute('width'))
  const attrHeight = parseSvgLength(root.getAttribute('height'))

  let width = attrWidth
  let height = attrHeight
  if (width === undefined && height === undefined) {
    width = hasViewBox ? viewWidth : FALLBACK_SIZE
    height = hasViewBox ? viewHeight : FALLBACK_SIZE
  } else if (height === undefined) {
    height =
      width !== undefined && hasViewBox && viewWidth !== undefined && viewHeight !== undefined
        ? (width * viewHeight) / viewWidth
        : width
  } else if (width === undefined) {
    width =
      height !== undefined && hasViewBox && viewWidth !== undefined && viewHeight !== undefined
        ? (height * viewWidth) / viewHeight
        : height
  }

  if (width !== undefined && height !== undefined) {
    root.setAttribute('width', String(width))
    root.setAttribute('height', String(height))
  }
  root.setAttribute('preserveAspectRatio', 'xMidYMid meet')

  return new XMLSerializer().serializeToString(root)
}

function parseSvgLength(value: string | null): number | undefined {
  if (value === null || value.trim() === '' || value.trim().endsWith('%')) {
    return undefined
  }
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
        return
      }
      reject(new Error('Failed to encode PNG'))
    }, 'image/png')
  })
}
