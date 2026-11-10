export type FrameConfig = {
  /** 图片与边框之间的留白，px */
  padding: number
  /** 边框宽度，px */
  borderWidth: number
  /** 外框圆角，px */
  radius: number
  /** 阴影模糊半径，px（0 表示不画阴影） */
  shadow: number
  backgroundColor: string
  borderColor: string
}

export const FRAME_DEFAULTS: FrameConfig = {
  padding: 24,
  borderWidth: 8,
  radius: 20,
  shadow: 24,
  backgroundColor: '#ffffff',
  borderColor: '#ffffff',
}

/** 各数值参数的合法上限，超出的输入会被夹紧 */
export const FRAME_LIMITS = {
  padding: 400,
  borderWidth: 100,
  radius: 400,
  shadow: 200,
} as const

export type ImageSize = {
  readonly width: number
  readonly height: number
}

export type FrameSize = {
  /** 画布总宽高（含阴影预留空间） */
  readonly width: number
  readonly height: number
  /** 外框左上角 */
  readonly frameX: number
  readonly frameY: number
  readonly frameWidth: number
  readonly frameHeight: number
  /** 图片绘制区域 */
  readonly imageX: number
  readonly imageY: number
  readonly imageWidth: number
  readonly imageHeight: number
  /** 夹紧后的外框圆角 */
  readonly radius: number
  /** 图片自身的圆角（外框圆角减去边框宽度） */
  readonly imageRadius: number
  readonly shadow: number
  readonly borderWidth: number
}

const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i

/** 校验 hex 颜色（#rgb / #rrggbb / #rrggbbaa），非法抛错 */
export function assertValidColor(color: string, label: string): string {
  const value = color.trim()
  if (!HEX_COLOR.test(value)) {
    throw new Error(`${label} must be a hex color, received "${color}"`)
  }
  return value
}

function clampNumber(value: number, label: string, max: number): number {
  if (!Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number, received ${String(value)}`)
  }
  return Math.min(max, Math.max(0, Math.round(value)))
}

function assertSourceSize(source: ImageSize): ImageSize {
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

/**
 * 计算带边框 / 留白 / 阴影的画布尺寸与各区域位置。
 * 数值参数夹紧到 0–上限，圆角不超过外框短边的一半。
 */
export function computeFrameSize(source: ImageSize, config: FrameConfig): FrameSize {
  const size = assertSourceSize(source)
  const padding = clampNumber(config.padding, 'padding', FRAME_LIMITS.padding)
  const borderWidth = clampNumber(config.borderWidth, 'borderWidth', FRAME_LIMITS.borderWidth)
  const radiusInput = clampNumber(config.radius, 'radius', FRAME_LIMITS.radius)
  const shadow = clampNumber(config.shadow, 'shadow', FRAME_LIMITS.shadow)

  const frameWidth = size.width + 2 * (padding + borderWidth)
  const frameHeight = size.height + 2 * (padding + borderWidth)
  const pad = shadow
  const frameX = pad
  const frameY = pad
  const radius = Math.min(radiusInput, Math.floor(Math.min(frameWidth, frameHeight) / 2))

  return {
    width: frameWidth + pad * 2,
    height: frameHeight + pad * 2,
    frameX,
    frameY,
    frameWidth,
    frameHeight,
    imageX: frameX + padding + borderWidth,
    imageY: frameY + padding + borderWidth,
    imageWidth: size.width,
    imageHeight: size.height,
    radius,
    imageRadius: Math.max(0, radius - borderWidth),
    shadow,
    borderWidth,
  }
}

/** 生成用于 UI 实时预览的 CSS 声明串（与画布绘制保持同样的参数） */
export function buildFrameStyle(config: FrameConfig): string {
  const padding = clampNumber(config.padding, 'padding', FRAME_LIMITS.padding)
  const borderWidth = clampNumber(config.borderWidth, 'borderWidth', FRAME_LIMITS.borderWidth)
  const radius = clampNumber(config.radius, 'radius', FRAME_LIMITS.radius)
  const shadow = clampNumber(config.shadow, 'shadow', FRAME_LIMITS.shadow)
  const backgroundColor = assertValidColor(config.backgroundColor, 'backgroundColor')
  const borderColor = assertValidColor(config.borderColor, 'borderColor')

  const declarations = [
    `padding: ${padding}px`,
    `border: ${borderWidth}px solid ${borderColor}`,
    `border-radius: ${radius}px`,
    `background-color: ${backgroundColor}`,
  ]
  if (shadow > 0) {
    declarations.push(`box-shadow: 0 ${Math.round(shadow / 3)}px ${shadow}px rgba(0, 0, 0, 0.35)`)
  }
  return declarations.join('; ')
}
