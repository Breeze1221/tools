import { base64ToBytes } from '@/utils/base64'

export type HashConfidence = 'high' | 'medium' | 'low'

export type HashReason =
  | 'bcrypt-prefix'
  | 'argon2-prefix'
  | 'pbkdf2-prefix'
  | 'hex-8'
  | 'hex-32'
  | 'hex-40'
  | 'hex-56'
  | 'hex-64'
  | 'hex-96'
  | 'hex-128'
  | 'base64'

export type HashCandidate = {
  algorithm: string
  confidence: HashConfidence
  reason: HashReason
}

const HEX_LENGTH_RULES: Record<
  number,
  { algorithm: string; confidence: HashConfidence; reason: HashReason }[]
> = {
  8: [{ algorithm: 'CRC32', confidence: 'high', reason: 'hex-8' }],
  32: [
    { algorithm: 'MD5', confidence: 'high', reason: 'hex-32' },
    { algorithm: 'NTLM', confidence: 'medium', reason: 'hex-32' },
  ],
  40: [{ algorithm: 'SHA-1', confidence: 'high', reason: 'hex-40' }],
  56: [{ algorithm: 'SHA-224', confidence: 'high', reason: 'hex-56' }],
  64: [{ algorithm: 'SHA-256', confidence: 'high', reason: 'hex-64' }],
  96: [{ algorithm: 'SHA-384', confidence: 'high', reason: 'hex-96' }],
  128: [{ algorithm: 'SHA-512', confidence: 'high', reason: 'hex-128' }],
}

const BCRYPT_PATTERN = /^\$2[aby]?\$\d{2}\$[./A-Za-z0-9]{53}$/
const ARGON2_PATTERN = /^\$argon2(i|d|id)\$/
const PBKDF2_PATTERN = /^\$?pbkdf2([-_]sha(1|256|512))?\$/i
const HEX_PATTERN = /^[0-9a-f]+$/i

function isBase64Decodable(value: string): boolean {
  try {
    return base64ToBytes(value).length > 0
  } catch {
    return false
  }
}

/**
 * 根据前缀与长度推测哈希算法，按置信度从高到低返回候选。
 * 空输入与未知格式都返回空数组；仅做格式推断，不验证内容。
 */
export function identifyHash(input: string): HashCandidate[] {
  const value = input.trim()
  if (value === '') {
    return []
  }

  if (BCRYPT_PATTERN.test(value)) {
    return [{ algorithm: 'bcrypt', confidence: 'high', reason: 'bcrypt-prefix' }]
  }
  if (ARGON2_PATTERN.test(value)) {
    return [{ algorithm: 'Argon2', confidence: 'high', reason: 'argon2-prefix' }]
  }
  if (PBKDF2_PATTERN.test(value)) {
    return [{ algorithm: 'PBKDF2', confidence: 'high', reason: 'pbkdf2-prefix' }]
  }

  const candidates: HashCandidate[] = []
  const isHex = HEX_PATTERN.test(value)

  if (isHex) {
    candidates.push(...(HEX_LENGTH_RULES[value.length] ?? []))
  }

  // 纯十六进制串必然也能当 base64 解码，避免再报一条无意义的低置信候选
  if (!isHex && value.length >= 8 && isBase64Decodable(value)) {
    candidates.push({ algorithm: 'Base64', confidence: 'low', reason: 'base64' })
  }

  return candidates
}
