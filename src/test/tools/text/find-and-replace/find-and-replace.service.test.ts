import { describe, expect, it } from 'vitest'

import {
  countMatches,
  escapeRegExp,
  findAndReplace,
  type FindAndReplaceOptions,
} from '@/tools/text/find-and-replace/find-and-replace.service'

const base: FindAndReplaceOptions = { find: 'foo', replacement: 'bar' }

describe('escapeRegExp', () => {
  it('escapes regular expression metacharacters', () => {
    expect(escapeRegExp('a.b*c')).toBe('a\\.b\\*c')
    expect(escapeRegExp('(x)[y]')).toBe('\\(x\\)\\[y\\]')
  })

  it('leaves plain text untouched', () => {
    expect(escapeRegExp('hello world')).toBe('hello world')
  })
})

describe('countMatches', () => {
  it('counts every match case-insensitively by default', () => {
    expect(countMatches('foo Foo FOO', base)).toBe(3)
  })

  it('respects case sensitivity', () => {
    expect(countMatches('foo Foo FOO', { ...base, caseSensitive: true })).toBe(1)
  })

  it('returns 0 for an empty search term', () => {
    expect(countMatches('foo', { find: '', replacement: '' })).toBe(0)
  })

  it('throws on an invalid regular expression', () => {
    expect(() =>
      countMatches('foo', { find: '(', replacement: '', useRegex: true }),
    ).toThrow(/Invalid regular expression/)
  })
})

describe('findAndReplace', () => {
  it('replaces every literal match by default', () => {
    expect(findAndReplace('foo bar foo', base)).toEqual({ output: 'bar bar bar', count: 2 })
  })

  it('matches case-insensitively by default', () => {
    expect(findAndReplace('Foo foo FOO', base)).toEqual({ output: 'bar bar bar', count: 3 })
  })

  it('keeps other casing when case sensitive', () => {
    expect(findAndReplace('Foo foo FOO', { ...base, caseSensitive: true })).toEqual({
      output: 'Foo bar FOO',
      count: 1,
    })
  })

  it('replaces only the first match when replaceAll is false', () => {
    expect(findAndReplace('foo foo foo', { ...base, replaceAll: false })).toEqual({
      output: 'bar foo foo',
      count: 1,
    })
  })

  it('supports whole-word matching', () => {
    expect(findAndReplace('cat category cat', { find: 'cat', replacement: 'dog', wholeWord: true }))
      .toEqual({ output: 'dog category dog', count: 2 })
  })

  it('treats regex metacharacters as literals when regex is off', () => {
    expect(findAndReplace('a.b aXb', { find: 'a.b', replacement: 'c' })).toEqual({
      output: 'c aXb',
      count: 1,
    })
  })

  it('does not interpret dollar patterns in literal mode', () => {
    expect(findAndReplace('price', { find: 'price', replacement: '$&100' })).toEqual({
      output: '$&100',
      count: 1,
    })
  })

  it('supports capture group references in regex mode', () => {
    expect(
      findAndReplace('John Smith', {
        find: '(\\w+) (\\w+)',
        replacement: '$2 $1',
        useRegex: true,
      }),
    ).toEqual({ output: 'Smith John', count: 1 })
  })

  it('returns the input unchanged for an empty search term', () => {
    expect(findAndReplace('foo', { find: '', replacement: 'bar' })).toEqual({
      output: 'foo',
      count: 0,
    })
  })

  it('handles empty input', () => {
    expect(findAndReplace('', base)).toEqual({ output: '', count: 0 })
  })

  it('throws on an invalid regular expression', () => {
    expect(() =>
      findAndReplace('foo', { find: '(?<', replacement: '', useRegex: true }),
    ).toThrow(/Invalid regular expression/)
  })
})
