import { describe, expect, it } from 'vitest'

import {
  commonPrefixLength,
  jaccardSimilarity,
  levenshteinDistance,
  normalizeWhitespace,
  similarityRatio,
} from '@/tools/text/text-similarity/text-similarity.service'

describe('normalizeWhitespace', () => {
  it('trims and collapses runs of whitespace', () => {
    expect(normalizeWhitespace('  hello   world \n')).toBe('hello world')
  })

  it('returns an empty string for whitespace-only input', () => {
    expect(normalizeWhitespace('   \n\t')).toBe('')
  })
})

describe('levenshteinDistance', () => {
  it('returns 0 for identical strings', () => {
    expect(levenshteinDistance('kitten', 'kitten')).toBe(0)
  })

  it('computes the classic kitten/sitting distance', () => {
    expect(levenshteinDistance('kitten', 'sitting')).toBe(3)
  })

  it('handles empty strings', () => {
    expect(levenshteinDistance('', 'abc')).toBe(3)
    expect(levenshteinDistance('abc', '')).toBe(3)
    expect(levenshteinDistance('', '')).toBe(0)
  })

  it('counts Chinese characters individually', () => {
    expect(levenshteinDistance('你好', '你好吗')).toBe(1)
  })

  it('counts emoji as single code points', () => {
    expect(levenshteinDistance('😀😀', '😀')).toBe(1)
  })

  it('is case sensitive', () => {
    expect(levenshteinDistance('Hello', 'hello')).toBe(1)
  })
})

describe('similarityRatio', () => {
  it('returns 100 for identical text', () => {
    expect(similarityRatio('hello', 'hello')).toBe(100)
  })

  it('returns 0 for completely different text of the same length', () => {
    expect(similarityRatio('abc', 'xyz')).toBe(0)
  })

  it('returns 100 when both strings are empty', () => {
    expect(similarityRatio('', '')).toBe(100)
  })

  it('returns 0 when only one string is empty', () => {
    expect(similarityRatio('', 'abc')).toBe(0)
  })

  it('ignores surrounding and repeated whitespace', () => {
    expect(similarityRatio('hello world', '  hello   world ')).toBe(100)
  })

  it('rounds to one decimal place', () => {
    expect(similarityRatio('kitten', 'sitting')).toBe(57.1)
  })
})

describe('jaccardSimilarity', () => {
  it('compares word sets', () => {
    expect(jaccardSimilarity('the cat sat', 'the cat ran')).toBe(50)
  })

  it('is case insensitive', () => {
    expect(jaccardSimilarity('Hello World', 'hello world')).toBe(100)
  })

  it('segments Chinese into single characters', () => {
    expect(jaccardSimilarity('中国人民', '中国 人民')).toBe(100)
  })

  it('returns 100 when both inputs are empty', () => {
    expect(jaccardSimilarity('', '   ')).toBe(100)
  })

  it('returns 0 when one input has no words', () => {
    expect(jaccardSimilarity('', 'hello')).toBe(0)
  })

  it('ignores punctuation when tokenising', () => {
    expect(jaccardSimilarity('hello, world!', 'hello world')).toBe(100)
  })
})

describe('commonPrefixLength', () => {
  it('returns the length of the shared prefix', () => {
    expect(commonPrefixLength('abcdef', 'abcxyz')).toBe(3)
  })

  it('returns 0 when the first characters differ', () => {
    expect(commonPrefixLength('abc', 'xyz')).toBe(0)
  })

  it('handles Chinese text', () => {
    expect(commonPrefixLength('你好世界', '你好朋友')).toBe(2)
  })

  it('handles empty strings', () => {
    expect(commonPrefixLength('', 'abc')).toBe(0)
    expect(commonPrefixLength('', '')).toBe(0)
  })
})
