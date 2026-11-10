import { describe, expect, it } from 'vitest'

import {
  escapeCsvCell,
  fakeDataFields,
  generateRecord,
  generateRecords,
} from '@/tools/development/fake-data-generator/fake-data-generator.service'

describe('fakeDataFields', () => {
  it('exposes at least fourteen distinct fields', () => {
    expect(fakeDataFields.length).toBeGreaterThanOrEqual(14)
    expect(new Set(fakeDataFields).size).toBe(fakeDataFields.length)
  })
})

describe('generateRecord', () => {
  it('fills every requested field', () => {
    const record = generateRecord(['id', 'email', 'city', 'price', 'boolean'])
    expect(Object.keys(record)).toStrictEqual(['id', 'email', 'city', 'price', 'boolean'])
    expect(record.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    )
    expect(String(record.email)).toContain('@')
    expect(typeof record.city).toBe('string')
    expect(typeof record.price).toBe('number')
    expect(typeof record.boolean).toBe('boolean')
  })

  it('throws when no field is selected', () => {
    expect(() => generateRecord([])).toThrow('No fields selected')
  })

  it('throws on an unknown field', () => {
    expect(() => generateRecord(['id', 'nope'])).toThrow('Unknown field: nope')
  })
})

describe('generateRecords', () => {
  it('produces the requested number of JSON records', () => {
    const output = generateRecords({
      fields: ['id', 'firstName'],
      count: 5,
      format: 'json',
      header: false,
    })
    const records = JSON.parse(output) as Record<string, unknown>[]
    expect(records).toHaveLength(5)
    expect(records[0]).toHaveProperty('id')
    expect(records[0]).toHaveProperty('firstName')
  })

  it('emits a CSV header when requested', () => {
    const output = generateRecords({
      fields: ['id', 'email'],
      count: 3,
      format: 'csv',
      header: true,
    })
    const lines = output.split('\n')
    expect(lines[0]).toBe('id,email')
    expect(lines).toHaveLength(4)
  })

  it('omits the CSV header when disabled', () => {
    const output = generateRecords({
      fields: ['id'],
      count: 2,
      format: 'csv',
      header: false,
    })
    expect(output.split('\n')).toHaveLength(2)
  })

  it('quotes CSV cells that contain commas', () => {
    const output = generateRecords({
      fields: ['address'],
      count: 3,
      format: 'csv',
      header: false,
    })
    for (const line of output.split('\n')) {
      expect(line.startsWith('"')).toBe(true)
      expect(line.endsWith('"')).toBe(true)
    }
  })

  it('throws when no field is selected', () => {
    expect(() => generateRecords({ fields: [], count: 1, format: 'json', header: false })).toThrow(
      'No fields selected',
    )
  })

  it('throws when count is out of range', () => {
    const base = { fields: ['id'], format: 'json', header: false } as const
    expect(() => generateRecords({ ...base, count: 0 })).toThrow('Count must be between')
    expect(() => generateRecords({ ...base, count: 501 })).toThrow('Count must be between')
    expect(() => generateRecords({ ...base, count: 1.5 })).toThrow('Count must be between')
  })
})

describe('escapeCsvCell', () => {
  it('keeps plain values untouched', () => {
    expect(escapeCsvCell('plain')).toBe('plain')
    expect(escapeCsvCell(42)).toBe('42')
  })

  it('wraps values with commas, quotes or newlines', () => {
    expect(escapeCsvCell('a,b')).toBe('"a,b"')
    expect(escapeCsvCell('say "hi"')).toBe('"say ""hi"""')
    expect(escapeCsvCell('line1\nline2')).toBe('"line1\nline2"')
  })
})
