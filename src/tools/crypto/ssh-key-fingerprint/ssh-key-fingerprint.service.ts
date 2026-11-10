import CryptoJS from 'crypto-js'

import { base64ToBytes, bytesToBase64 } from '@/utils/base64'
import { bytesToHex } from '@/utils/bytes'

export type SshKeyType = 'ssh-rsa' | 'ssh-ed25519' | `ecdsa-sha2-${string}`

export type ParsedSshPublicKey = {
  keyType: SshKeyType
  /** authorized_keys 行尾的注释，可能为空 */
  comment: string
  /** 规范化后的标准 base64 blob */
  base64: string
  blob: Uint8Array<ArrayBuffer>
  bits: number
}

const KEY_TYPE_PATTERN = /^(ssh-rsa|ssh-ed25519|ecdsa-sha2-[a-z0-9-]+)$/

const ECDSA_CURVE_BITS: Record<string, number> = {
  nistp256: 256,
  nistp384: 384,
  nistp521: 521,
}

function isSupportedKeyType(type: string): type is SshKeyType {
  return type === 'ssh-rsa' || type === 'ssh-ed25519' || type.startsWith('ecdsa-sha2-')
}

/** SSH string = uint32 大端长度 + 字节，越界即视为损坏的 blob */
function readSshString(
  blob: Uint8Array<ArrayBuffer>,
  offset: number,
): { value: Uint8Array<ArrayBuffer>; next: number } {
  if (offset + 4 > blob.length) {
    throw new Error('SSH public key: truncated string length')
  }
  const view = new DataView(blob.buffer, blob.byteOffset + offset, 4)
  const start = offset + 4
  const end = start + view.getUint32(0)
  if (end > blob.length) {
    throw new Error('SSH public key: string extends beyond the blob')
  }
  return { value: blob.subarray(start, end), next: end }
}

function bitLength(bytes: Uint8Array): number {
  let index = 0
  while (index < bytes.length && bytes[index] === 0) {
    index += 1
  }
  if (index === bytes.length) {
    return 0
  }
  return (bytes.length - index - 1) * 8 + (32 - Math.clz32(bytes[index]))
}

function readKeyBits(type: SshKeyType, blob: Uint8Array<ArrayBuffer>, offset: number): number {
  if (type === 'ssh-ed25519') {
    return readSshString(blob, offset).value.length * 8
  }
  if (type === 'ssh-rsa') {
    const exponent = readSshString(blob, offset)
    const modulus = readSshString(blob, exponent.next)
    return bitLength(modulus.value)
  }
  const curve = readSshString(blob, offset)
  const curveName = new TextDecoder().decode(curve.value)
  const bits = ECDSA_CURVE_BITS[curveName]
  if (!bits) {
    throw new Error(`SSH public key: unsupported ECDSA curve "${curveName}"`)
  }
  // 读取点坐标，顺带校验 blob 未被截断
  const point = readSshString(blob, curve.next)
  if (point.value.length === 0) {
    throw new Error('SSH public key: empty ECDSA point')
  }
  return bits
}

/**
 * 解析 OpenSSH 公钥（authorized_keys 的一行或裸 base64 blob）。
 * 私钥、空输入与损坏的 base64 都抛英文 Error，由 UI 负责翻译。
 */
export function parsePublicKey(input: string): ParsedSshPublicKey {
  const text = input.trim()
  if (text === '') {
    throw new Error('SSH public key: input is empty')
  }
  if (/-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----/.test(text) || text.includes('openssh-key-v1')) {
    throw new Error('SSH public key: private keys are not supported, paste the .pub line instead')
  }

  const line = text.split(/\r?\n/).find((item) => item.trim() !== '')
  if (!line) {
    throw new Error('SSH public key: input is empty')
  }

  const tokens = line.trim().split(/\s+/)
  const typeIndex = tokens.findIndex((token) => KEY_TYPE_PATTERN.test(token))
  const declaredType = typeIndex >= 0 ? tokens[typeIndex] : null
  const base64Token = tokens[typeIndex >= 0 ? typeIndex + 1 : 0]
  if (!base64Token) {
    throw new Error('SSH public key: missing base64 payload')
  }
  const comment = tokens.slice(typeIndex >= 0 ? typeIndex + 2 : 1).join(' ')

  const blob = base64ToBytes(base64Token)
  if (blob.length === 0) {
    throw new Error('SSH public key: the decoded blob is empty')
  }
  const typeField = readSshString(blob, 0)
  const embeddedType = new TextDecoder().decode(typeField.value)
  if (!isSupportedKeyType(embeddedType)) {
    throw new Error(`SSH public key: unsupported key type "${embeddedType}"`)
  }
  if (declaredType !== null && declaredType !== embeddedType) {
    throw new Error(
      `SSH public key: declared type "${declaredType}" does not match blob type "${embeddedType}"`,
    )
  }

  return {
    keyType: embeddedType,
    comment,
    base64: bytesToBase64(blob),
    blob,
    bits: readKeyBits(embeddedType, blob, typeField.next),
  }
}

/**
 * SHA256 指纹。OpenSSH 用的是**标准 base64 去掉尾部填充**（不是 base64url），
 * 实测输出里会出现 `+` 与 `/`，写成 url 安全字母表就会与 ssh-keygen 对不上。
 */
export async function sha256Fingerprint(input: string): Promise<string> {
  const { blob } = parsePublicKey(input)
  const subtle = globalThis.crypto?.subtle
  if (!subtle) {
    throw new Error('WebCrypto unavailable: SHA-256 fingerprint requires a secure context')
  }
  const digest = new Uint8Array(await subtle.digest('SHA-256', blob))
  return `SHA256:${bytesToBase64(digest).replace(/=+$/, '')}`
}

/** MD5 指纹，冒号分隔的十六进制；MD5 不在 WebCrypto 里，走已有依赖 crypto-js */
export function md5Fingerprint(input: string): string {
  const { blob } = parsePublicKey(input)
  const hex = CryptoJS.MD5(CryptoJS.enc.Hex.parse(bytesToHex(blob))).toString(CryptoJS.enc.Hex)
  return `MD5:${(hex.match(/../g) ?? []).join(':')}`
}
