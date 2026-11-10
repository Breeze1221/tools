const WORD_PATTERN = /[\p{Script=Han}]|[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu

function toChars(value: string): string[] {
  return Array.from(value)
}

function round1(value: number): number {
  return Math.round(value * 10) / 10
}

/** 去掉首尾空白并把连续空白压成一个空格，便于比较排版差异 */
export function normalizeWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

/** Levenshtein 编辑距离（按 Unicode 码点计，中文与 emoji 均按 1 个字符算） */
export function levenshteinDistance(a: string, b: string): number {
  const left = toChars(a)
  const right = toChars(b)

  if (left.length === 0) {
    return right.length
  }
  if (right.length === 0) {
    return left.length
  }

  let previous = Array.from({ length: right.length + 1 }, (_, index) => index)
  let current = new Array<number>(right.length + 1)

  for (let i = 1; i <= left.length; i += 1) {
    current[0] = i
    for (let j = 1; j <= right.length; j += 1) {
      const substitution = previous[j - 1] + (left[i - 1] === right[j - 1] ? 0 : 1)
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, substitution)
    }
    const swap = previous
    previous = current
    current = swap
  }

  return previous[right.length]
}

/** 归一化空白后的相似度百分比（0-100，保留 1 位；两个空串视为完全相同） */
export function similarityRatio(a: string, b: string): number {
  const left = toChars(normalizeWhitespace(a))
  const right = toChars(normalizeWhitespace(b))
  const maxLength = Math.max(left.length, right.length)
  if (maxLength === 0) {
    return 100
  }
  const distance = levenshteinDistance(left.join(''), right.join(''))
  return round1((1 - distance / maxLength) * 100)
}

/** 按词集合计算 Jaccard 相似度（大小写不敏感，中文按单字切分） */
export function jaccardSimilarity(a: string, b: string): number {
  const left = new Set(a.toLowerCase().match(WORD_PATTERN) ?? [])
  const right = new Set(b.toLowerCase().match(WORD_PATTERN) ?? [])

  if (left.size === 0 && right.size === 0) {
    return 100
  }
  if (left.size === 0 || right.size === 0) {
    return 0
  }

  let intersection = 0
  for (const token of left) {
    if (right.has(token)) {
      intersection += 1
    }
  }
  const union = left.size + right.size - intersection
  return round1((intersection / union) * 100)
}

/** 共同前缀长度（按 Unicode 码点计） */
export function commonPrefixLength(a: string, b: string): number {
  const left = toChars(a)
  const right = toChars(b)
  const limit = Math.min(left.length, right.length)

  let length = 0
  while (length < limit && left[length] === right[length]) {
    length += 1
  }
  return length
}
