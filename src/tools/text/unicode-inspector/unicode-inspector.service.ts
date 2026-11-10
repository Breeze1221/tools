/** 字符类别（按 Unicode 属性粗略判断） */
export const charCategories = [
  'letter',
  'number',
  'punctuation',
  'symbol',
  'whitespace',
  'emoji',
  'other',
] as const
export type CharCategory = (typeof charCategories)[number]

export interface CharInfo {
  /** 可安全放进表格 / TSV 的字符表示：制表符、换行等控制字符写成转义序列 */
  char: string
  /** 码点，形如 U+0041、U+1F600 */
  codePoint: string
  decimal: number
  /** UTF-8 字节，大写十六进制、空格分隔 */
  utf8: string
  /** UTF-16 码元，大写十六进制、空格分隔 */
  utf16: string
  category: CharCategory
  /** 是否由代理对（两个 UTF-16 码元）表示 */
  isSurrogatePair: boolean
}

export interface InspectSummary {
  /** 字符数 = 码点数（按 `[...text]` 迭代） */
  chars: number
  codePoints: number
  utf8Bytes: number
  utf16Units: number
}

export interface InspectResult {
  rows: CharInfo[]
  summary: InspectSummary
}

const WHITESPACE_RE = /^\s$/u
const EMOJI_RE = /^(?:\p{Emoji_Presentation}|\p{Extended_Pictographic})$/u
const LETTER_RE = /^\p{L}$/u
const NUMBER_RE = /^\p{N}$/u
const PUNCTUATION_RE = /^\p{P}$/u
const SYMBOL_RE = /^\p{S}$/u

/** 控制字符的可见写法；空格保持原样，避免污染复制出的字符列 */
const CONTROL_ESCAPES: Record<string, string> = {
  '\t': '\\t',
  '\n': '\\n',
  '\r': '\\r',
  '\0': '\\0',
}

/**
 * 把单个码点编码成 UTF-8 字节序列（不依赖 TextEncoder，Node 与浏览器结果一致）。
 * 传入多个码点时只看第一个。
 */
export function getUtf8Bytes(char: string): number[] {
  const codePoint = char.codePointAt(0)
  if (codePoint === undefined) {
    return []
  }
  if (codePoint < 0x80) {
    return [codePoint]
  }
  if (codePoint < 0x800) {
    return [0xc0 | (codePoint >> 6), 0x80 | (codePoint & 0x3f)]
  }
  if (codePoint < 0x10000) {
    return [0xe0 | (codePoint >> 12), 0x80 | ((codePoint >> 6) & 0x3f), 0x80 | (codePoint & 0x3f)]
  }
  return [
    0xf0 | (codePoint >> 18),
    0x80 | ((codePoint >> 12) & 0x3f),
    0x80 | ((codePoint >> 6) & 0x3f),
    0x80 | (codePoint & 0x3f),
  ]
}

/** 粗略判断单个字符的类别；emoji 优先于符号，空白优先于控制字符 */
export function describeChar(char: string): CharCategory {
  if (char === '') {
    return 'other'
  }
  if (WHITESPACE_RE.test(char)) {
    return 'whitespace'
  }
  if (EMOJI_RE.test(char)) {
    return 'emoji'
  }
  if (LETTER_RE.test(char)) {
    return 'letter'
  }
  if (NUMBER_RE.test(char)) {
    return 'number'
  }
  if (PUNCTUATION_RE.test(char)) {
    return 'punctuation'
  }
  if (SYMBOL_RE.test(char)) {
    return 'symbol'
  }
  return 'other'
}

function toHex(value: number, digits: number): string {
  return value.toString(16).toUpperCase().padStart(digits, '0')
}

/** 单个字符在表格里的可见写法 */
function displayChar(char: string): string {
  return CONTROL_ESCAPES[char] ?? char
}

function utf16Units(char: string): string {
  const units: string[] = []
  for (let index = 0; index < char.length; index += 1) {
    units.push(toHex(char.charCodeAt(index), 4))
  }
  return units.join(' ')
}

/** 逐字符拆解文本：码点、十进制、UTF-8、UTF-16、类别与代理对标记 */
export function inspectText(text: string): InspectResult {
  const rows = Array.from(text, (char): CharInfo => {
    const codePoint = char.codePointAt(0) ?? 0
    return {
      char: displayChar(char),
      codePoint: `U+${toHex(codePoint, 4)}`,
      decimal: codePoint,
      utf8: getUtf8Bytes(char)
        .map((byte) => toHex(byte, 2))
        .join(' '),
      utf16: utf16Units(char),
      category: describeChar(char),
      isSurrogatePair: char.length === 2,
    }
  })

  return {
    rows,
    summary: {
      chars: rows.length,
      codePoints: rows.length,
      utf8Bytes: Array.from(text).reduce((total, char) => total + getUtf8Bytes(char).length, 0),
      utf16Units: text.length,
    },
  }
}

const TSV_COLUMNS = [
  'char',
  'codePoint',
  'decimal',
  'utf8',
  'utf16',
  'category',
  'isSurrogatePair',
] as const

/** 行数据 → TSV（首行为列名，制表符分隔，可直接粘贴进表格软件） */
export function toTsv(rows: readonly CharInfo[]): string {
  const body = rows.map((row) => TSV_COLUMNS.map((column) => String(row[column])).join('\t'))
  return [TSV_COLUMNS.join('\t'), ...body].join('\n')
}

/** 行数据 → 格式化 JSON */
export function toJson(rows: readonly CharInfo[]): string {
  return JSON.stringify(rows, null, 2)
}
