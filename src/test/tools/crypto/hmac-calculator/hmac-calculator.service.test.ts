import { describe, expect, it } from 'vitest'

import {
  computeHmac,
  matchesExpected,
  parseKeyInput,
  toBase64Url,
} from '@/tools/crypto/hmac-calculator/hmac-calculator.service'

const RFC_MESSAGE = 'The quick brown fox jumps over the lazy dog'
const RFC_DIGEST = 'f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8'

describe('hmac-calculator service', () => {
  describe('parseKeyInput', () => {
    it('encodes text as UTF-8 bytes', () => {
      expect(Array.from(parseKeyInput('key', 'text'))).toEqual([107, 101, 121])
    })

    it('parses hex with optional whitespace and colons', () => {
      expect(Array.from(parseKeyInput('00:ff 10', 'hex'))).toEqual([0, 255, 16])
    })

    it('parses base64', () => {
      expect(Array.from(parseKeyInput('a2V5', 'base64'))).toEqual([107, 101, 121])
    })

    it('throws for invalid hex', () => {
      expect(() => parseKeyInput('zz', 'hex')).toThrow(/hex/)
    })

    it('throws for an odd number of hex digits', () => {
      expect(() => parseKeyInput('abc', 'hex')).toThrow(/even/)
    })

    it('throws for invalid base64', () => {
      expect(() => parseKeyInput('!!!!', 'base64')).toThrow(/base64/)
    })
  })

  describe('computeHmac', () => {
    it('matches the RFC 4231 HMAC-SHA256 vector', async () => {
      await expect(
        computeHmac(RFC_MESSAGE, parseKeyInput('key', 'text'), 'SHA-256', 'hex'),
      ).resolves.toBe(RFC_DIGEST)
    })

    it('returns base64 output', async () => {
      await expect(
        computeHmac(RFC_MESSAGE, parseKeyInput('key', 'text'), 'SHA-256', 'base64'),
      ).resolves.toBe('97yD9DBThCSxMpjmqm+xQ+9NWaFJRhdZl0edvC0aPNg=')
    })

    it('returns unpadded base64url without +, / or =', async () => {
      const digest = await computeHmac(
        RFC_MESSAGE,
        parseKeyInput('key', 'text'),
        'SHA-256',
        'base64url',
      )
      expect(digest).toBe('97yD9DBThCSxMpjmqm-xQ-9NWaFJRhdZl0edvC0aPNg')
      expect(digest).not.toMatch(/[+/=]/)
    })

    it('supports every advertised algorithm', async () => {
      const key = parseKeyInput('key', 'text')
      for (const algorithm of ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'] as const) {
        const digest = await computeHmac(RFC_MESSAGE, key, algorithm, 'hex')
        expect(digest).toMatch(/^[0-9a-f]+$/)
      }
    })

    it('rejects an unknown algorithm', async () => {
      await expect(
        computeHmac(RFC_MESSAGE, parseKeyInput('key', 'text'), 'MD5' as never, 'hex'),
      ).rejects.toThrow(/Unsupported HMAC algorithm/)
    })

    it('rejects an empty key', async () => {
      await expect(computeHmac(RFC_MESSAGE, new Uint8Array(0), 'SHA-256', 'hex')).rejects.toThrow(
        /must not be empty/,
      )
    })
  })

  describe('toBase64Url', () => {
    it('replaces +, / and strips padding', () => {
      expect(toBase64Url(new Uint8Array([0xfb, 0xff]))).toBe('-_8')
    })
  })

  describe('matchesExpected', () => {
    it('returns null when nothing was entered', () => {
      expect(matchesExpected(RFC_DIGEST, '   ')).toBeNull()
    })

    it('ignores case and whitespace', () => {
      expect(matchesExpected(RFC_DIGEST, `  ${RFC_DIGEST.toUpperCase()}  `)).toBe(true)
    })

    it('returns false for a different digest', () => {
      expect(matchesExpected(RFC_DIGEST, RFC_DIGEST.replace('f7bc', '0000'))).toBe(false)
    })
  })
})
