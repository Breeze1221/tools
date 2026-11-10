import { describe, expect, it } from 'vitest'

import {
  base64ToBytes,
  buildDataUri,
  bytesToBase64,
  detectImageMime,
  formatBytes,
  parseDataUri,
} from '@/tools/images/base64-image-converter/base64-image-converter.service'

const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x01])
const JPEG_BYTES = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10])
const GIF_BYTES = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x00])
const WEBP_BYTES = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38,
])

describe('base64 round trip', () => {
  it('encodes bytes and decodes them back unchanged', () => {
    const original = new Uint8Array([0, 1, 2, 127, 128, 254, 255])
    const base64 = bytesToBase64(original)
    const decoded = base64ToBytes(base64)
    expect(decoded.length).toBe(original.length)
    expect([...decoded]).toEqual([...original])
  })

  it('encodes an empty array to an empty string', () => {
    expect(bytesToBase64(new Uint8Array())).toBe('')
  })

  it('ignores whitespace inside the payload', () => {
    expect([...base64ToBytes('AAEC\n/w==')]).toEqual([0, 1, 2, 255])
  })
})

describe('base64ToBytes', () => {
  it('throws on characters outside the base64 alphabet', () => {
    expect(() => base64ToBytes('!!!!')).toThrow(Error)
    expect(() => base64ToBytes('ab$d')).toThrow(Error)
  })

  it('throws when the length is not a multiple of four', () => {
    expect(() => base64ToBytes('abc')).toThrow(Error)
  })

  it('throws on empty input', () => {
    expect(() => base64ToBytes('')).toThrow('base64: input is empty')
    expect(() => base64ToBytes('   ')).toThrow('base64: input is empty')
  })
})

describe('buildDataUri', () => {
  it('prefixes the mime type and base64 payload', () => {
    const uri = buildDataUri(PNG_BYTES, 'image/png')
    expect(uri.startsWith('data:image/png;base64,')).toBe(true)
    expect(uri).toBe(`data:image/png;base64,${bytesToBase64(PNG_BYTES)}`)
  })

  it('throws when there are no bytes', () => {
    expect(() => buildDataUri(new Uint8Array(), 'image/png')).toThrow(Error)
  })
})

describe('parseDataUri', () => {
  it('returns the mime type, payload and decoded bytes', () => {
    const uri = `data:image/png;base64,${bytesToBase64(PNG_BYTES)}`
    const parsed = parseDataUri(uri)
    expect(parsed.mime).toBe('image/png')
    expect(parsed.base64).toBe(bytesToBase64(PNG_BYTES))
    expect([...parsed.bytes]).toEqual([...PNG_BYTES])
  })

  it('drops extra header parameters from the mime type', () => {
    const uri = `data:image/svg+xml;charset=utf-8;base64,${bytesToBase64(new Uint8Array([1, 2, 3]))}`
    expect(parseDataUri(uri).mime).toBe('image/svg+xml')
  })

  it('throws on empty input', () => {
    expect(() => parseDataUri('')).toThrow('data uri: input is empty')
  })

  it('throws when the data prefix or comma is missing', () => {
    expect(() => parseDataUri('hello')).toThrow(Error)
    expect(() => parseDataUri('data:image/png;base64')).toThrow(Error)
  })

  it('throws for non-base64 payloads', () => {
    expect(() => parseDataUri('data:image/png,abc')).toThrow(Error)
  })

  it('throws when the payload is not valid base64', () => {
    expect(() => parseDataUri('data:image/png;base64,%%%%')).toThrow(Error)
  })
})

describe('detectImageMime', () => {
  it('detects PNG from its magic bytes', () => {
    expect(detectImageMime(PNG_BYTES)).toBe('image/png')
  })

  it('detects JPEG from its magic bytes', () => {
    expect(detectImageMime(JPEG_BYTES)).toBe('image/jpeg')
  })

  it('detects GIF from its magic bytes', () => {
    expect(detectImageMime(GIF_BYTES)).toBe('image/gif')
  })

  it('detects WebP from the RIFF container', () => {
    expect(detectImageMime(WEBP_BYTES)).toBe('image/webp')
  })

  it('detects SVG from its text prologue', () => {
    const svg = new TextEncoder().encode('<?xml version="1.0"?><svg viewBox="0 0 1 1"></svg>')
    expect(detectImageMime(svg)).toBe('image/svg+xml')
  })

  it('returns null for unknown data and empty input', () => {
    expect(detectImageMime(new Uint8Array([1, 2, 3, 4]))).toBeNull()
    expect(detectImageMime(new Uint8Array())).toBeNull()
  })
})

describe('formatBytes', () => {
  it('formats bytes, kilobytes and megabytes', () => {
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(2048)).toBe('2 KB')
    expect(formatBytes(1.5 * 1024 * 1024)).toBe('1.50 MB')
  })
})
