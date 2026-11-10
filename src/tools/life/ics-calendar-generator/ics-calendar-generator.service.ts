/** iCalendar（RFC 5545）事件生成：纯字符串拼装，负责 CRLF、75 字节折行与文本转义 */

/** 提前提醒分钟数，0 表示不提醒 */
export type ReminderMinutes = 0 | 5 | 15 | 30 | 60

export type IcsEventInput = {
  title: string
  location?: string
  description?: string
  /** datetime-local 值：YYYY-MM-DDTHH:mm（本地时间） */
  start: string
  /** datetime-local 值：YYYY-MM-DDTHH:mm（本地时间） */
  end: string
  /** 全天事件：只取日期部分，DTEND 取结束日期次日（RFC 5545 定义为不包含） */
  isAllDay: boolean
  reminderMinutes: ReminderMinutes
}

export type BuildEventOptions = {
  /** DTSTAMP 时间，测试时可固定以得到确定输出 */
  now?: Date
  uid?: string
}

export type BuildCalendarOptions = {
  now?: Date
}

const CRLF = '\r\n'
const DAY_MS = 24 * 60 * 60 * 1000
/** RFC 5545 规定每行不超过 75 个八位组（不含 CRLF） */
const MAX_LINE_OCTETS = 75
/** 续行以一个空格开头，这 1 个字节也计入 75 字节上限 */
const CONTINUATION_PREFIX = ' '
const textEncoder = new TextEncoder()

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

function utf8Length(value: string): number {
  return textEncoder.encode(value).length
}

/** 文本转义：反斜杠、分号、逗号、换行 */
export function escapeIcsText(value: string): string {
  return value
    .replaceAll('\\', '\\\\')
    .replaceAll(';', '\\;')
    .replaceAll(',', '\\,')
    .replace(/\r\n|\r|\n/g, '\\n')
}

/**
 * 按 UTF-8 字节折行：首行最多 75 字节，续行（含开头空格）同样不超过 75 字节。
 * 逐码点累加，不会把一个多字节字符截成两半。
 */
export function foldIcsLine(line: string): string {
  if (utf8Length(line) <= MAX_LINE_OCTETS) {
    return line
  }
  const chunks: string[] = []
  let current = ''
  let currentBytes = 0
  let limit = MAX_LINE_OCTETS
  for (const char of line) {
    const charBytes = utf8Length(char)
    if (currentBytes + charBytes > limit && current !== '') {
      chunks.push(current)
      current = char
      currentBytes = charBytes
      limit = MAX_LINE_OCTETS - CONTINUATION_PREFIX.length
    } else {
      current += char
      currentBytes += charBytes
    }
  }
  if (current !== '') {
    chunks.push(current)
  }
  return chunks.join(CRLF + CONTINUATION_PREFIX)
}

/** Date → UTC 时间戳：YYYYMMDDTHHMMSSZ */
export function formatIcsDateTime(date: Date): string {
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date')
  }
  return `${date.getUTCFullYear()}${pad2(date.getUTCMonth() + 1)}${pad2(date.getUTCDate())}T${pad2(date.getUTCHours())}${pad2(date.getUTCMinutes())}${pad2(date.getUTCSeconds())}Z`
}

/** Date → 日期值：YYYYMMDD（按 UTC 取年月日，调用方保证传入的是零点） */
export function formatIcsDate(date: Date): string {
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date')
  }
  return `${date.getUTCFullYear()}${pad2(date.getUTCMonth() + 1)}${pad2(date.getUTCDate())}`
}

/** datetime-local 字符串按本地时间解析；非法输入抛 Error */
function parseLocalDateTime(value: string, field: string): Date {
  const trimmed = value.trim()
  if (trimmed === '') {
    throw new Error(`Event ${field} time is required`)
  }
  const date = new Date(trimmed)
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid event ${field} time: "${value}"`)
  }
  return date
}

/** 取日期部分并构造成 UTC 零点，避免本地时区把日期整体挪一天 */
function parseDateOnly(value: string, field: string): Date {
  const trimmed = value.trim()
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed)
  if (!match) {
    throw new Error(`Invalid event ${field} date: "${value}"`)
  }
  const date = new Date(`${match[1]}-${match[2]}-${match[3]}T00:00:00Z`)
  if (Number.isNaN(date.getTime()) || date.getUTCDate() !== Number(match[3])) {
    throw new Error(`Invalid event ${field} date: "${value}"`)
  }
  return date
}

function assertEndNotBeforeStart(start: Date, end: Date): void {
  if (end.getTime() < start.getTime()) {
    throw new Error('Event end must not be earlier than start')
  }
}

/** 生成单个 VEVENT（含可选 VALARM），行尾为 CRLF */
export function buildEvent(event: IcsEventInput, options: BuildEventOptions = {}): string {
  const title = event.title.trim()
  if (title === '') {
    throw new Error('Event title is required')
  }

  const start = event.isAllDay
    ? parseDateOnly(event.start, 'start')
    : parseLocalDateTime(event.start, 'start')
  const end = event.isAllDay
    ? parseDateOnly(event.end, 'end')
    : parseLocalDateTime(event.end, 'end')
  assertEndNotBeforeStart(start, end)

  const now = options.now ?? new Date()
  const startKey = event.isAllDay ? formatIcsDate(start) : formatIcsDateTime(start)
  const uid = options.uid ?? `${startKey}-${title.length}@toolbox.local`

  const lines: string[] = ['BEGIN:VEVENT', `UID:${uid}`, `DTSTAMP:${formatIcsDateTime(now)}`]

  if (event.isAllDay) {
    lines.push(`DTSTART;VALUE=DATE:${formatIcsDate(start)}`)
    lines.push(`DTEND;VALUE=DATE:${formatIcsDate(new Date(end.getTime() + DAY_MS))}`)
  } else {
    lines.push(`DTSTART:${formatIcsDateTime(start)}`)
    lines.push(`DTEND:${formatIcsDateTime(end)}`)
  }

  lines.push(`SUMMARY:${escapeIcsText(title)}`)

  const location = (event.location ?? '').trim()
  if (location !== '') {
    lines.push(`LOCATION:${escapeIcsText(location)}`)
  }

  const description = (event.description ?? '').trim()
  if (description !== '') {
    lines.push(`DESCRIPTION:${escapeIcsText(description)}`)
  }

  if (event.reminderMinutes > 0) {
    lines.push(
      'BEGIN:VALARM',
      `TRIGGER:-PT${event.reminderMinutes}M`,
      'ACTION:DISPLAY',
      'DESCRIPTION:Reminder',
      'END:VALARM',
    )
  }

  lines.push('END:VEVENT')
  return `${lines.map(foldIcsLine).join(CRLF)}${CRLF}`
}

/** 生成完整 VCALENDAR：多个事件共用一个日历头，每行按字节折行 */
export function buildCalendar(
  events: readonly IcsEventInput[],
  options: BuildCalendarOptions = {},
): string {
  if (events.length === 0) {
    throw new Error('At least one event is required')
  }
  const now = options.now ?? new Date()
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ToolBox//ICS Calendar Generator//EN',
  ]

  events.forEach((event, index) => {
    const uid = `event-${index + 1}-${event.start.replace(/[^0-9]/g, '')}@toolbox.local`
    lines.push(buildEvent(event, { now, uid }).slice(0, -CRLF.length))
  })

  lines.push('END:VCALENDAR')
  return `${lines.join(CRLF)}${CRLF}`
}
