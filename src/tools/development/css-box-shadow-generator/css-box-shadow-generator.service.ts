export type ShadowLayer = {
  readonly id: string
  /** Horizontal offset in px */
  readonly x: number
  /** Vertical offset in px */
  readonly y: number
  /** Blur radius in px */
  readonly blur: number
  /** Spread radius in px */
  readonly spread: number
  /** Base color as `#rgb` or `#rrggbb` */
  readonly color: string
  /** Opacity 0–1 */
  readonly opacity: number
  readonly inset: boolean
}

export type ShadowMode = 'box-shadow' | 'filter'
export const SHADOW_MODES = ['box-shadow', 'filter'] as const

export type ShadowPreset = {
  readonly id: string
  readonly layers: readonly ShadowLayer[]
}

export const MAX_SHADOW_LAYERS = 6

/** Slider and clamp ranges, shared by the UI and the service */
export const SHADOW_LIMITS = {
  offset: 100,
  blur: 200,
  spread: 100,
} as const

const HEX_COLOR = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function round(value: number, digits = 0): number {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

function toInteger(value: number, fallback = 0): number {
  return Number.isFinite(value) ? Math.round(value) : fallback
}

/** Expand `#rgb` / `#rrggbb` into its three channels; invalid input throws */
function readHex(hex: string): [number, number, number] {
  const match = HEX_COLOR.exec(hex.trim())
  if (!match) {
    throw new Error(`Invalid hex color: ${hex}`)
  }
  const digits = match[1] ?? ''
  const full =
    digits.length === 3
      ? digits
          .split('')
          .map((digit) => digit + digit)
          .join('')
      : digits
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ]
}

/** `#rrggbb` + 0–1 opacity → `rgba(r, g, b, a)` */
export function hexToRgba(hex: string, opacity: number): string {
  const [r, g, b] = readHex(hex)
  const alpha = round(clamp(Number.isFinite(opacity) ? opacity : 0, 0, 1), 2)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/** Normalize one layer: clamp ranges, round numbers, repair invalid colors */
export function clampLayer(layer: ShadowLayer): ShadowLayer {
  return {
    id: layer.id,
    x: clamp(toInteger(layer.x), -SHADOW_LIMITS.offset, SHADOW_LIMITS.offset),
    y: clamp(toInteger(layer.y), -SHADOW_LIMITS.offset, SHADOW_LIMITS.offset),
    blur: clamp(toInteger(layer.blur), 0, SHADOW_LIMITS.blur),
    spread: clamp(toInteger(layer.spread), -SHADOW_LIMITS.spread, SHADOW_LIMITS.spread),
    color: HEX_COLOR.test(layer.color.trim()) ? layer.color.trim().toLowerCase() : '#000000',
    opacity: round(clamp(Number.isFinite(layer.opacity) ? layer.opacity : 0, 0, 1), 2),
    inset: layer.inset,
  }
}

/** A sensible default layer; `index` only seeds the id so lists stay unique */
export function createLayer(index = 0): ShadowLayer {
  return {
    id: `layer-${index}`,
    x: 0,
    y: 4,
    blur: 12,
    spread: 0,
    color: '#000000',
    opacity: 0.25,
    inset: false,
  }
}

/**
 * Build the `box-shadow` value (without the declaration) from layers,
 * preserving their order. Empty input throws because CSS cannot express it.
 */
export function buildBoxShadow(layers: readonly ShadowLayer[]): string {
  if (layers.length === 0) {
    throw new Error('At least one shadow layer is required')
  }
  return layers
    .map((layer) => {
      const normalized = clampLayer(layer)
      const inset = normalized.inset ? 'inset ' : ''
      const color = hexToRgba(normalized.color, normalized.opacity)
      return `${inset}${normalized.x}px ${normalized.y}px ${normalized.blur}px ${normalized.spread}px ${color}`
    })
    .join(', ')
}

/**
 * Build a full CSS declaration.
 *
 * `filter: drop-shadow()` has no spread radius and no `inset` keyword, so those
 * two properties are intentionally ignored in `filter` mode (the UI explains this).
 */
export function buildBoxShadowCss(layers: readonly ShadowLayer[], mode: ShadowMode): string {
  if (layers.length === 0) {
    throw new Error('At least one shadow layer is required')
  }
  if (mode === 'filter') {
    const value = layers
      .map((layer) => {
        const normalized = clampLayer(layer)
        const color = hexToRgba(normalized.color, normalized.opacity)
        return `drop-shadow(${normalized.x}px ${normalized.y}px ${normalized.blur}px ${color})`
      })
      .join(' ')
    return `filter: ${value};`
  }
  return `box-shadow: ${buildBoxShadow(layers)};`
}

/** Built-in looks: Material elevation, soft, inset, neon, hard and floating */
export const SHADOW_PRESETS: readonly ShadowPreset[] = [
  {
    id: 'material',
    layers: [
      {
        id: 'material-1',
        x: 0,
        y: 1,
        blur: 3,
        spread: 0,
        color: '#000000',
        opacity: 0.12,
        inset: false,
      },
      {
        id: 'material-2',
        x: 0,
        y: 1,
        blur: 2,
        spread: 0,
        color: '#000000',
        opacity: 0.24,
        inset: false,
      },
    ],
  },
  {
    id: 'soft',
    layers: [
      {
        id: 'soft-1',
        x: 0,
        y: 10,
        blur: 25,
        spread: -5,
        color: '#000000',
        opacity: 0.15,
        inset: false,
      },
    ],
  },
  {
    id: 'inset',
    layers: [
      {
        id: 'inset-1',
        x: 0,
        y: 2,
        blur: 4,
        spread: 0,
        color: '#000000',
        opacity: 0.2,
        inset: true,
      },
    ],
  },
  {
    id: 'neon',
    layers: [
      {
        id: 'neon-1',
        x: 0,
        y: 0,
        blur: 12,
        spread: 2,
        color: '#00e5ff',
        opacity: 0.9,
        inset: false,
      },
      {
        id: 'neon-2',
        x: 0,
        y: 0,
        blur: 32,
        spread: 6,
        color: '#00e5ff',
        opacity: 0.6,
        inset: false,
      },
    ],
  },
  {
    id: 'hard',
    layers: [
      {
        id: 'hard-1',
        x: 4,
        y: 4,
        blur: 0,
        spread: 0,
        color: '#000000',
        opacity: 0.9,
        inset: false,
      },
    ],
  },
  {
    id: 'floating',
    layers: [
      {
        id: 'floating-1',
        x: 0,
        y: 20,
        blur: 40,
        spread: -10,
        color: '#000000',
        opacity: 0.3,
        inset: false,
      },
      {
        id: 'floating-2',
        x: 0,
        y: 8,
        blur: 16,
        spread: -6,
        color: '#000000',
        opacity: 0.2,
        inset: false,
      },
    ],
  },
]
