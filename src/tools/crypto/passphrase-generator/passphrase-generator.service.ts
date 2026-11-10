import { randomInt } from '@/utils/random'

import { WORDLIST } from './wordlist'

/** 可用分隔符（与 UI 下拉一一对应） */
export const passphraseSeparators = ['space', 'hyphen', 'dot', 'underscore'] as const

export type PassphraseSeparator = (typeof passphraseSeparators)[number]

export type PassphraseOptions = {
  /** 单词数量 */
  wordCount: number
  separator: PassphraseSeparator
  /** 每个单词首字母大写 */
  capitalize: boolean
  /** 在随机位置插入一个随机数字 */
  includeDigit: boolean
}

export const PASSPHRASE_WORD_COUNT_RANGE = { min: 3, max: 12 } as const
export const PASSPHRASE_COUNT_RANGE = { min: 1, max: 10 } as const

export const DEFAULT_PASSPHRASE_OPTIONS: PassphraseOptions = {
  wordCount: 5,
  separator: 'hyphen',
  capitalize: false,
  includeDigit: false,
}

const SEPARATOR_CHARS: Record<PassphraseSeparator, string> = {
  space: ' ',
  hyphen: '-',
  dot: '.',
  underscore: '_',
}

/** 插入单个十进制数字带来约 log2(10) ≈ 3.32 bit，按约定取 4 bit 计入理论熵 */
const DIGIT_ENTROPY_BITS = 4

/** 去重重试上限：词表空间足够时用不到，空间不足时据此提前返回 */
const MAX_DUPLICATE_ATTEMPTS = 200

export function isPassphraseSeparator(value: string): value is PassphraseSeparator {
  return passphraseSeparators.some((separator) => separator === value)
}

function assertWordCount(wordCount: number): void {
  if (
    !Number.isInteger(wordCount) ||
    wordCount < PASSPHRASE_WORD_COUNT_RANGE.min ||
    wordCount > PASSPHRASE_WORD_COUNT_RANGE.max
  ) {
    throw new Error(
      `Word count must be an integer between ${PASSPHRASE_WORD_COUNT_RANGE.min} and ${PASSPHRASE_WORD_COUNT_RANGE.max}, got ${wordCount}`,
    )
  }
}

function assertCount(count: number): void {
  if (
    !Number.isInteger(count) ||
    count < PASSPHRASE_COUNT_RANGE.min ||
    count > PASSPHRASE_COUNT_RANGE.max
  ) {
    throw new Error(
      `Count must be an integer between ${PASSPHRASE_COUNT_RANGE.min} and ${PASSPHRASE_COUNT_RANGE.max}, got ${count}`,
    )
  }
}

function assertValidOptions(options: PassphraseOptions): void {
  assertWordCount(options.wordCount)
  if (!isPassphraseSeparator(options.separator)) {
    throw new Error(`Unsupported separator: ${String(options.separator)}`)
  }
}

function buildPassphrase(options: PassphraseOptions): string {
  const { wordCount, separator, capitalize, includeDigit } = options

  const tokens: string[] = []
  for (let index = 0; index < wordCount; index++) {
    const word = WORDLIST[randomInt(WORDLIST.length)]
    tokens.push(capitalize ? word.charAt(0).toUpperCase() + word.slice(1) : word)
  }

  if (includeDigit) {
    // 数字作为独立片段插入，既保证出现在随机位置，也不会把某个单词撕成两半
    tokens.splice(randomInt(tokens.length + 1), 0, String(randomInt(10)))
  }

  return tokens.join(SEPARATOR_CHARS[separator])
}

/** 生成一条易记短语口令，参数非法时抛出 Error（UI 负责翻译展示） */
export function generatePassphrase(options: PassphraseOptions): string {
  assertValidOptions(options)
  return buildPassphrase(options)
}

/**
 * 批量生成短语口令并按值去重；词表空间不足时可能返回少于 count 条。
 * 参数非法时抛出 Error（UI 负责翻译展示）。
 */
export function generatePassphrases(options: PassphraseOptions, count: number): string[] {
  assertValidOptions(options)
  assertCount(count)

  const results: string[] = []
  const seen = new Set<string>()
  const maxAttempts = MAX_DUPLICATE_ATTEMPTS + count * 10

  for (let attempt = 0; attempt < maxAttempts && results.length < count; attempt++) {
    const passphrase = buildPassphrase(options)
    if (seen.has(passphrase)) {
      continue
    }
    seen.add(passphrase)
    results.push(passphrase)
  }

  return results
}

/**
 * 理论熵值：wordCount × log2(wordlistSize)，插入随机数字时再加 4 bit。
 * 结果保留两位小数；参数非法时抛出 Error。
 */
export function estimatePassphraseEntropy(
  wordCount: number,
  wordlistSize: number = WORDLIST.length,
  includeDigit = false,
): number {
  assertWordCount(wordCount)
  if (!Number.isInteger(wordlistSize) || wordlistSize < 2) {
    throw new Error(`Wordlist size must be an integer of at least 2, got ${wordlistSize}`)
  }

  const bits = wordCount * Math.log2(wordlistSize) + (includeDigit ? DIGIT_ENTROPY_BITS : 0)
  return Math.round(bits * 100) / 100
}
