const CN_DIGITS = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'] as const
const FINANCIAL_DIGITS = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'] as const
const CN_SMALL_UNITS = ['', '十', '百', '千'] as const
const FINANCIAL_SMALL_UNITS = ['', '拾', '佰', '仟'] as const
const CN_BIG_UNITS = ['', '万', '亿', '万亿'] as const

/** 支持的最大数值：9999 亿 */
export const MAX_CHINESE_NUMBER = 999_900_000_000

const DIGIT_VALUES: Readonly<Record<string, number>> = {
  零: 0,
  〇: 0,
  一: 1,
  壹: 1,
  二: 2,
  贰: 2,
  两: 2,
  三: 3,
  叁: 3,
  四: 4,
  肆: 4,
  五: 5,
  伍: 5,
  六: 6,
  陆: 6,
  七: 7,
  柒: 7,
  八: 8,
  捌: 8,
  九: 9,
  玖: 9,
}

const UNIT_VALUES: Readonly<Record<string, number>> = {
  十: 10,
  拾: 10,
  百: 100,
  佰: 100,
  千: 1000,
  仟: 1000,
  万: 10_000,
  萬: 10_000,
  亿: 100_000_000,
  億: 100_000_000,
}

const FULL_WIDTH_DIGITS = '０１２３４５６７８９'

export type NumberToChineseOptions = {
  /** 输出人民币财务大写（壹贰叁… + 元角分整），默认 false */
  readonly financial?: boolean
}

function groupToChinese(
  group: number,
  digits: readonly string[],
  units: readonly string[],
): string {
  let result = ''
  let hasPendingZero = false
  let hasStarted = false

  for (let position = 3; position >= 0; position -= 1) {
    const divisor = 10 ** position
    const digit = Math.floor(group / divisor) % 10
    if (digit === 0) {
      if (hasStarted) {
        hasPendingZero = true
      }
      continue
    }
    if (hasPendingZero) {
      result += digits[0]
      hasPendingZero = false
    }
    result += digits[digit] + units[position]
    hasStarted = true
  }

  return result
}

function integerToChinese(
  value: number,
  digits: readonly string[],
  units: readonly string[],
  stripLeadingOne: boolean,
): string {
  if (value === 0) {
    return digits[0]
  }

  const groups: number[] = []
  let rest = value
  while (rest > 0) {
    groups.unshift(rest % 10_000)
    rest = Math.floor(rest / 10_000)
  }

  let result = ''
  for (let index = 0; index < groups.length; index += 1) {
    const group = groups[index]
    if (group === 0) {
      continue
    }
    const bigUnit = CN_BIG_UNITS[groups.length - 1 - index]
    if (result !== '' && group < 1000) {
      result += digits[0]
    }
    result += groupToChinese(group, digits, units) + bigUnit
  }

  if (stripLeadingOne && result.startsWith('一十')) {
    result = result.slice(1)
  }

  return result
}

function convertIntegerText(input: string): number {
  let total = 0
  let section = 0
  let pendingDigit = 0
  let hasContent = false

  for (const char of input) {
    const digit = DIGIT_VALUES[char]
    if (digit !== undefined) {
      pendingDigit = digit
      hasContent = true
      continue
    }

    const unit = UNIT_VALUES[char]
    if (unit === undefined) {
      throw new Error(`Unexpected character in Chinese number: ${char}`)
    }
    hasContent = true

    if (unit < 10_000) {
      const multiplier = pendingDigit === 0 ? 1 : pendingDigit
      section += multiplier * unit
      pendingDigit = 0
      continue
    }

    section += pendingDigit
    pendingDigit = 0
    if (unit === 10_000) {
      total += section * 10_000
    } else {
      total = (total + section) * 100_000_000
    }
    section = 0
  }

  if (!hasContent) {
    throw new Error('Input is empty')
  }

  return total + section + pendingDigit
}

/** 中文数字（含财务大写）转阿拉伯数字；支持小数「点」，非法输入抛错 */
export function chineseToNumber(input: string): number {
  let text = input.trim().replace(/[,\s]/g, '')
  if (text === '') {
    throw new Error('Input is empty')
  }

  text = Array.from(text)
    .map((char) => {
      const fullWidth = FULL_WIDTH_DIGITS.indexOf(char)
      return fullWidth === -1 ? char : String(fullWidth)
    })
    .join('')

  if (/^\d+(?:\.\d+)?$/.test(text)) {
    return Number(text)
  }

  const decimalIndex = text.search(/[点點.]/)
  let integerText = text
  let fractionText = ''

  if (decimalIndex >= 0) {
    integerText = text.slice(0, decimalIndex)
    fractionText = text.slice(decimalIndex + 1)
    if (/[点點.]/.test(fractionText)) {
      throw new Error('Input contains more than one decimal separator')
    }
    if (fractionText === '') {
      throw new Error('Input has no digits after the decimal separator')
    }
  }

  const integerValue = integerText === '' ? 0 : convertIntegerText(integerText)
  if (fractionText === '') {
    return integerValue
  }

  let fractionValue = 0
  let scale = 10
  for (const char of fractionText) {
    const digit = DIGIT_VALUES[char]
    if (digit === undefined) {
      throw new Error(`Unexpected character after decimal separator: ${char}`)
    }
    fractionValue += digit / scale
    scale *= 10
  }

  return integerValue + fractionValue
}

function toChineseNumber(
  value: number,
  digits: readonly string[],
  units: readonly string[],
  stripLeadingOne: boolean,
): string {
  const cents = Math.round(value * 100)
  const integerPart = Math.floor(cents / 100)
  const fractionPart = cents % 100

  const integerText = integerToChinese(integerPart, digits, units, stripLeadingOne)
  if (fractionPart === 0) {
    return integerText
  }

  const fractionDigits = String(fractionPart)
    .padStart(2, '0')
    .replace(/0$/, '')
    .split('')
    .map((digit) => digits[Number(digit)])
    .join('')
  return `${integerText}点${fractionDigits}`
}

function toFinancialNumber(value: number): string {
  const cents = Math.round(value * 100)
  const integerPart = Math.floor(cents / 100)
  const fractionPart = cents % 100
  const jiao = Math.floor(fractionPart / 10)
  const fen = fractionPart % 10

  let result = ''
  if (integerPart > 0) {
    result += `${integerToChinese(integerPart, FINANCIAL_DIGITS, FINANCIAL_SMALL_UNITS, false)}元`
  }
  if (jiao > 0) {
    result += `${FINANCIAL_DIGITS[jiao]}角`
  } else if (fen > 0 && integerPart > 0) {
    result += FINANCIAL_DIGITS[0]
  }
  if (fen > 0) {
    result += `${FINANCIAL_DIGITS[fen]}分`
  }
  if (result === '') {
    result = '零元'
  }
  if (fractionPart === 0) {
    result += '整'
  }
  return result
}

/** 阿拉伯数字转中文数字；financial 时输出人民币财务大写，支持两位小数 */
export function numberToChinese(
  input: number | string,
  options: NumberToChineseOptions = {},
): string {
  const value = typeof input === 'number' ? input : Number(input.trim().replace(/[,\s]/g, ''))

  if (!Number.isFinite(value)) {
    throw new Error('Input must be a finite number')
  }
  if (value < 0) {
    throw new Error('Input must not be negative')
  }
  if (value > MAX_CHINESE_NUMBER) {
    throw new Error('Input exceeds the supported maximum of 9999 hundred million')
  }

  if (options.financial === true) {
    return toFinancialNumber(value)
  }
  return toChineseNumber(value, CN_DIGITS, CN_SMALL_UNITS, true)
}
