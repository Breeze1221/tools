import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'

export const DOTENV_FORMATS = ['env', 'json', 'yaml'] as const
export type DotenvFormat = (typeof DOTENV_FORMATS)[number]

export type DotenvError = {
  /** 1-based line number in the source text */
  line: number
  /** English technical message; the UI adds localized context */
  message: string
}

export type DotenvWarning = DotenvError

export type DotenvParseResult = {
  values: Record<string, string>
  errors: DotenvError[]
  warnings: DotenvWarning[]
}

/** Key syntax shared by most dotenv implementations */
const KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_.-]*$/

type ParsedValue = { value: string } | { error: string }

/** Double-quoted values understand \n, \t, \r, \" and \\; unknown escapes stay intact */
function parseDoubleQuoted(raw: string): ParsedValue {
  let value = ''
  let index = 1
  while (index < raw.length) {
    const char = raw[index]
    if (char === '\\') {
      const next = raw[index + 1]
      if (next === undefined) {
        return { error: 'Unterminated escape sequence in double-quoted value' }
      }
      if (next === 'n') value += '\n'
      else if (next === 't') value += '\t'
      else if (next === 'r') value += '\r'
      else if (next === '"') value += '"'
      else if (next === '\\') value += '\\'
      else value += `\\${next}`
      index += 2
      continue
    }
    if (char === '"') {
      return { value }
    }
    value += char
    index += 1
  }
  return { error: 'Unterminated double-quoted value' }
}

/** Single-quoted values are literal: no escape processing at all */
function parseSingleQuoted(raw: string): ParsedValue {
  const end = raw.indexOf("'", 1)
  if (end === -1) {
    return { error: 'Unterminated single-quoted value' }
  }
  return { value: raw.slice(1, end) }
}

function parseValue(raw: string): ParsedValue {
  const trimmedStart = raw.trimStart()
  if (trimmedStart.startsWith('"')) {
    return parseDoubleQuoted(trimmedStart)
  }
  if (trimmedStart.startsWith("'")) {
    return parseSingleQuoted(trimmedStart)
  }
  // Unquoted values end at a `#` only when whitespace precedes it,
  // so `KEY=#hash` keeps its leading hash while `KEY=1 # note` drops the comment.
  const comment = /\s#/.exec(raw)
  const value = (comment ? raw.slice(0, comment.index) : raw).trim()
  return { value }
}

/**
 * Parse `.env` text into a flat string map.
 *
 * Supports `KEY=value`, `export KEY=value`, comments, blank lines, single/double
 * quotes and trailing comments on unquoted values. Duplicate keys keep the later
 * value and emit a warning; malformed lines are reported and skipped.
 */
export function parseDotenv(input: string): DotenvParseResult {
  const values: Record<string, string> = {}
  const errors: DotenvError[] = []
  const warnings: DotenvWarning[] = []

  input.split(/\r?\n/).forEach((rawLine, index) => {
    const line = rawLine.trim()
    if (line === '' || line.startsWith('#')) {
      return
    }

    const lineNumber = index + 1
    const assignment = line.startsWith('export') && /^export[\s]/.test(line)
      ? line.slice(6).trimStart()
      : line
    const equalsIndex = assignment.indexOf('=')
    if (equalsIndex === -1) {
      errors.push({ line: lineNumber, message: 'Missing "=" in assignment' })
      return
    }

    const key = assignment.slice(0, equalsIndex).trim()
    if (key === '') {
      errors.push({ line: lineNumber, message: 'Empty key before "="' })
      return
    }
    if (!KEY_PATTERN.test(key)) {
      errors.push({ line: lineNumber, message: `Invalid key "${key}"` })
      return
    }

    const parsed = parseValue(assignment.slice(equalsIndex + 1).trimStart())
    if ('error' in parsed) {
      errors.push({ line: lineNumber, message: parsed.error })
      return
    }

    if (Object.prototype.hasOwnProperty.call(values, key)) {
      warnings.push({
        line: lineNumber,
        message: `Duplicate key "${key}"; the later value wins`,
      })
    }
    values[key] = parsed.value
  })

  return { values, errors, warnings }
}

function escapeDoubleQuoted(value: string): string {
  return value
    .replaceAll('\\', '\\\\')
    .replaceAll('"', '\\"')
    .replaceAll('\n', '\\n')
    .replaceAll('\r', '\\r')
    .replaceAll('\t', '\\t')
}

/** Values containing whitespace, quotes, backslashes or `#` must be double-quoted */
const NEEDS_QUOTES = /[\s"'\\#]/

/** Serialize a flat string map back to `.env` syntax; an empty map yields '' */
export function serializeDotenv(values: Record<string, string>): string {
  return Object.entries(values)
    .map(([key, value]) => {
      if (value !== '' && NEEDS_QUOTES.test(value)) {
        return `${key}="${escapeDoubleQuoted(value)}"`
      }
      return `${key}=${value}`
    })
    .join('\n')
}

/** Config values that are not strings are coerced so they can live in `.env` */
function toEnvValue(value: unknown): string {
  if (typeof value === 'string') return value
  if (value === null || value === undefined) return ''
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value)
  }
  return JSON.stringify(value) ?? ''
}

function toEnvRecord(data: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, toEnvValue(value)]))
}

function readConfig(input: string, format: DotenvFormat): Record<string, unknown> {
  if (format === 'env') {
    const { values, errors } = parseDotenv(input)
    const first = errors[0]
    if (first) {
      throw new Error(`Invalid .env input at line ${first.line}: ${first.message}`)
    }
    return values
  }

  let parsed: unknown
  if (format === 'json') {
    try {
      parsed = JSON.parse(input)
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'parse failed'
      throw new Error(`Invalid JSON input: ${detail}`, { cause: error })
    }
  } else {
    try {
      parsed = parseYaml(input)
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'parse failed'
      throw new Error(`Invalid YAML input: ${detail}`, { cause: error })
    }
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error(`Input ${format.toUpperCase()} must be an object`)
  }
  return parsed as Record<string, unknown>
}

/**
 * Convert config text between `.env`, JSON and YAML.
 *
 * Blank input returns ''. Unparsable input throws an `Error` with an English
 * technical message; the UI translates the surrounding copy.
 */
export function convertEnvFormat(input: string, from: DotenvFormat, to: DotenvFormat): string {
  if (input.trim() === '') {
    return ''
  }

  const data = readConfig(input, from)

  if (to === 'env') {
    return serializeDotenv(toEnvRecord(data))
  }
  if (to === 'json') {
    return JSON.stringify(data, null, 2)
  }
  return stringifyYaml(data).trimEnd()
}
