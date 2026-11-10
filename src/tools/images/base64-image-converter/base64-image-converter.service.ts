import { base64ToBytes as decodeBase64, bytesToDataUrl } from '@/utils/base64'

export { bytesToBase64 } from '@/utils/base64'
export { formatBytes } from '@/utils/format-bytes'

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
const JPEG_SIGNATURE = [0xff, 0xd8, 0xff]
const GIF_SIGNATURE = [0x47, 0x49, 0x46, 0x38]
const RIFF_SIGNATURE = [0x52, 0x49, 0x46, 0x46]
const WEBP_SIGNATURE = [0x57, 0x45, 0x42, 0x50]

function startsWithBytes(bytes: Uint8Array, signature: readonly number[]): boolean {
  if (bytes.length < signature.length) {
    return false
  }
  return signature.every((byte, index) => bytes[index] === byte)
}

/** 严格解码 Base64；空输入直接抛错，非法字符由 utils 的解析器拒绝 */
export function base64ToBytes(text: string): Uint8Array<ArrayBuffer> {
  if (text.trim() === '') {
    throw new Error('base64: input is empty')
  }
  return decodeBase64(text)
}

/** 用魔数判断图片类型，识别不到返回 null，交给调用方回退到文件自身声明的 MIME */
export function detectImageMime(bytes: Uint8Array): string | null {
  if (bytes.length === 0) {
    return null
  }
  if (startsWithBytes(bytes, PNG_SIGNATURE)) {
    return 'image/png'
  }
  if (startsWithBytes(bytes, JPEG_SIGNATURE)) {
    return 'image/jpeg'
  }
  if (startsWithBytes(bytes, GIF_SIGNATURE)) {
    return 'image/gif'
  }
  if (
    startsWithBytes(bytes, RIFF_SIGNATURE) &&
    bytes.length >= 12 &&
    WEBP_SIGNATURE.every((byte, index) => bytes[8 + index] === byte)
  ) {
    return 'image/webp'
  }

  const head = new TextDecoder().decode(bytes.subarray(0, 512)).trimStart()
  if (/^(?:<\?xml[^>]*\?>\s*)?(?:<!--[\s\S]*?-->\s*)*<svg[\s>]/i.test(head)) {
    return 'image/svg+xml'
  }

  return null
}

/** 拼装 data URI，空字节数组视为非法输入 */
export function buildDataUri(bytes: Uint8Array, mime: string): string {
  if (bytes.length === 0) {
    throw new Error('data uri: image bytes are empty')
  }
  return bytesToDataUrl(bytes, mime)
}

export type ParsedDataUri = {
  mime: string
  base64: string
  bytes: Uint8Array<ArrayBuffer>
}

/** 解析 base64 载荷的 data URI；只接受 `data:<mime>;base64,<payload>` */
export function parseDataUri(uri: string): ParsedDataUri {
  const trimmed = uri.trim()
  if (trimmed === '') {
    throw new Error('data uri: input is empty')
  }
  if (!trimmed.startsWith('data:')) {
    throw new Error('data uri: missing "data:" prefix')
  }

  const comma = trimmed.indexOf(',')
  if (comma < 0) {
    throw new Error('data uri: missing comma separator')
  }

  const header = trimmed.slice('data:'.length, comma)
  if (!header.toLowerCase().endsWith(';base64')) {
    throw new Error('data uri: only base64 payloads are supported')
  }

  const mime = header.split(';')[0] ?? ''
  const base64 = trimmed.slice(comma + 1)

  return {
    mime: mime === '' ? 'application/octet-stream' : mime,
    base64,
    bytes: base64ToBytes(base64),
  }
}
