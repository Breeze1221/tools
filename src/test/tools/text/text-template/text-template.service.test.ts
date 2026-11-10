import { describe, expect, it } from 'vitest'

import {
  detectVariables,
  fillTemplate,
  parseKeyValuePairs,
} from '@/tools/text/text-template/text-template.service'

describe('detectVariables', () => {
  it('finds single and spaced placeholders', () => {
    expect(detectVariables('Hello {{name}}, welcome to {{ city }}!')).toEqual(['name', 'city'])
  })

  it('deduplicates repeated variables and keeps first-seen order', () => {
    expect(detectVariables('{{b}} {{a}} {{b}}')).toEqual(['b', 'a'])
  })

  it('returns an empty list when there are no placeholders', () => {
    expect(detectVariables('plain text')).toEqual([])
  })

  it('ignores empty placeholders', () => {
    expect(detectVariables('{{ }} {{}}')).toEqual([])
  })

  it('returns an empty list for an empty template', () => {
    expect(detectVariables('')).toEqual([])
  })
})

describe('fillTemplate', () => {
  it('fills every provided variable', () => {
    expect(fillTemplate('Hi {{name}} from {{city}}', { name: 'Ann', city: 'Paris' })).toEqual({
      output: 'Hi Ann from Paris',
      missing: [],
    })
  })

  it('keeps placeholders for missing variables and reports them', () => {
    expect(fillTemplate('Hi {{name}} from {{city}}', { name: 'Ann' })).toEqual({
      output: 'Hi Ann from {{city}}',
      missing: ['city'],
    })
  })

  it('accepts spaces inside the braces', () => {
    expect(fillTemplate('{{ name }}', { name: 'Ann' })).toEqual({ output: 'Ann', missing: [] })
  })

  it('replaces repeated occurrences', () => {
    expect(fillTemplate('{{a}}-{{a}}', { a: 'x' })).toEqual({ output: 'x-x', missing: [] })
  })

  it('treats an empty value as provided', () => {
    expect(fillTemplate('[{{a}}]', { a: '' })).toEqual({ output: '[]', missing: [] })
  })

  it('does not interpret dollar patterns in replacement values', () => {
    expect(fillTemplate('{{a}}', { a: '$& <b>' })).toEqual({ output: '$& <b>', missing: [] })
  })

  it('returns plain templates unchanged', () => {
    expect(fillTemplate('plain text', {})).toEqual({ output: 'plain text', missing: [] })
  })

  it('handles an empty template', () => {
    expect(fillTemplate('', {})).toEqual({ output: '', missing: [] })
  })
})

describe('parseKeyValuePairs', () => {
  it('parses one pair per line and trims keys and values', () => {
    expect(parseKeyValuePairs('a=1\n b = two \nempty=')).toEqual({
      a: '1',
      b: 'two',
      empty: '',
    })
  })

  it('skips blank lines, comments and lines without a key', () => {
    expect(parseKeyValuePairs('\n# comment\ninvalid\n=3\na=1')).toEqual({ a: '1' })
  })

  it('keeps equals signs inside values', () => {
    expect(parseKeyValuePairs('token=a=b')).toEqual({ token: 'a=b' })
  })

  it('lets later duplicates win', () => {
    expect(parseKeyValuePairs('a=1\na=2')).toEqual({ a: '2' })
  })

  it('returns an empty object for empty input', () => {
    expect(parseKeyValuePairs('')).toEqual({})
  })
})
