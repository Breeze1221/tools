import { describe, expect, it } from 'vitest'

import {
  LOREM_COUNT_MAX,
  LOREM_COUNT_MIN,
  generateLorem,
  latinWords,
  loremLanguages,
  loremTypes,
} from '@/tools/text/lorem-ipsum-generator/lorem-ipsum-generator.service'

describe('generateLorem', () => {
  it('generates the requested number of paragraphs', () => {
    const result = generateLorem({
      type: 'paragraph',
      count: 4,
      startWithLorem: false,
      language: 'latin',
    })
    const paragraphs = result.split('\n\n')
    expect(paragraphs).toHaveLength(4)
    expect(paragraphs.every((item) => item.trim() !== '')).toBe(true)
  })

  it('generates the requested number of sentences', () => {
    const result = generateLorem({
      type: 'sentence',
      count: 5,
      startWithLorem: false,
      language: 'latin',
    })
    expect(result.match(/\./g)).toHaveLength(5)
  })

  it('generates exactly the requested number of words', () => {
    for (const count of [1, 7, LOREM_COUNT_MAX]) {
      const result = generateLorem({
        type: 'word',
        count,
        startWithLorem: false,
        language: 'latin',
      })
      expect(result.split(' ')).toHaveLength(count)
    }
  })

  it('starts with the classic Lorem ipsum phrase when requested', () => {
    const sentence = generateLorem({
      type: 'sentence',
      count: 3,
      startWithLorem: true,
      language: 'latin',
    })
    expect(sentence.startsWith('Lorem ipsum dolor sit amet')).toBe(true)

    const paragraph = generateLorem({
      type: 'paragraph',
      count: 2,
      startWithLorem: true,
      language: 'latin',
    })
    expect(paragraph.split('\n\n')[0]?.startsWith('Lorem ipsum dolor sit amet')).toBe(true)

    const word = generateLorem({
      type: 'word',
      count: 8,
      startWithLorem: true,
      language: 'latin',
    })
    expect(word.startsWith('Lorem ipsum dolor sit amet ')).toBe(true)
    expect(word.split(' ')).toHaveLength(8)
  })

  it('truncates the opening phrase when fewer words are requested', () => {
    const result = generateLorem({
      type: 'word',
      count: 3,
      startWithLorem: true,
      language: 'latin',
    })
    expect(result).toBe('Lorem ipsum dolor')
  })

  it('keeps Chinese output free of Latin letters', () => {
    for (const type of loremTypes) {
      for (const startWithLorem of [false, true]) {
        const result = generateLorem({ type, count: 3, startWithLorem, language: 'chinese' })
        expect(result).not.toMatch(/[A-Za-z]/)
      }
    }
  })

  it(`throws when count is outside ${LOREM_COUNT_MIN}-${LOREM_COUNT_MAX}`, () => {
    const base = { type: 'sentence', startWithLorem: false, language: 'latin' } as const
    expect(() => generateLorem({ ...base, count: 0 })).toThrow(/between 1 and 20/)
    expect(() => generateLorem({ ...base, count: LOREM_COUNT_MAX + 1 })).toThrow(/between 1 and 20/)
    expect(() => generateLorem({ ...base, count: 2.5 })).toThrow(/between 1 and 20/)
    expect(() => generateLorem({ ...base, count: Number.NaN })).toThrow(/between 1 and 20/)
  })

  it('ships a word bank of at least 60 words and both languages', () => {
    expect(latinWords.length).toBeGreaterThanOrEqual(60)
    expect(loremLanguages).toEqual(['latin', 'chinese'])
  })
})
