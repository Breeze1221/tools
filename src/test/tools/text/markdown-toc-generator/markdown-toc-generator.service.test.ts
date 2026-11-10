import { describe, expect, it } from 'vitest'

import {
  buildToc,
  extractHeadings,
  slugifyHeading,
  type TocOptions,
} from '@/tools/text/markdown-toc-generator/markdown-toc-generator.service'

const base: TocOptions = {
  maxLevel: 6,
  links: false,
  ordered: false,
  nested: true,
}

describe('slugifyHeading', () => {
  it('lowercases, strips punctuation and dashes spaces', () => {
    expect(slugifyHeading('Hello World!')).toBe('hello-world')
  })

  it('keeps CJK characters', () => {
    expect(slugifyHeading('2026 计划 一览')).toBe('2026-计划-一览')
  })

  it('drops inline markup before slugging', () => {
    expect(slugifyHeading('**Bold** _Title_')).toBe('bold-title')
  })

  it('falls back to a stable word for punctuation-only headings', () => {
    expect(slugifyHeading('!!!')).toBe('section')
  })
})

describe('extractHeadings', () => {
  it('collects headings with their depth in source order', () => {
    expect(extractHeadings('# Title\n\n### Deep\n## Sub')).toEqual([
      { depth: 1, text: 'Title' },
      { depth: 3, text: 'Deep' },
      { depth: 2, text: 'Sub' },
    ])
  })

  it('ignores heading-like lines inside backtick and tilde fences', () => {
    const source = [
      '# Real',
      '```md',
      '# Fake',
      '```',
      '~~~',
      '# Also fake',
      '~~~',
      '## Also real',
    ].join('\n')
    expect(extractHeadings(source)).toEqual([
      { depth: 1, text: 'Real' },
      { depth: 2, text: 'Also real' },
    ])
  })

  it('ignores heading-like lines inside HTML comments', () => {
    const source = '# Visible\n<!--\n# Hidden\n-->\n## Shown'
    expect(extractHeadings(source)).toEqual([
      { depth: 1, text: 'Visible' },
      { depth: 2, text: 'Shown' },
    ])
  })

  it('strips inline markup from the heading text', () => {
    expect(extractHeadings('## **Bold** heading')).toEqual([{ depth: 2, text: 'Bold heading' }])
  })

  it('returns an empty list for empty input', () => {
    expect(extractHeadings('')).toEqual([])
  })
})

describe('buildToc', () => {
  it('nests deeper headings under shallower ones', () => {
    const headings = extractHeadings('# A\n## B\n### C\n## D\n# E')
    expect(buildToc(headings, base)).toBe('- A\n  - B\n    - C\n  - D\n- E')
  })

  it('emits links with GitHub style anchors', () => {
    const headings = extractHeadings('# Hello World!\n## 2026 计划 一览')
    expect(buildToc(headings, { ...base, links: true })).toBe(
      '- [Hello World!](#hello-world)\n  - [2026 计划 一览](#2026-计划-一览)',
    )
  })

  it('appends an index to repeated heading anchors', () => {
    const headings = extractHeadings('# A\n# A\n# A')
    expect(buildToc(headings, { ...base, links: true })).toBe('- [A](#a)\n- [A](#a-1)\n- [A](#a-2)')
  })

  it('filters headings above maxLevel', () => {
    const headings = extractHeadings('# A\n## B\n### C')
    expect(buildToc(headings, { ...base, maxLevel: 2 })).toBe('- A\n  - B')
  })

  it('builds an ordered list when requested', () => {
    const headings = extractHeadings('# A\n## B\n## C\n# D')
    expect(buildToc(headings, { ...base, ordered: true })).toBe('1. A\n  1. B\n  2. C\n2. D')
  })

  it('flattens the list when nesting is off', () => {
    const headings = extractHeadings('# A\n## B')
    expect(buildToc(headings, { ...base, nested: false })).toBe('- A\n- B')
  })

  it('returns an empty string when nothing is left', () => {
    expect(buildToc([], base)).toBe('')
    const headings = extractHeadings('## B')
    expect(buildToc(headings, { ...base, maxLevel: 1 })).toBe('')
  })
})
