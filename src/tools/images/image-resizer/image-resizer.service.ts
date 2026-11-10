/** 画布与目标尺寸的硬上限，避免超出浏览器可分配的画布大小 */
export const MAX_DIMENSION = 12000

/** 百分比缩放的常用档位（UI 以快捷按钮呈现） */
export const RESIZE_PERCENT_PRESETS = [25, 50, 75, 100] as const

/** exact：给定宽高；fit：等比装进框；cover：等比填满框；percent：按百分比缩放 */
export type ResizeMode = 'exact' | 'fit' | 'cover' | 'percent'

export type ImageSize = {
  readonly width: number
  readonly height: number
}

export type ResizeOptions = {
  readonly mode: ResizeMode
  readonly width?: number
  readonly height?: number
  readonly percent?: number
  /** 默认 true；为 false 时等比模式不会放大原图 */
  readonly allowUpscale?: boolean
}

function isPositive(value: number | undefined): value is number {
  return value !== undefined && Number.isFinite(value) && value > 0
}

function toDimension(value: number): number {
  const rounded = Math.max(1, Math.round(value))
  if (rounded > MAX_DIMENSION) {
    throw new Error(`Target dimension exceeds the ${MAX_DIMENSION}px limit`)
  }
  return rounded
}

function assertSourceSize(source: ImageSize): void {
  if (!isPositive(source.width) || !isPositive(source.height)) {
    throw new Error('Source width and height must be positive numbers')
  }
}

/**
 * 计算缩放后的目标尺寸。返回值恒为整数且至少 1px；
 * allowUpscale=false 只作用于等比模式（fit / cover / percent），exact 由调用方显式指定。
 */
export function computeTargetSize(source: ImageSize, options: ResizeOptions): ImageSize {
  assertSourceSize(source)

  if (options.mode === 'exact') {
    if (!isPositive(options.width) || !isPositive(options.height)) {
      throw new Error('Exact mode requires positive width and height')
    }
    return { width: toDimension(options.width), height: toDimension(options.height) }
  }

  let scale: number

  if (options.mode === 'percent') {
    if (!isPositive(options.percent)) {
      throw new Error('Percent must be a positive number')
    }
    scale = options.percent / 100
  } else {
    if (!isPositive(options.width) || !isPositive(options.height)) {
      throw new Error(`${options.mode} mode requires positive width and height`)
    }
    const horizontal = options.width / source.width
    const vertical = options.height / source.height
    scale = options.mode === 'fit' ? Math.min(horizontal, vertical) : Math.max(horizontal, vertical)
  }

  if (options.allowUpscale === false) {
    scale = Math.min(scale, 1)
  }

  return {
    width: toDimension(source.width * scale),
    height: toDimension(source.height * scale),
  }
}

/** 校验输入框里的尺寸字符串：必须是 1–MAX_DIMENSION 的整数 */
export function parseDimension(raw: string): number {
  const value = raw.trim()
  if (value === '') {
    throw new Error('Dimension is required')
  }
  if (!/^\d+$/.test(value)) {
    throw new Error(`Dimension must be a positive integer, received "${value}"`)
  }
  const parsed = Number(value)
  if (parsed < 1) {
    throw new Error('Dimension must be at least 1')
  }
  if (parsed > MAX_DIMENSION) {
    throw new Error(`Dimension must not exceed ${MAX_DIMENSION}`)
  }
  return parsed
}
