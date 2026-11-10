import { describe, expect, it } from 'vitest'

import {
  describeChar,
  getUtf8Bytes,
  inspectText,
  toJson,
  toTsv,
} from '@/tools/text/unicode-inspector/unicode-inspector.service'

describe('getUtf8Bytes', () => {
  it('encodes ASCII in one byte', () => {
    expect(getUtf8Bytes('A')).toEqual([0x41])
  })

  it('encodes Chinese in three bytes', () => {
    expect(getUtf8Bytes('中')).toEqual([0xe4, 0xb8, 0xad])
  })

  it('encodes an emoji in four bytes', () => {
    expect(getUtf8Bytes('😀')).toEqual([0xf0, 0x9f, 0x98, 0x80])
  })

  it('returns an empty list for an empty string', () => {
    expect(getUtf8Bytes('')).toEqual([])
  })
})

describe('describeChar', () => {
  it('classifies letters, numbers, punctuation, symbols and whitespace', () => {
    expect(describeChar('a')).toBe('letter')
    expect(describeChar('7')).toBe('number')
    expect(describeChar(',')).toBe('punctuation')
    expect(describeChar('$')).toBe('symbol')
    expect(describeChar(' ')).toBe('whitespace')
    expect(describeChar('\n')).toBe('whitespace')
  })

  it('classifies emoji', () => {
    expect(describeChar('😀')).toBe('emoji')
  })
})

describe('inspectText', () => {
  it('describes a single ASCII character', () => {
    const { rows, summary } = inspectText('A')
    expect(rows).toEqual([
      {
        char: 'A',
        codePoint: 'U+0041',
        decimal: 65,
        utf8: '41',
        utf16: '0041',
        category: 'letter',
        isSurrogatePair: false,
      },
    ])
    expect(summary).toEqual({ chars: 1, codePoints: 1, utf8Bytes: 1, utf16Units: 1 })
  })

  it('reports three UTF-8 bytes for a Chinese character', () => {
    const { rows } = inspectText('中')
    expect(rows[0].codePoint).toBe('U+4E2D')
    expect(rows[0].utf8).toBe('E4 B8 AD')
    expect(rows[0].utf16).toBe('4E2D')
  })

  it('marks an emoji as a surrogate pair with four UTF-8 bytes', () => {
    const { rows, summary } = inspectText('😀')
    expect(rows[0].codePoint).toBe('U+1F600')
    expect(rows[0].decimal).toBe(0x1f600)
    expect(rows[0].utf8).toBe('F0 9F 98 80')
    expect(rows[0].utf16).toBe('D83D DE00')
    expect(rows[0].isSurrogatePair).toBe(true)
    // 一个码点，但占两个 UTF-16 码元
    expect(summary).toEqual({ chars: 1, codePoints: 1, utf8Bytes: 4, utf16Units: 2 })
  })

  it('escapes newlines so the character column stays on one line', () => {
    const { rows, summary } = inspectText('\n')
    expect(rows[0].char).toBe('\\n')
    expect(rows[0].category).toBe('whitespace')
    expect(summary.utf8Bytes).toBe(1)
  })

  it('returns empty rows and zero totals for empty input', () => {
    expect(inspectText('')).toEqual({
      rows: [],
      summary: { chars: 0, codePoints: 0, utf8Bytes: 0, utf16Units: 0 },
    })
  })
})

describe('toTsv', () => {
  it('writes a header plus one line per character', () => {
    const { rows } = inspectText('A中')
    const lines = toTsv(rows).split('\n')
    expect(lines).toHaveLength(3)
    expect(lines[0].split('\t')).toHaveLength(7)
    expect(lines[1]).toBe('A\tU+0041\t65\t41\t0041\tletter\tfalse')
  })

  it('still writes only the header for no rows', () => {
    expect(toTsv([]).split('\n')).toHaveLength(1)
  })
})

describe('toJson', () => {
  it('serialises rows as pretty printed JSON', () => {
    const { rows } = inspectText('A')
    const parsed: unknown = JSON.parse(toJson(rows))
    expect(parsed).toEqual(rows)
    expect(toJson(rows)).toContain('\n  ')
  })
})
