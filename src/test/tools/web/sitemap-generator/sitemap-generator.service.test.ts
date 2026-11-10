import { describe, expect, it } from 'vitest'

import {
  buildSitemap,
  escapeXml,
  type SitemapChangeFreq,
} from '@/tools/web/sitemap-generator/sitemap-generator.service'

describe('buildSitemap', () => {
  it('builds a single minimal entry', () => {
    expect(buildSitemap([{ loc: 'https://example.com/' }])).toBe(
      [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        '  <url>',
        '    <loc>https://example.com/</loc>',
        '  </url>',
        '</urlset>',
      ].join('\n'),
    )
  })

  it('includes optional fields in order', () => {
    const output = buildSitemap([
      {
        loc: 'https://example.com/about',
        lastmod: '2026-11-10',
        changefreq: 'weekly',
        priority: 0.8,
      },
    ])
    expect(output).toBe(
      [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        '  <url>',
        '    <loc>https://example.com/about</loc>',
        '    <lastmod>2026-11-10</lastmod>',
        '    <changefreq>weekly</changefreq>',
        '    <priority>0.8</priority>',
        '  </url>',
        '</urlset>',
      ].join('\n'),
    )
  })

  it('handles multiple entries', () => {
    const output = buildSitemap([
      { loc: 'https://example.com/' },
      { loc: 'https://example.com/about' },
    ])
    expect(output.match(/<url>/g)).toHaveLength(2)
    expect(output).toContain('<loc>https://example.com/about</loc>')
  })

  it('escapes XML special characters in the URL', () => {
    const output = buildSitemap([{ loc: 'https://example.com/search?a=1&b=2' }])
    expect(output).toContain('<loc>https://example.com/search?a=1&amp;b=2</loc>')
  })

  it('emits compact XML when pretty is false', () => {
    expect(buildSitemap([{ loc: 'https://example.com/', priority: 1 }], { pretty: false })).toBe(
      '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://example.com/</loc><priority>1</priority></url></urlset>',
    )
  })

  it('throws for an empty entry list', () => {
    expect(() => buildSitemap([])).toThrow()
  })

  it('throws for invalid or non-http URLs', () => {
    expect(() => buildSitemap([{ loc: '' }])).toThrow()
    expect(() => buildSitemap([{ loc: 'example.com' }])).toThrow()
    expect(() => buildSitemap([{ loc: 'ftp://example.com/file' }])).toThrow()
  })

  it('throws for an out-of-range priority', () => {
    expect(() => buildSitemap([{ loc: 'https://example.com/', priority: -0.1 }])).toThrow()
    expect(() => buildSitemap([{ loc: 'https://example.com/', priority: 1.1 }])).toThrow()
    expect(() => buildSitemap([{ loc: 'https://example.com/', priority: Number.NaN }])).toThrow()
  })

  it('throws for an unknown changefreq', () => {
    expect(() =>
      buildSitemap([{ loc: 'https://example.com/', changefreq: 'sometimes' as SitemapChangeFreq }]),
    ).toThrow()
  })

  it('throws for malformed or impossible lastmod dates', () => {
    expect(() => buildSitemap([{ loc: 'https://example.com/', lastmod: '2026/11/10' }])).toThrow()
    expect(() => buildSitemap([{ loc: 'https://example.com/', lastmod: '2026-02-30' }])).toThrow()
  })
})

describe('escapeXml', () => {
  it('escapes the five XML special characters', () => {
    expect(escapeXml(`<&>"'`)).toBe('&lt;&amp;&gt;&quot;&apos;')
  })
})
