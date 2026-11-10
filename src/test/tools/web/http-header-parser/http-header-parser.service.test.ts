import { describe, expect, it } from 'vitest'

import {
  findHeader,
  headersToJson,
  parseHeaderBlock,
} from '@/tools/web/http-header-parser/http-header-parser.service'

describe('parseHeaderBlock', () => {
  it('parses a request line and headers', () => {
    const result = parseHeaderBlock('GET /api/users?page=1 HTTP/1.1\nHost: example.com')
    expect(result.startLine).toEqual({
      type: 'request',
      method: 'GET',
      target: '/api/users?page=1',
      protocol: 'HTTP/1.1',
    })
    expect(result.headers).toEqual([{ name: 'Host', values: ['example.com'] }])
    expect(result.errors).toEqual([])
  })

  it('parses a response status line', () => {
    const result = parseHeaderBlock(
      'HTTP/1.1 404 Not Found\r\nContent-Type: text/html\r\n\r\n<body>',
    )
    expect(result.startLine).toEqual({
      type: 'status',
      protocol: 'HTTP/1.1',
      statusCode: 404,
      statusText: 'Not Found',
    })
    expect(result.headers).toEqual([{ name: 'Content-Type', values: ['text/html'] }])
    expect(result.errors).toHaveLength(1)
  })

  it('parses headers without a start line', () => {
    const result = parseHeaderBlock('Accept: application/json\nX-Trace: abc')
    expect(result.startLine).toBeNull()
    expect(result.headers.map((header) => header.name)).toEqual(['Accept', 'X-Trace'])
  })

  it('joins folded continuation lines with a space', () => {
    const result = parseHeaderBlock('X-Long: first part\n  second part\n\tthird part')
    expect(result.headers).toEqual([
      { name: 'X-Long', values: ['first part second part third part'] },
    ])
    expect(result.errors).toEqual([])
  })

  it('merges duplicate headers and keeps every value', () => {
    const result = parseHeaderBlock('Set-Cookie: a=1\nSet-Cookie: b=2\nset-cookie: c=3')
    expect(result.headers).toEqual([{ name: 'Set-Cookie', values: ['a=1', 'b=2', 'c=3'] }])
  })

  it('accepts LF and CRLF line endings', () => {
    expect(parseHeaderBlock('A: 1\r\nB: 2').headers).toHaveLength(2)
    expect(parseHeaderBlock('A: 1\nB: 2').headers).toHaveLength(2)
  })

  it('records invalid lines as errors and keeps parsing', () => {
    const result = parseHeaderBlock('this is not a header\nA: 1')
    expect(result.headers).toEqual([{ name: 'A', values: ['1'] }])
    expect(result.errors).toEqual([
      { line: 1, content: 'this is not a header', message: 'Expected a "Name: value" header line' },
    ])
  })

  it('records an invalid header name', () => {
    const result = parseHeaderBlock('Bad Header: value')
    expect(result.headers).toEqual([])
    expect(result.errors[0]?.message).toContain('Invalid header name')
  })

  it('records a continuation line without a preceding header', () => {
    const result = parseHeaderBlock('  orphan continuation')
    expect(result.errors[0]?.message).toContain('Continuation line')
  })

  it('returns an empty result for empty or blank input', () => {
    expect(parseHeaderBlock('')).toEqual({ startLine: null, headers: [], errors: [] })
    expect(parseHeaderBlock('  \n\n\t')).toEqual({ startLine: null, headers: [], errors: [] })
  })
})

describe('headersToJson', () => {
  it('serializes single and duplicate headers', () => {
    const json = headersToJson([
      { name: 'Host', values: ['example.com'] },
      { name: 'Accept', values: ['text/html', 'application/json'] },
    ])
    expect(JSON.parse(json)).toEqual({
      Host: 'example.com',
      Accept: ['text/html', 'application/json'],
    })
  })

  it('serializes an empty header list', () => {
    expect(headersToJson([])).toBe('{}')
  })
})

describe('findHeader', () => {
  it('finds headers case-insensitively', () => {
    const headers = [{ name: 'Content-Type', values: ['text/html'] }]
    expect(findHeader(headers, 'content-type')).toEqual(['text/html'])
  })

  it('returns an empty array when the header is absent', () => {
    expect(findHeader([], 'host')).toEqual([])
    expect(findHeader([{ name: 'Host', values: ['a'] }], 'accept')).toEqual([])
  })
})
