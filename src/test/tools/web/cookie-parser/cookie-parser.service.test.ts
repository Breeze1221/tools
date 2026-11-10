import { describe, expect, it } from 'vitest'

import {
  buildCookie,
  cookiesToJson,
  parseCookies,
} from '@/tools/web/cookie-parser/cookie-parser.service'

describe('parseCookies', () => {
  it('parses a standard cookie header', () => {
    expect(parseCookies('a=1; b=2')).toEqual({
      cookies: [
        { name: 'a', value: '1', decodedValue: '1' },
        { name: 'b', value: '2', decodedValue: '2' },
      ],
      errors: [],
      warnings: [],
    })
  })

  it('strips the Cookie: prefix', () => {
    expect(parseCookies('Cookie: a=1; b=2').cookies.map((cookie) => cookie.name)).toEqual([
      'a',
      'b',
    ])
  })

  it('parses cookies separated by newlines', () => {
    expect(parseCookies('a=1\nb=2\n\nc=3').cookies.map((cookie) => cookie.name)).toEqual([
      'a',
      'b',
      'c',
    ])
  })

  it('parses a quoted document.cookie assignment', () => {
    expect(parseCookies('document.cookie = "a=1; b=2"').cookies).toHaveLength(2)
  })

  it('decodes percent-encoded values', () => {
    const [cookie] = parseCookies('user=%E5%BC%A0%E4%B8%89').cookies
    expect(cookie).toEqual({
      name: 'user',
      value: '%E5%BC%A0%E4%B8%89',
      decodedValue: '张三',
    })
  })

  it('unquotes a quoted value when decoding', () => {
    const [cookie] = parseCookies('q="hello"').cookies
    expect(cookie).toEqual({ name: 'q', value: '"hello"', decodedValue: 'hello' })
  })

  it('keeps the raw value when percent-decoding fails', () => {
    const [cookie] = parseCookies('x=%E0%A4%A').cookies
    expect(cookie?.decodedValue).toBe('%E0%A4%A')
  })

  it('reports invalid cookie names and drops them from the result', () => {
    const result = parseCookies('bad name=1; ok=2')
    expect(result.cookies.map((cookie) => cookie.name)).toEqual(['ok'])
    expect(result.errors).toEqual([
      { segment: 'bad name=1', message: 'Invalid cookie name: expected an RFC 6265 token' },
    ])
  })

  it('reports segments without "="', () => {
    const result = parseCookies('flag; a=1')
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]?.segment).toBe('flag')
    expect(result.cookies).toHaveLength(1)
  })

  it('keeps the last duplicate and records a warning', () => {
    const result = parseCookies('a=1; b=2; a=3')
    expect(result.cookies).toEqual([
      { name: 'a', value: '3', decodedValue: '3' },
      { name: 'b', value: '2', decodedValue: '2' },
    ])
    expect(result.warnings).toHaveLength(1)
    expect(result.warnings[0]?.name).toBe('a')
  })

  it('returns empty results for empty input', () => {
    expect(parseCookies('')).toEqual({ cookies: [], errors: [], warnings: [] })
    expect(parseCookies('   ;  \n ')).toEqual({ cookies: [], errors: [], warnings: [] })
  })
})

describe('buildCookie', () => {
  it('builds a minimal cookie', () => {
    expect(buildCookie({ name: 'a', value: '1' })).toBe('a=1')
  })

  it('adds every attribute in order', () => {
    expect(
      buildCookie({
        name: 'sid',
        value: 'abc',
        domain: '.example.com',
        path: '/app',
        maxAgeSeconds: 3600.4,
        expires: new Date('2026-01-01T00:00:00Z'),
        secure: true,
        httpOnly: true,
        sameSite: 'Lax',
      }),
    ).toBe(
      'sid=abc; Domain=.example.com; Path=/app; Max-Age=3600; Expires=Thu, 01 Jan 2026 00:00:00 GMT; Secure; HttpOnly; SameSite=Lax',
    )
  })

  it('encodes reserved characters in the value', () => {
    expect(buildCookie({ name: 'q', value: 'a b;c,d"e' })).toBe('q=a%20b%3Bc%2Cd%22e')
  })

  it('accepts an ISO expires string', () => {
    expect(buildCookie({ name: 'a', value: '1', expires: '2026-01-01T00:00:00Z' })).toContain(
      'Expires=Thu, 01 Jan 2026 00:00:00 GMT',
    )
  })

  it('throws when SameSite=None is used without Secure', () => {
    expect(() => buildCookie({ name: 'a', value: '1', sameSite: 'None' })).toThrow()
    expect(buildCookie({ name: 'a', value: '1', sameSite: 'None', secure: true })).toBe(
      'a=1; Secure; SameSite=None',
    )
  })

  it('throws for invalid names, max-age and expires values', () => {
    expect(() => buildCookie({ name: 'bad name', value: '1' })).toThrow()
    expect(() => buildCookie({ name: '', value: '1' })).toThrow()
    expect(() => buildCookie({ name: 'a', value: '1', maxAgeSeconds: Number.NaN })).toThrow()
    expect(() => buildCookie({ name: 'a', value: '1', expires: 'not-a-date' })).toThrow()
  })
})

describe('cookiesToJson', () => {
  it('serializes cookies with all three fields', () => {
    const cookies = [{ name: 'a', value: '%41', decodedValue: 'A' }]
    expect(cookiesToJson(cookies)).toBe(JSON.stringify(cookies, null, 2))
  })

  it('serializes an empty list', () => {
    expect(cookiesToJson([])).toBe('[]')
  })
})
