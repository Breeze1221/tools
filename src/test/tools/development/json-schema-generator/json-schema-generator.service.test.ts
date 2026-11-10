import { describe, expect, it } from 'vitest'

import {
  generateJsonSchema,
  inferJsonSchema,
  type JsonSchemaDraft,
} from '@/tools/development/json-schema-generator/json-schema-generator.service'

describe('json-schema-generator service', () => {
  describe('inferJsonSchema', () => {
    it('infers nested objects and required keys', () => {
      const schema = inferJsonSchema({
        id: 1,
        user: { name: 'Ada', email: 'ada@example.com' },
      })

      expect(schema).toMatchObject({
        type: 'object',
        required: ['id', 'user'],
        properties: {
          id: { type: 'integer' },
          user: {
            type: 'object',
            required: ['name', 'email'],
            properties: {
              name: { type: 'string' },
              email: { type: 'string', format: 'email' },
            },
          },
        },
      })
    })

    it('omits required when the option is disabled', () => {
      const schema = inferJsonSchema({ a: 'x' }, { required: false })

      expect(schema).toMatchObject({ type: 'object', properties: { a: { type: 'string' } } })
      expect(schema.required).toBeUndefined()
    })

    it('returns properties only for an empty object', () => {
      const schema = inferJsonSchema({})

      expect(schema).toMatchObject({ type: 'object', properties: {} })
      expect(schema.required).toBeUndefined()
    })

    it('merges homogeneous arrays into a single items schema', () => {
      const schema = inferJsonSchema([1, 2, 3])

      expect(schema).toMatchObject({ type: 'array', items: { type: 'integer' } })
    })

    it('uses anyOf for heterogeneous arrays', () => {
      const schema = inferJsonSchema([1, 'a', true, 2])

      expect(schema).toMatchObject({
        type: 'array',
        items: {
          anyOf: [{ type: 'integer' }, { type: 'string' }, { type: 'boolean' }],
        },
      })
    })

    it('uses an empty items schema for an empty array', () => {
      expect(inferJsonSchema([])).toMatchObject({ type: 'array', items: {} })
    })

    it('detects common string formats', () => {
      expect(inferJsonSchema('ada@example.com')).toMatchObject({ format: 'email' })
      expect(inferJsonSchema('2026-11-10T08:00:00Z')).toMatchObject({ format: 'date-time' })
      expect(inferJsonSchema('https://example.com/a')).toMatchObject({ format: 'uri' })
      expect(inferJsonSchema('192.168.0.1')).toMatchObject({ format: 'ipv4' })
      expect(inferJsonSchema('plain text')).toMatchObject({ type: 'string' })
    })

    it('distinguishes integers, numbers, booleans and null', () => {
      expect(inferJsonSchema(42)).toMatchObject({ type: 'integer' })
      expect(inferJsonSchema(4.2)).toMatchObject({ type: 'number' })
      expect(inferJsonSchema(true)).toMatchObject({ type: 'boolean' })
      expect(inferJsonSchema(null)).toMatchObject({ type: 'null' })
    })

    it('switches the $schema URI with the draft', () => {
      expect(inferJsonSchema({}, { draft: 'draft-07' }).$schema).toBe(
        'http://json-schema.org/draft-07/schema#',
      )
      expect(inferJsonSchema({}, { draft: '2020-12' }).$schema).toBe(
        'https://json-schema.org/draft/2020-12/schema',
      )
    })

    it('throws for an unsupported draft', () => {
      expect(() => inferJsonSchema({}, { draft: 'draft-04' as JsonSchemaDraft })).toThrow(
        'Unsupported JSON Schema draft',
      )
    })
  })

  describe('generateJsonSchema', () => {
    it('parses JSON and returns formatted output', () => {
      const output = generateJsonSchema('{"id":1}')
      const parsed: unknown = JSON.parse(output)

      expect(parsed).toMatchObject({
        type: 'object',
        properties: { id: { type: 'integer' } },
      })
      expect(output).toContain('\n  ')
    })

    it('throws for empty or invalid JSON input', () => {
      expect(() => generateJsonSchema('')).toThrow('Input is empty')
      expect(() => generateJsonSchema('   ')).toThrow('Input is empty')
      expect(() => generateJsonSchema('{oops}')).toThrow('Input is not valid JSON')
    })
  })
})
