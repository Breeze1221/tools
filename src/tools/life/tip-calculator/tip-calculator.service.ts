/** 常用小费百分比预设 */
export const TIP_PRESETS = [10, 15, 18, 20] as const

export type TipInput = {
  /** 账单金额，必须大于 0 */
  readonly bill: number
  /** 小费百分比，0–100 */
  readonly tipPercent: number
  /** 分摊人数，1–100，默认 1 */
  readonly people?: number
  /** 是否把总额向上取整到整数金额 */
  readonly roundUp?: boolean
}

export type TipResult = {
  /** 小费金额，保留 2 位 */
  readonly tip: number
  /** 含小费的总额，保留 2 位 */
  readonly total: number
  /** 每人应付，保留 2 位 */
  readonly perPerson: number
  /** 向上取整后的总额（仅 roundUp 为 true 时返回） */
  readonly roundedTotal?: number
  /** 向上取整后每人应付（仅 roundUp 为 true 时返回） */
  readonly roundedPerPerson?: number
}

const MAX_PEOPLE = 100
const MAX_PERCENT = 100

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function requireFinite(value: number, label: string): number {
  if (!Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`)
  }
  return value
}

/** 计算小费、总额与人均分摊；非法输入抛英文 Error */
export function calculateTip(input: TipInput): TipResult {
  const bill = requireFinite(input.bill, 'Bill')
  if (bill <= 0) {
    throw new Error('Bill must be greater than 0')
  }

  const tipPercent = requireFinite(input.tipPercent, 'Tip percent')
  if (tipPercent < 0 || tipPercent > MAX_PERCENT) {
    throw new Error(`Tip percent must be between 0 and ${MAX_PERCENT}`)
  }

  const people = input.people ?? 1
  if (!Number.isInteger(people) || people < 1 || people > MAX_PEOPLE) {
    throw new Error(`People must be an integer between 1 and ${MAX_PEOPLE}`)
  }

  const tip = round2((bill * tipPercent) / 100)
  const total = round2(bill + tip)
  const perPerson = round2(total / people)

  if (!input.roundUp) {
    return { tip, total, perPerson }
  }

  // 先抹掉浮点误差再向上取整，避免 115.00000000000001 被抬成 116
  const roundedTotal = Math.ceil(round2(total) - 1e-9)
  return {
    tip,
    total,
    perPerson,
    roundedTotal,
    roundedPerPerson: round2(roundedTotal / people),
  }
}
