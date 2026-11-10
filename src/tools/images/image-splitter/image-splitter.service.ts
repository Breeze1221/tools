/** 行列数上限，避免一次生成过多切片 */
export const MAX_GRID = 10

export type GridPreset = {
  readonly rows: number
  readonly cols: number
}

/** UI 上的等分快捷预设 */
export const SPLIT_PRESETS: readonly GridPreset[] = [
  { rows: 2, cols: 2 },
  { rows: 3, cols: 3 },
  { rows: 4, cols: 4 },
]

export type ImageSize = {
  readonly width: number
  readonly height: number
}

export type Tile = {
  readonly row: number
  readonly col: number
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

function assertGrid(value: number, label: string): number {
  if (!Number.isInteger(value) || value < 1 || value > MAX_GRID) {
    throw new Error(
      `${label} must be an integer between 1 and ${MAX_GRID}, received ${String(value)}`,
    )
  }
  return value
}

function assertSize(source: ImageSize): ImageSize {
  if (
    !Number.isFinite(source.width) ||
    !Number.isFinite(source.height) ||
    source.width < 1 ||
    source.height < 1
  ) {
    throw new Error('Image width and height must be positive numbers')
  }
  return { width: Math.round(source.width), height: Math.round(source.height) }
}

/** 把一条边均分；除不尽的余数全部给最后一段 */
function splitAxis(total: number, parts: number, label: string): number[] {
  const base = Math.floor(total / parts)
  if (base < 1) {
    throw new Error(`Image is too small to be split into ${parts} ${label}`)
  }
  const sizes = Array.from({ length: parts }, () => base)
  sizes[parts - 1] = base + (total - base * parts)
  return sizes
}

/**
 * 按行列切分图片。行列必须为 1–10 的整数，余数分给最后一行 / 最后一列；
 * 任一边小于切分份数时抛错（否则会出现 0px 的切片）。
 */
export function computeTiles(source: ImageSize, rows: number, cols: number): Tile[] {
  const size = assertSize(source)
  const rowCount = assertGrid(rows, 'rows')
  const colCount = assertGrid(cols, 'cols')

  const widths = splitAxis(size.width, colCount, 'columns')
  const heights = splitAxis(size.height, rowCount, 'rows')

  const tiles: Tile[] = []
  let y = 0
  for (let row = 0; row < rowCount; row += 1) {
    let x = 0
    for (let col = 0; col < colCount; col += 1) {
      tiles.push({ row, col, x, y, width: widths[col], height: heights[row] })
      x += widths[col]
    }
    y += heights[row]
  }
  return tiles
}
