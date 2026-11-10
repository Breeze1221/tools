import { describe, expect, it } from 'vitest'

import {
  cleanWebp,
  detectFormat,
  hasExif,
  isJpeg,
  isPng,
  isWebp,
  metadataBytesSaved,
  parseJpegExif,
  parsePngMetadata,
  readExifTags,
  stripMetadata,
} from '@/tools/images/exif-viewer-cleaner/exif-viewer-cleaner.service'

// ── helpers ────────────────────────────────────────────────────────────────

function writeAscii(target: Uint8Array, offset: number, value: string): void {
  for (let index = 0; index < value.length; index += 1) {
    target[offset + index] = value.charCodeAt(index)
  }
}

function buildTiff(): Uint8Array {
  const tiff = new Uint8Array(64)
  const view = new DataView(tiff.buffer)
  tiff[0] = 0x49
  tiff[1] = 0x49
  view.setUint16(2, 42, true)
  view.setUint32(4, 8, true)
  view.setUint16(8, 3, true)

  const writeEntry = (
    index: number, tag: number, type: number, count: number,
    writeValue: (offset: number) => void,
  ) => {
    const entryOffset = 10 + index * 12
    view.setUint16(entryOffset, tag, true)
    view.setUint16(entryOffset + 2, type, true)
    view.setUint32(entryOffset + 4, count, true)
    writeValue(entryOffset + 8)
  }

  writeEntry(0, 0x010f, 2, 6, (offset) => view.setUint32(offset, 50, true))
  writeEntry(1, 0x0112, 3, 1, (offset) => view.setUint16(offset, 1, true))
  writeEntry(2, 0x0131, 2, 8, (offset) => view.setUint32(offset, 56, true))
  view.setUint32(46, 0, true)
  writeAscii(tiff, 50, 'Canon\0')
  writeAscii(tiff, 56, 'ToolBox\0')
  return tiff
}

function buildJpeg(): Uint8Array {
  const tiff = buildTiff()
  const payloadLength = 6 + tiff.length
  const segmentLength = payloadLength + 2
  const parts: number[] = [
    0xff, 0xd8, // SOI
    0xff, 0xe1, (segmentLength >> 8) & 0xff, segmentLength & 0xff, // APP1
    0x45, 0x78, 0x69, 0x66, 0x00, 0x00, // Exif header
    ...tiff,
    0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00, // SOS
    0x12, 0x34, 0x56, // entropy data
    0xff, 0xd9, // EOI
  ]
  return Uint8Array.from(parts)
}

function pngChunk(type: string, data: number[]): number[] {
  const length = data.length
  return [
    (length >>> 24) & 0xff, (length >>> 16) & 0xff, (length >>> 8) & 0xff, length & 0xff,
    ...Array.from(type, (c) => c.charCodeAt(0)),
    ...data,
    0, 0, 0, 0, // CRC simplified
  ]
}

const PNG_SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
const PNG_IHDR = pngChunk('IHDR', [0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0])
const PNG_TEXT = pngChunk('tEXt', Array.from('Comment\0hello', (c) => c.charCodeAt(0)))
const PNG_ICCP = pngChunk('iCCP', Array.from('sRGB\0\0', (c) => c.charCodeAt(0)))
const PNG_PHYs = pngChunk('pHYs', [0, 0, 0x0b, 0xd7, 0, 0, 0x0b, 0xd7, 0x00, 0x00, 0x00, 0x01])
const PNG_IDAT = pngChunk('IDAT', [1, 2, 3, 4])
const PNG_IEND = pngChunk('IEND', [])

function buildPng(): Uint8Array {
  return Uint8Array.from([
    ...PNG_SIG, ...PNG_IHDR, ...PNG_TEXT, ...PNG_ICCP, ...PNG_PHYs, ...PNG_IDAT, ...PNG_IEND,
  ])
}

// ── WebP helpers ─────────────────────────────────────────────────────────────

// WebP 规范：RIFF 头 + WEBP 标识 + chunk1 + chunk2 + ...
// 每个 chunk = 4 字节类型 + 4 字节 LE size + data [+ 1 字节 padding if size odd]
function buildWebpWithMeta(): Uint8Array {
  const out: number[] = []
  // 先占位 RIFF 头，后面算 size
  out.push(0x52, 0x49, 0x46, 0x46) // "RIFF"
  out.push(0, 0, 0, 0) // RIFF size (占位)
  out.push(0x57, 0x45, 0x42, 0x50) // "WEBP"

  // VP8 chunk (7 bytes data, odd → need 1 byte padding after)
  const vp8Data = [0, 0, 0, 0, 0, 0, 0]
  out.push(0x56, 0x50, 0x38, 0x20) // "VP8 "
  out.push(vp8Data.length & 0xff, (vp8Data.length >>> 8) & 0xff, 0, 0)
  out.push(...vp8Data)
  out.push(0) // RIFF padding for odd-size chunk

  // XMP chunk (5 bytes data, odd → need 1 byte padding after)
  const xmpData = [1, 2, 3, 4, 5]
  out.push(0x58, 0x4d, 0x50, 0x20) // "XMP "
  out.push(xmpData.length & 0xff, (xmpData.length >>> 8) & 0xff, 0, 0)
  out.push(...xmpData)
  out.push(0) // RIFF padding for odd-size chunk

  // 计算 RIFF size（= 文件大小 - 8）
  const riffSize = out.length - 8
  out[4] = riffSize & 0xff
  out[5] = (riffSize >>> 8) & 0xff
  out[6] = (riffSize >>> 16) & 0xff
  out[7] = (riffSize >>> 24) & 0xff

  return Uint8Array.from(out)
}

function buildWebpClean(): Uint8Array {
  const out: number[] = []
  out.push(0x52, 0x49, 0x46, 0x46)
  out.push(0, 0, 0, 0)
  out.push(0x57, 0x45, 0x42, 0x50)
  const vp8Data = [0, 0, 0, 0, 0, 0, 0]
  out.push(0x56, 0x50, 0x38, 0x20)
  out.push(vp8Data.length & 0xff, (vp8Data.length >>> 8) & 0xff, 0, 0)
  out.push(...vp8Data)
  out.push(0) // RIFF padding for odd-size chunk
  const riffSize = out.length - 8
  out[4] = riffSize & 0xff
  out[5] = (riffSize >>> 8) & 0xff
  out[6] = (riffSize >>> 16) & 0xff
  out[7] = (riffSize >>> 24) & 0xff
  return Uint8Array.from(out)
}

// ── Tests: format detection ──────────────────────────────────────────────────

describe('format detection', () => {
  it('detects JPEG', () => {
    expect(isJpeg(buildJpeg())).toBe(true)
    expect(isJpeg(buildPng())).toBe(false)
    expect(isJpeg(new Uint8Array([]))).toBe(false)
  })
  it('detects PNG', () => {
    expect(isPng(buildPng())).toBe(true)
    expect(isPng(buildJpeg())).toBe(false)
  })
  it('detects WebP', () => {
    expect(isWebp(buildWebpWithMeta())).toBe(true)
    expect(isWebp(buildJpeg())).toBe(false)
  })
  it('detectFormat returns unknown for non-images', () => {
    expect(detectFormat(Uint8Array.from([1, 2, 3]))).toBe('unknown')
  })
})

// ── Tests: readExifTags ─────────────────────────────────────────────────────

describe('readExifTags', () => {
  it('reads Make, Software, Orientation from IFD0', () => {
    expect(readExifTags(buildJpeg())).toEqual([
      { key: 'make', value: 'Canon' },
      { key: 'software', value: 'ToolBox' },
      { key: 'orientation', value: '1' },
    ])
  })
  it('returns empty for PNG', () => {
    const tags = readExifTags(buildPng())
    expect(tags.length).toBe(0)
  })
  it('returns empty for non-image', () => {
    const tags = readExifTags(Uint8Array.from([1, 2, 3]))
    expect(tags.length).toBe(0)
  })
})

// ── Tests: parsePngMetadata ─────────────────────────────────────────────────

describe('parsePngMetadata', () => {
  it('returns text entries and hasIccp flag', () => {
    const meta = parsePngMetadata(buildPng())
    expect(meta.texts).toEqual({ Comment: 'hello' })
    expect(meta.hasIccp).toBe(true)
  })
  it('returns empty object for non-PNG', () => {
    expect(parsePngMetadata(buildJpeg())).toEqual({ texts: {}, hasIccp: false })
  })
})

// ── Tests: hasExif ──────────────────────────────────────────────────────────

describe('hasExif', () => {
  it('returns true for JPEG with APP1', () => expect(hasExif(buildJpeg())).toBe(true))
  it('returns true for PNG with tEXt', () => expect(hasExif(buildPng())).toBe(true))
  it('returns true for WebP with XMP', () => expect(hasExif(buildWebpWithMeta())).toBe(true))
  it('returns false for WebP without meta', () => expect(hasExif(buildWebpClean())).toBe(false))
})

// ── Tests: stripMetadata ────────────────────────────────────────────────────

describe('stripMetadata', () => {
  it('removes APP1 from JPEG, keeps SOS and EOI', () => {
    const jpeg = buildJpeg()
    const stripped = stripMetadata(jpeg)
    expect(Array.from(stripped.slice(0, 2))).toEqual([0xff, 0xd8])
    expect(Array.from(stripped.slice(2, 4))).toEqual([0xff, 0xda])
    expect(Array.from(stripped.slice(-2))).toEqual([0xff, 0xd9])
    expect(readExifTags(stripped)).toEqual([])
    expect(metadataBytesSaved(jpeg, stripped)).toBeGreaterThan(0)
  })

  it('removes tEXt and iCCP from PNG, keeps pHYs/IHDR/IDAT/IEND', () => {
    const png = buildPng()
    const stripped = stripMetadata(png)
    expect(Array.from(stripped)).not.toContain('Comment'.charCodeAt(0))
    // 仍然包含 pHYs、IHDR、IDAT、IEND 的类型字节
    // pHYs chunk 保留：检查输出中是否有 'pHYs'
    const text = String.fromCharCode(...Array.from(stripped))
    expect(text).toContain('pHYs')
    expect(text).toContain('IHDR')
    expect(text).toContain('IDAT')
    expect(text).toContain('IEND')
    expect(metadataBytesSaved(png, stripped)).toBeGreaterThan(0)
  })

  it('cleans WebP', () => {
    const webp = buildWebpWithMeta()
    const stripped = stripMetadata(webp)
    expect(hasExif(stripped)).toBe(false)
    expect(metadataBytesSaved(webp, stripped)).toBeGreaterThan(0)
  })

  it('throws for unsupported format', () => {
    expect(() => stripMetadata(Uint8Array.from([1, 2, 3]))).toThrow(/JPEG, PNG and WebP/)
  })
})

// ── Tests: cleanWebp ─────────────────────────────────────────────────────────

describe('cleanWebp', () => {
  it('removes XMP chunk', () => {
    const webp = buildWebpWithMeta()
    const cleaned = cleanWebp(webp)
    expect(isWebp(cleaned)).toBe(true)
    expect(hasExif(cleaned)).toBe(false)
  })
  it('throws for non-WebP', () => {
    expect(() => cleanWebp(buildJpeg())).toThrow(/Not a WebP/)
  })
})

// ── Tests: parseJpegExif ─────────────────────────────────────────────────────

describe('parseJpegExif', () => {
  it('extracts flat fields', () => {
    const info = parseJpegExif(buildJpeg())
    expect(info.make).toBe('Canon')
    expect(info.software).toBe('ToolBox')
  })
  it('returns empty for non-JPEG', () => {
    expect(parseJpegExif(buildPng())).toEqual({})
  })
})
