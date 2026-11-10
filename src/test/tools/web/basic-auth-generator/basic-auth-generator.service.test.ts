import { describe, expect, it } from 'vitest'

import {
  buildBasicAuthHeader,
  parseBasicAuthHeader,
} from '@/tools/web/basic-auth-generator/basic-auth-generator.service'

describe('buildBasicAuthHeader', () => {
  it('encodes ASCII credentials', () => {
    expect(buildBasicAuthHeader('admin', 'secret')).toBe('Basic YWRtaW46c2VjcmV0')
  })

  it('allows an empty password', () => {
    expect(buildBasicAuthHeader('admin', '')).toBe('Basic YWRtaW46')
  })

  it('encodes UTF-8 Chinese characters', () => {
    const header = buildBasicAuthHeader('张三', '密码')
    expect(header).toMatch(/^Basic [A-Za-z0-9+/]+={0,2}$/)
    expect(parseBasicAuthHeader(header)).toEqual({ username: '张三', password: '密码' })
  })

  it('encodes emoji', () => {
    const header = buildBasicAuthHeader('user', '🔐pass')
    expect(parseBasicAuthHeader(header)).toEqual({ username: 'user', password: '🔐pass' })
  })

  it('throws for an empty username', () => {
    expect(() => buildBasicAuthHeader('', 'secret')).toThrow()
  })
})

describe('parseBasicAuthHeader', () => {
  it('parses a header with any scheme casing', () => {
    expect(parseBasicAuthHeader('basic YWRtaW46c2VjcmV0')).toEqual({
      username: 'admin',
      password: 'secret',
    })
    expect(parseBasicAuthHeader('  BASIC   YWRtaW46c2VjcmV0  ')).toEqual({
      username: 'admin',
      password: 'secret',
    })
  })

  it('keeps colons inside the password', () => {
    expect(parseBasicAuthHeader(`Basic ${btoa('user:a:b')}`)).toEqual({
      username: 'user',
      password: 'a:b',
    })
  })

  it('throws for a non-Basic header', () => {
    expect(() => parseBasicAuthHeader('Bearer token')).toThrow()
    expect(() => parseBasicAuthHeader('')).toThrow()
  })

  it('throws for invalid base64', () => {
    expect(() => parseBasicAuthHeader('Basic not base64!')).toThrow()
  })

  it('throws when the decoded value has no colon', () => {
    expect(() => parseBasicAuthHeader(`Basic ${btoa('abc')}`)).toThrow()
  })
})
