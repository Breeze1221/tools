export const CARD_BRANDS = [
  'visa',
  'mastercard',
  'amex',
  'discover',
  'jcb',
  'diners-club',
  'unionpay',
] as const

export type CardBrand = (typeof CARD_BRANDS)[number] | 'unknown'

export type IdentifierKind = 'credit-card' | 'imei' | 'iban' | 'isbn-10' | 'isbn-13' | 'unknown'

export type IdentifierCheck = {
  kind: IdentifierKind
  valid: boolean
  normalized: string
  brand?: CardBrand
}

/** 去掉空白与连字符并转大写，用于展示与校验位计算 */
export function normalizeIdentifier(input: string): string {
  return input.replace(/[\s-]/g, '').toUpperCase()
}

/** Luhn 校验（信用卡、IMEI）；含非数字时返回 false，空串同样为 false */
export function luhnCheck(input: string): boolean {
  const digits = input.replace(/[\s-]/g, '')
  if (!/^\d+$/.test(digits)) {
    return false
  }
  let sum = 0
  let shouldDouble = false
  for (let index = digits.length - 1; index >= 0; index -= 1) {
    const digit = digits.charCodeAt(index) - 48
    if (shouldDouble) {
      const doubled = digit * 2
      sum += doubled > 9 ? doubled - 9 : doubled
    } else {
      sum += digit
    }
    shouldDouble = !shouldDouble
  }
  return sum % 10 === 0
}

/** 依据 IIN 前缀识别卡组织；无法识别时返回 null */
export function detectCardBrand(input: string): CardBrand | null {
  const digits = input.replace(/[\s-]/g, '')
  if (!/^\d+$/.test(digits)) {
    return null
  }
  const prefix2 = Number(digits.slice(0, 2))
  const prefix3 = Number(digits.slice(0, 3))
  const prefix4 = Number(digits.slice(0, 4))
  const prefix6 = Number(digits.slice(0, 6))

  if (digits.startsWith('4')) {
    return 'visa'
  }
  if ((prefix2 >= 51 && prefix2 <= 55) || (prefix4 >= 2221 && prefix4 <= 2720)) {
    return 'mastercard'
  }
  if (prefix2 === 34 || prefix2 === 37) {
    return 'amex'
  }
  if (
    digits.startsWith('6011') ||
    prefix2 === 65 ||
    (prefix3 >= 644 && prefix3 <= 649) ||
    (prefix6 >= 622126 && prefix6 <= 622925)
  ) {
    return 'discover'
  }
  if (prefix4 >= 3528 && prefix4 <= 3589) {
    return 'jcb'
  }
  if ((prefix3 >= 300 && prefix3 <= 305) || prefix2 === 36 || prefix2 === 38) {
    return 'diners-club'
  }
  if (prefix2 === 62) {
    return 'unionpay'
  }
  return null
}

/** IBAN：去空格后重排做 mod 97，余数必须为 1 */
export function validateIban(input: string): boolean {
  const normalized = input.replace(/\s+/g, '').toUpperCase()
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(normalized)) {
    return false
  }
  if (normalized.length < 15 || normalized.length > 34) {
    return false
  }
  const rearranged = normalized.slice(4) + normalized.slice(0, 4)
  let remainder = 0
  for (const char of rearranged) {
    const value = char >= 'A' && char <= 'Z' ? String(char.charCodeAt(0) - 55) : char
    for (const digit of value) {
      remainder = (remainder * 10 + Number(digit)) % 97
    }
  }
  return remainder === 1
}

/** ISBN-10：前 9 位数字，末位可为 X，按 10…1 加权后必须整除 11 */
export function validateIsbn10(input: string): boolean {
  const normalized = normalizeIdentifier(input)
  if (!/^\d{9}[\dX]$/.test(normalized)) {
    return false
  }
  let sum = 0
  for (let index = 0; index < 10; index += 1) {
    const char = normalized[index]
    const value = char === 'X' ? 10 : Number(char)
    sum += value * (10 - index)
  }
  return sum % 11 === 0
}

/** ISBN-13：978 / 979 前缀，1 与 3 交替加权后必须整除 10 */
export function validateIsbn13(input: string): boolean {
  const normalized = normalizeIdentifier(input)
  if (!/^97[89]\d{10}$/.test(normalized)) {
    return false
  }
  let sum = 0
  for (let index = 0; index < 13; index += 1) {
    sum += Number(normalized[index]) * (index % 2 === 0 ? 1 : 3)
  }
  return sum % 10 === 0
}

/**
 * 自动识别号码类型并返回所有可能的解释。
 * 空输入返回空数组；无法识别的内容返回单条 invalid 的 unknown 结果。
 */
export function validateIdentifier(input: string): IdentifierCheck[] {
  const raw = input.trim()
  if (raw === '') {
    return []
  }
  const normalized = normalizeIdentifier(raw)
  if (normalized === '') {
    return []
  }

  const results: IdentifierCheck[] = []
  const isDigits = /^\d+$/.test(normalized)

  if (/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(normalized)) {
    results.push({ kind: 'iban', valid: validateIban(normalized), normalized })
  }

  if (isDigits && normalized.length >= 12 && normalized.length <= 19) {
    results.push({
      kind: 'credit-card',
      valid: luhnCheck(normalized),
      normalized,
      brand: detectCardBrand(normalized) ?? 'unknown',
    })
  }

  if (isDigits && normalized.length === 15) {
    results.push({ kind: 'imei', valid: luhnCheck(normalized), normalized })
  }

  if (/^\d{9}[\dX]$/.test(normalized)) {
    results.push({ kind: 'isbn-10', valid: validateIsbn10(normalized), normalized })
  }

  if (isDigits && normalized.length === 13) {
    results.push({ kind: 'isbn-13', valid: validateIsbn13(normalized), normalized })
  }

  if (results.length === 0) {
    results.push({ kind: 'unknown', valid: false, normalized })
  }
  return results
}
