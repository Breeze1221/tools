import { bytesToBase64Url } from '@/utils/base64'
import { randomBytes } from '@/utils/random'

export const PKCE_METHODS = ['S256', 'plain'] as const

export type PkceMethod = (typeof PKCE_METHODS)[number]

export const CODE_VERIFIER_MIN_LENGTH = 43
export const CODE_VERIFIER_MAX_LENGTH = 128
export const DEFAULT_CODE_VERIFIER_LENGTH = 64

/** RFC 7636 §4.1：43–128 个 unreserved 字符 */
const VERIFIER_PATTERN = /^[A-Za-z0-9\-._~]{43,128}$/

export type AuthorizationUrlOptions = {
  authorizationEndpoint: string
  clientId: string
  redirectUri: string
  codeChallenge: string
  method?: PkceMethod
  state?: string
  scope?: string
}

/** 生成 code_verifier：先取随机字节做 Base64URL，再截到指定长度 */
export function generateCodeVerifier(length: number = DEFAULT_CODE_VERIFIER_LENGTH): string {
  if (
    !Number.isInteger(length) ||
    length < CODE_VERIFIER_MIN_LENGTH ||
    length > CODE_VERIFIER_MAX_LENGTH
  ) {
    throw new Error(
      `PKCE: verifier length must be an integer between ${CODE_VERIFIER_MIN_LENGTH} and ${CODE_VERIFIER_MAX_LENGTH}, got ${length}`,
    )
  }
  return bytesToBase64Url(randomBytes(Math.ceil((length * 3) / 4))).slice(0, length)
}

export function isValidCodeVerifier(verifier: string): boolean {
  return VERIFIER_PATTERN.test(verifier)
}

/**
 * 计算 code_challenge。S256 = Base64URL(SHA-256(ASCII(verifier))) 且无填充；
 * plain 原样返回（仅用于不支持 S256 的旧服务器）。
 */
export async function createCodeChallenge(
  verifier: string,
  method: PkceMethod = 'S256',
): Promise<string> {
  if (!isValidCodeVerifier(verifier)) {
    throw new Error('PKCE: verifier must be 43–128 characters from [A-Za-z0-9-._~]')
  }

  switch (method) {
    case 'plain':
      return verifier
    case 'S256': {
      const subtle = globalThis.crypto?.subtle
      if (!subtle) {
        throw new Error('WebCrypto unavailable: PKCE S256 requires a secure context')
      }
      const digest = new Uint8Array(
        await subtle.digest('SHA-256', new TextEncoder().encode(verifier)),
      )
      return bytesToBase64Url(digest)
    }
    default:
      throw new Error(`PKCE: unsupported challenge method "${String(method)}"`)
  }
}

/** 拼出带 PKCE 参数的授权请求 URL，便于直接复制到浏览器或 curl */
export function buildAuthorizationUrl(options: AuthorizationUrlOptions): string {
  let endpoint: URL
  try {
    endpoint = new URL(options.authorizationEndpoint)
  } catch {
    throw new Error('PKCE: authorization endpoint must be an absolute URL')
  }
  if (endpoint.protocol !== 'https:' && endpoint.protocol !== 'http:') {
    throw new Error('PKCE: authorization endpoint must use http or https')
  }
  if (options.clientId.trim() === '') {
    throw new Error('PKCE: client id must not be empty')
  }
  if (options.redirectUri.trim() === '') {
    throw new Error('PKCE: redirect URI must not be empty')
  }
  if (options.codeChallenge.trim() === '') {
    throw new Error('PKCE: code challenge must not be empty')
  }

  endpoint.searchParams.set('response_type', 'code')
  endpoint.searchParams.set('client_id', options.clientId)
  endpoint.searchParams.set('redirect_uri', options.redirectUri)
  endpoint.searchParams.set('code_challenge', options.codeChallenge)
  endpoint.searchParams.set('code_challenge_method', options.method ?? 'S256')
  if (options.state) {
    endpoint.searchParams.set('state', options.state)
  }
  if (options.scope) {
    endpoint.searchParams.set('scope', options.scope)
  }
  return endpoint.toString()
}
