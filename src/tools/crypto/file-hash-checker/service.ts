import CryptoJS from 'crypto-js'

/** 支持的哈希算法常量集合 */
export const algorithms = ['MD5', 'SHA1', 'SHA256', 'SHA384', 'SHA512', 'SHA3-256', 'SHA3-512'] as const
export type Algorithm = (typeof algorithms)[number]

const CHUNK_SIZE = 64 * 1024 * 1024 // 64 MB per chunk

/**
 * crypto.subtle 支持的算法（浏览器可用，但 Node.js 不支持 SHA-3 系列）。
 * SHA-3 需走 crypto-js 降级路径。
 */
const SUBTLE_ALG_MAP: Record<string, AlgorithmIdentifier> = {
  SHA1: 'SHA-1',
  SHA256: 'SHA-256',
  SHA384: 'SHA-384',
  SHA512: 'SHA-512',
}

/** 将 ArrayBuffer 转为 lowercase hex 字符串 */
function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let hex = ''
  for (const byte of bytes) {
    hex += byte.toString(16).padStart(2, '0')
  }
  return hex
}

/** CryptoJS 算法入口 */
function cryptoJsHash(bytes: ArrayBuffer, algorithm: Algorithm): string {
  const wordArray = CryptoJS.lib.WordArray.create(new Uint8Array(bytes) as unknown as number[])
  let wordArrayHex: string
  switch (algorithm) {
    case 'MD5':
      wordArrayHex = CryptoJS.MD5(wordArray).toString(CryptoJS.enc.Hex)
      break
    case 'SHA1':
      wordArrayHex = CryptoJS.SHA1(wordArray).toString(CryptoJS.enc.Hex)
      break
    case 'SHA256':
      wordArrayHex = CryptoJS.SHA256(wordArray).toString(CryptoJS.enc.Hex)
      break
    case 'SHA384':
      wordArrayHex = CryptoJS.SHA384(wordArray).toString(CryptoJS.enc.Hex)
      break
    case 'SHA512':
      wordArrayHex = CryptoJS.SHA512(wordArray).toString(CryptoJS.enc.Hex)
      break
    case 'SHA3-256':
      wordArrayHex = CryptoJS.SHA3(wordArray, { outputLength: 256 }).toString(CryptoJS.enc.Hex)
      break
    case 'SHA3-512':
      wordArrayHex = CryptoJS.SHA3(wordArray, { outputLength: 512 }).toString(CryptoJS.enc.Hex)
      break
    default:
      throw new Error(`Unsupported algorithm: ${algorithm}`)
  }
  return wordArrayHex.toLowerCase()
}

/**
 * 对给定字节数组计算指定算法的十六进制哈希。
 * 优先使用 crypto.subtle.digest（性能更好），不支持时自动降级到 crypto-js。
 *
 * @param bytes 要哈希的字节
 * @param algorithm 算法名
 * @returns lowercase hex 哈希字符串
 * @throws {Error} 当 algorithm 不在支持列表中
 */
export async function hashBytes(bytes: ArrayBuffer, algorithm: Algorithm): Promise<string> {
  if (!algorithms.includes(algorithm)) {
    throw new Error(`Unsupported algorithm: ${algorithm}`)
  }

  // 优先尝试 crypto.subtle（浏览器中 MD5/SHA3 系列不可用，走降级）
  if (SUBTLE_ALG_MAP[algorithm] && typeof crypto !== 'undefined' && crypto.subtle?.digest) {
    try {
      const buffer = await crypto.subtle.digest(SUBTLE_ALG_MAP[algorithm], bytes)
      return bufferToHex(buffer)
    } catch {
      // WebCrypto 不支持（Node.js 旧版本或某些浏览器），降级到 crypto-js
    }
  }

  return cryptoJsHash(bytes, algorithm)
}

/**
 * 分片读取文件并计算指定算法集合的全部哈希。
 *
 * @param file 要哈希的 File 对象
 * @param algorithmsToRun 要计算的算法列表
 * @param onProgress 进度回调（可选）：(processedBytes, totalBytes) => void
 * @returns 各算法对应的 lowercase hex 哈希值
 * @throws {Error} 当 algorithmsToRun 含非法算法或读取失败时
 */
export async function hashFile(
  file: File,
  algorithmsToRun: Algorithm[] = [...algorithms],
  onProgress?: (processedBytes: number, totalBytes: number) => void,
): Promise<Record<Algorithm, string>> {
  for (const algo of algorithmsToRun) {
    if (!algorithms.includes(algo)) {
      throw new Error(`Unsupported algorithm: ${algo}`)
    }
  }

  const totalBytes = file.size
  const chunks: ArrayBuffer[] = []
  let processed = 0

  // 分片读取文件
  for (let start = 0; start < totalBytes; start += CHUNK_SIZE) {
    const end = Math.min(start + CHUNK_SIZE, totalBytes)
    const slice = file.slice(start, end)
    const buffer = await slice.arrayBuffer()
    chunks.push(buffer)
    processed += buffer.byteLength
    onProgress?.(processed, totalBytes)
  }

  const total = chunks.reduce((sum, c) => sum + c.byteLength, 0)
  const merged = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    merged.set(new Uint8Array(chunk), offset)
    offset += chunk.byteLength
  }

  // 并发计算所有算法
  const results = await Promise.all(
    algorithmsToRun.map(async (algo) => [algo, await hashBytes(merged.buffer, algo)] as const),
  )

  return Object.fromEntries(results) as Record<Algorithm, string>
}

/**
 * 比对给定的期望值哈希与结果中哪些算法匹配。
 * 忽略大小写与空白字符。
 *
 * @param expected 用户粘贴的期望哈希
 * @param results hashFile 的结果
 * @returns 匹配的算法集合；若无匹配则返回空数组
 */
export function matchExpectedHash(
  expected: string,
  results: Partial<Record<Algorithm, string>>,
): Algorithm[] {
  const normalized = expected.trim().replace(/\s+/g, '').toLowerCase()
  if (!normalized) return []
  return algorithms.filter((algo) => {
    const value = results[algo]
    return typeof value === 'string' && value.toLowerCase() === normalized
  })
}
