import { describe, expect, it } from 'vitest'

import {
  jsonArrayToJsonl,
  jsonlToJsonArray,
  validateJsonl,
} from '@/tools/development/jsonl-converter/jsonl-converter.service'

describe('jsonl-converter service', () => {
  describe('jsonArrayToJsonl', () => {
    it('writes one object per line', () => {
      const input = JSON.stringify([{ id: 1 }, { id: 2 }, { id: 3 }])
      const output = jsonArrayToJsonl(input)

      expect(output.split('\n')).toHaveLength(3)
      expect(output.split('\n')[0]).toBe('{"id":1}')
      expect(output.split('\n')[2]).toBe('{"id":3}')
    })

    it('keeps nested values on a single line when pretty is enabled', () => {
      const output = jsonArrayToJsonl('[{"a":{"b":[1,2]}}]', true)

      expect(output.split('\n')).toHaveLength(1)
      expect(JSON.parse(output)).toEqual({ a: { b: [1, 2] } })
    })

    it('returns an empty string for an empty array', () => {
      expect(jsonArrayToJsonl('[]')).toBe('')
    })

    it('throws for non-array JSON', () => {
      expect(() => jsonArrayToJsonl('{"a":1}')).toThrow('Input JSON must be an array')
      expect(() => jsonArrayToJsonl('"text"')).toThrow('Input JSON must be an array')
      expect(() => jsonArrayToJsonl('42')).toThrow('Input JSON must be an array')
    })

    it('throws for invalid JSON and empty input', () => {
      expect(() => jsonArrayToJsonl('[{]')).toThrow('Input is not valid JSON')
      expect(() => jsonArrayToJsonl('')).toThrow('Input is empty')
      expect(() => jsonArrayToJsonl('   ')).toThrow('Input is empty')
    })
  })

  describe('jsonlToJsonArray', () => {
    it('parses each line into an array', () => {
      const result = jsonlToJsonArray('{"a":1}\n{"a":2}')

      expect(result.errors).toEqual([])
      expect(result.validCount).toBe(2)
      expect(JSON.parse(result.json)).toEqual([{ a: 1 }, { a: 2 }])
    })

    it('round-trips an array through JSONL and back', () => {
      const original = [{ id: 1, tags: ['a'] }, { id: 2, ok: true }, null]
      const result = jsonlToJsonArray(jsonArrayToJsonl(JSON.stringify(original)))

      expect(result.errors).toEqual([])
      expect(JSON.parse(result.json)).toEqual(original)
    })

    it('ignores blank lines', () => {
      const result = jsonlToJsonArray('\n{"a":1}\n\n   \n{"b":2}\n')

      expect(result.lineCount).toBe(2)
      expect(result.validCount).toBe(2)
      expect(result.errorCount).toBe(0)
      expect(JSON.parse(result.json)).toEqual([{ a: 1 }, { b: 2 }])
    })

    it('reports the original line number of invalid lines', () => {
      const result = jsonlToJsonArray('{"a":1}\n\n{bad}\n{"c":3}')

      expect(result.errorCount).toBe(1)
      expect(result.errors[0]?.line).toBe(3)
      expect(result.errors[0]?.message).toBeTruthy()
      expect(result.validCount).toBe(2)
      expect(JSON.parse(result.json)).toEqual([{ a: 1 }, { c: 3 }])
    })

    it('warns about non-object lines but keeps them', () => {
      const result = jsonlToJsonArray('{"a":1}\n42\n"text"\n[1,2]')

      expect(result.errors).toEqual([])
      expect(result.warnings.map((warning) => warning.line)).toEqual([2, 3, 4])
      expect(JSON.parse(result.json)).toEqual([{ a: 1 }, 42, 'text', [1, 2]])
    })

    it('supports pretty indentation', () => {
      const compact = jsonlToJsonArray('{"a":1}').json
      const pretty = jsonlToJsonArray('{"a":1}', true).json

      expect(compact).toBe('[{"a":1}]')
      expect(pretty).toContain('\n  ')
      expect(JSON.parse(pretty)).toEqual([{ a: 1 }])
    })

    it('throws for empty input', () => {
      expect(() => jsonlToJsonArray('')).toThrow('Input is empty')
      expect(() => jsonlToJsonArray(' \n ')).toThrow('Input is empty')
    })
  })

  describe('validateJsonl', () => {
    it('counts valid and invalid lines', () => {
      const result = validateJsonl('{"a":1}\n{bad}\n{"b":2}')

      expect(result.lineCount).toBe(3)
      expect(result.validCount).toBe(2)
      expect(result.errorCount).toBe(1)
      expect(result.errors[0]?.line).toBe(2)
    })

    it('returns zeroed stats for empty input', () => {
      expect(validateJsonl('')).toEqual({
        lineCount: 0,
        validCount: 0,
        errorCount: 0,
        errors: [],
        warnings: [],
      })
    })
  })
})
