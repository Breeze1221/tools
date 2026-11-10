/**
 * 本文件是工具里唯一允许接触 DOM / Canvas 的地方：
 * 读取用户选择的图片，按最长边缩放到采样尺寸后返回 RGBA 像素。
 */

export type SampledImage = {
  pixels: Uint8ClampedArray
  width: number
  height: number
  sourceWidth: number
  sourceHeight: number
}

type DecodedImage = {
  source: CanvasImageSource
  width: number
  height: number
  close: () => void
}

/** 统计主色只需很小的采样面：最长边超过这个值就继续缩小 */
export const MAX_SAMPLE_SIDE = 200

export async function sampleImage(file: File, maxSide = MAX_SAMPLE_SIDE): Promise<SampledImage> {
  if (!file.type.startsWith('image/')) {
    throw new Error('The selected file is not an image')
  }
  if (!Number.isInteger(maxSide) || maxSide <= 0) {
    throw new Error(`Invalid max side: ${maxSide}`)
  }

  const decoded = await decodeImage(file)

  try {
    const scale = Math.min(1, maxSide / Math.max(decoded.width, decoded.height))
    const width = Math.max(1, Math.round(decoded.width * scale))
    const height = Math.max(1, Math.round(decoded.height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) {
      throw new Error('Canvas 2D context is unavailable')
    }

    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    context.drawImage(decoded.source, 0, 0, width, height)

    const imageData = context.getImageData(0, 0, width, height)
    return {
      pixels: imageData.data,
      width,
      height,
      sourceWidth: decoded.width,
      sourceHeight: decoded.height,
    }
  } finally {
    decoded.close()
  }
}

async function decodeImage(file: File): Promise<DecodedImage> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        close: () => bitmap.close(),
      }
    } catch {
      // 某些浏览器对 imageOrientation 选项或该格式支持不好，退回 <img> 解码
    }
  }

  const url = URL.createObjectURL(file)
  try {
    const image = await loadImage(url)
    return {
      source: image,
      width: image.naturalWidth || image.width,
      height: image.naturalHeight || image.height,
      close: () => undefined,
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
