import { describe, expect, it } from 'vitest'

import {
  READABILITY_LEVELS,
  analyzeReadability,
  countSyllables,
  getReadabilityLevel,
} from '@/tools/text/readability-analyzer/readability-analyzer.service'

describe('READABILITY_LEVELS', () => {
  it('exposes every difficulty level', () => {
    expect(READABILITY_LEVELS).toContain('veryEasy')
    expect(READABILITY_LEVELS).toContain('difficult')
    expect(READABILITY_LEVELS).toContain('unknown')
  })
})

describe('countSyllables', () => {
  it('counts vowels in simple words', () => {
    expect(countSyllables('cat')).toBe(1)
    expect(countSyllables('hello')).toBe(2)
    expect(countSyllables('banana')).toBe(3)
  })

  it('returns 1 for very short or numeric words', () => {
    expect(countSyllables('the')).toBe(1)
    expect(countSyllables('123')).toBe(1)
    expect(countSyllables('')).toBe(1)
  })

  it('counts each CJK character as a syllable', () => {
    expect(countSyllables('中文')).toBe(2)
  })
})

describe('getReadabilityLevel', () => {
  it('maps score boundaries to levels', () => {
    expect(getReadabilityLevel(90)).toBe('veryEasy')
    expect(getReadabilityLevel(89.9)).toBe('easy')
    expect(getReadabilityLevel(80)).toBe('easy')
    expect(getReadabilityLevel(70)).toBe('fairlyEasy')
    expect(getReadabilityLevel(60)).toBe('standard')
    expect(getReadabilityLevel(50)).toBe('fairlyDifficult')
    expect(getReadabilityLevel(30)).toBe('difficult')
    expect(getReadabilityLevel(29.9)).toBe('veryDifficult')
  })

  it('returns unknown for non-finite scores', () => {
    expect(getReadabilityLevel(Number.NaN)).toBe('unknown')
    expect(getReadabilityLevel(Number.POSITIVE_INFINITY)).toBe('unknown')
  })
})

describe('analyzeReadability', () => {
  it('analyses a simple sentence', () => {
    const result = analyzeReadability('The cat sat on the mat.')

    expect(result.stats).toEqual({
      words: 6,
      sentences: 1,
      syllables: 6,
      complexWords: 0,
      chars: 23,
    })
    expect(result.scores.fleschReadingEase).toBe(116.1)
    expect(result.scores.fleschKincaidGrade).toBeCloseTo(-1.45, 0)
    expect(result.scores.gunningFog).toBe(2.4)
    expect(result.level).toBe('veryEasy')
  })

  it('detects complex words and hard levels', () => {
    const result = analyzeReadability(
      'The extraordinary international organization communicated effectively.',
    )

    expect(result.stats.words).toBe(6)
    expect(result.stats.complexWords).toBe(5)
    expect(result.stats.sentences).toBe(1)
    expect(result.level).toBe('veryDifficult')
  })

  it('counts multiple sentences', () => {
    const result = analyzeReadability('Hello! How are you? Fine.')
    expect(result.stats.sentences).toBe(3)
    expect(result.stats.words).toBe(5)
  })

  it('counts characters by code point', () => {
    const result = analyzeReadability('😀 ok')
    expect(result.stats.chars).toBe(4)
    expect(result.stats.words).toBe(1)
  })

  it('returns zeros and unknown for empty input', () => {
    expect(analyzeReadability('')).toEqual({
      stats: { words: 0, sentences: 0, syllables: 0, complexWords: 0, chars: 0 },
      scores: { fleschReadingEase: 0, fleschKincaidGrade: 0, gunningFog: 0 },
      level: 'unknown',
    })
  })

  it('handles whitespace-only input', () => {
    const result = analyzeReadability('   \n\t')
    expect(result.stats.words).toBe(0)
    expect(result.stats.sentences).toBe(0)
    expect(result.stats.chars).toBe(5)
    expect(result.level).toBe('unknown')
  })

  it('treats a text without terminal punctuation as one sentence', () => {
    const result = analyzeReadability('hello world')
    expect(result.stats.sentences).toBe(1)
    expect(result.stats.words).toBe(2)
  })
})
