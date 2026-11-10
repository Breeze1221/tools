import { describe, expect, it } from 'vitest'

import {
  convertAll,
  detectBase,
  formatInBase,
  formatThousands,
  groupBinary,
  parseInBase,
} from '@/tools/development/number-base-converter/number-base-converter.service'

describe('number-base-converter service', () => {
  describe('parseInBase', () => {
    it('parses a decimal string', () => {
      expect(parseInBase('255', 10)).toBe(255n)
    })

    it('parses strings with prefixes and underscores', () => {
      expect(parseInBase('0xFF', 16)).toBe(255n)
      expect(parseInBase('0b1010', 2)).toBe(10n)
      expect(parseInBase('0o17', 8)).toBe(15n)
      expect(parseInBase('1_000', 10)).toBe(1000n)
    })

    it('is case insensitive', () => {
      expect(parseInBase('ff', 16)).toBe(255n)
      expect(parseInBase('0XFF', 16)).toBe(255n)
      expect(parseInBase('ZZ', 36)).toBe(1295n)
    })

    it('parses negative numbers', () => {
      expect(parseInBase('-1010', 2)).toBe(-10n)
    })

    it('throws for invalid digits', () => {
      expect(() => parseInBase('12G', 16)).toThrow()
      expect(() => parseInBase('102', 2)).toThrow()
    })

    it('throws when the base is out of range', () => {
      expect(() => parseInBase('10', 1)).toThrow()
      expect(() => parseInBase('10', 37)).toThrow()
    })

    it('throws for empty input', () => {
      expect(() => parseInBase('', 10)).toThrow()
      expect(() => parseInBase('  ', 10)).toThrow()
    })
  })

  describe('formatInBase', () => {
    it('formats bigint values in the requested base', () => {
      expect(formatInBase(255n, 2)).toBe('11111111')
      expect(formatInBase(255n, 16)).toBe('FF')
      expect(formatInBase(-255n, 8)).toBe('-377')
    })
  })

  describe('detectBase', () => {
    it('detects prefixes', () => {
      expect(detectBase('0b1010')).toBe(2)
      expect(detectBase('0o17')).toBe(8)
      expect(detectBase('0xFF')).toBe(16)
    })

    it('defaults to decimal without a prefix', () => {
      expect(detectBase('123')).toBe(10)
      expect(detectBase('-42')).toBe(10)
    })

    it('throws for empty input', () => {
      expect(() => detectBase('')).toThrow()
      expect(detectBase('0x')).toBe(16)
    })
  })

  describe('convertAll', () => {
    it('converts decimal to every output base', () => {
      expect(convertAll('255', 10)).toEqual({
        '2': '11111111',
        '8': '377',
        '10': '255',
        '16': 'FF',
        '36': '73',
      })
    })

    it('accepts a hexadecimal input with prefix', () => {
      expect(convertAll('0xFF', 16)['10']).toBe('255')
    })

    it('keeps the sign for negative numbers', () => {
      const result = convertAll('-10', 10)
      expect(result['2']).toBe('-1010')
      expect(result['10']).toBe('-10')
    })

    it('keeps precision for numbers beyond Number.MAX_SAFE_INTEGER', () => {
      const big = 2n ** 100n
      const result = convertAll(big.toString(), 10)
      expect(result['16']).toBe(`1${'0'.repeat(25)}`)
      expect(result['2']).toBe(`1${'0'.repeat(100)}`)
    })

    it('throws for empty or invalid input', () => {
      expect(() => convertAll('', 10)).toThrow()
      expect(() => convertAll('xyz', 10)).toThrow()
      expect(() => convertAll('10', 0)).toThrow()
      expect(() => convertAll('10', 37)).toThrow()
    })
  })

  describe('groupBinary', () => {
    it('groups bits in blocks of four from the right', () => {
      expect(groupBinary('11110000')).toBe('1111 0000')
      expect(groupBinary('10101')).toBe('1 0101')
    })

    it('keeps the sign for negative binaries', () => {
      expect(groupBinary('-11110000')).toBe('-1111 0000')
    })

    it('throws for non-binary characters', () => {
      expect(() => groupBinary('1021')).toThrow()
    })
  })

  describe('formatThousands', () => {
    it('inserts thousand separators', () => {
      expect(formatThousands('1234567')).toBe('1,234,567')
      expect(formatThousands('-1234')).toBe('-1,234')
      expect(formatThousands('999')).toBe('999')
    })
  })
})
