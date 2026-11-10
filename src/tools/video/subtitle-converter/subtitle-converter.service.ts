export const SUBTITLE_FORMATS = ['srt', 'vtt', 'ass'] as const

export type SubtitleFormat = (typeof SUBTITLE_FORMATS)[number]
/** 源格式可以是 auto，由 detectFormat 判定 */
export type SubtitleSourceFormat = SubtitleFormat | 'auto'

export type SubtitleCue = {
  startMs: number
  endMs: number
  text: string
}

export const SUBTITLE_EXTENSIONS: Record<SubtitleFormat, string> = {
  srt: '.srt',
  vtt: '.vtt',
  ass: '.ass',
}

export const SUBTITLE_MIME: Record<SubtitleFormat, string> = {
  srt: 'application/x-subrip',
  vtt: 'text/vtt',
  ass: 'text/x-ssa',
}

const TIMESTAMP = /^(?:(\d{1,2}):)?(\d{1,2}):(\d{2})[.,](\d{1,3})$/
const ASS_TIMESTAMP = /^(\d{1,2}):(\d{2}):(\d{2})\.(\d{1,2})$/

/** 按空行切块，统一换行并去掉 BOM */
function splitBlocks(input: string): string[][] {
  return input
    .replace(/^\uFEFF/, '')
    .replace(/\r\n?/g, '\n')
    .split(/\n{2,}/)
    .map((block) => block.split('\n'))
    .filter((lines) => lines.some((line) => line.trim() !== ''))
}

/** 解析 `HH:MM:SS,mmm` / `MM:SS.mmm` / `H:MM:SS.cc` 为毫秒 */
function parseTimestamp(value: string): number {
  const match = TIMESTAMP.exec(value.trim())
  if (!match) {
    throw new Error(`Invalid timestamp: ${value}`)
  }
  const hours = Number(match[1] ?? 0)
  const minutes = Number(match[2])
  const seconds = Number(match[3])
  if (minutes > 59 || seconds > 59) {
    throw new Error(`Invalid timestamp: ${value}`)
  }
  const millis = Number(match[4].padEnd(3, '0'))
  return ((hours * 60 + minutes) * 60 + seconds) * 1000 + millis
}

/** 从 `start --> end` 时间行取毫秒区间，忽略行尾的 position/align 等附加参数 */
function parseTimeRange(line: string): { startMs: number; endMs: number } | null {
  const arrow = line.indexOf('-->')
  if (arrow < 0) return null
  const start = line.slice(0, arrow).trim().split(/\s+/)[0]
  const end = line
    .slice(arrow + 3)
    .trim()
    .split(/\s+/)[0]
  if (!start || !end) return null
  return { startMs: parseTimestamp(start), endMs: parseTimestamp(end) }
}

/** 去掉 ASS 的内联标签，把 `\N` / `\n` 还原成换行、`\h` 还原成空格 */
function cleanAssText(value: string): string {
  return value
    .replace(/\{[^}]*\}/g, '')
    .replace(/\\N/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\\h/g, ' ')
    .trim()
}

function pad(value: number, length = 2): string {
  return String(Math.max(0, Math.trunc(value))).padStart(length, '0')
}

/** 毫秒格式化成 SRT/VTT 时间戳；separator 区分 `,` 与 `.` */
export function formatTimestamp(ms: number, separator: ',' | '.' = ','): string {
  const total = Math.max(0, Math.round(ms))
  const hours = Math.floor(total / 3_600_000)
  const minutes = Math.floor((total % 3_600_000) / 60_000)
  const seconds = Math.floor((total % 60_000) / 1000)
  const millis = total % 1000
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}${separator}${pad(millis, 3)}`
}

/** ASS 用 `H:MM:SS.cc`，百分秒两位 */
function formatAssTimestamp(ms: number): string {
  const total = Math.max(0, Math.round(ms))
  const hours = Math.floor(total / 3_600_000)
  const minutes = Math.floor((total % 3_600_000) / 60_000)
  const seconds = Math.floor((total % 60_000) / 1000)
  const centiseconds = Math.floor((total % 1000) / 10)
  return `${hours}:${pad(minutes)}:${pad(seconds)}.${pad(centiseconds)}`
}

/** 自动识别字幕格式：空输入或无法识别时抛 Error */
export function detectFormat(input: string): SubtitleFormat {
  const text = input.replace(/^\uFEFF/, '').trim()
  if (!text) {
    throw new Error('Input is empty')
  }
  if (/^WEBVTT\b/i.test(text)) {
    return 'vtt'
  }
  if (/^\s*\[(?:Script Info|Events|V4\+? Styles)\]/im.test(text)) {
    return 'ass'
  }
  if (/^\s*Dialogue\s*:/im.test(text)) {
    return 'ass'
  }
  if (/\d{1,2}:\d{2}:\d{2}[,.]\d{1,3}\s*-->/m.test(text)) {
    return 'srt'
  }
  throw new Error('Unrecognised subtitle format')
}

export function parseSrt(input: string): SubtitleCue[] {
  const cues: SubtitleCue[] = []

  for (const lines of splitBlocks(input)) {
    const timingIndex = lines.findIndex((line) => line.includes('-->'))
    if (timingIndex < 0) continue
    const range = parseTimeRange(lines[timingIndex])
    if (!range) continue
    const text = lines
      .slice(timingIndex + 1)
      .join('\n')
      .trim()
    if (!text) continue
    cues.push({ ...range, text })
  }

  if (cues.length === 0) {
    throw new Error('No SRT cues found')
  }
  return cues
}

export function parseVtt(input: string): SubtitleCue[] {
  const cues: SubtitleCue[] = []

  for (const lines of splitBlocks(input)) {
    const first = lines[0].trim()
    if (/^(?:NOTE|STYLE|REGION)\b/i.test(first)) continue
    const timingIndex = lines.findIndex((line) => line.includes('-->'))
    if (timingIndex < 0) continue
    const range = parseTimeRange(lines[timingIndex])
    if (!range) continue
    const text = lines
      .slice(timingIndex + 1)
      .join('\n')
      .trim()
    if (!text) continue
    cues.push({ ...range, text })
  }

  if (cues.length === 0) {
    throw new Error('No VTT cues found')
  }
  return cues
}

export function parseAss(input: string): SubtitleCue[] {
  const cues: SubtitleCue[] = []

  for (const rawLine of input
    .replace(/^\uFEFF/, '')
    .replace(/\r\n?/g, '\n')
    .split('\n')) {
    const line = rawLine.trim()
    if (!/^Dialogue\s*:/i.test(line)) continue
    const parts = line.slice(line.indexOf(':') + 1).split(',')
    if (parts.length < 10) continue
    const start = ASS_TIMESTAMP.test(parts[1].trim())
      ? parseAssTimestamp(parts[1].trim())
      : parseTimestamp(parts[1])
    const end = ASS_TIMESTAMP.test(parts[2].trim())
      ? parseAssTimestamp(parts[2].trim())
      : parseTimestamp(parts[2])
    const text = cleanAssText(parts.slice(9).join(','))
    if (!text) continue
    cues.push({ startMs: start, endMs: end, text })
  }

  if (cues.length === 0) {
    throw new Error('No ASS dialogue lines found')
  }
  return cues
}

/** ASS 时间戳允许一位小数（百分秒），先补齐成标准三段再交给 parseTimestamp */
function parseAssTimestamp(value: string): number {
  const match = ASS_TIMESTAMP.exec(value)
  if (!match) {
    throw new Error(`Invalid ASS timestamp: ${value}`)
  }
  return (
    ((Number(match[1]) * 60 + Number(match[2])) * 60 + Number(match[3])) * 1000 +
    Number(match[4].padEnd(2, '0')) * 10
  )
}

export function toSrt(cues: readonly SubtitleCue[]): string {
  if (cues.length === 0) {
    throw new Error('No cues to serialise')
  }
  const blocks = cues.map((cue, index) => {
    const start = formatTimestamp(cue.startMs, ',')
    const end = formatTimestamp(cue.endMs, ',')
    return `${index + 1}\n${start} --> ${end}\n${cue.text}`
  })
  return `${blocks.join('\n\n')}\n`
}

export function toVtt(cues: readonly SubtitleCue[]): string {
  if (cues.length === 0) {
    throw new Error('No cues to serialise')
  }
  const blocks = cues.map((cue) => {
    const start = formatTimestamp(cue.startMs, '.')
    const end = formatTimestamp(cue.endMs, '.')
    return `${start} --> ${end}\n${cue.text}`
  })
  return `WEBVTT\n\n${blocks.join('\n\n')}\n`
}

const ASS_HEADER = [
  '[Script Info]',
  'Title: ToolBox subtitles',
  'ScriptType: v4.00+',
  'WrapStyle: 0',
  'ScaledBorderAndShadow: yes',
  'PlayResX: 1920',
  'PlayResY: 1080',
  '',
  '[V4+ Styles]',
  'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
  'Style: Default,Arial,64,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,0,2,10,10,10,1',
  '',
  '[Events]',
  'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
].join('\n')

export function toAss(cues: readonly SubtitleCue[]): string {
  if (cues.length === 0) {
    throw new Error('No cues to serialise')
  }
  const lines = cues.map((cue) => {
    const start = formatAssTimestamp(cue.startMs)
    const end = formatAssTimestamp(cue.endMs)
    const text = cue.text.replace(/\r\n?/g, '\n').replace(/\n/g, '\\N')
    return `Dialogue: 0,${start},${end},Default,,0,0,0,,${text}`
  })
  return `${ASS_HEADER}\n${lines.join('\n')}\n`
}

function parseByFormat(input: string, format: SubtitleFormat): SubtitleCue[] {
  if (format === 'srt') return parseSrt(input)
  if (format === 'vtt') return parseVtt(input)
  return parseAss(input)
}

/** 字幕互转：空输入、无法识别或解析不出字条时抛 Error */
export function convertSubtitles(
  input: string,
  from: SubtitleSourceFormat,
  to: SubtitleFormat,
): string {
  const text = input.trim()
  if (!text) {
    throw new Error('Input is empty')
  }
  const source = from === 'auto' ? detectFormat(text) : from
  const cues = parseByFormat(text, source)
  if (to === 'srt') return toSrt(cues)
  if (to === 'vtt') return toVtt(cues)
  return toAss(cues)
}
