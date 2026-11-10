import { base64ToBytes, bytesToBase64, bytesToBase64Url } from '@/utils/base64'
import { bytesToHex, hexToBytes } from '@/utils/bytes'

export const hmacAlgorithms = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'] as const

export type HmacAlgorithm = (typeof hmacAlgorithms)[number]

export const keyEncodings = ['text', 'hex', 'base64'] as const

export type KeyEncoding = (typeof keyEncodings)[number]

export const hmacOutputEncodings = ['hex', 'base64', 'base64url'] as const

export type HmacOutputEncoding = (typeof hmacOutputEncodings)[number]

/** RFC 4648 §5 无填充 base64url，与 JWS / JWK 的约定一致 */
export { bytesToBase64Url as toBase64Url }

/** 把用户输入的密钥按所选编码转成字节；非法 hex / base64 由底层解析函数抛错 */
export function parseKeyInput(input: string, encoding: KeyEncoding): Uint8Array {
  switch (encoding) {
    case 'text':
      return new TextEncoder().encode(input)
    case 'hex':
      return hexToBytes(input)
    case 'base64':
      return base64ToBytes(input)
    default:
      throw new Error(`Unsupported key encoding: ${String(encoding)}`)
  }
}

function encodeOutput(bytes: Uint8Array, encoding: HmacOutputEncoding): string {
  switch (encoding) {
    case 'hex':
      return bytesToHex(bytes)
    case 'base64':
      return bytesToBase64(bytes)
    case 'base64url':
      return bytesToBase64Url(bytes)
    default:
      throw new Error(`Unsupported output encoding: ${String(encoding)}`)
  }
}

/**
 * 计算 HMAC 摘要（WebCrypto）。消息按 UTF-8 编码，密钥为原始字节；
 * 未知算法与不可用的 WebCrypto 都抛 Error。
 */
export async function computeHmac(
  message: string,
  key: Uint8Array,
  algorithm: HmacAlgorithm,
  outputEncoding: HmacOutputEncoding,
): Promise<string> {
  if (!hmacAlgorithms.includes(algorithm)) {
    throw new Error(`Unsupported HMAC algorithm: ${String(algorithm)}`)
  }
  if (key.length === 0) {
    throw new Error('HMAC: key must not be empty')
  }
  const subtle = globalThis.crypto?.subtle
  if (!subtle) {
    throw new Error('WebCrypto unavailable: HMAC requires a secure context (https or localhost)')
  }

  const cryptoKey = await subtle.importKey(
    'raw',
    key as Uint8Array<ArrayBuffer>,
    { name: 'HMAC', hash: algorithm },
    false,
    ['sign'],
  )
  const signature = await subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(message))
  return encodeOutput(new Uint8Array(signature), outputEncoding)
}

/** 忽略大小写与空白比对期望值；期望值为空（或全是空白）时返回 null 表示未填写 */
export function matchesExpected(actual: string, expected: string): boolean | null {
  const target = expected.replace(/\s+/g, '').toLowerCase()
  if (target === '') {
    return null
  }
  return actual.replace(/\s+/g, '').toLowerCase() === target
}
