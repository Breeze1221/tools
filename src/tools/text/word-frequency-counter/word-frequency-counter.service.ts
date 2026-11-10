export const SORT_MODES = ['count', 'alpha'] as const
export type WordSortMode = (typeof SORT_MODES)[number]

export type CountWordsOptions = {
  /** 是否区分大小写，默认 false（统一转小写后统计） */
  readonly caseSensitive?: boolean
  /** 最小词长，默认 1 */
  readonly minLength?: number
  /** 是否忽略英文停用词 */
  readonly ignoreStopwords?: boolean
  /** 是否忽略纯数字词 */
  readonly ignoreNumbers?: boolean
  /** count：频次降序（同频按字母升序）；alpha：字母升序 */
  readonly sort: WordSortMode
  /** 只返回前 N 条，省略或非正数表示不限 */
  readonly limit?: number
}

export type WordFrequencyItem = {
  readonly word: string
  readonly count: number
  /** 占已统计词数的百分比，保留 1 位小数 */
  readonly percent: number
}

export type WordFrequencyResult = {
  readonly totalWords: number
  readonly uniqueWords: number
  readonly items: WordFrequencyItem[]
}

/** 内置英文停用词小表（统计前统一转小写） */
export const STOPWORDS: ReadonlySet<string> = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'been',
  'but',
  'by',
  'can',
  'could',
  'did',
  'do',
  'does',
  'for',
  'from',
  'had',
  'has',
  'have',
  'he',
  'her',
  'here',
  'him',
  'his',
  'how',
  'i',
  'if',
  'in',
  'into',
  'is',
  'it',
  'its',
  'may',
  'me',
  'might',
  'my',
  'no',
  'not',
  'of',
  'on',
  'or',
  'our',
  'out',
  'said',
  'she',
  'should',
  'so',
  'some',
  'than',
  'that',
  'the',
  'their',
  'them',
  'then',
  'there',
  'these',
  'they',
  'this',
  'those',
  'to',
  'us',
  'was',
  'we',
  'were',
  'what',
  'when',
  'where',
  'which',
  'who',
  'why',
  'will',
  'with',
  'would',
  'you',
  'your',
])

/** Segmenter 不可用时的回退分词正则（支持字母、数字与连字符/撇号连接的词） */
const WORD_PATTERN = /[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu
const NUMBER_PATTERN = /^\p{N}+$/u
const JOINERS: ReadonlySet<string> = new Set(["'", '’', '-'])

let segmenter: Intl.Segmenter | null | undefined

function getSegmenter(): Intl.Segmenter | null {
  if (segmenter === undefined) {
    segmenter =
      typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function'
        ? new Intl.Segmenter(undefined, { granularity: 'word' })
        : null
  }
  return segmenter
}

/** 把 Segmenter 切出的「词 + 连接符 + 词」重新拼成一个词，与回退正则行为保持一致 */
function collectTokens(text: string): string[] {
  const wordSegmenter = getSegmenter()
  if (wordSegmenter === null) {
    return text.match(WORD_PATTERN) ?? []
  }

  const segments = Array.from(wordSegmenter.segment(text), (item) => ({
    value: item.segment,
    isWordLike: item.isWordLike === true,
  }))

  const tokens: string[] = []
  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index]
    if (!segment.isWordLike) {
      continue
    }
    let word = segment.value
    let cursor = index
    while (cursor + 2 < segments.length) {
      const joiner = segments[cursor + 1]
      const next = segments[cursor + 2]
      if (!joiner.isWordLike && JOINERS.has(joiner.value) && next.isWordLike) {
        word += joiner.value + next.value
        cursor += 2
      } else {
        break
      }
    }
    tokens.push(word)
    index = cursor
  }
  return tokens
}

function round1(value: number): number {
  return Math.round(value * 10) / 10
}

function compareAlpha(a: WordFrequencyItem, b: WordFrequencyItem): number {
  if (a.word < b.word) {
    return -1
  }
  return a.word > b.word ? 1 : 0
}

function compareCount(a: WordFrequencyItem, b: WordFrequencyItem): number {
  if (a.count !== b.count) {
    return b.count - a.count
  }
  return compareAlpha(a, b)
}

/** 统计词频：支持中日韩分词、大小写、停用词、最小词长、数字过滤与排序/截断 */
export function countWords(input: string, options: CountWordsOptions): WordFrequencyResult {
  const minLength = options.minLength ?? 1
  const counts = new Map<string, number>()
  let totalWords = 0

  for (const token of collectTokens(input)) {
    const word = options.caseSensitive === true ? token : token.toLowerCase()
    if (word.length < minLength) {
      continue
    }
    if (options.ignoreNumbers === true && NUMBER_PATTERN.test(word)) {
      continue
    }
    if (options.ignoreStopwords === true && STOPWORDS.has(word)) {
      continue
    }
    counts.set(word, (counts.get(word) ?? 0) + 1)
    totalWords += 1
  }

  const items: WordFrequencyItem[] = Array.from(counts, ([word, count]) => ({
    word,
    count,
    percent: totalWords === 0 ? 0 : round1((count / totalWords) * 100),
  }))
  items.sort(options.sort === 'alpha' ? compareAlpha : compareCount)

  const limited =
    options.limit !== undefined && options.limit > 0
      ? items.slice(0, Math.floor(options.limit))
      : items

  return { totalWords, uniqueWords: counts.size, items: limited }
}

function escapeCsvField(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value
}

/** 词频结果 → CSV（表头 word,count,percent，含逗号/引号/换行的字段自动转义） */
export function toCsv(items: readonly WordFrequencyItem[]): string {
  const rows = items.map((item) =>
    [escapeCsvField(item.word), String(item.count), String(item.percent)].join(','),
  )
  return ['word,count,percent', ...rows].join('\n')
}

/** 词频结果 → 格式化 JSON */
export function toJson(items: readonly WordFrequencyItem[]): string {
  return JSON.stringify(items, null, 2)
}
