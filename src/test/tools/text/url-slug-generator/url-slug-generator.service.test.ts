import { describe, expect, it } from 'vitest'

import {
  slugify,
  slugifyLines,
  type SlugOptions,
} from '@/tools/text/url-slug-generator/url-slug-generator.service'

const base: SlugOptions = {
  separator: '-',
  lowercase: true,
  dedupe: false,
  keepChinese: true,
  asciiOnly: false,
}

describe('slugify', () => {
  it('turns words into a lowercase dashed slug', () => {
    expect(slugify('Hello World', base)).toBe('hello-world')
  })

  it('transliterates accented letters to ASCII', () => {
    expect(slugify('Café au lait', base)).toBe('cafe-au-lait')
    expect(slugify('Straße', base)).toBe('strasse')
  })

  it('keeps the original case when lowercase is off', () => {
    expect(slugify('Hello World', { ...base, lowercase: false })).toBe('Hello-World')
  })

  it('honours the chosen separator', () => {
    expect(slugify('Hello World', { ...base, separator: '_' })).toBe('hello_world')
    expect(slugify('Hello World', { ...base, separator: '' })).toBe('helloworld')
  })

  it('collapses runs of whitespace and drops punctuation and emoji', () => {
    expect(slugify('  Hello,   World!  ', base)).toBe('hello-world')
    expect(slugify('hello 😀 world', base)).toBe('hello-world')
  })

  it('keeps Chinese characters by default', () => {
    expect(slugify('你好 世界', base)).toBe('你好-世界')
  })

  it('drops Chinese when keepChinese is off', () => {
    expect(slugify('你好 世界', { ...base, keepChinese: false })).toBe('')
  })

  it('drops every non ASCII character when asciiOnly is on', () => {
    expect(slugify('中文 café', { ...base, asciiOnly: true })).toBe('cafe')
  })

  it('returns an empty string for punctuation-only input', () => {
    expect(slugify('!!! ???', base)).toBe('')
  })
})

describe('slugifyLines', () => {
  it('generates one slug per line and skips empty lines', () => {
    expect(slugifyLines('First Line\n\n   \nSecond Line', base)).toBe('first-line\nsecond-line')
  })

  it('keeps duplicates when dedupe is off', () => {
    expect(slugifyLines('Hello\nhello', base)).toBe('hello\nhello')
  })

  it('appends -2, -3 to repeated slugs when dedupe is on', () => {
    expect(slugifyLines('Hello\nhello\nHello', { ...base, dedupe: true })).toBe(
      'hello\nhello-2\nhello-3',
    )
  })

  it('returns an empty string for empty input', () => {
    expect(slugifyLines('', base)).toBe('')
    expect(slugifyLines('\n\n', base)).toBe('')
  })
})
