import { describe, expect, it } from 'vitest'

import {
  STOPWORDS,
  countWords,
  toCsv,
  toJson,
} from '@/tools/text/word-frequency-counter/word-frequency-counter.service'

describe('STOPWORDS', () => {
  it('contains common English stopwords', () => {
    expect(STOPWORDS.has('the')).toBe(true)
    expect(STOPWORDS.has('and')).toBe(true)
    expect(STOPWORDS.has('hello')).toBe(false)
  })
})

describe('countWords', () => {
  it('counts words and sorts by frequency', () => {
    const result = countWords('Hello hello, world!', { sort: 'count' })
    expect(result.totalWords).toBe(3)
    expect(result.uniqueWords).toBe(2)
    expect(result.items).toEqual([
      { word: 'hello', count: 2, percent: 66.7 },
      { word: 'world', count: 1, percent: 33.3 },
    ])
  })

  it('lowercases by default and keeps case when case sensitive', () => {
    const insensitive = countWords('Hello hello HELLO', { sort: 'count' })
    expect(insensitive.uniqueWords).toBe(1)
    expect(insensitive.items[0]).toEqual({ word: 'hello', count: 3, percent: 100 })

    const sensitive = countWords('Hello hello HELLO', { sort: 'count', caseSensitive: true })
    expect(sensitive.uniqueWords).toBe(3)
    expect(sensitive.items.map((item) => item.word)).toEqual(['HELLO', 'Hello', 'hello'])
  })

  it('ignores stopwords when asked', () => {
    const result = countWords('the cat and the dog', { sort: 'count', ignoreStopwords: true })
    expect(result.totalWords).toBe(2)
    expect(result.items).toEqual([
      { word: 'cat', count: 1, percent: 50 },
      { word: 'dog', count: 1, percent: 50 },
    ])
  })

  it('filters words shorter than the minimum length', () => {
    const result = countWords('a bb ccc dddd', { sort: 'count', minLength: 3 })
    expect(result.totalWords).toBe(2)
    expect(result.items.map((item) => item.word)).toEqual(['ccc', 'dddd'])
  })

  it('ignores pure numbers when asked', () => {
    const result = countWords('123 abc 456', { sort: 'count', ignoreNumbers: true })
    expect(result.totalWords).toBe(1)
    expect(result.items).toEqual([{ word: 'abc', count: 1, percent: 100 }])
  })

  it('keeps pure numbers by default', () => {
    const result = countWords('123 abc 456', { sort: 'alpha' })
    expect(result.totalWords).toBe(3)
    expect(result.items.map((item) => item.word)).toEqual(['123', '456', 'abc'])
  })

  it('limits the number of returned items after sorting', () => {
    const result = countWords('a b c a b a', { sort: 'count', limit: 2 })
    expect(result.uniqueWords).toBe(3)
    expect(result.items).toEqual([
      { word: 'a', count: 3, percent: 50 },
      { word: 'b', count: 2, percent: 33.3 },
    ])
  })

  it('breaks count ties alphabetically', () => {
    const result = countWords('beta alpha gamma', { sort: 'count' })
    expect(result.items.map((item) => item.word)).toEqual(['alpha', 'beta', 'gamma'])
  })

  it('sorts alphabetically when requested', () => {
    const result = countWords('beta beta alpha', { sort: 'alpha' })
    expect(result.items.map((item) => item.word)).toEqual(['alpha', 'beta'])
  })

  it('strips punctuation and keeps hyphenated or contracted words whole', () => {
    const result = countWords('well-known well-known, state-of-the-art don\'t don\'t', {
      sort: 'count',
    })
    expect(result.totalWords).toBe(5)
    expect(result.uniqueWords).toBe(3)
    expect(result.items[0]).toEqual({ word: "don't", count: 2, percent: 40 })
    expect(result.items[1]).toEqual({ word: 'well-known', count: 2, percent: 40 })
    expect(result.items[2]).toEqual({ word: 'state-of-the-art', count: 1, percent: 20 })
  })

  it('segments Chinese text into words', () => {
    const result = countWords('中国 中国 人民', { sort: 'count' })
    expect(result.totalWords).toBe(3)
    expect(result.items[0]).toEqual({ word: '中国', count: 2, percent: 66.7 })
  })

  it('returns an empty result for empty input', () => {
    expect(countWords('', { sort: 'count' })).toEqual({
      totalWords: 0,
      uniqueWords: 0,
      items: [],
    })
  })

  it('returns an empty result when every word is filtered out', () => {
    const result = countWords('the and 123', {
      sort: 'count',
      ignoreStopwords: true,
      ignoreNumbers: true,
    })
    expect(result).toEqual({ totalWords: 0, uniqueWords: 0, items: [] })
  })
})

describe('toCsv', () => {
  it('writes a header followed by one row per word', () => {
    expect(toCsv([{ word: 'hello', count: 2, percent: 66.7 }]).split('\n')).toEqual([
      'word,count,percent',
      'hello,2,66.7',
    ])
  })

  it('escapes commas, quotes and newlines', () => {
    const csv = toCsv([
      { word: 'a,b', count: 1, percent: 33.3 },
      { word: 'say "hi"', count: 1, percent: 33.3 },
      { word: 'line\nbreak', count: 1, percent: 33.4 },
    ])
    expect(csv).toContain('"a,b",1,33.3')
    expect(csv).toContain('"say ""hi""",1,33.3')
    expect(csv).toContain('"line\nbreak",1,33.4')
  })

  it('writes only the header when there are no items', () => {
    expect(toCsv([])).toBe('word,count,percent')
  })
})

describe('toJson', () => {
  it('serialises items as pretty printed JSON', () => {
    const items = countWords('hello hello world', { sort: 'count' }).items
    const parsed: unknown = JSON.parse(toJson(items))
    expect(parsed).toEqual(items)
    expect(toJson(items)).toContain('\n  ')
  })

  it('returns an empty array literal for no items', () => {
    expect(toJson([])).toBe('[]')
  })
})
