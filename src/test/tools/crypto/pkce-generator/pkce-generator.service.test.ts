import { describe, expect, it } from 'vitest'

import {
  buildAuthorizationUrl,
  createCodeChallenge,
  DEFAULT_CODE_VERIFIER_LENGTH,
  generateCodeVerifier,
  isValidCodeVerifier,
} from '@/tools/crypto/pkce-generator/pkce-generator.service'

/** RFC 7636 Appendix B 的示例向量 */
const RFC_VERIFIER = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'
const RFC_CHALLENGE = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM'
const VERIFIER_PATTERN = /^[A-Za-z0-9\-._~]+$/

describe('pkce-generator service', () => {
  describe('generateCodeVerifier', () => {
    it('uses 64 characters by default', () => {
      expect(generateCodeVerifier()).toHaveLength(DEFAULT_CODE_VERIFIER_LENGTH)
    })

    it('accepts the lower and upper length boundaries', () => {
      expect(generateCodeVerifier(43)).toHaveLength(43)
      expect(generateCodeVerifier(128)).toHaveLength(128)
    })

    it('only emits URL-safe unreserved characters', () => {
      expect(generateCodeVerifier(128)).toMatch(VERIFIER_PATTERN)
    })

    it('produces different values on every call', () => {
      expect(generateCodeVerifier()).not.toBe(generateCodeVerifier())
    })

    it('throws below 43 characters', () => {
      expect(() => generateCodeVerifier(42)).toThrow(/length/)
    })

    it('throws above 128 characters', () => {
      expect(() => generateCodeVerifier(129)).toThrow(/length/)
    })

    it('throws for a non-integer length', () => {
      expect(() => generateCodeVerifier(43.5)).toThrow(/length/)
    })
  })

  describe('isValidCodeVerifier', () => {
    it('accepts the RFC example', () => {
      expect(isValidCodeVerifier(RFC_VERIFIER)).toBe(true)
    })

    it('rejects short and illegal values', () => {
      expect(isValidCodeVerifier('too-short')).toBe(false)
      expect(isValidCodeVerifier(`${RFC_VERIFIER}*`)).toBe(false)
    })
  })

  describe('createCodeChallenge', () => {
    it('matches the RFC 7636 S256 vector', async () => {
      await expect(createCodeChallenge(RFC_VERIFIER)).resolves.toBe(RFC_CHALLENGE)
    })

    it('returns the verifier unchanged for plain', async () => {
      await expect(createCodeChallenge(RFC_VERIFIER, 'plain')).resolves.toBe(RFC_VERIFIER)
    })

    it('never emits padding in S256 output', async () => {
      await expect(createCodeChallenge(RFC_VERIFIER, 'S256')).resolves.toMatch(/^[A-Za-z0-9\-_]+$/)
    })

    it('rejects an invalid verifier', async () => {
      await expect(createCodeChallenge('short')).rejects.toThrow(/43–128/)
    })
  })

  describe('buildAuthorizationUrl', () => {
    const baseOptions = {
      authorizationEndpoint: 'https://auth.example.com/oauth/authorize',
      clientId: 'client-123',
      redirectUri: 'https://app.example.com/callback',
      codeChallenge: RFC_CHALLENGE,
    }

    it('adds every required PKCE parameter', () => {
      const url = new URL(buildAuthorizationUrl(baseOptions))
      expect(url.searchParams.get('response_type')).toBe('code')
      expect(url.searchParams.get('client_id')).toBe('client-123')
      expect(url.searchParams.get('redirect_uri')).toBe('https://app.example.com/callback')
      expect(url.searchParams.get('code_challenge')).toBe(RFC_CHALLENGE)
      expect(url.searchParams.get('code_challenge_method')).toBe('S256')
    })

    it('includes optional state and scope', () => {
      const url = new URL(
        buildAuthorizationUrl({ ...baseOptions, state: 'xyz', scope: 'openid profile' }),
      )
      expect(url.searchParams.get('state')).toBe('xyz')
      expect(url.searchParams.get('scope')).toBe('openid profile')
    })

    it('keeps existing query parameters', () => {
      const url = new URL(
        buildAuthorizationUrl({
          ...baseOptions,
          authorizationEndpoint: 'https://auth.example.com/authorize?prompt=login',
        }),
      )
      expect(url.searchParams.get('prompt')).toBe('login')
    })

    it('rejects a relative endpoint', () => {
      expect(() =>
        buildAuthorizationUrl({ ...baseOptions, authorizationEndpoint: '/authorize' }),
      ).toThrow(/absolute URL/)
    })

    it('rejects an empty client id', () => {
      expect(() => buildAuthorizationUrl({ ...baseOptions, clientId: '  ' })).toThrow(/client id/)
    })

    it('rejects an empty redirect URI', () => {
      expect(() => buildAuthorizationUrl({ ...baseOptions, redirectUri: '' })).toThrow(
        /redirect URI/,
      )
    })
  })
})
