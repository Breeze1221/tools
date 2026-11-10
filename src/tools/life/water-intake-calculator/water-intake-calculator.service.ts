export const WATER_CLIMATES = ['cold', 'temperate', 'hot'] as const
export type WaterClimate = (typeof WATER_CLIMATES)[number]

/** 气候修正系数：寒冷 0.95、温和 1、炎热 1.1 */
export const CLIMATE_FACTORS: Record<WaterClimate, number> = {
  cold: 0.95,
  temperate: 1,
  hot: 1.1,
}

/** 每公斤体重的基础饮水量（毫升） */
export const ML_PER_KG = 35
/** 每 30 分钟运动额外补充的水量（毫升） */
export const ML_PER_ACTIVITY_STEP = 350
export const ACTIVITY_STEP_MINUTES = 30
/** 一杯的容量（毫升） */
export const CUP_ML = 250
/** 1 磅 = 0.45359237 公斤 */
const KG_PER_LB = 0.45359237

const MIN_WEIGHT_KG = 20
const MAX_WEIGHT_KG = 400
const MAX_ACTIVITY_MINUTES = 1440

export type WaterIntakeInput = {
  /** 体重（公斤） */
  readonly weightKg: number
  /** 每日运动分钟数，0–1440，默认 0 */
  readonly activityMinutes?: number
  /** 气候，默认 temperate */
  readonly climate?: WaterClimate
}

export type WaterIntakeResult = {
  /** 建议饮水量（毫升，取整到 10） */
  readonly milliliters: number
  /** 折合升，保留 2 位 */
  readonly liters: number
  /** 折合 250 ml 杯数，保留 1 位 */
  readonly cups: number
  /** 体重基础量（取整前，毫升） */
  readonly baseMilliliters: number
  /** 运动加水量（取整前，毫升） */
  readonly activityMilliliters: number
  readonly climateFactor: number
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits
  return Math.round((value + Number.EPSILON) * factor) / factor
}

/** 磅 → 公斤，保留 2 位；非法输入抛英文 Error */
export function lbToKg(lb: number): number {
  if (!Number.isFinite(lb) || lb <= 0) {
    throw new Error('Weight in pounds must be a positive number')
  }
  return round(lb * KG_PER_LB, 2)
}

/** 按体重、运动时长与气候估算每日饮水量；非法输入抛英文 Error */
export function calculateWaterIntake(input: WaterIntakeInput): WaterIntakeResult {
  const weightKg = input.weightKg
  if (!Number.isFinite(weightKg) || weightKg <= 0) {
    throw new Error('Weight must be a positive number')
  }
  if (weightKg < MIN_WEIGHT_KG || weightKg > MAX_WEIGHT_KG) {
    throw new Error(`Weight must be between ${MIN_WEIGHT_KG} and ${MAX_WEIGHT_KG} kg`)
  }

  const activityMinutes = input.activityMinutes ?? 0
  if (!Number.isFinite(activityMinutes) || activityMinutes < 0) {
    throw new Error('Activity minutes must be a non-negative number')
  }
  if (activityMinutes > MAX_ACTIVITY_MINUTES) {
    throw new Error(`Activity minutes must not exceed ${MAX_ACTIVITY_MINUTES}`)
  }

  const climate = input.climate ?? 'temperate'
  if (!WATER_CLIMATES.includes(climate)) {
    throw new Error(`Unknown climate: ${String(climate)}`)
  }
  const climateFactor = CLIMATE_FACTORS[climate]

  const baseMilliliters = weightKg * ML_PER_KG
  const activityMilliliters =
    Math.floor(activityMinutes / ACTIVITY_STEP_MINUTES) * ML_PER_ACTIVITY_STEP
  const rawMilliliters = (baseMilliliters + activityMilliliters) * climateFactor
  // 加一点点余量，避免 0.95 这类系数把 1995 ml 压成 1994.999… 后被舍成 1990
  const milliliters = Math.round(rawMilliliters / 10 + 1e-9) * 10

  return {
    milliliters,
    liters: round(milliliters / 1000, 2),
    cups: round(milliliters / CUP_ML, 1),
    baseMilliliters,
    activityMilliliters,
    climateFactor,
  }
}
