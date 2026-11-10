export const BMI_UNIT_SYSTEMS = ['metric', 'imperial'] as const
export type BmiUnitSystem = (typeof BMI_UNIT_SYSTEMS)[number]

export const BMI_CATEGORIES = ['underweight', 'normal', 'overweight', 'obese'] as const
export type BmiCategory = (typeof BMI_CATEGORIES)[number]

export type WeightRange = {
  readonly min: number
  readonly max: number
}

export type BmiResult = {
  /** BMI，保留 1 位小数 */
  readonly bmi: number
  readonly category: BmiCategory
  /** 健康体重区间（BMI 18.5–24.9 对应的体重） */
  readonly healthyWeightKg: WeightRange
  readonly healthyWeightLb: WeightRange
}

export type BmiInput = {
  readonly unitSystem: BmiUnitSystem
  /** 公制身高（cm） */
  heightCm?: number
  /** 公制体重（kg） */
  weightKg?: number
  /** 英制身高（英尺） */
  heightFeet?: number
  /** 英制身高（英寸），省略按 0 处理 */
  heightInches?: number
  /** 英制体重（磅） */
  weightLb?: number
}

const CM_PER_INCH = 2.54
const INCHES_PER_FOOT = 12
const KG_PER_LB = 0.45359237
const LB_PER_KG = 2.2046226218

const MIN_HEIGHT_CM = 50
const MAX_HEIGHT_CM = 260
const MIN_WEIGHT_KG = 2
const MAX_WEIGHT_KG = 500

const HEALTHY_BMI_MIN = 18.5
const HEALTHY_BMI_MAX = 24.9

function round1(value: number): number {
  return Math.round(value * 10) / 10
}

function requirePositive(value: number | undefined, label: string): number {
  if (value === undefined || !Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be a positive number`)
  }
  return value
}

function requireRange(value: number, min: number, max: number, label: string): void {
  if (value < min || value > max) {
    throw new Error(`${label} must be between ${min} and ${max}`)
  }
}

/** 公斤 → 磅（保留 1 位小数） */
export function kgToLb(kg: number): number {
  return round1(kg * LB_PER_KG)
}

/** 磅 → 公斤（保留 1 位小数） */
export function lbToKg(lb: number): number {
  return round1(lb * KG_PER_LB)
}

/** 厘米 → 英尺 + 英寸（英寸保留 1 位小数，进位后不会出现 12 英寸） */
export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  if (!Number.isFinite(cm) || cm < 0) {
    throw new Error('Height in centimeters must be a non-negative number')
  }
  const totalInches = cm / CM_PER_INCH
  let feet = Math.floor(totalInches / INCHES_PER_FOOT)
  let inches = round1(totalInches - feet * INCHES_PER_FOOT)
  if (inches >= INCHES_PER_FOOT) {
    feet += 1
    inches = 0
  }
  return { feet, inches }
}

/** 按 WHO 成人标准分类：<18.5 偏瘦，18.5–24.9 正常，25–29.9 超重，≥30 肥胖 */
export function bmiCategory(bmi: number): BmiCategory {
  if (!Number.isFinite(bmi) || bmi <= 0) {
    throw new Error('BMI must be a positive number')
  }
  if (bmi < 18.5) {
    return 'underweight'
  }
  if (bmi < 25) {
    return 'normal'
  }
  if (bmi < 30) {
    return 'overweight'
  }
  return 'obese'
}

function resolveMeasurements(input: BmiInput): { heightCm: number; weightKg: number } {
  if (input.unitSystem === 'metric') {
    const heightCm = requirePositive(input.heightCm, 'Height')
    const weightKg = requirePositive(input.weightKg, 'Weight')
    requireRange(heightCm, MIN_HEIGHT_CM, MAX_HEIGHT_CM, 'Height (cm)')
    requireRange(weightKg, MIN_WEIGHT_KG, MAX_WEIGHT_KG, 'Weight (kg)')
    return { heightCm, weightKg }
  }

  const heightFeet = requirePositive(input.heightFeet, 'Height (ft)')
  const heightInches = input.heightInches ?? 0
  if (!Number.isFinite(heightInches) || heightInches < 0 || heightInches >= INCHES_PER_FOOT) {
    throw new Error('Height (in) must be between 0 and 11')
  }
  const weightLb = requirePositive(input.weightLb, 'Weight (lb)')

  const heightCm = round1((heightFeet * INCHES_PER_FOOT + heightInches) * CM_PER_INCH)
  const weightKg = weightLb * KG_PER_LB
  requireRange(heightCm, MIN_HEIGHT_CM, MAX_HEIGHT_CM, 'Height (cm)')
  requireRange(weightKg, MIN_WEIGHT_KG, MAX_WEIGHT_KG, 'Weight (kg)')
  return { heightCm, weightKg }
}

/** 计算 BMI、分类与健康体重区间；非法输入抛英文 Error */
export function calculateBmi(input: BmiInput): BmiResult {
  const { heightCm, weightKg } = resolveMeasurements(input)
  const heightM = heightCm / 100
  const bmi = round1(weightKg / (heightM * heightM))

  const healthyWeightKg = {
    min: round1(HEALTHY_BMI_MIN * heightM * heightM),
    max: round1(HEALTHY_BMI_MAX * heightM * heightM),
  }

  return {
    bmi,
    category: bmiCategory(bmi),
    healthyWeightKg,
    healthyWeightLb: {
      min: kgToLb(healthyWeightKg.min),
      max: kgToLb(healthyWeightKg.max),
    },
  }
}
