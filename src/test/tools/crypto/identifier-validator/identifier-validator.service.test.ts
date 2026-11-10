import { describe, expect, it } from 'vitest'

import {
  detectCardBrand,
  luhnCheck,
  normalizeIdentifier,
  validateIban,
  validateIdentifier,
  validateIsbn10,
  validateIsbn13,
} from '@/tools/crypto/identifier-validator/identifier-validator.service'

const VALID_VISA = '4111111111111111'
const VALID_IBAN = 'GB82 WEST 1234 5698 7654 32'
const VALID_ISBN_10 = '0-306-40615-2'
const VALID_ISBN_13 = '978-0-306-40615-7'
const VALID_IMEI = '356938035643809'

describe('identifier-validator service', () => {
  describe('normalizeIdentifier', () => {
    it('strips whitespace and hyphens and uppercases', () => {
      expect(normalizeIdentifier(' gb82 west-1234 ')).toBe('GB82WEST1234')
    })
  })

  describe('luhnCheck', () => {
    it('accepts a valid Visa number with spaces', () => {
      expect(luhnCheck('4111 1111 1111 1111')).toBe(true)
    })

    it('accepts a valid IMEI', () => {
      expect(luhnCheck(VALID_IMEI)).toBe(true)
    })

    it('rejects a wrong check digit', () => {
      expect(luhnCheck('4111111111111112')).toBe(false)
    })

    it('rejects an empty string', () => {
      expect(luhnCheck('')).toBe(false)
    })

    it('rejects non-digit characters', () => {
      expect(luhnCheck('4111-abcd')).toBe(false)
    })
  })

  describe('detectCardBrand', () => {
    it('detects the common brands', () => {
      expect(detectCardBrand(VALID_VISA)).toBe('visa')
      expect(detectCardBrand('5555555555554444')).toBe('mastercard')
      expect(detectCardBrand('2221000000000009')).toBe('mastercard')
      expect(detectCardBrand('378282246310005')).toBe('amex')
      expect(detectCardBrand('6011111111111117')).toBe('discover')
      expect(detectCardBrand('3530111333300000')).toBe('jcb')
      expect(detectCardBrand('30569309025904')).toBe('diners-club')
      expect(detectCardBrand('6200000000000000')).toBe('unionpay')
    })

    it('returns null for unknown prefixes', () => {
      expect(detectCardBrand('9999999999999999')).toBeNull()
    })

    it('returns null for non-digit input', () => {
      expect(detectCardBrand('not a card')).toBeNull()
    })
  })

  describe('validateIban', () => {
    it('accepts a valid GB IBAN with spaces', () => {
      expect(validateIban(VALID_IBAN)).toBe(true)
    })

    it('accepts a valid DE IBAN', () => {
      expect(validateIban('DE89370400440532013000')).toBe(true)
    })

    it('rejects a wrong check digit', () => {
      expect(validateIban('GB82WEST12345698765431')).toBe(false)
    })

    it('rejects empty and malformed input', () => {
      expect(validateIban('')).toBe(false)
      expect(validateIban('GB82')).toBe(false)
      expect(validateIban('not an iban')).toBe(false)
    })
  })

  describe('validateIsbn10', () => {
    it('accepts a valid ISBN-10 with hyphens', () => {
      expect(validateIsbn10(VALID_ISBN_10)).toBe(true)
    })

    it('accepts a trailing X', () => {
      expect(validateIsbn10('123456789X')).toBe(true)
    })

    it('rejects a wrong check digit', () => {
      expect(validateIsbn10('0306406153')).toBe(false)
      expect(validateIsbn10('1234567890')).toBe(false)
    })

    it('rejects empty and wrong lengths', () => {
      expect(validateIsbn10('')).toBe(false)
      expect(validateIsbn10('123456789')).toBe(false)
    })
  })

  describe('validateIsbn13', () => {
    it('accepts a valid ISBN-13 with hyphens', () => {
      expect(validateIsbn13(VALID_ISBN_13)).toBe(true)
    })

    it('rejects a wrong check digit', () => {
      expect(validateIsbn13('9780306406158')).toBe(false)
    })

    it('rejects a non-978/979 prefix', () => {
      expect(validateIsbn13('1234567890128')).toBe(false)
    })

    it('rejects empty input', () => {
      expect(validateIsbn13('')).toBe(false)
    })
  })

  describe('validateIdentifier', () => {
    it('returns an empty list for empty input', () => {
      expect(validateIdentifier('')).toEqual([])
      expect(validateIdentifier('   ')).toEqual([])
    })

    it('recognises a valid Visa card', () => {
      const [card] = validateIdentifier('4111 1111 1111 1111')
      expect(card).toEqual({
        kind: 'credit-card',
        valid: true,
        normalized: VALID_VISA,
        brand: 'visa',
      })
    })

    it('recognises an invalid card', () => {
      const [card] = validateIdentifier('4111111111111112')
      expect(card?.kind).toBe('credit-card')
      expect(card?.valid).toBe(false)
    })

    it('recognises an IBAN', () => {
      const iban = validateIdentifier(VALID_IBAN).find((item) => item.kind === 'iban')
      expect(iban?.valid).toBe(true)
      expect(iban?.normalized).toBe('GB82WEST12345698765432')
    })

    it('recognises an ISBN-10', () => {
      const isbn = validateIdentifier(VALID_ISBN_10).find((item) => item.kind === 'isbn-10')
      expect(isbn?.valid).toBe(true)
    })

    it('recognises an ISBN-13', () => {
      const isbn = validateIdentifier(VALID_ISBN_13).find((item) => item.kind === 'isbn-13')
      expect(isbn?.valid).toBe(true)
    })

    it('offers both card and IMEI interpretations for 15 digits', () => {
      const kinds = validateIdentifier(VALID_IMEI).map((item) => item.kind)
      expect(kinds).toContain('credit-card')
      expect(kinds).toContain('imei')
    })

    it('marks unrecognised input as invalid', () => {
      expect(validateIdentifier('hello!')).toEqual([
        { kind: 'unknown', valid: false, normalized: 'HELLO!' },
      ])
      expect(validateIdentifier('1234')).toEqual([
        { kind: 'unknown', valid: false, normalized: '1234' },
      ])
    })
  })
})
