export const GRID_UNITS = ['fr', 'px'] as const
export type GridUnit = (typeof GRID_UNITS)[number]

export const GRID_AUTO_FLOW = ['row', 'column', 'row dense', 'column dense'] as const
export type GridAutoFlow = (typeof GRID_AUTO_FLOW)[number]

export const GRID_ALIGN = ['stretch', 'start', 'end', 'center'] as const
export type GridAlign = (typeof GRID_ALIGN)[number]

export const GRID_LIMITS = {
  columns: { min: 1, max: 12 },
  rows: { min: 1, max: 12 },
  gap: { min: 0, max: 120 },
  trackSize: { fr: { min: 1, max: 6 }, px: { min: 10, max: 400 } },
} as const

export type GridConfig = {
  /** 列数 1–12 */
  readonly columns: number
  /** 行数 1–12 */
  readonly rows: number
  readonly unit: GridUnit
  /** 单条轨道尺寸：fr 时为份数，px 时为像素 */
  readonly trackSize: number
  /** 自定义 grid-template-columns，填写后优先于列数 */
  readonly customColumns: string
  /** 间距（px），超出范围会被夹紧 */
  readonly gap: number
  readonly autoFlow: GridAutoFlow
  readonly justifyItems: GridAlign
  readonly alignItems: GridAlign
}

function includes<T extends string>(values: readonly T[], value: string): value is T {
  return (values as readonly string[]).includes(value)
}

function assertIntegerInRange(value: number, min: number, max: number, label: string): number {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${label} must be an integer between ${min} and ${max}`)
  }
  return value
}

function clampGap(gap: number): number {
  if (!Number.isFinite(gap)) {
    throw new Error('Gap must be a finite number')
  }
  return Math.min(GRID_LIMITS.gap.max, Math.max(GRID_LIMITS.gap.min, Math.round(gap)))
}

function sanitizeCustomTrack(track: string): string {
  const text = track.trim()
  if (text === '') {
    return ''
  }
  if (/[;{}]/.test(text)) {
    throw new Error('Custom track contains invalid characters')
  }
  return text
}

/** 单条轨道值，如 `1fr` 或 `200px` */
export function generateTrack(value: number, unit: GridUnit): string {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error('Track size must be a positive number')
  }
  return `${Math.round(value * 100) / 100}${unit}`
}

function trackTemplate(config: GridConfig): string {
  const custom = sanitizeCustomTrack(config.customColumns)
  if (custom !== '') {
    return custom
  }
  const range = GRID_LIMITS.trackSize[config.unit]
  if (!Number.isFinite(config.trackSize)) {
    throw new Error('Track size must be a finite number')
  }
  const size = Math.min(range.max, Math.max(range.min, config.trackSize))
  return `repeat(${config.columns}, ${generateTrack(size, config.unit)})`
}

function normalizeConfig(config: GridConfig): GridConfig {
  if (!includes(GRID_UNITS, config.unit)) {
    throw new Error(`Invalid grid unit: ${String(config.unit)}`)
  }
  if (!includes(GRID_AUTO_FLOW, config.autoFlow)) {
    throw new Error(`Invalid grid-auto-flow: ${String(config.autoFlow)}`)
  }
  if (!includes(GRID_ALIGN, config.justifyItems)) {
    throw new Error(`Invalid justify-items: ${String(config.justifyItems)}`)
  }
  if (!includes(GRID_ALIGN, config.alignItems)) {
    throw new Error(`Invalid align-items: ${String(config.alignItems)}`)
  }
  return {
    ...config,
    columns: assertIntegerInRange(
      config.columns,
      GRID_LIMITS.columns.min,
      GRID_LIMITS.columns.max,
      'Columns',
    ),
    rows: assertIntegerInRange(config.rows, GRID_LIMITS.rows.min, GRID_LIMITS.rows.max, 'Rows'),
    gap: clampGap(config.gap),
  }
}

/** 预览用的样式对象 */
export function buildGridStyle(config: GridConfig): Record<string, string> {
  const normalized = normalizeConfig(config)
  const template = trackTemplate(normalized)
  return {
    display: 'grid',
    gridTemplateColumns: template,
    gridTemplateRows: `repeat(${normalized.rows}, ${generateTrack(
      normalized.unit === 'px' ? 80 : 1,
      normalized.unit === 'px' ? 'px' : 'fr',
    )})`,
    gap: `${normalized.gap}px`,
    gridAutoFlow: normalized.autoFlow,
    justifyItems: normalized.justifyItems,
    alignItems: normalized.alignItems,
  }
}

/** 生成 `.container { ... }` CSS 片段 */
export function buildGridCss(config: GridConfig): string {
  const normalized = normalizeConfig(config)
  const template = trackTemplate(normalized)
  return [
    '.container {',
    '  display: grid;',
    `  grid-template-columns: ${template};`,
    `  grid-template-rows: repeat(${normalized.rows}, ${generateTrack(
      normalized.unit === 'px' ? 80 : 1,
      normalized.unit === 'px' ? 'px' : 'fr',
    )});`,
    `  gap: ${normalized.gap}px;`,
    `  grid-auto-flow: ${normalized.autoFlow};`,
    `  justify-items: ${normalized.justifyItems};`,
    `  align-items: ${normalized.alignItems};`,
    '}',
  ].join('\n')
}
