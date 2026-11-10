import { describe, expect, it } from 'vitest'

import { buildRobotsTxt } from '@/tools/web/robots-txt-generator/robots-txt-generator.service'

describe('buildRobotsTxt', () => {
  it('builds a single group', () => {
    const output = buildRobotsTxt({
      groups: [{ userAgent: '*', allow: ['/public'], disallow: ['/admin', '/private'] }],
    })
    expect(output).toBe(
      ['User-agent: *', 'Allow: /public', 'Disallow: /admin', 'Disallow: /private'].join('\n'),
    )
  })

  it('separates multiple groups with a blank line', () => {
    const output = buildRobotsTxt({
      groups: [
        { userAgent: '*', allow: [], disallow: ['/'] },
        { userAgent: 'Googlebot', allow: ['/'], disallow: [] },
      ],
    })
    expect(output).toBe(
      ['User-agent: *', 'Disallow: /', '', 'User-agent: Googlebot', 'Allow: /'].join('\n'),
    )
  })

  it('adds crawl delay when provided', () => {
    const output = buildRobotsTxt({
      groups: [{ userAgent: '*', allow: [], disallow: [], crawlDelay: 10 }],
    })
    expect(output).toBe('User-agent: *\nCrawl-delay: 10')
  })

  it('appends sitemap and host directives', () => {
    const output = buildRobotsTxt({
      groups: [{ userAgent: '*', allow: [], disallow: [] }],
      sitemaps: ['https://example.com/sitemap.xml', 'https://example.com/news.xml'],
      host: 'https://example.com',
    })
    expect(output).toBe(
      [
        'User-agent: *',
        '',
        'Sitemap: https://example.com/sitemap.xml',
        'Sitemap: https://example.com/news.xml',
        'Host: https://example.com',
      ].join('\n'),
    )
  })

  it('ignores blank paths and sitemap entries', () => {
    const output = buildRobotsTxt({
      groups: [{ userAgent: '*', allow: ['  '], disallow: ['', '/admin'] }],
      sitemaps: ['   '],
    })
    expect(output).toBe('User-agent: *\nDisallow: /admin')
  })

  it('throws when there are no groups', () => {
    expect(() => buildRobotsTxt({ groups: [] })).toThrow()
  })

  it('throws for an empty user agent', () => {
    expect(() =>
      buildRobotsTxt({ groups: [{ userAgent: ' ', allow: [], disallow: [] }] }),
    ).toThrow()
  })

  it('throws for paths that do not start with a slash', () => {
    expect(() =>
      buildRobotsTxt({ groups: [{ userAgent: '*', allow: ['public'], disallow: [] }] }),
    ).toThrow()
    expect(() =>
      buildRobotsTxt({ groups: [{ userAgent: '*', allow: [], disallow: ['admin'] }] }),
    ).toThrow()
  })

  it('throws for invalid crawl delays', () => {
    expect(() =>
      buildRobotsTxt({ groups: [{ userAgent: '*', allow: [], disallow: [], crawlDelay: -1 }] }),
    ).toThrow()
    expect(() =>
      buildRobotsTxt({
        groups: [{ userAgent: '*', allow: [], disallow: [], crawlDelay: Number.NaN }],
      }),
    ).toThrow()
  })

  it('throws for invalid sitemap and host URLs', () => {
    expect(() =>
      buildRobotsTxt({
        groups: [{ userAgent: '*', allow: [], disallow: [] }],
        sitemaps: ['example.com/sitemap.xml'],
      }),
    ).toThrow()
    expect(() =>
      buildRobotsTxt({
        groups: [{ userAgent: '*', allow: [], disallow: [] }],
        host: 'example.com',
      }),
    ).toThrow()
  })
})
