/** 水印九宫格位置（与 UI 的 3 × 3 选择器一一对应） */
export const WATERMARK_ANCHORS = [
  'top-left',
  'top',
  'top-right',
  'left',
  'center',
  'right',
  'bottom-left',
  'bottom',
  'bottom-right',
] as const

export type WatermarkAnchor = (typeof WATERMARK_ANCHORS)[number]

export type WatermarkPosition = {
  x: number
  y: number
}

export type WatermarkPositionInput = {
  canvasW: number
  canvasH: number
  wmW: number
  wmH: number
  anchor: WatermarkAnchor
  margin: number
}

export type TilePositionsInput = {
  canvasW: number
  canvasH: number
  wmW: number
  wmH: number
  gapX?: number
  gapY?: number
}

function assertPositive(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive number, received ${value}`)
  }
}

function clampMargin(margin: number, max: number): number {
  const value = Number.isFinite(margin) ? margin : 0
  return Math.min(Math.max(value, 0), Math.max(0, max))
}

/** 把旋转角度限制在 -90° ~ 90° */
export function clampRotation(rotation: number): number {
  if (!Number.isFinite(rotation)) {
    return 0
  }
  return Math.min(90, Math.max(-90, rotation))
}

/** 校验透明度，非法值抛错（UI 负责把错误翻译成用户文案） */
export function assertValidOpacity(opacity: number): number {
  if (!Number.isFinite(opacity) || opacity < 0 || opacity > 1) {
    throw new Error(`Opacity must be between 0 and 1, received ${opacity}`)
  }
  return opacity
}

/** 校验字号，非法值抛错 */
export function assertValidFontSize(fontSize: number): number {
  if (!Number.isFinite(fontSize) || fontSize <= 0) {
    throw new Error(`Font size must be a positive number, received ${fontSize}`)
  }
  return fontSize
}

/** 校验图片水印缩放比例，非法值抛错 */
export function assertValidScale(scale: number): number {
  if (!Number.isFinite(scale) || scale <= 0) {
    throw new Error(`Scale must be a positive number, received ${scale}`)
  }
  return scale
}

/**
 * 计算水印左上角坐标。margin 会被钳制在 0 与「两侧各一半剩余空间」之间，
 * 因此水印永远不会因为边距过大而跑出画布。
 */
export function computeWatermarkPosition(input: WatermarkPositionInput): WatermarkPosition {
  const { canvasW, canvasH, wmW, wmH, anchor, margin } = input
  assertPositive(canvasW, 'canvasW')
  assertPositive(canvasH, 'canvasH')
  assertPositive(wmW, 'wmW')
  assertPositive(wmH, 'wmH')

  const marginX = clampMargin(margin, (canvasW - wmW) / 2)
  const marginY = clampMargin(margin, (canvasH - wmH) / 2)

  const left = marginX
  const centerX = (canvasW - wmW) / 2
  const right = canvasW - wmW - marginX
  const top = marginY
  const centerY = (canvasH - wmH) / 2
  const bottom = canvasH - wmH - marginY

  const positions: Record<WatermarkAnchor, WatermarkPosition> = {
    'top-left': { x: left, y: top },
    top: { x: centerX, y: top },
    'top-right': { x: right, y: top },
    left: { x: left, y: centerY },
    center: { x: centerX, y: centerY },
    right: { x: right, y: centerY },
    'bottom-left': { x: left, y: bottom },
    bottom: { x: centerX, y: bottom },
    'bottom-right': { x: right, y: bottom },
  }

  const position = positions[anchor]
  if (!position) {
    throw new Error(`Unknown watermark anchor: ${String(anchor)}`)
  }
  return { x: Math.round(position.x), y: Math.round(position.y) }
}

/**
 * 生成平铺水印的网格坐标（每个坐标是水印左上角）。最后一行/列允许被画布裁切。
 */
export function buildTilePositions(input: TilePositionsInput): WatermarkPosition[] {
  const { canvasW, canvasH, wmW, wmH, gapX = 0, gapY = 0 } = input
  assertPositive(canvasW, 'canvasW')
  assertPositive(canvasH, 'canvasH')
  assertPositive(wmW, 'wmW')
  assertPositive(wmH, 'wmH')

  const stepX = wmW + Math.max(0, Number.isFinite(gapX) ? gapX : 0)
  const stepY = wmH + Math.max(0, Number.isFinite(gapY) ? gapY : 0)
  const cols = Math.max(1, Math.ceil(canvasW / stepX))
  const rows = Math.max(1, Math.ceil(canvasH / stepY))

  const positions: WatermarkPosition[] = []
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      positions.push({ x: Math.round(col * stepX), y: Math.round(row * stepY) })
    }
  }
  return positions
}
