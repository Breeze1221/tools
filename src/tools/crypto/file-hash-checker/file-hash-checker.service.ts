import CryptoJS from 'crypto-js'

import { bytesToHex } from '@/utils/bytes'

export const fileHashAlgorithms = ['MD5', 'SHA1', 'SHA256', 'SHA384', 'SHA512'] as const

export type FileHashAlgorithm = (typeof fileHashAlgorithms)[number]

/** WebCrypto 的摘要名；MD5 不在 WebCrypto 支持列表里，走 crypto-js */
const webCryptoDigests: Record<Exclude<FileHashAlgorithm, 'MD5'>, string> = {
  SHA1: 'SHA-1',
  SHA256: 'SHA-256',
  SHA384: 'SHA-384',
  SHA512: 'SHA-512',
}

function isFileHashAlgorithm(algorithm: string): algorithm is FileHashAlgorithm {
  return fileHashAlgorithms.some((item) => item === algorithm)
}

/** 计算字节数组的十六进制摘要（小写）；算法不支持或 WebCrypto 不可用时抛出 Error */
export async function hashBytes(algorithm: FileHashAlgorithm, bytes: Uint8Array): Promise<string> {
  if (!isFileHashAlgorithm(algorithm)) {
    throw new Error(`Unsupported hash algorithm: ${String(algorithm)}`)
  }

  if (algorithm === 'MD5') {
    return CryptoJS.MD5(CryptoJS.lib.WordArray.create(bytes)).toString(CryptoJS.enc.Hex)
  }

  const subtle = globalThis.crypto?.subtle
  if (!subtle) {
    throw new Error(
      'WebCrypto unavailable: hashing requires a secure context (https or localhost)',
    )
  }

  // WebCrypto 的 BufferSource 只接受 ArrayBuffer 背衬的视图，调用方传入的都是普通 Uint8Array
  const digest = await subtle.digest(
    webCryptoDigests[algorithm],
    bytes as Uint8Array<ArrayBuffer>,
  )
  return bytesToHex(new Uint8Array(digest))
}

/** 一次算出全部算法的摘要，键为算法名 */
export async function hashAll(bytes: Uint8Array): Promise<Record<FileHashAlgorithm, string>> {
  const entries = await Promise.all(
    fileHashAlgorithms.map(
      async (algorithm): Promise<[FileHashAlgorithm, string]> => [
        algorithm,
        await hashBytes(algorithm, bytes),
      ],
    ),
  )
  return Object.fromEntries(entries) as Record<FileHashAlgorithm, string>
}

/** 忽略大小写与空白后比较；期望值为空（或全是空白）时返回 null 表示未填写 */
export function compareHash(actual: string, expected: string): boolean | null {
  const target = expected.replace(/\s+/g, '').toLowerCase()
  if (target === '') {
    return null
  }
  return actual.replace(/\s+/g, '').toLowerCase() === target
}
