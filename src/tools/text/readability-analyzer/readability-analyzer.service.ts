export const READABILITY_LEVELS = [
  'veryEasy',
  'easy',
  'fairlyEasy',
  'standard',
  'fairlyDifficult',
  'difficult',
  'veryDifficult',
  'unknown',
] as const

export type ReadabilityLevel = (typeof READABILITY_LEVELS)[number]

export type ReadabilityStats = {
  readonly words: number
  readonly sentences: number
  readonly syllables: number
  readonly complexWords: number
  readonly chars: number
}

export type ReadabilityScores = {
  readonly fleschReadingEase: number
  readonly fleschKincaidGrade: number
  readonly gunningFog: number
}

export type ReadabilityResult = {
  readonly stats: ReadabilityStats
  readonly scores: ReadabilityScores
  readonly level: ReadabilityLevel
}

const WORD_PATTERN = /[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu
const SENTENCE_BOUNDARY = /[.!?…。！？]+/u
const CJK_PATTERN = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/gu

function round1(value: number): number {
  return Math.round(value * 10) / 10
}

function countSentences(text: string): number {
  const segments = text
    .split(SENTENCE_BOUNDARY)
    .map((segment) => segment.trim())
    .filter((segment) => segment !== '' && /[\p{L}\p{N}]/u.test(segment))
  return segments.length
}

/** 英文音节启发式；连续 CJK 字符按每字一个音节计 */
export function countSyllables(word: string): number {
  const lower = word.toLowerCase()
  const cjk = lower.match(CJK_PATTERN)
  if (cjk !== null) {
    return Math.max(1, cjk.length)
  }

  const cleaned = lower.replace(/[^a-z]/g, '')
  if (cleaned.length === 0) {
    return 1
  }
  if (cleaned.length <= 3) {
    return 1
  }

  const trimmed = cleaned.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '')
  const groups = trimmed.match(/[aeiouy]{1,2}/g)
  return Math.max(1, groups?.length ?? 0)
}

/** 按 Flesch Reading Ease 分数给出难度等级，0 分文本返回 unknown */
export function getReadabilityLevel(score: number): ReadabilityLevel {
  if (!Number.isFinite(score)) {
    return 'unknown'
  }
  if (score >= 90) {
    return 'veryEasy'
  }
  if (score >= 80) {
    return 'easy'
  }
  if (score >= 70) {
    return 'fairlyEasy'
  }
  if (score >= 60) {
    return 'standard'
  }
  if (score >= 50) {
    return 'fairlyDifficult'
  }
  if (score >= 30) {
    return 'difficult'
  }
  return 'veryDifficult'
}

/** 分析文本可读性：统计词/句/音节/复杂词/字符数，并计算三项经典分数；空文本返回全 0 */
export function analyzeReadability(text: string): ReadabilityResult {
  const words = text.match(WORD_PATTERN) ?? []
  const chars = Array.from(text).length
  const sentences = countSentences(text)

  if (words.length === 0) {
    return {
      stats: { words: 0, sentences: 0, syllables: 0, complexWords: 0, chars },
      scores: { fleschReadingEase: 0, fleschKincaidGrade: 0, gunningFog: 0 },
      level: 'unknown',
    }
  }

  const syllables = words.reduce((total, word) => total + countSyllables(word), 0)
  const complexWords = words.filter((word) => countSyllables(word) >= 3).length
  const sentenceCount = Math.max(1, sentences)

  const wordsPerSentence = words.length / sentenceCount
  const syllablesPerWord = syllables / words.length
  const complexRatio = complexWords / words.length

  return {
    stats: {
      words: words.length,
      sentences,
      syllables,
      complexWords,
      chars,
    },
    scores: {
      fleschReadingEase: round1(206.835 - 1.015 * wordsPerSentence - 84.6 * syllablesPerWord),
      fleschKincaidGrade: round1(0.39 * wordsPerSentence + 11.8 * syllablesPerWord - 15.59),
      gunningFog: round1(0.4 * (wordsPerSentence + 100 * complexRatio)),
    },
    level: getReadabilityLevel(
      206.835 - 1.015 * wordsPerSentence - 84.6 * syllablesPerWord,
    ),
  }
}
