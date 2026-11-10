import { describe, expect, it } from 'vitest'

import {
  buildMetaTags,
  DESCRIPTION_MAX_LENGTH,
  escapeHtml,
  TITLE_MAX_LENGTH,
} from '@/tools/web/meta-tag-generator/meta-tag-generator.service'

describe('buildMetaTags', () => {
  it('builds every tag from a full configuration', () => {
    const result = buildMetaTags({
      title: 'ToolBox',
      description: 'Local developer tools',
      canonicalUrl: 'https://example.com/',
      imageUrl: 'https://example.com/cover.png',
      robots: 'index, follow',
      ogType: 'article',
      twitterCard: 'summary_large_image',
      themeColor: '#0f172a',
    })

    expect(result.warnings).toEqual([])
    expect(result.html).toContain('<title>ToolBox</title>')
    expect(result.html).toContain('<meta name="description" content="Local developer tools" />')
    expect(result.html).toContain('<link rel="canonical" href="https://example.com/" />')
    expect(result.html).toContain('<meta name="robots" content="index, follow" />')
    expect(result.html).toContain('<meta property="og:title" content="ToolBox" />')
    expect(result.html).toContain(
      '<meta property="og:description" content="Local developer tools" />',
    )
    expect(result.html).toContain(
      '<meta property="og:image" content="https://example.com/cover.png" />',
    )
    expect(result.html).toContain('<meta property="og:url" content="https://example.com/" />')
    expect(result.html).toContain('<meta property="og:type" content="article" />')
    expect(result.html).toContain('<meta name="twitter:card" content="summary_large_image" />')
    expect(result.html).toContain('<meta name="twitter:title" content="ToolBox" />')
    expect(result.html).toContain(
      '<meta name="twitter:image" content="https://example.com/cover.png" />',
    )
    expect(result.html).toContain('<meta name="theme-color" content="#0f172a" />')
  })

  it('builds a minimal configuration with defaults', () => {
    const result = buildMetaTags({ title: 'ToolBox' })
    expect(result.html.split('\n')).toEqual([
      '<title>ToolBox</title>',
      '<meta property="og:title" content="ToolBox" />',
      '<meta property="og:type" content="website" />',
      '<meta name="twitter:card" content="summary" />',
      '<meta name="twitter:title" content="ToolBox" />',
    ])
    expect(result.warnings).toEqual([])
  })

  it('escapes HTML in titles and attribute values', () => {
    const result = buildMetaTags({
      title: '<b>"ToolBox" & friends</b>',
      description: "it's fine",
      canonicalUrl: 'https://example.com/?a=1&b=2',
    })
    expect(result.html).toContain('&lt;b&gt;&quot;ToolBox&quot; &amp; friends&lt;/b&gt;')
    expect(result.html).toContain('content="it&#39;s fine"')
    expect(result.html).toContain('href="https://example.com/?a=1&amp;b=2"')
  })

  it('warns when the title exceeds the suggested length', () => {
    const result = buildMetaTags({ title: 'a'.repeat(TITLE_MAX_LENGTH + 1) })
    expect(result.warnings).toEqual([
      { field: 'title', length: TITLE_MAX_LENGTH + 1, limit: TITLE_MAX_LENGTH },
    ])
  })

  it('warns when the description exceeds the suggested length', () => {
    const result = buildMetaTags({
      title: 'ToolBox',
      description: 'b'.repeat(DESCRIPTION_MAX_LENGTH + 1),
    })
    expect(result.warnings).toEqual([
      {
        field: 'description',
        length: DESCRIPTION_MAX_LENGTH + 1,
        limit: DESCRIPTION_MAX_LENGTH,
      },
    ])
  })

  it('does not warn at exactly the suggested limits', () => {
    const result = buildMetaTags({
      title: 'a'.repeat(TITLE_MAX_LENGTH),
      description: 'b'.repeat(DESCRIPTION_MAX_LENGTH),
    })
    expect(result.warnings).toEqual([])
  })

  it('throws for an empty title', () => {
    expect(() => buildMetaTags({ title: '' })).toThrow()
    expect(() => buildMetaTags({ title: '   ' })).toThrow()
  })

  it('throws for invalid URLs', () => {
    expect(() => buildMetaTags({ title: 'ToolBox', canonicalUrl: 'not-a-url' })).toThrow()
    expect(() =>
      buildMetaTags({ title: 'ToolBox', canonicalUrl: 'ftp://example.com/file' }),
    ).toThrow()
    expect(() => buildMetaTags({ title: 'ToolBox', imageUrl: 'example.com/cover.png' })).toThrow()
  })
})

describe('escapeHtml', () => {
  it('escapes the five HTML special characters', () => {
    expect(escapeHtml(`<&>"'`)).toBe('&lt;&amp;&gt;&quot;&#39;')
  })
})
