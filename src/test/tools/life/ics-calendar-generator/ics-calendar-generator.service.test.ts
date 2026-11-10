import { describe, expect, it } from 'vitest'

import {
  buildCalendar,
  buildEvent,
  escapeIcsText,
  foldIcsLine,
  formatIcsDate,
  formatIcsDateTime,
  type IcsEventInput,
} from '@/tools/life/ics-calendar-generator/ics-calendar-generator.service'

const NOW = new Date('2026-11-10T08:00:00Z')
const encoder = new TextEncoder()

const baseEvent: IcsEventInput = {
  title: 'Weekly sync',
  location: 'Room A',
  description: 'Agenda and notes',
  start: '2026-11-10T14:00',
  end: '2026-11-10T15:00',
  isAllDay: false,
  reminderMinutes: 15,
}

describe('formatIcsDateTime / formatIcsDate', () => {
  it('formats an instant as UTC basic date-time', () => {
    expect(formatIcsDateTime(new Date('2026-11-10T08:05:09Z'))).toBe('20261110T080509Z')
  })

  it('formats a zero-UTC date as YYYYMMDD', () => {
    expect(formatIcsDate(new Date('2026-11-10T00:00:00Z'))).toBe('20261110')
  })

  it('rejects invalid dates', () => {
    expect(() => formatIcsDateTime(new Date('nope'))).toThrowError(/Invalid date/)
    expect(() => formatIcsDate(new Date(Number.NaN))).toThrowError(/Invalid date/)
  })
})

describe('escapeIcsText', () => {
  it('escapes backslashes, semicolons, commas and newlines', () => {
    expect(escapeIcsText('a;b,c\\d\ne')).toBe('a\\;b\\,c\\\\d\\ne')
    expect(escapeIcsText('line1\r\nline2\rline3')).toBe('line1\\nline2\\nline3')
  })

  it('leaves plain text untouched', () => {
    expect(escapeIcsText('Team meeting 10:00')).toBe('Team meeting 10:00')
  })
})

describe('foldIcsLine', () => {
  it('keeps every physical line within 75 octets and prefixes continuations with a space', () => {
    const line = `SUMMARY:${'A'.repeat(200)}`
    const folded = foldIcsLine(line)
    const lines = folded.split('\r\n')
    expect(lines.length).toBeGreaterThan(1)
    for (const physical of lines) {
      expect(encoder.encode(physical).length).toBeLessThanOrEqual(75)
    }
    expect(lines[0].startsWith(' ')).toBe(false)
    for (const continuation of lines.slice(1)) {
      expect(continuation.startsWith(' ')).toBe(true)
    }
    expect(folded.replaceAll('\r\n ', '')).toBe(line)
  })

  it('does not split multi-byte characters when folding Chinese text', () => {
    const line = `DESCRIPTION:${'跨时区会议规划'.repeat(12)}`
    const folded = foldIcsLine(line)
    expect(folded).not.toContain('\uFFFD')
    expect(folded.replaceAll('\r\n ', '')).toBe(line)
    for (const physical of folded.split('\r\n')) {
      expect(encoder.encode(physical).length).toBeLessThanOrEqual(75)
    }
  })

  it('returns short lines unchanged', () => {
    expect(foldIcsLine('VERSION:2.0')).toBe('VERSION:2.0')
  })
})

describe('buildEvent', () => {
  it('emits the required VEVENT structure with CRLF line endings', () => {
    const event = buildEvent(baseEvent, { now: NOW })
    expect(event.startsWith('BEGIN:VEVENT\r\n')).toBe(true)
    expect(event.endsWith('END:VEVENT\r\n')).toBe(true)

    const lines = event.split('\r\n').filter(Boolean)
    expect(lines[1]).toMatch(/^UID:/)
    expect(lines[2]).toBe('DTSTAMP:20261110T080000Z')
    expect(lines.some((line) => /^DTSTART:\d{8}T\d{6}Z$/.test(line))).toBe(true)
    expect(lines.some((line) => /^DTEND:\d{8}T\d{6}Z$/.test(line))).toBe(true)
    expect(lines).toContain('SUMMARY:Weekly sync')
    expect(lines).toContain('LOCATION:Room A')
    expect(lines).toContain('DESCRIPTION:Agenda and notes')
  })

  it('adds a VALARM when a reminder is configured', () => {
    const event = buildEvent(baseEvent, { now: NOW })
    expect(event).toContain(
      'BEGIN:VALARM\r\nTRIGGER:-PT15M\r\nACTION:DISPLAY\r\nDESCRIPTION:Reminder\r\nEND:VALARM',
    )
  })

  it('omits the VALARM when the reminder is disabled', () => {
    const event = buildEvent({ ...baseEvent, reminderMinutes: 0 }, { now: NOW })
    expect(event).not.toContain('BEGIN:VALARM')
  })

  it('escapes separators inside text fields', () => {
    const event = buildEvent(
      { ...baseEvent, title: 'Review; Q4, plan', description: 'a\\b\r\nc' },
      { now: NOW },
    )
    expect(event).toContain('SUMMARY:Review\\; Q4\\, plan\r\n')
    expect(event).toContain('DESCRIPTION:a\\\\b\\nc\r\n')
  })

  it('uses VALUE=DATE and an exclusive end date for all-day events', () => {
    const event = buildEvent(
      { ...baseEvent, start: '2026-11-10T14:00', end: '2026-11-10T15:00', isAllDay: true },
      { now: NOW },
    )
    expect(event).toContain('DTSTART;VALUE=DATE:20261110\r\n')
    expect(event).toContain('DTEND;VALUE=DATE:20261111\r\n')
    expect(event).not.toContain('DTSTART:')
  })

  it('throws when the event ends before it starts', () => {
    expect(() =>
      buildEvent({ ...baseEvent, end: '2026-11-10T13:00' }, { now: NOW }),
    ).toThrowError(/earlier than start/)
    expect(() =>
      buildEvent({ ...baseEvent, isAllDay: true, end: '2026-11-09T00:00' }, { now: NOW }),
    ).toThrowError(/earlier than start/)
  })

  it('throws for missing titles and malformed times', () => {
    expect(() => buildEvent({ ...baseEvent, title: '   ' }, { now: NOW })).toThrowError(
      /title is required/,
    )
    expect(() => buildEvent({ ...baseEvent, title: 'x', start: '' }, { now: NOW })).toThrowError(
      /start time is required|Invalid event start time/,
    )
  })
})

describe('buildCalendar', () => {
  it('wraps events in a VCALENDAR with VERSION and PRODID', () => {
    const calendar = buildCalendar([baseEvent], { now: NOW })
    expect(calendar.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:')).toBe(true)
    expect(calendar.endsWith('END:VCALENDAR\r\n')).toBe(true)
    expect(calendar).toContain('BEGIN:VEVENT')
    expect(calendar).toContain('END:VEVENT')
  })

  it('emits one VEVENT per input event', () => {
    const calendar = buildCalendar(
      [
        baseEvent,
        { ...baseEvent, title: 'Second' },
        { ...baseEvent, title: 'Third' },
      ],
      { now: NOW },
    )
    expect(calendar.match(/BEGIN:VEVENT/g)).toHaveLength(3)
    expect(calendar.match(/END:VEVENT/g)).toHaveLength(3)
  })

  it('uses unique UIDs for multiple events', () => {
    const calendar = buildCalendar([baseEvent, { ...baseEvent, title: 'Second' }], { now: NOW })
    const uids = calendar.split('\r\n').filter((line) => line.startsWith('UID:'))
    expect(uids).toHaveLength(2)
    expect(new Set(uids).size).toBe(2)
  })

  it('throws when there are no events', () => {
    expect(() => buildCalendar([])).toThrowError(/At least one event/)
  })
})
