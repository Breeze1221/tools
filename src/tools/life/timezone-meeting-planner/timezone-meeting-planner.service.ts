/**
 * 跨时区会议规划：全部基于 Intl.DateTimeFormat 的 timeZone 计算，
 * 不依赖任何第三方时区库，也不使用会随宿主机变化的本地时区偏移。
 */

const MS_PER_MINUTE = 60 * 1000
const MS_PER_DAY = 24 * 60 * 60 * 1000
const MS_PER_HOUR = 60 * 60 * 1000

/** 工作时间窗口（城市当地小时，左闭右开） */
export const WORKING_HOURS = { start: 9, end: 18 } as const

export type ZonedParts = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
}

/** 内置常用城市：labelKey 对应 tools-life.json 的 timezone-meeting-planner.cities.* */
export type MeetingCity = {
  id: string
  labelKey: string
  timeZone: string
}

export const MEETING_CITIES: readonly MeetingCity[] = [
  { id: 'beijing', labelKey: 'cities.beijing', timeZone: 'Asia/Shanghai' },
  { id: 'shanghai', labelKey: 'cities.shanghai', timeZone: 'Asia/Shanghai' },
  { id: 'hong-kong', labelKey: 'cities.hongKong', timeZone: 'Asia/Hong_Kong' },
  { id: 'taipei', labelKey: 'cities.taipei', timeZone: 'Asia/Taipei' },
  { id: 'tokyo', labelKey: 'cities.tokyo', timeZone: 'Asia/Tokyo' },
  { id: 'seoul', labelKey: 'cities.seoul', timeZone: 'Asia/Seoul' },
  { id: 'singapore', labelKey: 'cities.singapore', timeZone: 'Asia/Singapore' },
  { id: 'bangkok', labelKey: 'cities.bangkok', timeZone: 'Asia/Bangkok' },
  { id: 'jakarta', labelKey: 'cities.jakarta', timeZone: 'Asia/Jakarta' },
  { id: 'mumbai', labelKey: 'cities.mumbai', timeZone: 'Asia/Kolkata' },
  { id: 'dubai', labelKey: 'cities.dubai', timeZone: 'Asia/Dubai' },
  { id: 'moscow', labelKey: 'cities.moscow', timeZone: 'Europe/Moscow' },
  { id: 'berlin', labelKey: 'cities.berlin', timeZone: 'Europe/Berlin' },
  { id: 'paris', labelKey: 'cities.paris', timeZone: 'Europe/Paris' },
  { id: 'amsterdam', labelKey: 'cities.amsterdam', timeZone: 'Europe/Amsterdam' },
  { id: 'rome', labelKey: 'cities.rome', timeZone: 'Europe/Rome' },
  { id: 'madrid', labelKey: 'cities.madrid', timeZone: 'Europe/Madrid' },
  { id: 'london', labelKey: 'cities.london', timeZone: 'Europe/London' },
  { id: 'new-york', labelKey: 'cities.newYork', timeZone: 'America/New_York' },
  { id: 'chicago', labelKey: 'cities.chicago', timeZone: 'America/Chicago' },
  { id: 'los-angeles', labelKey: 'cities.losAngeles', timeZone: 'America/Los_Angeles' },
  { id: 'san-francisco', labelKey: 'cities.sanFrancisco', timeZone: 'America/Los_Angeles' },
  { id: 'toronto', labelKey: 'cities.toronto', timeZone: 'America/Toronto' },
  { id: 'mexico-city', labelKey: 'cities.mexicoCity', timeZone: 'America/Mexico_City' },
  { id: 'sao-paulo', labelKey: 'cities.saoPaulo', timeZone: 'America/Sao_Paulo' },
  {
    id: 'buenos-aires',
    labelKey: 'cities.buenosAires',
    timeZone: 'America/Argentina/Buenos_Aires',
  },
  { id: 'cairo', labelKey: 'cities.cairo', timeZone: 'Africa/Cairo' },
  { id: 'johannesburg', labelKey: 'cities.johannesburg', timeZone: 'Africa/Johannesburg' },
  { id: 'lagos', labelKey: 'cities.lagos', timeZone: 'Africa/Lagos' },
  { id: 'sydney', labelKey: 'cities.sydney', timeZone: 'Australia/Sydney' },
  { id: 'melbourne', labelKey: 'cities.melbourne', timeZone: 'Australia/Melbourne' },
  { id: 'auckland', labelKey: 'cities.auckland', timeZone: 'Pacific/Auckland' },
]

const formatterCache = new Map<string, Intl.DateTimeFormat>()

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

function getFormatter(timeZone: string): Intl.DateTimeFormat {
  const cached = formatterCache.get(timeZone)
  if (cached) {
    return cached
  }
  let formatter: Intl.DateTimeFormat
  try {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    })
  } catch {
    throw new Error(`Invalid time zone: ${timeZone}`)
  }
  formatterCache.set(timeZone, formatter)
  return formatter
}

/** 某一时刻在指定时区的日历字段（不依赖宿主时区） */
export function getZonedParts(date: Date, timeZone: string): ZonedParts {
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date')
  }
  const parts = getFormatter(timeZone).formatToParts(date)
  const pick = (type: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((part) => part.type === type)?.value ?? '0')
  return {
    year: pick('year'),
    month: pick('month'),
    day: pick('day'),
    hour: pick('hour') % 24,
    minute: pick('minute'),
    second: pick('second'),
  }
}

/** UTC 偏移分钟数：东八区为 +480，纽约冬令时为 -300 */
export function getOffsetMinutes(date: Date, timeZone: string): number {
  const parts = getZonedParts(date, timeZone)
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  )
  return Math.round((asUtc - date.getTime()) / MS_PER_MINUTE)
}

/** 展示用当地时间：YYYY-MM-DD HH:mm */
export function formatInZone(date: Date, timeZone: string): string {
  const parts = getZonedParts(date, timeZone)
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)} ${pad2(parts.hour)}:${pad2(parts.minute)}`
}

/** datetime-local 输入框的值：YYYY-MM-DDTHH:mm */
export function toZonedInputValue(date: Date, timeZone: string): string {
  const parts = getZonedParts(date, timeZone)
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}T${pad2(parts.hour)}:${pad2(parts.minute)}`
}

/** UTC 偏移展示：UTC+08:00 / UTC-05:00（含半小时时区） */
export function formatOffsetLabel(offsetMinutes: number): string {
  const sign = offsetMinutes < 0 ? '-' : '+'
  const absolute = Math.abs(offsetMinutes)
  return `UTC${sign}${pad2(Math.floor(absolute / 60))}:${pad2(absolute % 60)}`
}

/** 0 = 周日 … 6 = 周六 */
function getWeekday(parts: ZonedParts): number {
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay()
}

/**
 * datetime-local 字符串 → 该时区下的真实时刻。
 * 先按 UTC 解析再用偏移量回推，重复一次以覆盖夏令时切换日。
 */
export function parseZonedDateTime(value: string, timeZone: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value.trim())
  if (!match) {
    throw new Error(`Invalid date time value: "${value}"`)
  }
  const [year, month, day, hour, minute] = match.slice(1, 6).map(Number)
  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    hour > 23 ||
    minute > 59
  ) {
    throw new Error(`Invalid date time value: "${value}"`)
  }
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute)
  const firstOffset = getOffsetMinutes(new Date(utcGuess), timeZone)
  const firstResult = new Date(utcGuess - firstOffset * MS_PER_MINUTE)
  const secondOffset = getOffsetMinutes(firstResult, timeZone)
  return secondOffset === firstOffset
    ? firstResult
    : new Date(utcGuess - secondOffset * MS_PER_MINUTE)
}

export type CityRow = {
  city: MeetingCity
  /** 当地时间：YYYY-MM-DD HH:mm */
  localDateTime: string
  /** 与基准时区的日差：-1 / 0 / +1 */
  dayDiff: number
  offsetMinutes: number
  offsetLabel: string
  /** 是否落在 9:00–18:00 工作时段 */
  isWorkingHours: boolean
}

/** 每个城市相对同一时刻的当地日期、偏移、日差与工作时段状态 */
export function computeCityRows(
  baseDate: Date,
  cities: readonly MeetingCity[],
  baseTimeZone: string = Intl.DateTimeFormat().resolvedOptions().timeZone,
): CityRow[] {
  const baseParts = getZonedParts(baseDate, baseTimeZone)
  const baseDayIndex = Date.UTC(baseParts.year, baseParts.month - 1, baseParts.day) / MS_PER_DAY

  return cities.map((city) => {
    const parts = getZonedParts(baseDate, city.timeZone)
    const dayIndex = Date.UTC(parts.year, parts.month - 1, parts.day) / MS_PER_DAY
    const offsetMinutes = getOffsetMinutes(baseDate, city.timeZone)
    return {
      city,
      localDateTime: formatInZone(baseDate, city.timeZone),
      dayDiff: Math.round(dayIndex - baseDayIndex),
      offsetMinutes,
      offsetLabel: formatOffsetLabel(offsetMinutes),
      isWorkingHours: parts.hour >= WORKING_HOURS.start && parts.hour < WORKING_HOURS.end,
    }
  })
}

export type OverlapOptions = {
  /** 从基准时间向后搜索多少天，默认 7 */
  searchDays?: number
  /** 当地时间窗口起始小时（含），默认 8 */
  startHour?: number
  /** 当地时间窗口结束小时（不含），默认 20 */
  endHour?: number
  /** 最多返回的时段数，默认 3 */
  maxSlots?: number
}

export type OverlapSlot = {
  start: Date
  end: Date
  /** 时段长度（小时） */
  hours: number
  /** 各时区的当地时间标签 */
  times: { timeZone: string; label: string }[]
}

/**
 * 在所有给定时区都处于「工作日 + 时间窗口」的最近时段。
 * 连续满足的小时合并成一段，最多返回 maxSlots 段；无解返回空数组。
 */
export function findOverlapSlots(
  baseDate: Date,
  timeZones: readonly string[],
  options: OverlapOptions = {},
): OverlapSlot[] {
  const { searchDays = 7, startHour = 8, endHour = 20, maxSlots = 3 } = options
  const zones = [...new Set(timeZones)]
  if (zones.length === 0) {
    return []
  }
  // 提前校验时区，非法值直接抛错而不是在整个搜索循环里静默失败
  zones.forEach((zone) => getFormatter(zone))

  const firstHour = Math.ceil(baseDate.getTime() / MS_PER_HOUR) * MS_PER_HOUR
  const totalHours = Math.max(1, Math.round(searchDays * 24))

  const isWithinWindow = (time: number): boolean =>
    zones.every((zone) => {
      const parts = getZonedParts(new Date(time), zone)
      const weekday = getWeekday(parts)
      return (
        weekday >= 1 &&
        weekday <= 5 &&
        parts.hour >= startHour &&
        parts.hour < endHour
      )
    })

  const toSlot = (start: number, hours: number): OverlapSlot => ({
    start: new Date(start),
    end: new Date(start + hours * MS_PER_HOUR),
    hours,
    times: zones.map((timeZone) => ({
      timeZone,
      label: formatInZone(new Date(start), timeZone),
    })),
  })

  const slots: OverlapSlot[] = []
  let runStart: number | null = null
  let runHours = 0

  for (let index = 0; index < totalHours; index += 1) {
    const time = firstHour + index * MS_PER_HOUR
    if (isWithinWindow(time)) {
      if (runStart === null) {
        runStart = time
        runHours = 0
      }
      runHours += 1
      continue
    }
    if (runStart !== null) {
      slots.push(toSlot(runStart, runHours))
      runStart = null
      runHours = 0
      if (slots.length >= maxSlots) {
        return slots
      }
    }
  }

  if (runStart !== null && slots.length < maxSlots) {
    slots.push(toSlot(runStart, runHours))
  }

  return slots
}
