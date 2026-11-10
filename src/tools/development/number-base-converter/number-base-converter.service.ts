export const BASE_MIN = 2
export const BASE_MAX = 36

export const OUTPUT_BASES = [2, 8, 10, 16, 36] as const
export type OutputBase = (typeof OUTPUT_BASES)[number]

const DIGITS = '0123456789abcdefghijklmnopqrstuvwxyz'

function assertBase(base: number): void {
  if (!Number.isInteger(base) || base < BASE_MIN || base > BASE_MAX) {
    throw new Error(`Base must be an integer between ${BASE_MIN} and ${BASE_MAX}`)
  }
}

function stripSeparators(input: string): string {
  return input.replace(/[\s_]/g, '')
}

/** 依据 0x / 0b / 0o 前缀识别进制，无前缀按十进制；空输入抛错 */
export function detectBase(input: string): number {
  const text = stripSeparators(input)
  if (text === '') {
    throw new Error('Input is empty')
  }
  const unsigned = text.replace(/^[+-]/, '')
  if (unsigned === '') {
    throw new Error('Input is empty')
  }
  if (/^0[xX]/.test(unsigned)) {
    return 16
  }
  if (/^0[bB]/.test(unsigned)) {
    return 2
  }
  if (/^0[oO]/.test(unsigned)) {
    return 8
  }
  return 10
}

/**
 * 解析任意进制（2–36）的整数串为 BigInt：
 * 支持正负号、前导 0x / 0b / 0o、下划线分隔与大小写不敏感。
 */
export function parseInBase(input: string, base: number): bigint {
  assertBase(base)

  let text = stripSeparators(input)
  if (text === '') {
    throw new Error('Input is empty')
  }

  let sign = 1n
  if (text.startsWith('-') || text.startsWith('+')) {
    sign = text.startsWith('-') ? -1n : 1n
    text = text.slice(1)
  }
  if (text === '') {
    throw new Error('Input is empty')
  }

  const lower = text.toLowerCase()
  if (base === 16 && lower.startsWith('0x')) {
    text = text.slice(2)
  } else if (base === 2 && lower.startsWith('0b')) {
    text = text.slice(2)
  } else if (base === 8 && lower.startsWith('0o')) {
    text = text.slice(2)
  }
  if (text === '') {
    throw new Error('Input is empty')
  }

  const bigBase = BigInt(base)
  let value = 0n
  for (const char of text) {
    const digit = DIGITS.indexOf(char.toLowerCase())
    if (digit === -1 || digit >= base) {
      throw new Error(`Invalid digit "${char}" for base ${base}`)
    }
    value = value * bigBase + BigInt(digit)
  }
  return sign * value
}

/** 把 BigInt 写成指定进制；十六进制输出大写，其余小写 */
export function formatInBase(value: bigint, base: number): string {
  assertBase(base)

  const negative = value < 0n
  let remaining = negative ? -value : value
  if (remaining === 0n) {
    return '0'
  }

  const bigBase = BigInt(base)
  let output = ''
  while (remaining > 0n) {
    output = DIGITS[Number(remaining % bigBase)] + output
    remaining /= bigBase
  }
  const text = base === 16 ? output.toUpperCase() : output
  return negative ? `-${text}` : text
}

/** 一次输出 2 / 8 / 10 / 16 / 36 五个进制，键为进制字符串 */
export function convertAll(input: string, base: number): Record<string, string> {
  const value = parseInBase(input, base)
  return Object.fromEntries(OUTPUT_BASES.map((item) => [String(item), formatInBase(value, item)]))
}

/** 二进制按 4 位一组展示，如 11110000 → 1111 0000（负数保留符号） */
export function groupBinary(bits: string): string {
  const text = bits.trim()
  if (text === '') {
    return ''
  }

  const negative = text.startsWith('-')
  const digits = (negative ? text.slice(1) : text).replace(/\s/g, '')
  if (digits === '' || !/^[01]+$/.test(digits)) {
    throw new Error('Binary string can only contain 0 and 1')
  }

  const grouped = digits.replace(/\B(?=(?:\d{4})+$)/g, ' ')
  return negative ? `-${grouped}` : grouped
}

/** 十进制加千分位，如 1234567 → 1,234,567（负数保留符号） */
export function formatThousands(value: string): string {
  if (value === '') {
    return ''
  }
  const negative = value.startsWith('-')
  const digits = negative ? value.slice(1) : value
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return negative ? `-${grouped}` : grouped
}
