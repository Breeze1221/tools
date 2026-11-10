import { describe, expect, it } from 'vitest'

import {
  generateTypes,
  type GenerateTypesOptions,
} from '@/tools/development/json-to-typescript/json-to-typescript.service'

const interfaceOptions: GenerateTypesOptions = {
  mode: 'interface',
  rootName: 'Root',
  exportKeyword: true,
}

describe('generateTypes', () => {
  it('generates an interface for a flat object', () => {
    expect(generateTypes('{"id":1,"name":"Ada","active":true}', interfaceOptions)).toBe(
      ['export interface Root {', '  id: number', '  name: string', '  active: boolean', '}'].join(
        '\n',
      ),
    )
  })

  it('generates named interfaces for nested objects', () => {
    expect(generateTypes('{"user":{"id":1,"address":{"city":"Paris"}}}', interfaceOptions)).toBe(
      [
        'export interface Root {',
        '  user: User',
        '}',
        '',
        'export interface User {',
        '  id: number',
        '  address: Address',
        '}',
        '',
        'export interface Address {',
        '  city: string',
        '}',
      ].join('\n'),
    )
  })

  it('unions array element types and deduplicates them', () => {
    expect(generateTypes('{"values":[1,"a",null,1]}', interfaceOptions)).toBe(
      ['export interface Root {', '  values: (number | string | null)[]', '}'].join('\n'),
    )
  })

  it('creates a union of named types for an array of objects', () => {
    expect(generateTypes('{"items":[{"a":1},{"b":"x"}]}', interfaceOptions)).toBe(
      [
        'export interface Root {',
        '  items: (Items | Items2)[]',
        '}',
        '',
        'export interface Items {',
        '  a: number',
        '}',
        '',
        'export interface Items2 {',
        '  b: string',
        '}',
      ].join('\n'),
    )
  })

  it('keeps null merged with other types', () => {
    expect(generateTypes('{"deletedAt":null}', interfaceOptions)).toBe(
      ['export interface Root {', '  deletedAt: null', '}'].join('\n'),
    )
  })

  it('quotes property keys that are not valid identifiers', () => {
    expect(generateTypes('{"first-name":"Ada","123":"x"}', interfaceOptions)).toBe(
      ['export interface Root {', "  '123': string", "  'first-name': string", '}'].join('\n'),
    )
  })

  it('maps an empty object to Record<string, never>', () => {
    expect(generateTypes('{}', interfaceOptions)).toBe('export type Root = Record<string, never>')
  })

  it('maps an empty array to unknown[]', () => {
    expect(generateTypes('{"list":[]}', interfaceOptions)).toBe(
      ['export interface Root {', '  list: unknown[]', '}'].join('\n'),
    )
  })

  it('throws Invalid JSON for malformed input', () => {
    expect(() => generateTypes('{', interfaceOptions)).toThrow('Invalid JSON')
  })

  it('generates a zod schema with an inferred type', () => {
    expect(
      generateTypes('{"id":1,"name":"Ada"}', {
        ...interfaceOptions,
        mode: 'zod',
      }),
    ).toBe(
      [
        "import { z } from 'zod'",
        '',
        'export const RootSchema = z.object({',
        '  id: z.number(),',
        '  name: z.string(),',
        '})',
        '',
        'export type Root = z.infer<typeof RootSchema>',
      ].join('\n'),
    )
  })

  it('generates type aliases in type mode', () => {
    expect(
      generateTypes('{"id":1}', {
        ...interfaceOptions,
        mode: 'type',
      }),
    ).toBe(['export type Root = {', '  id: number', '}'].join('\n'))
  })

  it('falls back to a type alias for primitive roots', () => {
    expect(generateTypes('"hello"', interfaceOptions)).toBe('export type Root = string')
    expect(
      generateTypes('"hello"', {
        ...interfaceOptions,
        rootName: 'Greeting',
      }),
    ).toBe('export type Greeting = string')
  })

  it('omits the export keyword when disabled', () => {
    expect(
      generateTypes('{"id":1}', {
        ...interfaceOptions,
        exportKeyword: false,
      }),
    ).toBe(['interface Root {', '  id: number', '}'].join('\n'))
  })

  it('merges duplicate object shapes in arrays into one declaration', () => {
    expect(generateTypes('{"items":[{"id":1},{"id":2}]}', interfaceOptions)).toBe(
      [
        'export interface Root {',
        '  items: Items[]',
        '}',
        '',
        'export interface Items {',
        '  id: number',
        '}',
      ].join('\n'),
    )
  })
})
