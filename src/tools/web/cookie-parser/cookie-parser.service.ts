/** RFC 6265 cookie-name 允许的字符集（token） */
const COOKIE_TOKEN_PATTERN = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/

/** SameSite 取值 */
export type SameSite = 'Lax' | 'Strict' | 'None'

export type ParsedCookie = {
  name: string
  /** 原始值（未解码，可能带引号） */
  value: string
  /** percent 解码后的值；解码失败时回退为原始值 */
  decodedValue: string
}

export type CookieError = {
  /** 出问题的原始片段，便于用户定位 */
  segment: string
  message: string
}

export type CookieWarning = {
  name: string
  message: string
}

export type CookieParseResult = {
  cookies: ParsedCookie[]
  errors: CookieError[]
  warnings: CookieWarning[]
}

export type BuildCookieOptions = {
  name: string
  value: string
  domain?: string
  path?: string
  maxAgeSeconds?: number
  expires?: Date | string
  secure?: boolean
  httpOnly?: boolean
  sameSite?: SameSite
}

function isCookieToken(value: string): boolean {
  return COOKIE_TOKEN_PATTERN.test(value)
}

function decodeValue(raw: string): string {
  const unquoted =
    raw.length >= 2 && raw.startsWith('"') && raw.endsWith('"') ? raw.slice(1, -1) : raw
  try {
    return decodeURIComponent(unquoted)
  } catch {
    return unquoted
  }
}

/** 去掉 `document.cookie = "..."` 这种整段赋值形态的外壳 */
function normalizeDocumentCookie(input: string): string {
  let text = input.trim()
  text = text.replace(/^document\.cookie\s*=\s*/i, '').trim()
  if (
    (text.startsWith('"') && text.endsWith('"')) ||
    (text.startsWith("'") && text.endsWith("'"))
  ) {
    text = text.slice(1, -1)
  }
  return text
}

/**
 * 解析 Cookie 字符串：兼容 `Cookie: a=1; b=2`、每行一条以及 document.cookie 原样输出。
 * 空片段忽略；非法 name 记 error；重复 name 保留最后一条并记 warning。
 */
export function parseCookies(input: string): CookieParseResult {
  const cookies: ParsedCookie[] = []
  const errors: CookieError[] = []
  const warnings: CookieWarning[] = []
  const indexByName = new Map<string, number>()

  for (const raw of normalizeDocumentCookie(input).split(/[;\n]/)) {
    const segment = raw
      .trim()
      .replace(/^cookie\s*:/i, '')
      .trim()
    if (segment === '') continue

    const separator = segment.indexOf('=')
    if (separator < 0) {
      errors.push({ segment, message: 'Missing "=" in cookie segment' })
      continue
    }

    const name = segment.slice(0, separator).trim()
    const value = segment.slice(separator + 1).trim()

    if (!isCookieToken(name)) {
      errors.push({ segment, message: 'Invalid cookie name: expected an RFC 6265 token' })
      continue
    }

    const cookie: ParsedCookie = { name, value, decodedValue: decodeValue(value) }
    const existing = indexByName.get(name)
    if (existing === undefined) {
      indexByName.set(name, cookies.length)
      cookies.push(cookie)
    } else {
      cookies[existing] = cookie
      warnings.push({
        name,
        message: 'Duplicate cookie name; the last value wins',
      })
    }
  }

  return { cookies, errors, warnings }
}

/** 把表单数据拼成 Set-Cookie 形式的字符串 */
export function buildCookie(options: BuildCookieOptions): string {
  const name = options.name.trim()
  if (!isCookieToken(name)) {
    throw new Error('Invalid cookie name: expected an RFC 6265 token')
  }

  let output = `${name}=${encodeURIComponent(options.value)}`

  if (options.domain) {
    output += `; Domain=${options.domain.trim()}`
  }
  if (options.path) {
    output += `; Path=${options.path.trim()}`
  }
  if (options.maxAgeSeconds !== undefined) {
    if (!Number.isFinite(options.maxAgeSeconds)) {
      throw new Error('Max-Age must be a finite number of seconds')
    }
    output += `; Max-Age=${Math.round(options.maxAgeSeconds)}`
  }
  if (options.expires !== undefined) {
    const expires = options.expires instanceof Date ? options.expires : new Date(options.expires)
    if (Number.isNaN(expires.getTime())) {
      throw new Error('Expires must be a valid date')
    }
    output += `; Expires=${expires.toUTCString()}`
  }

  if (options.sameSite === 'None' && !options.secure) {
    throw new Error('SameSite=None requires the Secure attribute')
  }

  if (options.secure) {
    output += '; Secure'
  }
  if (options.httpOnly) {
    output += '; HttpOnly'
  }
  if (options.sameSite) {
    output += `; SameSite=${options.sameSite}`
  }

  return output
}

/** 解析结果转 JSON（name / value / decodedValue 三个字段） */
export function cookiesToJson(cookies: readonly ParsedCookie[]): string {
  return JSON.stringify(cookies, null, 2)
}
