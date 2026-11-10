/**
 * Code 128 完整编码表：107 条目对应符号值 0-106。
 * 0-95：数据符号（A 子集 0-95 / B 子集 0-95 / C 子集 00-99 含 0-95）
 * 96-102：控制符
 * 103：Start A, 104：Start B, 105：Start C, 106：Stop
 * 宽度序列格式：每个字符是一个模块宽度（总和 11，Stop 是 13）
 */
const CODE128_PATTERNS: readonly string[] = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312',
  '132212', '221213', '221312', '231212', '112232', '122132', '122231', '113222',
  '123122', '123221', '223211', '221132', '221231', '213212', '223112', '312131',
  '311222', '321122', '321221', '312212', '322112', '322211', '212123', '212321',
  '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121',
  '313121', '211331', '231131', '213113', '213311', '213131', '311123', '311321',
  '331121', '312113', '312311', '332111', '314111', '221411', '431111', '111224',
  '111422', '121124', '121421', '141122', '141221', '112214', '112412', '122114',
  '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112',
  '421211', '212141', '214121', '412121', '111143', '111341', '131141', '114113',
  '114311', '411113', '411311', '113141', '114131', '311141', '411131',
  '211412', '211214', '211232', '2331112',
] as const

const START_A = 103
const START_B = 104
const START_C = 105
const STOP = 106

const CHECK_MODULUS = 103
const MAX_LENGTH = 50
const MIN_LENGTH = 1

/** 子集选择：auto 自动选 / A / B / C */
export type Code128Variant = 'auto' | 'A' | 'B' | 'C'

/** 子集类型 */
export type Code128Subset = 'A' | 'B' | 'C'

/** 编码结果 */
export type Code128EncodeResult = {
  codes: number[]
  check: number
  subset: Code128Subset
}

/** 检测能否全用 C 子集（全是数字且偶数长度） */
function canUseC(text: string): boolean {
  if (text.length === 0) return false
  if (text.length % 2 !== 0) return false
  return /^\d+$/.test(text)
}

/** 自动选择最优子集：单一子集（A/B/C），不做动态切换 */
function selectAutoSubset(text: string): Code128Subset {
  // 1. 纯数字且偶数长度 → C（最短）
  if (canUseC(text)) return 'C'

  // 2. 检测必须用哪个子集
  let hasAOnly = false // ASCII 0-31 只有 A 能编码
  let hasBOnly = false // ASCII 96-127 只有 B 能编码
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i)
    if (code < 32) hasAOnly = true
    if (code > 95) hasBOnly = true
  }

  if (hasAOnly && hasBOnly) {
    // 混合：回退 B（更通用），编码时会对非法字符抛错
    return 'B'
  }
  if (hasAOnly) return 'A'
  if (hasBOnly) return 'B'
  // 都在 32-95 重叠区 → B（覆盖更广）
  return 'B'
}

/** 计算子集起始码 */
function startCodeForSubset(subset: Code128Subset): number {
  if (subset === 'A') return START_A
  if (subset === 'C') return START_C
  return START_B
}

/**
 * 把文本按给定子集转换成 Code128 符号值（不含 Start、Check、Stop）。
 * A/B 子集：每个字符直接映射 code - minChar
 * C 子集：每两个数字编码为一个值 (d1*10 + d2)
 */
function dataCodesForSubset(text: string, subset: Code128Subset): number[] {
  const codes: number[] = []

  if (subset === 'C') {
    if (text.length % 2 !== 0) {
      throw new Error('Code 128C requires an even number of digits')
    }
    for (let i = 0; i < text.length; i += 2) {
      if (!/^[0-9]{2}$/.test(text.slice(i, i + 2))) {
        throw new Error('Code 128C requires digits only')
      }
      const value = Number.parseInt(text.slice(i, i + 2), 10)
      codes.push(value) // 0-99 直接作为 C 子集符号值
    }
    return codes
  }

  // A 或 B
  const minChar = subset === 'A' ? 0 : 32
  const maxChar = subset === 'A' ? 95 : 127

  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i)
    if (code < minChar || code > maxChar) {
      const msg = subset === 'A'
        ? 'Code 128A supports ASCII 0-95 only'
        : 'Code 128B supports ASCII 32-127 only'
      throw new Error(`${msg}, received character code ${code} at index ${i}`)
    }
    codes.push(code - minChar)
  }
  return codes
}

/**
 * 计算 Code 128 校验位：Start 值 * 1 + sum(code_i * (i+2)) mod 103
 * codes 参数是 [startCode, ...dataCodes]
 */
function computeCheckSymbol(codes: readonly number[]): number {
  let sum = codes[0] // start code * 1
  for (let i = 1; i < codes.length; i += 1) {
    sum += codes[i] * (i + 1)
  }
  return sum % CHECK_MODULUS
}

/**
 * 纯函数：把文本编码成 Code 128 的符号数组（含 Start、Check、Stop）。
 * variant 为 auto 时自动选最优子集；A/B/C 强制子集。
 * 输出 codes 数组：[Start, ...data, Check, Stop]
 * check 单独返回校验符号值。
 */
export function code128Encode(
  text: string,
  variant: Code128Variant = 'auto',
): Code128EncodeResult {
  if (text.length < MIN_LENGTH) {
    throw new Error(`Code 128 requires at least ${MIN_LENGTH} character`)
  }
  if (text.length > MAX_LENGTH) {
    throw new Error(`Code 128 text must be at most ${MAX_LENGTH} characters, got ${text.length}`)
  }

  // 解析子集
  const subset: Code128Subset = variant === 'auto'
    ? selectAutoSubset(text)
    : variant

  const startCode = startCodeForSubset(subset)
  const dataCodes = dataCodesForSubset(text, subset)

  // codesForCheck = [Start, d0, d1, ...]
  const codesForCheck = [startCode, ...dataCodes]
  const check = computeCheckSymbol(codesForCheck)

  // 完整输出 = [Start, ...data, Check, Stop]
  const codes = [startCode, ...dataCodes, check, STOP]

  return { codes, check, subset }
}

/** 把符号数组展开为模块位串（奇数位=条，偶数位=空） */
export function codesToBits(codes: readonly number[]): string {
  let bits = ''
  for (const code of codes) {
    const pattern = CODE128_PATTERNS[code]
    if (pattern === undefined) {
      throw new Error(`Invalid Code 128 symbol value: ${code}`)
    }
    let isBar = true
    for (const digit of pattern) {
      bits += (isBar ? '1' : '0').repeat(Number(digit))
      isBar = !isBar
    }
  }
  return bits
}

/** 从 Code 128 符号值获取对应的字符（B 子集，供显示用） */
export function code128SymbolToChar(code: number, subset: Code128Subset): string | null {
  if (code > 95) return null
  const offset = subset === 'A' ? 0 : 32
  return String.fromCharCode(code + offset)
}

/** 导出的完整符号表（107 项） */
export const CODE128_SYMBOL_COUNT = CODE128_PATTERNS.length
