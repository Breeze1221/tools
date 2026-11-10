import { base64ToBytes, bytesToBase64 } from '@/utils/base64'

export type BasicAuthCredentials = {
  username: string
  password: string
}

/** 生成 Authorization: Basic <base64>，按 UTF-8 编码以支持中文与 emoji */
export function buildBasicAuthHeader(username: string, password: string): string {
  if (username === '') {
    throw new Error('basic-auth-generator: username is required')
  }
  const encoded = bytesToBase64(new TextEncoder().encode(`${username}:${password}`))
  return `Basic ${encoded}`
}

/** 反向解析 Basic 请求头：大小写不敏感，密码中的冒号原样保留 */
export function parseBasicAuthHeader(header: string): BasicAuthCredentials {
  const match = /^Basic\s+(\S+)\s*$/i.exec(header.trim())
  if (!match) {
    throw new Error('basic-auth-generator: expected a "Basic <credentials>" header')
  }

  const bytes = base64ToBytes(match[1] ?? '')
  let decoded: string
  try {
    decoded = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch (error) {
    throw new Error('basic-auth-generator: credentials are not valid UTF-8', { cause: error })
  }

  const separator = decoded.indexOf(':')
  if (separator < 0) {
    throw new Error('basic-auth-generator: decoded credentials are missing the ":" separator')
  }

  return {
    username: decoded.slice(0, separator),
    password: decoded.slice(separator + 1),
  }
}
