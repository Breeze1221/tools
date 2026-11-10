export type RobotsGroup = {
  userAgent: string
  allow: string[]
  disallow: string[]
  crawlDelay?: number
}

export type RobotsConfig = {
  groups: RobotsGroup[]
  sitemaps?: string[]
  host?: string
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function normalizePaths(paths: readonly string[], label: string): string[] {
  const normalized: string[] = []
  for (const path of paths) {
    const trimmed = path.trim()
    if (trimmed === '') {
      continue
    }
    if (!trimmed.startsWith('/')) {
      throw new Error(`robots-txt-generator: ${label} path must start with "/": ${trimmed}`)
    }
    normalized.push(trimmed)
  }
  return normalized
}

function buildGroup(group: RobotsGroup): string {
  const userAgent = group.userAgent.trim()
  if (userAgent === '') {
    throw new Error('robots-txt-generator: user agent is required')
  }

  if (group.crawlDelay !== undefined) {
    if (!Number.isFinite(group.crawlDelay) || group.crawlDelay < 0) {
      throw new Error(`robots-txt-generator: invalid crawl delay: ${group.crawlDelay}`)
    }
  }

  const lines = [`User-agent: ${userAgent}`]
  for (const path of normalizePaths(group.allow, 'allow')) {
    lines.push(`Allow: ${path}`)
  }
  for (const path of normalizePaths(group.disallow, 'disallow')) {
    lines.push(`Disallow: ${path}`)
  }
  if (group.crawlDelay !== undefined) {
    lines.push(`Crawl-delay: ${group.crawlDelay}`)
  }
  return lines.join('\n')
}

/** 生成 robots.txt：每个 User-agent 分组一段，末尾追加 Sitemap 与 Host 指令 */
export function buildRobotsTxt(config: RobotsConfig): string {
  if (config.groups.length === 0) {
    throw new Error('robots-txt-generator: at least one user-agent group is required')
  }

  const blocks = config.groups.map((group) => buildGroup(group))
  const tail: string[] = []

  for (const sitemap of config.sitemaps ?? []) {
    const trimmed = sitemap.trim()
    if (trimmed === '') {
      continue
    }
    if (!isHttpUrl(trimmed)) {
      throw new Error(`robots-txt-generator: invalid sitemap URL: ${trimmed}`)
    }
    tail.push(`Sitemap: ${trimmed}`)
  }

  const host = config.host?.trim() ?? ''
  if (host !== '') {
    if (!isHttpUrl(host)) {
      throw new Error(`robots-txt-generator: invalid host URL: ${host}`)
    }
    tail.push(`Host: ${host}`)
  }

  if (tail.length > 0) {
    blocks.push(tail.join('\n'))
  }

  return blocks.join('\n\n')
}
