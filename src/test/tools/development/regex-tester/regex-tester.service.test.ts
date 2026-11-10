import { describe, expect, it } from 'vitest'

import {
  compileRegex,
  findMatches,
  highlightSegments,
  normalizeFlags,
  replaceMatches,
} from '@/tools/development/regex-tester/regex-tester.service'

describe('normalizeFlags', () => {
  it('keeps supported flags once in canonical order', () => {
    expect(normalizeFlags('ig')).toBe('gi')
    expect(normalizeFlags('ggii')).toBe('gi')
  })

  it('drops unsupported flags such as y and d', () => {
    expect(normalizeFlags('yigd')).toBe('gi')
  })
})

describe('compileRegex', () => {
  it('compiles a valid pattern with normalized flags', () => {
    expect(compileRegex('a+', 'ig').flags).toBe('gi')
  })

  it('throws on an invalid pattern', () => {
    expect(() => compileRegex('(', 'g')).toThrow(/Invalid regular expression/)
  })
})

describe('findMatches', () => {
  it('finds every match with the correct index', () => {
    const matches = findMatches('cat', 'g', 'cat cat')

    expect(matches.map((match) => match.text)).toEqual(['cat', 'cat'])
    expect(matches.map((match) => match.index)).toEqual([0, 4])
  })

  it('is case-insensitive with the i flag', () => {
    const matches = findMatches('abc', 'gi', 'ABC abc')

    expect(matches).toHaveLength(2)
  })

  it('collects capture groups', () => {
    const [match] = findMatches('(\\w+)@(\\w+)\\.com', 'g', 'ada@math.com')

    expect(match?.groups).toEqual(['ada', 'math'])
    expect(match?.namedGroups).toEqual({})
  })

  it('collects named capture groups', () => {
    const [match] = findMatches('(?<user>\\w+)@(?<host>\\w+)', 'g', 'ada@math')

    expect(match?.namedGroups).toEqual({ user: 'ada', host: 'math' })
    expect(match?.groups).toEqual(['ada', 'math'])
  })

  it('advances past zero-length matches instead of looping forever', () => {
    const matches = findMatches('a*', 'g', 'ba')

    expect(matches.map((match) => match.text)).toEqual(['', 'a', ''])
    expect(matches.map((match) => match.index)).toEqual([0, 1, 2])
  })

  it('returns an empty list for an empty pattern', () => {
    expect(findMatches('', 'g', 'anything')).toEqual([])
  })

  it('throws on an invalid pattern', () => {
    expect(() => findMatches('(', 'g', 'text')).toThrow(/Invalid regular expression/)
  })
})

describe('replaceMatches', () => {
  it('expands numbered capture groups', () => {
    expect(replaceMatches('(\\w+)@(\\w+)', 'g', 'ada@math linus@os', '$2($1)')).toBe(
      'math(ada) os(linus)',
    )
  })

  it('expands named capture groups', () => {
    expect(
      replaceMatches('(?<user>\\w+)@(?<host>\\w+)', 'g', 'ada@math', '$<user> at $<host>'),
    ).toBe('ada at math')
  })

  it('replaces only the first match without the g flag', () => {
    expect(replaceMatches('a', 'i', 'aa', 'b')).toBe('ba')
  })

  it('returns the original text for an empty pattern', () => {
    expect(replaceMatches('', 'g', 'abc', 'x')).toBe('abc')
  })
})

describe('highlightSegments', () => {
  it('joins back into the original text and marks every match', () => {
    const text = 'cat and dog'
    const matches = findMatches('cat|dog', 'g', text)
    const segments = highlightSegments(text, matches)

    expect(segments.map((segment) => segment.text).join('')).toBe(text)
    expect(segments.filter((segment) => segment.matched)).toHaveLength(2)
    expect(segments.filter((segment) => segment.matched).map((segment) => segment.text)).toEqual([
      'cat',
      'dog',
    ])
  })

  it('does not emit empty segments for zero-length matches', () => {
    const text = 'ba'
    const segments = highlightSegments(text, findMatches('a*', 'g', text))

    expect(segments.map((segment) => segment.text).join('')).toBe(text)
    expect(segments.filter((segment) => segment.matched)).toHaveLength(1)
  })

  it('returns a single unmatched segment when nothing matches', () => {
    expect(highlightSegments('abc', [])).toEqual([{ text: 'abc', matched: false }])
  })

  it('returns an empty list for empty text', () => {
    expect(highlightSegments('', [])).toEqual([])
  })
})
