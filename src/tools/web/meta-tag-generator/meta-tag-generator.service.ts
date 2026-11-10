export const TITLE_MAX_LENGTH = 60
export const DESCRIPTION_MAX_LENGTH = 160

export type MetaWarning = {
  field: 'title' | 'description'
  length: number
  limit: number
}

export type MetaTagOptions = {
  title: string
  description?: string
  canonicalUrl?: string
  imageUrl?: string
  robots?: string
  ogType?: string
  twitterCard?: 'summary' | 'summary_large_image'
  themeColor?: string
}

export type MetaTagResult = {
  html: string
  warnings: MetaWarning[]
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

/** HTML 转义：用于标签内容与属性值 */
export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function charLength(value: string): number {
  return Array.from(value).length
}

function metaName(name: string, content: string): string {
  return `<meta name="${name}" content="${escapeHtml(content)}" />`
}

function metaProperty(property: string, content: string): string {
  return `<meta property="${property}" content="${escapeHtml(content)}" />`
}

/** 生成 head 中的 title、description、canonical、robots、Open Graph、Twitter Card 与 theme-color */
export function buildMetaTags(options: MetaTagOptions): MetaTagResult {
  const title = options.title.trim()
  if (title === '') {
    throw new Error('meta-tag-generator: title is required')
  }

  const description = options.description?.trim() ?? ''
  const canonicalUrl = options.canonicalUrl?.trim() ?? ''
  const imageUrl = options.imageUrl?.trim() ?? ''
  const robots = options.robots?.trim() ?? ''
  const ogType = options.ogType?.trim() ?? 'website'
  const themeColor = options.themeColor?.trim() ?? ''

  if (canonicalUrl !== '' && !isHttpUrl(canonicalUrl)) {
    throw new Error(`meta-tag-generator: invalid canonical URL: ${canonicalUrl}`)
  }
  if (imageUrl !== '' && !isHttpUrl(imageUrl)) {
    throw new Error(`meta-tag-generator: invalid image URL: ${imageUrl}`)
  }

  const warnings: MetaWarning[] = []
  const titleLength = charLength(title)
  if (titleLength > TITLE_MAX_LENGTH) {
    warnings.push({ field: 'title', length: titleLength, limit: TITLE_MAX_LENGTH })
  }
  const descriptionLength = charLength(description)
  if (descriptionLength > DESCRIPTION_MAX_LENGTH) {
    warnings.push({
      field: 'description',
      length: descriptionLength,
      limit: DESCRIPTION_MAX_LENGTH,
    })
  }

  const twitterCard = options.twitterCard ?? (imageUrl === '' ? 'summary' : 'summary_large_image')
  const lines: string[] = [`<title>${escapeHtml(title)}</title>`]

  if (description !== '') {
    lines.push(metaName('description', description))
  }
  if (canonicalUrl !== '') {
    lines.push(`<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`)
  }
  if (robots !== '') {
    lines.push(metaName('robots', robots))
  }

  lines.push(metaProperty('og:title', title))
  if (description !== '') {
    lines.push(metaProperty('og:description', description))
  }
  if (imageUrl !== '') {
    lines.push(metaProperty('og:image', imageUrl))
  }
  if (canonicalUrl !== '') {
    lines.push(metaProperty('og:url', canonicalUrl))
  }
  if (ogType !== '') {
    lines.push(metaProperty('og:type', ogType))
  }

  lines.push(metaName('twitter:card', twitterCard))
  lines.push(metaName('twitter:title', title))
  if (description !== '') {
    lines.push(metaName('twitter:description', description))
  }
  if (imageUrl !== '') {
    lines.push(metaName('twitter:image', imageUrl))
  }
  if (themeColor !== '') {
    lines.push(metaName('theme-color', themeColor))
  }

  return { html: lines.join('\n'), warnings }
}
