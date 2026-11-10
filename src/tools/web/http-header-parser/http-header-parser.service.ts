export type HeaderEntry = {
  name: string
  values: string[]
}

export type HeaderParseError = {
  line: number
  content: string
  message: string
}

export type RequestLine = {
  type: 'request'
  method: string
  target: string
  protocol: string
}

export type StatusLine = {
  type: 'status'
  protocol: string
  statusCode: number
  statusText: string
}

export type ParsedHeaderBlock = {
  startLine: RequestLine | StatusLine | null
  headers: HeaderEntry[]
  errors: HeaderParseError[]
}

const TOKEN_SOURCE = "[!#$%&'*+\\-.^_`|~0-9A-Za-z]+"
const TOKEN_PATTERN = new RegExp(`^${TOKEN_SOURCE}$`)
const REQUEST_LINE_PATTERN = new RegExp(`^(${TOKEN_SOURCE})\\s+(\\S+)\\s+(HTTP/\\d+(?:\\.\\d+)?)$`)
const STATUS_LINE_PATTERN = /^(HTTP\/\d+(?:\.\d+)?)\s+(\d{3})(?:\s+(.*))?$/

function appendContinuation(entry: HeaderEntry, continuation: string): void {
  const lastIndex = entry.values.length - 1
  const lastValue = entry.values[lastIndex] ?? ''
  entry.values[lastIndex] = `${lastValue} ${continuation}`.trim()
}

/** 解析 HTTP 原始报文：起始行（请求/响应）+ 头部字段，容忍 CRLF/LF、折行与重复头 */
export function parseHeaderBlock(input: string): ParsedHeaderBlock {
  const result: ParsedHeaderBlock = { startLine: null, headers: [], errors: [] }
  if (input.trim() === '') {
    return result
  }

  const lines = input.replace(/\r\n?/g, '\n').split('\n')
  let current: HeaderEntry | null = null
  let isFirstContentLine = true

  lines.forEach((rawLine, index) => {
    const lineNumber = index + 1

    if (rawLine.trim() === '') {
      current = null
      return
    }

    if (/^[ \t]/.test(rawLine)) {
      if (current === null) {
        result.errors.push({
          line: lineNumber,
          content: rawLine,
          message: 'Continuation line without a preceding header',
        })
      } else {
        appendContinuation(current, rawLine.trim())
      }
      return
    }

    if (isFirstContentLine) {
      isFirstContentLine = false

      const requestMatch = REQUEST_LINE_PATTERN.exec(rawLine)
      if (requestMatch) {
        result.startLine = {
          type: 'request',
          method: requestMatch[1] ?? '',
          target: requestMatch[2] ?? '',
          protocol: requestMatch[3] ?? '',
        }
        current = null
        return
      }

      const statusMatch = STATUS_LINE_PATTERN.exec(rawLine)
      if (statusMatch) {
        result.startLine = {
          type: 'status',
          protocol: statusMatch[1] ?? '',
          statusCode: Number(statusMatch[2]),
          statusText: (statusMatch[3] ?? '').trim(),
        }
        current = null
        return
      }
    }

    const separator = rawLine.indexOf(':')
    if (separator <= 0) {
      result.errors.push({
        line: lineNumber,
        content: rawLine,
        message: 'Expected a "Name: value" header line',
      })
      current = null
      return
    }

    const name = rawLine.slice(0, separator).trim()
    const value = rawLine.slice(separator + 1).trim()

    if (!TOKEN_PATTERN.test(name)) {
      result.errors.push({
        line: lineNumber,
        content: rawLine,
        message: 'Invalid header name: expected an RFC 7230 token',
      })
      current = null
      return
    }

    const existing = result.headers.find(
      (header) => header.name.toLowerCase() === name.toLowerCase(),
    )
    if (existing) {
      existing.values.push(value)
      current = existing
    } else {
      const entry: HeaderEntry = { name, values: [value] }
      result.headers.push(entry)
      current = entry
    }
  })

  return result
}

/** 头部列表 → JSON：重复头合并为数组，键名保留首次出现的写法 */
export function headersToJson(headers: readonly HeaderEntry[]): string {
  const record: Record<string, string | string[]> = {}
  for (const header of headers) {
    record[header.name] = header.values.length === 1 ? (header.values[0] ?? '') : [...header.values]
  }
  return JSON.stringify(record, null, 2)
}

/** 按名称（大小写不敏感）查找头部，返回全部取值；未找到返回空数组 */
export function findHeader(headers: readonly HeaderEntry[], name: string): string[] {
  const target = name.toLowerCase()
  const found = headers.find((header) => header.name.toLowerCase() === target)
  return found ? [...found.values] : []
}
