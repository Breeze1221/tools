export const CSS_UNITS = ['px', 'rem', 'em', 'pt', '%', 'vw', 'vh', 'vmin', 'vmax'] as const

export type CssUnit = (typeof CSS_UNITS)[number]

export type UnitConfig = {
  /** 根字号（1rem 对应的 px） */
  rootFontSize: number
  /** 父字号（1em 对应的 px） */
  parentFontSize: number
  viewportWidth: number
  viewportHeight: number
}

export const DEFAULT_UNIT_CONFIG: UnitConfig = {
  rootFontSize: 16,
  parentFontSize: 16,
  viewportWidth: 1920,
  viewportHeight: 1080,
}

function assertConfig(config: UnitConfig): void {
  for (const value of [
    config.rootFontSize,
    config.parentFontSize,
    config.viewportWidth,
    config.viewportHeight,
  ]) {
    if (!Number.isFinite(value) || value <= 0) {
      throw new Error('Root font size, parent font size and viewport size must be positive numbers')
    }
  }
}

function isCssUnit(unit: string): unit is CssUnit {
  return (CSS_UNITS as readonly string[]).includes(unit)
}

function toPx(value: number, unit: CssUnit, config: UnitConfig): number {
  const shorterSide = Math.min(config.viewportWidth, config.viewportHeight)
  const longerSide = Math.max(config.viewportWidth, config.viewportHeight)

  switch (unit) {
    case 'px':
      return value
    case 'rem':
      return value * config.rootFontSize
    case 'em':
      return value * config.parentFontSize
    case 'pt':
      return value / 0.75
    case '%':
      return (value / 100) * config.parentFontSize
    case 'vw':
      return (value / 100) * config.viewportWidth
    case 'vh':
      return (value / 100) * config.viewportHeight
    case 'vmin':
      return (value / 100) * shorterSide
    case 'vmax':
      return (value / 100) * longerSide
  }
}

function fromPx(px: number, unit: CssUnit, config: UnitConfig): number {
  const shorterSide = Math.min(config.viewportWidth, config.viewportHeight)
  const longerSide = Math.max(config.viewportWidth, config.viewportHeight)

  switch (unit) {
    case 'px':
      return px
    case 'rem':
      return px / config.rootFontSize
    case 'em':
      return px / config.parentFontSize
    case 'pt':
      return px * 0.75
    case '%':
      return (px / config.parentFontSize) * 100
    case 'vw':
      return (px / config.viewportWidth) * 100
    case 'vh':
      return (px / config.viewportHeight) * 100
    case 'vmin':
      return (px / shorterSide) * 100
    case 'vmax':
      return (px / longerSide) * 100
  }
}

/** 把一个值换算成全部 CSS 单位，键为 `px` / `rem` / `em` / `pt` / `%` / `vw` / `vh` / `vmin` / `vmax` */
export function convertUnits(
  value: number,
  unit: string,
  config: UnitConfig = DEFAULT_UNIT_CONFIG,
): Record<string, number> {
  if (!Number.isFinite(value)) {
    throw new Error('Value must be a finite number')
  }
  if (!isCssUnit(unit)) {
    throw new Error(`Unknown unit: ${unit}`)
  }
  assertConfig(config)

  const px = toPx(value, unit, config)
  return Object.fromEntries(CSS_UNITS.map((target) => [target, fromPx(px, target, config)]))
}

/** 保留 4 位小数并去掉尾随 0；-0 归一为 0 */
export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) {
    return ''
  }
  const rounded = Number(value.toFixed(4))
  return Object.is(rounded, -0) ? '0' : String(rounded)
}
