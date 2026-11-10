import { describe, expect, it } from 'vitest'

import {
  DEFAULT_PASSPHRASE_OPTIONS,
  PASSPHRASE_COUNT_RANGE,
  PASSPHRASE_WORD_COUNT_RANGE,
  estimatePassphraseEntropy,
  generatePassphrase,
  generatePassphrases,
  passphraseSeparators,
  type PassphraseOptions,
  type PassphraseSeparator,
} from '@/tools/crypto/passphrase-generator/passphrase-generator.service'
import { WORDLIST } from '@/tools/crypto/passphrase-generator/wordlist'

const SEPARATOR_CHARS: Record<PassphraseSeparator, string> = {
  space: ' ',
  hyphen: '-',
  dot: '.',
  underscore: '_',
}

function optionsWith(patch: Partial<PassphraseOptions> = {}): PassphraseOptions {
  return { ...DEFAULT_PASSPHRASE_OPTIONS, ...patch }
}

function tokensOf(passphrase: string, separator: PassphraseSeparator): string[] {
  return passphrase.split(SEPARATOR_CHARS[separator])
}

describe('WORDLIST', () => {
  it('holds 120 to 160 common words', () => {
    expect(WORDLIST.length).toBeGreaterThanOrEqual(120)
    expect(WORDLIST.length).toBeLessThanOrEqual(160)
  })

  it('contains only unique lowercase words of 3 to 8 letters', () => {
    expect(new Set(WORDLIST).size).toBe(WORDLIST.length)
    for (const word of WORDLIST) {
      expect(word).toMatch(/^[a-z]{3,8}$/)
    }
  })
})

describe('generatePassphrase', () => {
  it('joins the requested number of words with the default separator', () => {
    const passphrase = generatePassphrase(DEFAULT_PASSPHRASE_OPTIONS)
    const tokens = tokensOf(passphrase, 'hyphen')
    expect(tokens).toHaveLength(DEFAULT_PASSPHRASE_OPTIONS.wordCount)
    for (const token of tokens) {
      expect(WORDLIST).toContain(token)
    }
  })

  it('supports every separator', () => {
    for (const separator of passphraseSeparators) {
      const passphrase = generatePassphrase(optionsWith({ separator, wordCount: 4 }))
      expect(passphrase).toContain(SEPARATOR_CHARS[separator])
      expect(tokensOf(passphrase, separator)).toHaveLength(4)
    }
  })

  it('accepts both ends of the word count range', () => {
    const min = generatePassphrase(optionsWith({ wordCount: PASSPHRASE_WORD_COUNT_RANGE.min }))
    expect(tokensOf(min, 'hyphen')).toHaveLength(PASSPHRASE_WORD_COUNT_RANGE.min)
    const max = generatePassphrase(optionsWith({ wordCount: PASSPHRASE_WORD_COUNT_RANGE.max }))
    expect(tokensOf(max, 'hyphen')).toHaveLength(PASSPHRASE_WORD_COUNT_RANGE.max)
  })

  it('capitalizes the first letter of every word on request', () => {
    const passphrase = generatePassphrase(optionsWith({ capitalize: true, wordCount: 6 }))
    for (const word of tokensOf(passphrase, 'hyphen')) {
      expect(word).toBe(word.charAt(0).toUpperCase() + word.slice(1))
      expect(word.charAt(0)).toMatch(/[A-Z]/)
    }
  })

  it('inserts exactly one digit when requested', () => {
    const passphrase = generatePassphrase(optionsWith({ includeDigit: true, wordCount: 5 }))
    const tokens = tokensOf(passphrase, 'hyphen')
    expect(tokens).toHaveLength(6)
    const digits = tokens.filter((token) => /^\d$/.test(token))
    expect(digits).toHaveLength(1)
    for (const token of tokens) {
      if (!/^\d$/.test(token)) {
        expect(WORDLIST).toContain(token)
      }
    }
  })

  it('throws when the word count is out of range', () => {
    expect(() =>
      generatePassphrase(optionsWith({ wordCount: PASSPHRASE_WORD_COUNT_RANGE.min - 1 })),
    ).toThrow(/word count/i)
    expect(() =>
      generatePassphrase(optionsWith({ wordCount: PASSPHRASE_WORD_COUNT_RANGE.max + 1 })),
    ).toThrow(/word count/i)
    expect(() => generatePassphrase(optionsWith({ wordCount: 5.5 }))).toThrow(/word count/i)
  })

  it('throws on an unsupported separator', () => {
    const invalidSeparator = 'pipe' as unknown as PassphraseSeparator
    expect(() => generatePassphrase(optionsWith({ separator: invalidSeparator }))).toThrow(
      /separator/i,
    )
  })
})

describe('generatePassphrases', () => {
  it('returns the requested number of distinct passphrases', () => {
    const items = generatePassphrases(DEFAULT_PASSPHRASE_OPTIONS, PASSPHRASE_COUNT_RANGE.max)
    expect(items).toHaveLength(PASSPHRASE_COUNT_RANGE.max)
    expect(new Set(items).size).toBe(PASSPHRASE_COUNT_RANGE.max)
  })

  it('accepts a single item and the lower count boundary', () => {
    const items = generatePassphrases(DEFAULT_PASSPHRASE_OPTIONS, PASSPHRASE_COUNT_RANGE.min)
    expect(items).toHaveLength(PASSPHRASE_COUNT_RANGE.min)
    expect(items[0]).toBeTypeOf('string')
  })

  it('throws when the count is out of range', () => {
    expect(() => generatePassphrases(DEFAULT_PASSPHRASE_OPTIONS, 0)).toThrow(/count/i)
    expect(() =>
      generatePassphrases(DEFAULT_PASSPHRASE_OPTIONS, PASSPHRASE_COUNT_RANGE.max + 1),
    ).toThrow(/count/i)
    expect(() => generatePassphrases(DEFAULT_PASSPHRASE_OPTIONS, 2.5)).toThrow(/count/i)
  })

  it('throws on invalid options before generating anything', () => {
    expect(() => generatePassphrases(optionsWith({ wordCount: 2 }), 3)).toThrow(/word count/i)
  })
})

describe('estimatePassphraseEntropy', () => {
  it('computes wordCount * log2(wordlistSize)', () => {
    expect(estimatePassphraseEntropy(5, 128)).toBe(35)
    expect(estimatePassphraseEntropy(12, 128)).toBe(84)
  })

  it('uses the built-in wordlist by default', () => {
    const expected = Math.round(5 * Math.log2(WORDLIST.length) * 100) / 100
    expect(estimatePassphraseEntropy(5)).toBe(expected)
  })

  it('adds four bits for the random digit', () => {
    expect(estimatePassphraseEntropy(5, 128, true)).toBe(39)
  })

  it('throws on an invalid word count', () => {
    expect(() => estimatePassphraseEntropy(2)).toThrow(/word count/i)
    expect(() => estimatePassphraseEntropy(13)).toThrow(/word count/i)
    expect(() => estimatePassphraseEntropy(5.5)).toThrow(/word count/i)
  })

  it('throws on an invalid wordlist size', () => {
    expect(() => estimatePassphraseEntropy(5, 1)).toThrow(/wordlist size/i)
    expect(() => estimatePassphraseEntropy(5, 0)).toThrow(/wordlist size/i)
    expect(() => estimatePassphraseEntropy(5, 128.5)).toThrow(/wordlist size/i)
  })
})
