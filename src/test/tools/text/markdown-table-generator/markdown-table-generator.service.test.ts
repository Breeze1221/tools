import { describe, expect, it } from 'vitest'

import {
  detectDelimiter,
  markdownTableToCsv,
  parseRows,
  toMarkdownTable,
} from '@/tools/text/markdown-table-generator/markdown-table-generator.service'

describe('detectDelimiter', () => {
  it('detects commas', () => {
    expect(detectDelimiter('a,b\n1,2')).toBe(',')
  })

  it('detects tabs', () => {
    expect(detectDelimiter('a\tb\n1\t2')).toBe('\t')
  })

  it('detects semicolons', () => {
    expect(detectDelimiter('a;b\n1;2')).toBe(';')
  })

  it('detects pipes', () => {
    expect(detectDelimiter('| a | b |\n| --- | --- |\n| 1 | 2 |')).toBe('|')
  })

  it('ignores delimiters inside quoted cells', () => {
    expect(detectDelimiter('"a,b"\t"c,d"\n"e,f"\t"g,h"')).toBe('\t')
  })

  it('falls back to aligned spaces', () => {
    expect(detectDelimiter('name    age\nAda     36')).toBe(' ')
  })

  it('throws on empty input', () => {
    expect(() => detectDelimiter('   ')).toThrow('Input is empty')
  })
})

describe('parseRows', () => {
  it('parses comma separated rows', () => {
    expect(parseRows('a,b\n1,2')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ])
  })

  it('parses tab separated rows via auto detection', () => {
    expect(parseRows('a\tb\n1\t2')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ])
  })

  it('honours an explicit delimiter', () => {
    expect(parseRows('a;b\n1;2', ';')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ])
  })

  it('keeps commas inside quoted cells', () => {
    expect(parseRows('name,address\n"Ada, Lovelace",London')).toEqual([
      ['name', 'address'],
      ['Ada, Lovelace', 'London'],
    ])
  })

  it('unescapes doubled quotes', () => {
    expect(parseRows('a,"say ""hi""",c')).toEqual([['a', 'say "hi"', 'c']])
  })

  it('keeps newlines inside quoted cells', () => {
    expect(parseRows('a,"line1\nline2",c\n1,2,3')).toEqual([
      ['a', 'line1\nline2', 'c'],
      ['1', '2', '3'],
    ])
  })

  it('parses space aligned tables', () => {
    expect(parseRows('name    age\nAda     36')).toEqual([
      ['name', 'age'],
      ['Ada', '36'],
    ])
  })

  it('throws on empty input', () => {
    expect(() => parseRows('')).toThrow('Input is empty')
    expect(() => parseRows('  \n ')).toThrow('Input is empty')
  })
})

describe('toMarkdownTable', () => {
  const options = { align: 'none', header: true, escapePipe: true } as const

  it('builds a table using the first row as header', () => {
    expect(
      toMarkdownTable(
        [
          ['a', 'b'],
          ['1', '2'],
        ],
        options,
      ),
    ).toBe('| a | b |\n| --- | --- |\n| 1 | 2 |')
  })

  it('writes the alignment markers for every column', () => {
    const rows = [['a', 'b']]
    expect(toMarkdownTable(rows, { ...options, align: 'left' })).toContain('| :--- | :--- |')
    expect(toMarkdownTable(rows, { ...options, align: 'center' })).toContain('| :---: | :---: |')
    expect(toMarkdownTable(rows, { ...options, align: 'right' })).toContain('| ---: | ---: |')
  })

  it('pads ragged rows with empty cells', () => {
    expect(toMarkdownTable([['a'], ['1', '2']], options)).toBe('| a |  |\n| --- | --- |\n| 1 | 2 |')
  })

  it('adds an empty header row when the first row is not a header', () => {
    expect(
      toMarkdownTable(
        [
          ['a', 'b'],
          ['1', '2'],
        ],
        { ...options, header: false },
      ),
    ).toBe('|  |  |\n| --- | --- |\n| a | b |\n| 1 | 2 |')
  })

  it('escapes pipes only when the option is on', () => {
    const rows = [['a|b', 'c']]
    expect(toMarkdownTable(rows, options)).toBe('| a\\|b | c |\n| --- | --- |')
    expect(toMarkdownTable(rows, { ...options, escapePipe: false })).toBe(
      '| a|b | c |\n| --- | --- |',
    )
  })

  it('folds cell newlines into <br>', () => {
    expect(toMarkdownTable([['a\nb']], options)).toContain('| a<br>b |')
  })

  it('throws on empty rows', () => {
    expect(() => toMarkdownTable([], options)).toThrow('Input is empty')
  })
})

describe('markdownTableToCsv', () => {
  it('converts a markdown table to CSV', () => {
    const input = ['| Name | Age |', '| --- | --- |', '| Ada | 36 |', '| Bob | 41 |'].join('\n')
    expect(markdownTableToCsv(input)).toBe('Name,Age\nAda,36\nBob,41')
  })

  it('skips alignment separators with colons', () => {
    const input = ['| A | B |', '| :---: | ---: |', '| 1 | 2 |'].join('\n')
    expect(markdownTableToCsv(input)).toBe('A,B\n1,2')
  })

  it('unescapes pipes and restores line breaks', () => {
    const input = ['| a\\|b | c |', '| --- | --- |', '| d<br>e | f |'].join('\n')
    expect(markdownTableToCsv(input)).toBe('a|b,c\n"d\ne",f')
  })

  it('quotes fields that contain commas or quotes', () => {
    const input = ['| x | y |', '| --- | --- |', '| "q" | a,b |'].join('\n')
    expect(markdownTableToCsv(input)).toBe('x,y\n"""q""","a,b"')
  })

  it('throws on empty input', () => {
    expect(() => markdownTableToCsv('')).toThrow('Input is empty')
  })
})
