import { concatBytes } from '@/utils/bytes'

// ── 类型 ────────────────────────────────────────────────────────────────────

export const exifTagKeys = [
  'make',
  'model',
  'dateTime',
  'dateTimeOriginal',
  'software',
  'orientation',
  'exposureTime',
  'fNumber',
  'iso',
  'focalLength',
  'gpsLatitude',
  'gpsLongitude',
  'gpsAltitude',
] as const

export type ExifTagKey = (typeof exifTagKeys)[number]

export type ExifTag = {
  key: ExifTagKey
  value: string
}

/** parseJpegExif 结构化输出 */
export type JpegExifInfo = {
  gps?: { lat: number; lon: number; alt?: number }
  make?: string
  model?: string
  datetime?: string
  software?: string
}

/** parsePngMetadata 输出 */
export type PngMetadata = {
  texts: Record<string, string>
  hasIccp: boolean
}

// ── 常量 ────────────────────────────────────────────────────────────────────

const EXIF_HEADER: readonly number[] = [0x45, 0x78, 0x69, 0x66, 0x00, 0x00]
const PNG_SIGNATURE: readonly number[] = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

/** PNG 要清除的元数据块（只删这些）*/
const PNG_STRIPPED_CHUNKS: ReadonlySet<string> = new Set([
  'tEXt', 'zTXt', 'iTXt', 'eXIf', 'tIME', 'iCCP',
])

const JPEG_STRIPPED_MARKERS: ReadonlySet<number> = new Set([0xe1, 0xed, 0xfe])

// ── TIFF 相关 ────────────────────────────────────────────────────────────────

const TIFF_TYPE_SIZES: Readonly<Record<number, number>> = {
  1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8,
}

const TAG_MAKE = 0x010f
const TAG_MODEL = 0x0110
const TAG_ORIENTATION = 0x0112
const TAG_SOFTWARE = 0x0131
const TAG_DATE_TIME = 0x0132
const TAG_EXIF_IFD = 0x8769
const TAG_GPS_IFD = 0x8825
const TAG_EXPOSURE_TIME = 0x829a
const TAG_F_NUMBER = 0x829d
const TAG_ISO = 0x8827
const TAG_DATE_TIME_ORIGINAL = 0x9003
const TAG_FOCAL_LENGTH = 0x920a
const TAG_GPS_LATITUDE_REF = 0x0001
const TAG_GPS_LATITUDE = 0x0002
const TAG_GPS_LONGITUDE_REF = 0x0003
const TAG_GPS_LONGITUDE = 0x0004
const TAG_GPS_ALTITUDE_REF = 0x0005
const TAG_GPS_ALTITUDE = 0x0006

type JpegSegment = {
  marker: number
  start: number
  dataStart: number
  dataEnd: number
  end: number
}

type IfdEntry = { tag: number; type: number; count: number; valueOffset: number }
type TiffReader = { bytes: Uint8Array; view: DataView; little: boolean }
type Rational = { numerator: number; denominator: number }

function hasPrefix(bytes: Uint8Array, prefix: readonly number[]): boolean {
  if (bytes.length < prefix.length) return false
  return prefix.every((byte, index) => bytes[index] === byte)
}

// ── 格式检测 ────────────────────────────────────────────────────────────────

export function isJpeg(bytes: Uint8Array): boolean {
  return bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xd8
}

export function isPng(bytes: Uint8Array): boolean {
  return hasPrefix(bytes, PNG_SIGNATURE)
}

/** WebP 检测：RIFF....WEBP */
export function isWebp(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  )
}

/** 支持的图片格式 */
export function detectFormat(bytes: Uint8Array): 'jpeg' | 'png' | 'webp' | 'unknown' {
  if (isJpeg(bytes)) return 'jpeg'
  if (isPng(bytes)) return 'png'
  if (isWebp(bytes)) return 'webp'
  return 'unknown'
}

// ── JPEG 段解析 ─────────────────────────────────────────────────────────────

/** 遍历 JPEG 的标记段；遇到 SOS 时把熵编码数据到文件尾视为一整段 */
function parseJpegSegments(bytes: Uint8Array): JpegSegment[] {
  if (!isJpeg(bytes)) throw new Error('Not a JPEG file')
  const segments: JpegSegment[] = []
  let offset = 2

  while (offset + 1 < bytes.length) {
    if (bytes[offset] !== 0xff) throw new Error('Invalid JPEG: expected a marker')
    let marker = bytes[offset + 1]
    while (marker === 0xff) {
      offset += 1
      if (offset + 1 >= bytes.length) throw new Error('Invalid JPEG: truncated marker')
      marker = bytes[offset + 1]
    }
    const start = offset
    if (marker === 0xd9) {
      segments.push({ marker, start, dataStart: start + 2, dataEnd: start + 2, end: start + 2 })
      break
    }
    if (marker === 0xda) {
      segments.push({ marker, start, dataStart: start + 4, dataEnd: bytes.length, end: bytes.length })
      break
    }
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      segments.push({ marker, start, dataStart: start + 2, dataEnd: start + 2, end: start + 2 })
      offset = start + 2
      continue
    }
    if (start + 3 >= bytes.length) throw new Error('Invalid JPEG: truncated segment header')
    const length = (bytes[start + 2] << 8) | bytes[start + 3]
    if (length < 2) throw new Error('Invalid JPEG: segment length must be at least 2')
    const end = start + 2 + length
    if (end > bytes.length) throw new Error('Invalid JPEG: segment length exceeds the file')
    segments.push({ marker, start, dataStart: start + 4, dataEnd: end, end })
    offset = end
  }
  return segments
}

function hasExifHeader(bytes: Uint8Array, segment: JpegSegment): boolean {
  if (segment.dataStart + EXIF_HEADER.length > segment.dataEnd) return false
  return EXIF_HEADER.every((byte, index) => bytes[segment.dataStart + index] === byte)
}

// ── TIFF 解析 ───────────────────────────────────────────────────────────────

function createTiffReader(tiff: Uint8Array): TiffReader | null {
  if (tiff.length < 8) return null
  const view = new DataView(tiff.buffer, tiff.byteOffset, tiff.byteLength)
  const isLittleEndian = tiff[0] === 0x49 && tiff[1] === 0x49
  const isBigEndian = tiff[0] === 0x4d && tiff[1] === 0x4d
  if (!isLittleEndian && !isBigEndian) return null
  const little = isLittleEndian
  if (view.getUint16(2, little) !== 42) return null
  return { bytes: tiff, view, little }
}

function readIfd(reader: TiffReader, offset: number): IfdEntry[] | null {
  const { view, little } = reader
  if (!Number.isInteger(offset) || offset < 8 || offset + 2 > view.byteLength) return null
  const count = view.getUint16(offset, little)
  if (offset + 2 + count * 12 > view.byteLength) return null
  const entries: IfdEntry[] = []
  for (let index = 0; index < count; index += 1) {
    const entryOffset = offset + 2 + index * 12
    entries.push({
      tag: view.getUint16(entryOffset, little),
      type: view.getUint16(entryOffset + 2, little),
      count: view.getUint32(entryOffset + 4, little),
      valueOffset: entryOffset + 8,
    })
  }
  return entries
}

function findEntry(entries: IfdEntry[], tag: number): IfdEntry | null {
  return entries.find((entry) => entry.tag === tag) ?? null
}

function entryDataOffset(reader: TiffReader, entry: IfdEntry): number | null {
  const unitSize = TIFF_TYPE_SIZES[entry.type]
  if (unitSize === undefined) return null
  const size = unitSize * entry.count
  if (size === 0 || size > reader.view.byteLength) return null
  if (size <= 4) return entry.valueOffset
  if (entry.valueOffset + 4 > reader.view.byteLength) return null
  const offset = reader.view.getUint32(entry.valueOffset, reader.little)
  if (offset + size > reader.view.byteLength) return null
  return offset
}

function readAscii(reader: TiffReader, entry: IfdEntry): string | null {
  const offset = entryDataOffset(reader, entry)
  if (offset === null) return null
  let end = offset
  const limit = offset + entry.count
  while (end < limit && reader.bytes[end] !== 0) end += 1
  let value = ''
  for (let index = offset; index < end; index += 1) value += String.fromCharCode(reader.bytes[index])
  return value.trim() === '' ? null : value.trim()
}

function readUnsigned(reader: TiffReader, entry: IfdEntry): number | null {
  const offset = entryDataOffset(reader, entry)
  if (offset === null) return null
  if (entry.type === 3) return reader.view.getUint16(offset, reader.little)
  if (entry.type === 4) return reader.view.getUint32(offset, reader.little)
  if (entry.type === 1 || entry.type === 7) return reader.bytes[offset]
  return null
}

function readRational(reader: TiffReader, entry: IfdEntry): Rational | null {
  if (entry.type !== 5) return null
  const offset = entryDataOffset(reader, entry)
  if (offset === null) return null
  return {
    numerator: reader.view.getUint32(offset, reader.little),
    denominator: reader.view.getUint32(offset + 4, reader.little),
  }
}

function readRationalList(reader: TiffReader, entry: IfdEntry, count: number): number[] | null {
  if (entry.type !== 5 || entry.count < count) return null
  const offset = entryDataOffset(reader, entry)
  if (offset === null) return null
  const values: number[] = []
  for (let index = 0; index < count; index += 1) {
    const numerator = reader.view.getUint32(offset + index * 8, reader.little)
    const denominator = reader.view.getUint32(offset + index * 8 + 4, reader.little)
    values.push(denominator === 0 ? 0 : numerator / denominator)
  }
  return values
}

function formatRational(value: Rational): string {
  if (value.denominator === 0) return '0'
  if (value.numerator === 1 && value.denominator !== 1) return `1/${value.denominator}`
  const decimal = value.numerator / value.denominator
  return Number.isInteger(decimal) ? String(decimal) : String(Number(decimal.toFixed(2)))
}

function formatGpsCoordinate(values: number[], ref: string | null): string | null {
  if (values.length < 3) return null
  const [degrees, minutes, seconds] = values
  const decimal = degrees + minutes / 60 + seconds / 3600
  return `${decimal.toFixed(6)}${ref === null ? '' : ` ${ref}`}`
}

function asciiValue(reader: TiffReader, entries: IfdEntry[], tag: number): string | null {
  const entry = findEntry(entries, tag)
  return entry === null ? null : readAscii(reader, entry)
}
function unsignedValue(reader: TiffReader, entries: IfdEntry[], tag: number): number | null {
  const entry = findEntry(entries, tag)
  return entry === null ? null : readUnsigned(reader, entry)
}
function rationalValue(reader: TiffReader, entries: IfdEntry[], tag: number): Rational | null {
  const entry = findEntry(entries, tag)
  return entry === null ? null : readRational(reader, entry)
}
function rationalListValue(
  reader: TiffReader, entries: IfdEntry[], tag: number, count: number,
): number[] | null {
  const entry = findEntry(entries, tag)
  return entry === null ? null : readRationalList(reader, entry, count)
}

// ── parseTiff（现有逻辑，扩展 GPS Alt） ──────────────────────────────────────

function parseTiff(tiff: Uint8Array): ExifTag[] {
  const reader = createTiffReader(tiff)
  if (reader === null) return []
  const ifd0 = readIfd(reader, reader.view.getUint32(4, reader.little))
  if (ifd0 === null) return []

  const values = new Map<ExifTagKey, string>()
  const put = (key: ExifTagKey, value: string | null) => {
    if (value !== null && value !== '') values.set(key, value)
  }

  put('make', asciiValue(reader, ifd0, TAG_MAKE))
  put('model', asciiValue(reader, ifd0, TAG_MODEL))
  put('dateTime', asciiValue(reader, ifd0, TAG_DATE_TIME))
  put('software', asciiValue(reader, ifd0, TAG_SOFTWARE))

  const orientation = unsignedValue(reader, ifd0, TAG_ORIENTATION)
  if (orientation !== null) put('orientation', String(orientation))

  const exifOffset = unsignedValue(reader, ifd0, TAG_EXIF_IFD)
  const exifIfd = exifOffset === null ? null : readIfd(reader, exifOffset)
  if (exifIfd !== null) {
    put('dateTimeOriginal', asciiValue(reader, exifIfd, TAG_DATE_TIME_ORIGINAL))
    const exposure = rationalValue(reader, exifIfd, TAG_EXPOSURE_TIME)
    if (exposure !== null) put('exposureTime', formatRational(exposure))
    const fNumber = rationalValue(reader, exifIfd, TAG_F_NUMBER)
    if (fNumber !== null && fNumber.denominator !== 0) {
      put('fNumber', String(Number((fNumber.numerator / fNumber.denominator).toFixed(1))))
    }
    const iso = unsignedValue(reader, exifIfd, TAG_ISO)
    if (iso !== null) put('iso', String(iso))
    const focalLength = rationalValue(reader, exifIfd, TAG_FOCAL_LENGTH)
    if (focalLength !== null) put('focalLength', `${formatRational(focalLength)} mm`)
  }

  const gpsOffset = unsignedValue(reader, ifd0, TAG_GPS_IFD)
  const gpsIfd = gpsOffset === null ? null : readIfd(reader, gpsOffset)
  if (gpsIfd !== null) {
    const latRef = asciiValue(reader, gpsIfd, TAG_GPS_LATITUDE_REF)
    const lat = rationalListValue(reader, gpsIfd, TAG_GPS_LATITUDE, 3)
    if (lat !== null) put('gpsLatitude', formatGpsCoordinate(lat, latRef))
    const lonRef = asciiValue(reader, gpsIfd, TAG_GPS_LONGITUDE_REF)
    const lon = rationalListValue(reader, gpsIfd, TAG_GPS_LONGITUDE, 3)
    if (lon !== null) put('gpsLongitude', formatGpsCoordinate(lon, lonRef))
    const altRef = asciiValue(reader, gpsIfd, TAG_GPS_ALTITUDE_REF)
    const alt = rationalValue(reader, gpsIfd, TAG_GPS_ALTITUDE)
    if (alt !== null) {
      const altValue = alt.denominator === 0 ? 0 : alt.numerator / alt.denominator
      const ref = altRef === '1' ? '-' : ''
      put('gpsAltitude', `${ref}${altValue.toFixed(1)} m`)
    }
  }

  return exifTagKeys.flatMap((key) => {
    const value = values.get(key)
    return value === undefined ? [] : [{ key, value }]
  })
}

// ── readExifTags（现有公共 API） ────────────────────────────────────────────

/** 读取 JPEG 的 EXIF 常用标签；非 JPEG、无 EXIF 或结构损坏时返回空数组 */
export function readExifTags(bytes: Uint8Array): ExifTag[] {
  try {
    if (!isJpeg(bytes)) return []
    const segments = parseJpegSegments(bytes)
    const app1 = segments.find(
      (segment) => segment.marker === 0xe1 && hasExifHeader(bytes, segment),
    )
    if (app1 === undefined) return []
    const tiffStart = app1.dataStart + EXIF_HEADER.length
    return parseTiff(bytes.subarray(tiffStart, app1.dataEnd))
  } catch {
    return []
  }
}

// ── parseJpegExif（结构化输出） ─────────────────────────────────────────────

/**
 * 结构化解析 JPEG EXIF，返回更易消费的扁平字段。
 * 非 JPEG 时返回空对象。
 */
export function parseJpegExif(bytes: Uint8Array): JpegExifInfo {
  const tags = readExifTags(bytes)
  const result: JpegExifInfo = {}
  const gpsLat = tags.find((t) => t.key === 'gpsLatitude')?.value
  const gpsLon = tags.find((t) => t.key === 'gpsLongitude')?.value
  const gpsAlt = tags.find((t) => t.key === 'gpsAltitude')?.value

  // 简单从字符串提取数值（"12.3456 N" 这种格式）
  const extractDecimal = (s?: string): number | undefined => {
    if (!s) return undefined
    const m = s.match(/-?\d+\.\d+/)
    return m ? Number(m[0]) : undefined
  }

  const lat = extractDecimal(gpsLat)
  const lon = extractDecimal(gpsLon)
  if (lat !== undefined && lon !== undefined) {
    // 方向标记
    if (gpsLat?.includes('S')) result.gps = { lat: -lat, lon }
    else if (gpsLon?.includes('W')) result.gps = { lat, lon: -lon }
    else result.gps = { lat, lon }
    const alt = extractDecimal(gpsAlt)
    if (alt !== undefined) result.gps.alt = alt
  }

  result.make = tags.find((t) => t.key === 'make')?.value
  result.model = tags.find((t) => t.key === 'model')?.value
  result.datetime = tags.find((t) => t.key === 'dateTime')?.value
  result.software = tags.find((t) => t.key === 'software')?.value

  return result
}

// ── PNG metadata 解析 ───────────────────────────────────────────────────────

function readUint32BigEndian(bytes: Uint8Array, offset: number): number {
  return ((bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0
}

/**
 * 解析 PNG 的文本元数据块和关键属性。
 * 非 PNG 时返回空 texts 且 hasIccp=false。
 */
export function parsePngMetadata(bytes: Uint8Array): PngMetadata {
  const result: PngMetadata = { texts: {}, hasIccp: false }
  if (!isPng(bytes)) return result

  let offset = PNG_SIGNATURE.length
  while (offset + 8 <= bytes.length) {
    const length = readUint32BigEndian(bytes, offset)
    const typeStart = offset + 4
    const type = String.fromCharCode(
      bytes[typeStart], bytes[typeStart + 1], bytes[typeStart + 2], bytes[typeStart + 3],
    )
    // data 区范围：[offset + 8, offset + 8 + length)
    const dataEnd = offset + 8 + length
    if (offset + 12 + length > bytes.length) break // 整个 chunk（含 CRC）不能越界

    if (type === 'tEXt') {
      // keyword\0value
      let keyEnd = typeStart + 4
      while (keyEnd < dataEnd && bytes[keyEnd] !== 0) keyEnd += 1
      let key = ''
      for (let i = typeStart + 4; i < keyEnd; i += 1) key += String.fromCharCode(bytes[i])
      let value = ''
      for (let i = keyEnd + 1; i < dataEnd; i += 1) value += String.fromCharCode(bytes[i])
      if (key.length > 0) result.texts[key] = value
    } else if (type === 'iCCP') {
      result.hasIccp = true
    }

    offset += 12 + length // length(4) + type(4) + data + crc(4)
    if (type === 'IEND') break
  }
  return result
}

// ── hasExif ──────────────────────────────────────────────────────────────────

/**
 * 快速判断图片是否含有需要清理的元数据（EXIF / 文本块 / iCCP / XMP）。
 */
export function hasExif(bytes: Uint8Array): boolean {
  try {
    if (isJpeg(bytes)) {
      const segments = parseJpegSegments(bytes)
      return segments.some((s) => JPEG_STRIPPED_MARKERS.has(s.marker))
    }
    if (isPng(bytes)) {
      let offset = PNG_SIGNATURE.length
      while (offset + 8 <= bytes.length) {
        const length = readUint32BigEndian(bytes, offset)
        const typeStart = offset + 4
        const type = String.fromCharCode(
          bytes[typeStart], bytes[typeStart + 1], bytes[typeStart + 2], bytes[typeStart + 3],
        )
        const end = offset + 12 + length
        if (end > bytes.length) break
        if (PNG_STRIPPED_CHUNKS.has(type)) return true
        offset = end
        if (type === 'IEND') break
      }
      return false
    }
    if (isWebp(bytes)) {
      return hasWebpMetadata(bytes)
    }
    return false
  } catch {
    return false
  }
}

// ── WebP 处理 ───────────────────────────────────────────────────────────────

/** WebP 的 RIFF chunk 头（4 字节类型 + 4 字节长度） */
function parseWebpChunks(bytes: Uint8Array): Array<{ type: string; dataStart: number; dataEnd: number }> {
  if (!isWebp(bytes)) throw new Error('Not a WebP file')
  // WebP header 12 字节
  const chunks: Array<{ type: string; dataStart: number; dataEnd: number }> = []
  let offset = 12
  while (offset + 8 <= bytes.length) {
    const type = String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3])
    const size = (bytes[offset + 4] | (bytes[offset + 5] << 8) | (bytes[offset + 6] << 16) | (bytes[offset + 7] << 24)) >>> 0
    const dataStart = offset + 8
    const dataEnd = dataStart + size
    chunks.push({ type, dataStart, dataEnd })
    offset = dataEnd + (size % 2 === 1 ? 1 : 0) // RIFF 偶数字节对齐
  }
  return chunks
}

const WEBP_METADATA_CHUNKS: ReadonlySet<string> = new Set(['XMP ', 'EXIF'])

function hasWebpMetadata(bytes: Uint8Array): boolean {
  try {
    return parseWebpChunks(bytes).some((c) => WEBP_METADATA_CHUNKS.has(c.type))
  } catch {
    return false
  }
}

/** 清除 WebP 的 XMP / EXIF chunk */
export function cleanWebp(bytes: Uint8Array): Uint8Array {
  if (!isWebp(bytes)) throw new Error('Not a WebP file')
  const chunks = parseWebpChunks(bytes)
  const keepChunks = chunks.filter((c) => !WEBP_METADATA_CHUNKS.has(c.type))
  // 重建：RIFF header (8) + WEBP (4) + chunks
  const totalSize = 12 + keepChunks.reduce((sum, c) => {
    const size = c.dataEnd - c.dataStart
    return sum + 8 + size + (size % 2 === 1 ? 1 : 0)
  }, 0)
  const out = new Uint8Array(totalSize)
  out.set(bytes.subarray(0, 12), 0)
  // 更新 RIFF 总长度（文件大小 - 8）
  const riffSize = totalSize - 8
  out[4] = riffSize & 0xff
  out[5] = (riffSize >>> 8) & 0xff
  out[6] = (riffSize >>> 16) & 0xff
  out[7] = (riffSize >>> 24) & 0xff
  let offset = 12
  for (const chunk of keepChunks) {
    const size = chunk.dataEnd - chunk.dataStart
    out[offset] = chunk.type.charCodeAt(0)
    out[offset + 1] = chunk.type.charCodeAt(1)
    out[offset + 2] = chunk.type.charCodeAt(2)
    out[offset + 3] = chunk.type.charCodeAt(3)
    out[offset + 4] = size & 0xff
    out[offset + 5] = (size >>> 8) & 0xff
    out[offset + 6] = (size >>> 16) & 0xff
    out[offset + 7] = (size >>> 24) & 0xff
    out.set(bytes.subarray(chunk.dataStart, chunk.dataEnd), offset + 8)
    offset += 8 + size + (size % 2 === 1 ? 1 : 0)
  }
  return out
}

// ── 清除实现 ────────────────────────────────────────────────────────────────

function stripJpeg(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
  const segments = parseJpegSegments(bytes)
  const parts: Uint8Array[] = [bytes.subarray(0, 2)]
  for (const segment of segments) {
    if (!JPEG_STRIPPED_MARKERS.has(segment.marker)) {
      parts.push(bytes.subarray(segment.start, segment.end))
    }
  }
  return concatBytes(...parts)
}

function stripPng(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
  const parts: Uint8Array[] = [bytes.subarray(0, PNG_SIGNATURE.length)]
  let offset = PNG_SIGNATURE.length

  while (offset + 8 <= bytes.length) {
    const length = readUint32BigEndian(bytes, offset)
    const typeStart = offset + 4
    const type = String.fromCharCode(
      bytes[typeStart], bytes[typeStart + 1], bytes[typeStart + 2], bytes[typeStart + 3],
    )
    const end = offset + 12 + length
    if (end > bytes.length) throw new Error('Invalid PNG: chunk length exceeds the file')
    if (!PNG_STRIPPED_CHUNKS.has(type)) {
      parts.push(bytes.subarray(offset, end))
    }
    offset = end
    if (type === 'IEND') break
  }

  if (offset < bytes.length) parts.push(bytes.subarray(offset))
  return concatBytes(...parts)
}

/** 清除 JPEG 的 APP1/APP13/COM 段，或 PNG 的 tEXt/zTXt/iTXt/eXIf/tIME/iCCP 块，或 WebP 的 XMP/EXIF */
export function stripMetadata(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
  if (isJpeg(bytes)) return stripJpeg(bytes)
  if (isPng(bytes)) return stripPng(bytes)
  if (isWebp(bytes)) return cleanWebp(bytes) as Uint8Array<ArrayBuffer>
  throw new Error('Unsupported image format: only JPEG, PNG and WebP are supported')
}

export function metadataBytesSaved(before: Uint8Array, after: Uint8Array): number {
  return before.length - after.length
}
