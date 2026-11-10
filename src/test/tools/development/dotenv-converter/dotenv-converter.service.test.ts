import { describe, expect, it } from 'vitest'

import {
  convertEnvFormat,
  parseDotenv,
  serializeDotenv,
} from '@/tools/development/dotenv-converter/dotenv-converter.service'

describe('dotenv-converter service', () => {
  describe('parseDotenv', () => {
    it('parses basic key/value pairs', () => {
      const result = parseDotenv('FOO=bar\nBAZ=qux')
      expect(result.values).toEqual({ FOO: 'bar', BAZ: 'qux' })
      expect(result.errors).toEqual([])
      expect(result.warnings).toEqual([])
    })

    it('strips the export prefix', () => {
      const result = parseDotenv('export FOO=bar\nexport\tBAZ=qux')
      expect(result.values).toEqual({ FOO: 'bar', BAZ: 'qux' })
      expect(result.errors).toEqual([])
    })

    it('skips comments and blank lines and strips trailing comments', () => {
      const result = parseDotenv('# leading comment\n\nA=1 # note\nB=#hash\nC=2#not-comment')
      expect(result.values).toEqual({ A: '1', B: '#hash', C: '2#not-comment' })
      expect(result.errors).toEqual([])
    })

    it('decodes escapes inside double quotes', () => {
      const result = parseDotenv('A="line\\nbreak\\t\\"quote\\"\\\\end"')
      expect(result.values.A).toBe('line\nbreak\t"quote"\\end')
      expect(result.errors).toEqual([])
    })

    it('keeps single-quoted values literal', () => {
      const result = parseDotenv("A='raw \\n # hash'")
      expect(result.values.A).toBe('raw \\n # hash')
      expect(result.errors).toEqual([])
    })

    it('warns and keeps the later value when a key repeats', () => {
      const result = parseDotenv('A=1\nA=2')
      expect(result.values.A).toBe('2')
      expect(result.errors).toEqual([])
      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0]?.line).toBe(2)
    })

    it('reports malformed lines and continues parsing', () => {
      const result = parseDotenv('NO_EQUALS\n=value\nBAD KEY=1\nA=1')
      expect(result.values).toEqual({ A: '1' })
      expect(result.errors.map((error) => error.line)).toEqual([1, 2, 3])
    })

    it('reports unterminated quotes', () => {
      expect(parseDotenv('A="oops').errors).toHaveLength(1)
      expect(parseDotenv("A='oops").errors).toHaveLength(1)
    })

    it('returns empty values for empty input', () => {
      expect(parseDotenv('')).toEqual({ values: {}, errors: [], warnings: [] })
    })
  })

  describe('serializeDotenv', () => {
    it('quotes and escapes values that need it', () => {
      const text = serializeDotenv({
        PLAIN: 'value',
        SPACED: 'two words',
        HASH: 'a#b',
        QUOTE: 'say "hi"',
        MULTI: 'line1\nline2',
        SLASH: 'C:\\path',
        SINGLE: "it's",
      })
      expect(text).toContain('PLAIN=value')
      expect(text).toContain('SPACED="two words"')
      expect(text).toContain('HASH="a#b"')
      expect(text).toContain('QUOTE="say \\"hi\\""')
      expect(text).toContain('MULTI="line1\\nline2"')
      expect(text).toContain('SLASH="C:\\\\path"')
      expect(text).toContain('SINGLE="it\'s"')
    })

    it('returns an empty string for an empty map', () => {
      expect(serializeDotenv({})).toBe('')
    })

    it('round-trips through parseDotenv', () => {
      const values = {
        A: '1',
        B: 'two words',
        C: 'line1\nline2',
        D: 'say "hi"',
        E: 'a#b',
        F: 'C:\\path',
        G: '',
      }
      const result = parseDotenv(serializeDotenv(values))
      expect(result.errors).toEqual([])
      expect(result.values).toEqual(values)
    })
  })

  describe('convertEnvFormat', () => {
    it('converts env to json', () => {
      const json = convertEnvFormat('A=1\nB=two words', 'env', 'json')
      expect(JSON.parse(json)).toEqual({ A: '1', B: 'two words' })
    })

    it('converts json to env', () => {
      expect(convertEnvFormat('{"A":"1","B":"two words"}', 'json', 'env')).toBe(
        'A=1\nB="two words"',
      )
    })

    it('round-trips yaml', () => {
      const yaml = convertEnvFormat('A=1\nB="two words"', 'env', 'yaml')
      expect(yaml).toContain('A: "1"')
      expect(convertEnvFormat(yaml, 'yaml', 'env')).toBe('A=1\nB="two words"')
    })

    it('keeps nested structures between json and yaml', () => {
      const yaml = convertEnvFormat('{"app":{"port":3000}}', 'json', 'yaml')
      expect(yaml).toContain('port: 3000')
    })

    it('returns empty output for blank input', () => {
      expect(convertEnvFormat('   \n', 'json', 'yaml')).toBe('')
      expect(convertEnvFormat('', 'env', 'json')).toBe('')
    })

    it('throws on invalid json', () => {
      expect(() => convertEnvFormat('{"a":', 'json', 'env')).toThrow(/Invalid JSON input/)
      expect(() => convertEnvFormat('[1,2]', 'json', 'env')).toThrow(/must be an object/)
    })

    it('throws on invalid env input', () => {
      expect(() => convertEnvFormat('NO_EQUALS', 'env', 'json')).toThrow(
        /Invalid \.env input at line 1/,
      )
    })
  })
})
