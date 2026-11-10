export type FilterConfig = {
  /** 亮度，百分比 */
  brightness: number
  /** 对比度，百分比 */
  contrast: number
  /** 饱和度，百分比 */
  saturate: number
  /** 色相旋转，角度 */
  hueRotate: number
  /** 灰度，百分比 */
  grayscale: number
  /** 褐色，百分比 */
  sepia: number
  /** 模糊半径，px */
  blur: number
}

export type FilterKey = keyof FilterConfig

export type FilterRange = {
  readonly min: number
  readonly max: number
}

/** 参数顺序同时也是 CSS filter 的拼接顺序 */
export const FILTER_KEYS = [
  'brightness',
  'contrast',
  'saturate',
  'hueRotate',
  'grayscale',
  'sepia',
  'blur',
] as const

export const FILTER_DEFAULTS: FilterConfig = {
  brightness: 100,
  contrast: 100,
  saturate: 100,
  hueRotate: 0,
  grayscale: 0,
  sepia: 0,
  blur: 0,
}

export const FILTER_RANGES: Record<FilterKey, FilterRange> = {
  brightness: { min: 0, max: 200 },
  contrast: { min: 0, max: 200 },
  saturate: { min: 0, max: 200 },
  hueRotate: { min: -180, max: 180 },
  grayscale: { min: 0, max: 100 },
  sepia: { min: 0, max: 100 },
  blur: { min: 0, max: 20 },
}

export type FilterPreset = {
  readonly id: string
  readonly config: FilterConfig
}

const preset = (id: string, overrides: Partial<FilterConfig>): FilterPreset => ({
  id,
  config: { ...FILTER_DEFAULTS, ...overrides },
})

/** 一键预设，id 用于 i18n 键名 `preset.<id>` */
export const FILTER_PRESETS: readonly FilterPreset[] = [
  preset('original', {}),
  preset('mono', { grayscale: 100, contrast: 110 }),
  preset('vintage', { sepia: 60, contrast: 110, saturate: 85, brightness: 105 }),
  preset('cool', { hueRotate: -20, saturate: 120, brightness: 105 }),
  preset('warm', { hueRotate: 15, sepia: 25, saturate: 115, brightness: 105 }),
  preset('drama', { contrast: 140, saturate: 80, grayscale: 20, brightness: 95 }),
]

/** 把单个参数夹紧到合法范围；非有限值回退到默认值 */
export function clampFilterValue(key: FilterKey, value: number): number {
  const range = FILTER_RANGES[key]
  if (!Number.isFinite(value)) {
    return FILTER_DEFAULTS[key]
  }
  return Math.min(range.max, Math.max(range.min, value))
}

/** 逐项夹紧配置，缺失项使用默认值 */
export function clampFilterConfig(config: Partial<FilterConfig>): FilterConfig {
  const result = {} as FilterConfig
  for (const key of FILTER_KEYS) {
    const value = config[key]
    result[key] = clampFilterValue(key, value ?? FILTER_DEFAULTS[key])
  }
  return result
}

function formatNumber(value: number): string {
  return String(Number(value.toFixed(2)))
}

/**
 * 生成 CSS filter 字符串，参数会先夹紧到合法范围。
 * 顺序固定为 brightness → contrast → saturate → hue-rotate → grayscale → sepia → blur。
 */
export function buildFilter(config: Partial<FilterConfig>): string {
  const value = clampFilterConfig(config)
  return [
    `brightness(${formatNumber(value.brightness)}%)`,
    `contrast(${formatNumber(value.contrast)}%)`,
    `saturate(${formatNumber(value.saturate)}%)`,
    `hue-rotate(${formatNumber(value.hueRotate)}deg)`,
    `grayscale(${formatNumber(value.grayscale)}%)`,
    `sepia(${formatNumber(value.sepia)}%)`,
    `blur(${formatNumber(value.blur)}px)`,
  ].join(' ')
}
