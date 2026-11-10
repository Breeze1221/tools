/** 顺时针旋转的四个合法档位 */
export const ROTATION_STEPS = [0, 90, 180, 270] as const

export type Rotation = (typeof ROTATION_STEPS)[number]

/** 翻转组合（UI 用两个开关表示，导出为单个模式便于 render 层使用） */
export const FLIP_MODES = ['none', 'horizontal', 'vertical', 'both'] as const

export type FlipMode = (typeof FLIP_MODES)[number]

export type ImageSize = {
  readonly width: number
  readonly height: number
}

/** 校验图片尺寸：必须是正数，返回取整后的尺寸 */
export function assertValidSize(source: ImageSize): ImageSize {
  if (
    !Number.isFinite(source.width) ||
    !Number.isFinite(source.height) ||
    source.width <= 0 ||
    source.height <= 0
  ) {
    throw new Error('Image width and height must be positive numbers')
  }
  return { width: Math.round(source.width), height: Math.round(source.height) }
}

/** 把任意角度归一化到 0 / 90 / 180 / 270；非 90 的倍数或非有限值抛错 */
export function normalizeRotation(deg: number): Rotation {
  if (!Number.isFinite(deg)) {
    throw new Error(`Rotation must be a finite number, received ${String(deg)}`)
  }
  const normalized = ((deg % 360) + 360) % 360
  if (normalized % 90 !== 0) {
    throw new Error(`Rotation must be a multiple of 90 degrees, received ${String(deg)}`)
  }
  return normalized as Rotation
}

/** 旋转后的画布尺寸：90 / 270 时宽高互换 */
export function rotateDimensions(source: ImageSize, rotation: number): ImageSize {
  const size = assertValidSize(source)
  const deg = normalizeRotation(rotation)
  return deg === 90 || deg === 270
    ? { width: size.height, height: size.width }
    : { width: size.width, height: size.height }
}

/** 把 UI 的两个翻转开关合成一个模式 */
export function flipFromSwitches(flipHorizontal: boolean, flipVertical: boolean): FlipMode {
  if (flipHorizontal && flipVertical) return 'both'
  if (flipHorizontal) return 'horizontal'
  if (flipVertical) return 'vertical'
  return 'none'
}
