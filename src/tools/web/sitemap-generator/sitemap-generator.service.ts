export const SITEMAP_CHANGEFREQS = [
  'always',
  'hourly',
  'daily',
  'weekly',
  'monthly',
  'yearly',
  'never',
] as const

export type SitemapChangeFreq = (typeof SITEMAP_CHANGEFREQS)[number]

export type SitemapEntry = {
  loc: string
  lastmod?: string
  changefreq?: SitemapChangeFreq
  priority?: number
}

export type SitemapOptions = {
  /** 是否输出缩进换行，默认 true；false 时输出紧凑单行 XML */
  pretty?: boolean
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

/** XML 转义：覆盖元素文本与属性值中的五个特殊字符 */
export function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function buildUrlEntry(entry: SitemapEntry, pretty: boolean): string {
  const loc = entry.loc.trim()
  if (!isHttpUrl(loc)) {
    throw new Error(`sitemap-generator: invalid URL: ${loc === '' ? '(empty)' : loc}`)
  }

  const tags = [`<loc>${escapeXml(loc)}</loc>`]

  const lastmod = entry.lastmod?.trim() ?? ''
  if (lastmod !== '') {
    if (!isIsoDate(lastmod)) {
      throw new Error(`sitemap-generator: invalid lastmod date, expected YYYY-MM-DD: ${lastmod}`)
    }
    tags.push(`<lastmod>${lastmod}</lastmod>`)
  }

  if (entry.changefreq !== undefined) {
    if (!SITEMAP_CHANGEFREQS.includes(entry.changefreq)) {
      throw new Error(`sitemap-generator: invalid changefreq: ${entry.changefreq}`)
    }
    tags.push(`<changefreq>${entry.changefreq}</changefreq>`)
  }

  if (entry.priority !== undefined) {
    if (!Number.isFinite(entry.priority) || entry.priority < 0 || entry.priority > 1) {
      throw new Error(`sitemap-generator: priority must be between 0 and 1: ${entry.priority}`)
    }
    tags.push(`<priority>${entry.priority}</priority>`)
  }

  if (!pretty) {
    return `<url>${tags.join('')}</url>`
  }
  return ['  <url>', ...tags.map((tag) => `    ${tag}`), '  </url>'].join('\n')
}

/** 生成符合 sitemaps.org 规范的 XML：loc 必填，lastmod/changefreq/priority 可选 */
export function buildSitemap(
  entries: readonly SitemapEntry[],
  options: SitemapOptions = {},
): string {
  if (entries.length === 0) {
    throw new Error('sitemap-generator: at least one URL entry is required')
  }

  const pretty = options.pretty ?? true
  const urlEntries = entries.map((entry) => buildUrlEntry(entry, pretty))
  const header = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ]

  if (!pretty) {
    return `${header.join('')}${urlEntries.join('')}</urlset>`
  }

  return [...header, ...urlEntries, '</urlset>'].join('\n')
}
