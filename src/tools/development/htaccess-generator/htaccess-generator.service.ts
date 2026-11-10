export const HTACCESS_STATUS_CODES = [301, 302] as const
export type HtaccessStatus = (typeof HTACCESS_STATUS_CODES)[number]

export type HtaccessRedirect = {
  readonly from: string
  readonly to: string
  readonly status: HtaccessStatus
}

export type HtaccessConfig = {
  readonly forceHttps: boolean
  readonly forceWww: boolean
  readonly redirects: readonly HtaccessRedirect[]
  /** 原样追加的自定义规则（可含注释） */
  readonly customRules: string
  readonly enableRewrite: boolean
}

const HTTP_URL = /^https?:\/\/[^\s]+$/i

function isAbsoluteUrl(value: string): boolean {
  return HTTP_URL.test(value)
}

function validateTarget(value: string, label: string): string {
  const text = value.trim()
  if (text === '') {
    throw new Error(`${label} is empty`)
  }
  if (!text.startsWith('/') && !isAbsoluteUrl(text)) {
    throw new Error(`${label} must start with / or http(s)://`)
  }
  if (/["'\s]/.test(text)) {
    throw new Error(`${label} must not contain quotes or whitespace`)
  }
  return text
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** 生成 .htaccess 片段；所有路径会先校验再转义 */
export function buildHtaccess(config: HtaccessConfig): string {
  const redirects = config.redirects.map((redirect, index) => {
    if (!HTACCESS_STATUS_CODES.includes(redirect.status)) {
      throw new Error(`Redirect ${index + 1} has an unsupported status code`)
    }
    return {
      from: validateTarget(redirect.from, `Redirect ${index + 1} source`),
      to: validateTarget(redirect.to, `Redirect ${index + 1} target`),
      status: redirect.status,
    }
  })

  const customLines = config.customRules
    .split(/\r?\n/)
    .map((line) => line.replaceAll('\u0000', ''))
    .filter((line) => line.trim() !== '')

  const hasRewriteWork = config.forceHttps || config.forceWww || redirects.length > 0
  if (!hasRewriteWork && customLines.length === 0) {
    throw new Error('Nothing to generate: enable an option or add at least one rule')
  }

  const blocks: string[] = []
  if (hasRewriteWork || config.enableRewrite) {
    blocks.push('RewriteEngine On')
  }

  if (config.forceHttps) {
    blocks.push(
      [
        '# Force HTTPS',
        'RewriteCond %{HTTPS} off',
        'RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]',
      ].join('\n'),
    )
  }

  if (config.forceWww) {
    blocks.push(
      [
        '# Force www',
        'RewriteCond %{HTTP_HOST} !^www\\. [NC]',
        'RewriteRule ^ https://www.%{HTTP_HOST}%{REQUEST_URI} [L,R=301]',
      ].join('\n'),
    )
  }

  const pathRules: string[] = []
  const absoluteRules: string[] = []
  for (const redirect of redirects) {
    if (isAbsoluteUrl(redirect.from)) {
      absoluteRules.push(`Redirect ${redirect.status} ${redirect.from} ${redirect.to}`)
      continue
    }
    pathRules.push(
      `RewriteRule ^${escapeRegExp(redirect.from)}/?$ ${redirect.to} [R=${redirect.status},L]`,
    )
  }

  if (pathRules.length > 0) {
    blocks.push(['# Path redirects', ...pathRules].join('\n'))
  }
  if (absoluteRules.length > 0) {
    blocks.push(['# Absolute redirects', ...absoluteRules].join('\n'))
  }
  if (customLines.length > 0) {
    blocks.push(['# Custom rules', ...customLines].join('\n'))
  }

  return `${blocks.join('\n\n')}\n`
}
