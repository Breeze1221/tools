export const GRADIENT_TYPES = ['linear', 'radial', 'conic'] as const
export type GradientType = (typeof GRADIENT_TYPES)[number]

export const RADIAL_SHAPES = ['circle', 'ellipse'] as const
export type RadialShape = (typeof RADIAL_SHAPES)[number]

export const GRADIENT_POSITIONS = [
  'center',
  'top',
  'bottom',
  'left',
  'right',
  'top left',
  'top right',
  'bottom left',
  'bottom right',
] as const
export type GradientPosition = (typeof GRADIENT_POSITIONS)[number]

export const CSS_MODES = ['background', 'background-image'] as const
export type GradientCssMode = (typeof CSS_MODES)[number]

export type GradientStop = {
  readonly id: string
  /** 任意合法 CSS 颜色，UI 层用取色器产出 hex */
  readonly color: string
  /** 位置 0–100（%） */
  readonly position: number
}

export type GradientConfig = {
  readonly type: GradientType
  readonly stops: readonly GradientStop[]
  /** linear 角度（deg） */
  readonly angle: number
  /** radial 形状 */
  readonly shape: RadialShape
  /** radial / conic 圆心 */
  readonly position: GradientPosition
  /** conic 起始角度（deg） */
  readonly startAngle: number
  readonly repeating: boolean
}

export type GradientPreset = {
  readonly id: string
  readonly config: GradientConfig
}

const MAX_ANGLE = 360
const MAX_POSITION = 100

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function round(value: number): number {
  return Math.round(value * 100) / 100
}

function normalizeAngle(angle: number): number {
  if (!Number.isFinite(angle)) {
    throw new Error('Gradient angle must be a finite number')
  }
  return round(((angle % MAX_ANGLE) + MAX_ANGLE) % MAX_ANGLE)
}

/** 色标按位置升序拼接，位置越界时夹到 0–100 */
function serializeStops(stops: readonly GradientStop[]): string {
  if (stops.length < 2) {
    throw new Error('A gradient requires at least 2 color stops')
  }
  return [...stops]
    .sort((a, b) => a.position - b.position)
    .map((stop) => {
      if (stop.color.trim() === '') {
        throw new Error('Color stop color cannot be empty')
      }
      const position = round(clamp(stop.position, 0, MAX_POSITION))
      return `${stop.color.trim()} ${position}%`
    })
    .join(', ')
}

/** 生成不含 `background` 前缀的渐变值，如 `linear-gradient(90deg, #fff 0%, #000 100%)` */
export function buildGradient(config: GradientConfig): string {
  const stops = serializeStops(config.stops)
  const prefix = config.repeating ? 'repeating-' : ''

  if (config.type === 'linear') {
    return `${prefix}linear-gradient(${normalizeAngle(config.angle)}deg, ${stops})`
  }
  if (config.type === 'radial') {
    return `${prefix}radial-gradient(${config.shape} at ${config.position}, ${stops})`
  }
  return `${prefix}conic-gradient(from ${normalizeAngle(config.startAngle)}deg at ${config.position}, ${stops})`
}

/** 生成可直接粘贴的 CSS 声明，如 `background: linear-gradient(...);` */
export function buildGradientCss(config: GradientConfig, mode: GradientCssMode): string {
  return `${mode}: ${buildGradient(config)};`
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomHexColor(): string {
  const value = randomInt(0, 0xffffff)
  return `#${value.toString(16).padStart(6, '0')}`
}

function randomStops(): GradientStop[] {
  const count = randomInt(2, 4)
  return Array.from({ length: count }, (_, index) => ({
    id: `random-${index}`,
    color: randomHexColor(),
    position: Math.round((index / (count - 1)) * MAX_POSITION),
  }))
}

/** 随机渐变：类型、角度、形状与色标都随机，但结构始终合法 */
export function randomGradient(): GradientConfig {
  const type = GRADIENT_TYPES[randomInt(0, GRADIENT_TYPES.length - 1)]
  return {
    type,
    stops: randomStops(),
    angle: randomInt(0, MAX_ANGLE / 15) * 15,
    shape: RADIAL_SHAPES[randomInt(0, RADIAL_SHAPES.length - 1)],
    position: GRADIENT_POSITIONS[randomInt(0, GRADIENT_POSITIONS.length - 1)],
    startAngle: randomInt(0, MAX_ANGLE / 15) * 15,
    repeating: false,
  }
}

function presetStops(id: string, colors: readonly string[]): GradientStop[] {
  return colors.map((color, index) => ({
    id: `${id}-${index}`,
    color,
    position: Math.round((index / (colors.length - 1)) * MAX_POSITION),
  }))
}

/** 内置预设：日出 / 海洋 / 霓虹 / 极简 */
export const gradientPresets: readonly GradientPreset[] = [
  {
    id: 'sunrise',
    config: {
      type: 'linear',
      stops: presetStops('sunrise', ['#ff9a44', '#ff6a88', '#ffd452']),
      angle: 45,
      shape: 'circle',
      position: 'center',
      startAngle: 0,
      repeating: false,
    },
  },
  {
    id: 'ocean',
    config: {
      type: 'linear',
      stops: presetStops('ocean', ['#2e3192', '#1bffff']),
      angle: 135,
      shape: 'ellipse',
      position: 'center',
      startAngle: 0,
      repeating: false,
    },
  },
  {
    id: 'neon',
    config: {
      type: 'linear',
      stops: presetStops('neon', ['#ff00cc', '#3333ff', '#00ffea']),
      angle: 90,
      shape: 'circle',
      position: 'center',
      startAngle: 0,
      repeating: false,
    },
  },
  {
    id: 'minimal',
    config: {
      type: 'linear',
      stops: presetStops('minimal', ['#f5f7fa', '#c3cfe2']),
      angle: 180,
      shape: 'ellipse',
      position: 'center',
      startAngle: 0,
      repeating: false,
    },
  },
]
