import { describe, expect, it } from 'vitest'

import {
  computeCityRows,
  findOverlapSlots,
  formatInZone,
  formatOffsetLabel,
  getOffsetMinutes,
  getZonedParts,
  MEETING_CITIES,
  parseZonedDateTime,
  toZonedInputValue,
} from '@/tools/life/timezone-meeting-planner/timezone-meeting-planner.service'

function weekdayOf(date: Date, timeZone: string): number {
  const parts = getZonedParts(date, timeZone)
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay()
}

describe('getOffsetMinutes', () => {
  it('returns +480 for Asia/Shanghai all year', () => {
    expect(getOffsetMinutes(new Date('2026-11-10T08:00:00Z'), 'Asia/Shanghai')).toBe(480)
    expect(getOffsetMinutes(new Date('2026-07-10T08:00:00Z'), 'Asia/Shanghai')).toBe(480)
  })

  it('returns -300 for America/New_York in winter and -240 in summer', () => {
    expect(getOffsetMinutes(new Date('2026-01-15T12:00:00Z'), 'America/New_York')).toBe(-300)
    expect(getOffsetMinutes(new Date('2026-07-15T12:00:00Z'), 'America/New_York')).toBe(-240)
  })

  it('keeps half-hour offsets', () => {
    expect(getOffsetMinutes(new Date('2026-01-15T12:00:00Z'), 'Asia/Kolkata')).toBe(330)
  })

  it('throws for unknown zones', () => {
    expect(() => getOffsetMinutes(new Date(), 'Nowhere/Invalid')).toThrowError(
      /Invalid time zone/,
    )
  })

  it('formats offsets with sign and minutes', () => {
    expect(formatOffsetLabel(480)).toBe('UTC+08:00')
    expect(formatOffsetLabel(-300)).toBe('UTC-05:00')
    expect(formatOffsetLabel(330)).toBe('UTC+05:30')
  })
})

describe('formatInZone', () => {
  it('rolls over to the next day when the zone is ahead of UTC', () => {
    const instant = new Date('2026-01-01T16:30:00Z')
    expect(formatInZone(instant, 'Asia/Shanghai')).toBe('2026-01-02 00:30')
  })

  it('stays on the same day for a zone behind UTC', () => {
    const instant = new Date('2026-01-01T16:30:00Z')
    expect(formatInZone(instant, 'America/Los_Angeles')).toBe('2026-01-01 08:30')
    expect(formatInZone(instant, 'UTC')).toBe('2026-01-01 16:30')
  })
})

describe('getZonedParts', () => {
  it('returns the calendar fields of the given zone', () => {
    expect(getZonedParts(new Date('2026-11-10T00:00:00Z'), 'Asia/Tokyo')).toEqual({
      year: 2026,
      month: 11,
      day: 10,
      hour: 9,
      minute: 0,
      second: 0,
    })
  })
})

describe('parseZonedDateTime / toZonedInputValue', () => {
  it('interprets a datetime-local value in the given zone', () => {
    const date = parseZonedDateTime('2026-11-10T14:30', 'Asia/Shanghai')
    expect(date.toISOString()).toBe('2026-11-10T06:30:00.000Z')
    expect(toZonedInputValue(date, 'Asia/Shanghai')).toBe('2026-11-10T14:30')
  })

  it('rejects malformed values', () => {
    expect(() => parseZonedDateTime('2026-13-10T14:30', 'Asia/Shanghai')).toThrowError(
      /Invalid date time/,
    )
    expect(() => parseZonedDateTime('', 'Asia/Shanghai')).toThrowError(/Invalid date time/)
  })
})

describe('computeCityRows', () => {
  const base = parseZonedDateTime('2026-11-10T14:00', 'Asia/Shanghai')
  const cities = [
    MEETING_CITIES.find((city) => city.id === 'beijing'),
    MEETING_CITIES.find((city) => city.id === 'london'),
    MEETING_CITIES.find((city) => city.id === 'san-francisco'),
  ].filter((city) => city !== undefined)

  it('returns one row per requested city', () => {
    const rows = computeCityRows(base, cities, 'Asia/Shanghai')
    expect(rows).toHaveLength(cities.length)
    expect(rows.map((row) => row.city.id)).toEqual(cities.map((city) => city.id))
  })

  it('shows the base city at the same wall clock time', () => {
    const rows = computeCityRows(base, cities, 'Asia/Shanghai')
    expect(rows[0].localDateTime).toBe('2026-11-10 14:00')
    expect(rows[0].offsetLabel).toBe('UTC+08:00')
    expect(rows[0].dayDiff).toBe(0)
    expect(rows[0].isWorkingHours).toBe(true)
  })

  it('computes negative day differences and off-hours flags', () => {
    const rows = computeCityRows(base, cities, 'Asia/Shanghai')
    const sanFrancisco = rows.find((row) => row.city.id === 'san-francisco')
    expect(sanFrancisco?.dayDiff).toBe(-1)
    expect(sanFrancisco?.isWorkingHours).toBe(false)

    const london = rows.find((row) => row.city.id === 'london')
    expect(london?.localDateTime).toBe('2026-11-10 06:00')
    expect(london?.dayDiff).toBe(0)
    expect(london?.isWorkingHours).toBe(false)
  })

  it('returns an empty list for no cities', () => {
    expect(computeCityRows(base, [], 'Asia/Shanghai')).toEqual([])
  })
})

describe('findOverlapSlots', () => {
  const zones = ['Asia/Shanghai', 'Asia/Tokyo', 'Australia/Sydney']

  it('finds at most three slots where every zone is in the weekday window', () => {
    const base = parseZonedDateTime('2026-11-10T09:00', 'Asia/Shanghai')
    const slots = findOverlapSlots(base, zones)
    expect(slots.length).toBeGreaterThan(0)
    expect(slots.length).toBeLessThanOrEqual(3)

    for (const slot of slots) {
      expect(slot.start.getTime()).toBeGreaterThanOrEqual(base.getTime())
      expect(slot.end.getTime()).toBeGreaterThan(slot.start.getTime())
      expect(slot.hours).toBeGreaterThan(0)
      for (const zone of zones) {
        const hour = getZonedParts(slot.start, zone).hour
        expect(hour).toBeGreaterThanOrEqual(8)
        expect(hour).toBeLessThan(20)
        const weekday = weekdayOf(slot.start, zone)
        expect(weekday).toBeGreaterThanOrEqual(1)
        expect(weekday).toBeLessThanOrEqual(5)
      }
      expect(slot.times.map((item) => item.timeZone)).toEqual(zones)
    }
  })

  it('returns an empty array when no hour fits every zone', () => {
    // 七月上海 UTC+8、纽约 UTC-4，正好相差 12 小时：两边的 8:00–20:00 窗口互不重叠
    const base = parseZonedDateTime('2026-07-15T09:00', 'Asia/Shanghai')
    expect(findOverlapSlots(base, ['Asia/Shanghai', 'America/New_York'])).toEqual([])
  })

  it('returns an empty array without zones', () => {
    expect(findOverlapSlots(parseZonedDateTime('2026-11-10T09:00', 'Asia/Shanghai'), [])).toEqual(
      [],
    )
  })

  it('honours the maxSlots option', () => {
    const base = parseZonedDateTime('2026-11-10T09:00', 'Asia/Shanghai')
    const slots = findOverlapSlots(base, ['Asia/Shanghai'], { maxSlots: 1 })
    expect(slots).toHaveLength(1)
  })
})
