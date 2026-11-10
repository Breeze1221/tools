/** 分隔符：连字符 / 下划线 / 无 */
export const slugSeparators = ['-', '_', ''] as const
export type SlugSeparator = (typeof slugSeparators)[number]

export interface SlugOptions {
  separator: SlugSeparator
  /** 是否把结果转成小写 */
  lowercase: boolean
  /** 重复 slug 是否追加 -2、-3 后缀 */
  dedupe: boolean
  /** 是否保留中文（按 UTF-8 原样输出） */
  keepChinese: boolean
  /** 删除所有非 ASCII 字符（优先级高于 keepChinese） */
  asciiOnly: boolean
}

/** NFD 分解后仍不会还原成 ASCII 的常见字母，按德语/北欧习惯转写 */
const TRANSLITERATIONS: Record<string, string> = {
  ß: 'ss',
  æ: 'ae',
  œ: 'oe',
  ø: 'o',
  ł: 'l',
  đ: 'd',
  ð: 'd',
  þ: 'th',
  ħ: 'h',
  ı: 'i',
  ŧ: 't',
}

const TRANSLITERATION_RE = new RegExp(`[${Object.keys(TRANSLITERATIONS).join('')}]`, 'gi')

/** 去除重音符号并把连字转写成 ASCII：`café` → `cafe`、`Straße` → `Strasse` */
function toAsciiLetters(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .replace(TRANSLITERATION_RE, (char) => TRANSLITERATIONS[char.toLowerCase()] ?? char)
}

/**
 * 单行文本 → URL slug。
 *
 * 重音字符转 ASCII、标点与 emoji 丢弃、连续空白折叠成一个分隔符、首尾不留分隔符；
 * 中文默认保留，可选删除全部非 ASCII 字符。
 */
export function slugify(text: string, options: SlugOptions): string {
  let value = toAsciiLetters(text)

  if (options.asciiOnly) {
    value = value.replace(/[^\x20-\x7e]+/g, ' ')
  } else if (!options.keepChinese) {
    value = value.replace(/\p{Script=Han}+/gu, ' ')
  }

  const words = value.split(/[^\p{L}\p{N}]+/u).filter((word) => word !== '')
  if (options.lowercase) {
    return words.join(options.separator).toLowerCase()
  }
  return words.join(options.separator)
}

/**
 * 多行文本 → 每行一个 slug（空行与转换后为空的行被丢弃）。
 * 开启去重后，同一 slug 的第二次出现追加 `-2`，第三次 `-3`。
 */
export function slugifyLines(input: string, options: SlugOptions): string {
  const seen = new Map<string, number>()
  const suffixSeparator = options.separator === '' ? '-' : options.separator
  const lines: string[] = []

  for (const line of input.split(/\r?\n/)) {
    const slug = slugify(line, options)
    if (slug === '') {
      continue
    }
    if (!options.dedupe) {
      lines.push(slug)
      continue
    }
    const used = seen.get(slug) ?? 0
    seen.set(slug, used + 1)
    lines.push(used === 0 ? slug : `${slug}${suffixSeparator}${used + 1}`)
  }

  return lines.join('\n')
}
