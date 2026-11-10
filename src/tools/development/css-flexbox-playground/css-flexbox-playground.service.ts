export const FLEX_DIRECTIONS = ['row', 'row-reverse', 'column', 'column-reverse'] as const
export type FlexDirection = (typeof FLEX_DIRECTIONS)[number]

export const FLEX_WRAPS = ['nowrap', 'wrap', 'wrap-reverse'] as const
export type FlexWrap = (typeof FLEX_WRAPS)[number]

export const FLEX_JUSTIFY_CONTENT = [
  'flex-start',
  'flex-end',
  'center',
  'space-between',
  'space-around',
  'space-evenly',
] as const
export type FlexJustifyContent = (typeof FLEX_JUSTIFY_CONTENT)[number]

export const FLEX_ALIGN_ITEMS = ['stretch', 'flex-start', 'flex-end', 'center', 'baseline'] as const
export type FlexAlignItems = (typeof FLEX_ALIGN_ITEMS)[number]

export const FLEX_ALIGN_CONTENT = [
  'stretch',
  'flex-start',
  'flex-end',
  'center',
  'space-between',
  'space-around',
] as const
export type FlexAlignContent = (typeof FLEX_ALIGN_CONTENT)[number]

export const FLEX_OPTIONS = {
  direction: FLEX_DIRECTIONS,
  wrap: FLEX_WRAPS,
  justifyContent: FLEX_JUSTIFY_CONTENT,
  alignItems: FLEX_ALIGN_ITEMS,
  alignContent: FLEX_ALIGN_CONTENT,
} as const

export const FLEX_GAP_RANGE = { min: 0, max: 120 } as const
export const FLEX_CHILD_RANGE = { min: 1, max: 24 } as const

export type FlexConfig = {
  readonly direction: FlexDirection
  readonly wrap: FlexWrap
  readonly justifyContent: FlexJustifyContent
  readonly alignItems: FlexAlignItems
  readonly alignContent: FlexAlignContent
  /** 子项间距（px），超出范围会被夹紧 */
  readonly gap: number
  /** 子项数量，必须为 1–24 的整数 */
  readonly children: number
}

export type FlexPreset = {
  readonly id: string
  readonly config: FlexConfig
}

function includes<T extends string>(values: readonly T[], value: string): value is T {
  return (values as readonly string[]).includes(value)
}

/** 夹紧 gap 到合法区间；非数字直接报错 */
function clampGap(gap: number): number {
  if (!Number.isFinite(gap)) {
    throw new Error('Gap must be a finite number')
  }
  return Math.min(FLEX_GAP_RANGE.max, Math.max(FLEX_GAP_RANGE.min, Math.round(gap)))
}

function normalizeConfig(config: FlexConfig): FlexConfig {
  if (!includes(FLEX_DIRECTIONS, config.direction)) {
    throw new Error(`Invalid flex direction: ${String(config.direction)}`)
  }
  if (!includes(FLEX_WRAPS, config.wrap)) {
    throw new Error(`Invalid flex wrap: ${String(config.wrap)}`)
  }
  if (!includes(FLEX_JUSTIFY_CONTENT, config.justifyContent)) {
    throw new Error(`Invalid justify-content: ${String(config.justifyContent)}`)
  }
  if (!includes(FLEX_ALIGN_ITEMS, config.alignItems)) {
    throw new Error(`Invalid align-items: ${String(config.alignItems)}`)
  }
  if (!includes(FLEX_ALIGN_CONTENT, config.alignContent)) {
    throw new Error(`Invalid align-content: ${String(config.alignContent)}`)
  }
  if (!Number.isInteger(config.children) || config.children < 1) {
    throw new Error('At least one child is required')
  }
  return {
    ...config,
    gap: clampGap(config.gap),
    children: Math.min(FLEX_CHILD_RANGE.max, config.children),
  }
}

/** 生成可直接用于预览的样式对象（kebab 风格的 CSS 值） */
export function buildFlexStyle(config: FlexConfig): Record<string, string> {
  const normalized = normalizeConfig(config)
  return {
    display: 'flex',
    flexDirection: normalized.direction,
    flexWrap: normalized.wrap,
    justifyContent: normalized.justifyContent,
    alignItems: normalized.alignItems,
    alignContent: normalized.alignContent,
    gap: `${normalized.gap}px`,
  }
}

/** 生成 `.container { ... }` CSS 片段 */
export function buildFlexCss(config: FlexConfig): string {
  const normalized = normalizeConfig(config)
  return [
    '.container {',
    '  display: flex;',
    `  flex-direction: ${normalized.direction};`,
    `  flex-wrap: ${normalized.wrap};`,
    `  justify-content: ${normalized.justifyContent};`,
    `  align-items: ${normalized.alignItems};`,
    `  align-content: ${normalized.alignContent};`,
    `  gap: ${normalized.gap}px;`,
    '}',
  ].join('\n')
}

/** 内置布局预设：居中、横向列表、卡片网格与两端对齐 */
export const FLEX_PRESETS: readonly FlexPreset[] = [
  {
    id: 'center',
    config: {
      direction: 'row',
      wrap: 'nowrap',
      justifyContent: 'center',
      alignItems: 'center',
      alignContent: 'stretch',
      gap: 12,
      children: 3,
    },
  },
  {
    id: 'horizontal-list',
    config: {
      direction: 'row',
      wrap: 'nowrap',
      justifyContent: 'flex-start',
      alignItems: 'center',
      alignContent: 'stretch',
      gap: 16,
      children: 4,
    },
  },
  {
    id: 'card-grid',
    config: {
      direction: 'row',
      wrap: 'wrap',
      justifyContent: 'flex-start',
      alignItems: 'stretch',
      alignContent: 'flex-start',
      gap: 16,
      children: 6,
    },
  },
  {
    id: 'space-between',
    config: {
      direction: 'row',
      wrap: 'nowrap',
      justifyContent: 'space-between',
      alignItems: 'center',
      alignContent: 'stretch',
      gap: 12,
      children: 3,
    },
  },
]
