import { describe, expect, it } from 'vitest'

import { identifyHash } from '@/tools/crypto/hash-identifier/hash-identifier.service'

const MD5_HEX = 'd41d8cd98f00b204e9800998ecf8427e'
const BCRYPT_HASH = '$2a$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW'

describe('hash-identifier service', () => {
  describe('modular crypt formats', () => {
    it('identifies bcrypt', () => {
      expect(identifyHash(BCRYPT_HASH)).toEqual([
        { algorithm: 'bcrypt', confidence: 'high', reason: 'bcrypt-prefix' },
      ])
    })

    it('identifies Argon2 variants', () => {
      expect(identifyHash('$argon2id$v=19$m=65536,t=3,p=4$c2FsdA$aGFzaA')[0]?.algorithm).toBe(
        'Argon2',
      )
      expect(identifyHash('$argon2i$v=19$m=4096,t=3,p=1$c2FsdA$aGFzaA')[0]?.reason).toBe(
        'argon2-prefix',
      )
    })

    it('identifies PBKDF2 in passlib and Django spellings', () => {
      expect(identifyHash('$pbkdf2-sha256$29000$c2FsdA$aGFzaA')[0]?.algorithm).toBe('PBKDF2')
      expect(identifyHash('pbkdf2_sha256$260000$c2FsdA$aGFzaA')[0]?.algorithm).toBe('PBKDF2')
    })
  })

  describe('hex digests', () => {
    it('identifies CRC32', () => {
      expect(identifyHash('a1b2c3d4')).toEqual([
        { algorithm: 'CRC32', confidence: 'high', reason: 'hex-8' },
      ])
    })

    it('offers MD5 and NTLM for 32 hex characters', () => {
      const candidates = identifyHash(MD5_HEX)
      expect(candidates.map((item) => item.algorithm)).toEqual(['MD5', 'NTLM'])
      expect(candidates[0]?.confidence).toBe('high')
      expect(candidates[1]?.confidence).toBe('medium')
    })

    it('identifies every SHA digest length', () => {
      expect(identifyHash('a'.repeat(40))[0]?.algorithm).toBe('SHA-1')
      expect(identifyHash('a'.repeat(56))[0]?.algorithm).toBe('SHA-224')
      expect(identifyHash('a'.repeat(64))[0]?.algorithm).toBe('SHA-256')
      expect(identifyHash('a'.repeat(96))[0]?.algorithm).toBe('SHA-384')
      expect(identifyHash('a'.repeat(128))[0]?.algorithm).toBe('SHA-512')
    })

    it('accepts uppercase hex', () => {
      expect(identifyHash(MD5_HEX.toUpperCase()).map((item) => item.algorithm)).toEqual([
        'MD5',
        'NTLM',
      ])
    })

    it('ignores surrounding whitespace', () => {
      expect(identifyHash(`  ${MD5_HEX}\n`)[0]?.algorithm).toBe('MD5')
    })
  })

  describe('base64', () => {
    it('suggests Base64 with low confidence when it decodes', () => {
      expect(identifyHash('aGVsbG8gd29ybGQ=')).toEqual([
        { algorithm: 'Base64', confidence: 'low', reason: 'base64' },
      ])
    })

    it('does not add a Base64 candidate for hex digests', () => {
      expect(identifyHash(MD5_HEX).some((item) => item.algorithm === 'Base64')).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('returns nothing for empty input', () => {
      expect(identifyHash('')).toEqual([])
      expect(identifyHash('   ')).toEqual([])
    })

    it('returns nothing for unknown formats', () => {
      expect(identifyHash('not-a-hash!')).toEqual([])
      expect(identifyHash('hello world')).toEqual([])
    })

    it('returns nothing for an unsupported hex length', () => {
      expect(identifyHash('abcdef')).toEqual([])
    })
  })
})
