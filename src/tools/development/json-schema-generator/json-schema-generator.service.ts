export const JSON_SCHEMA_DRAFTS = ['draft-07', '2020-12'] as const
export type JsonSchemaDraft = (typeof JSON_SCHEMA_DRAFTS)[number]

export type JsonSchemaOptions = {
  readonly draft: JsonSchemaDraft
  /** 是否把对象的全部键写入 required */
  readonly required: boolean
}

export type JsonSchema = Record<string, unknown>

export const DEFAULT_JSON_SCHEMA_OPTIONS: JsonSchemaOptions = {
  draft: '2020-12',
  required: true,
}

const DRAFT_URIS: Record<JsonSchemaDraft, string> = {
  'draft-07': 'http://json-schema.org/draft-07/schema#',
  '2020-12': 'https://json-schema.org/draft/2020-12/schema',
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/
const URI_PATTERN = /^https?:\/\/[^\s]+$/i
const IPV4_PATTERN =
  /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/

function detectStringFormat(value: string): string | null {
  if (EMAIL_PATTERN.test(value)) {
    return 'email'
  }
  if (DATE_TIME_PATTERN.test(value)) {
    return 'date-time'
  }
  if (URI_PATTERN.test(value)) {
    return 'uri'
  }
  if (IPV4_PATTERN.test(value)) {
    return 'ipv4'
  }
  return null
}

function inferString(value: string): JsonSchema {
  const format = detectStringFormat(value)
  return format === null ? { type: 'string' } : { type: 'string', format }
}

function mergeSchemas(schemas: readonly JsonSchema[]): JsonSchema {
  const unique: JsonSchema[] = []
  const seen = new Set<string>()
  for (const schema of schemas) {
    const key = JSON.stringify(schema)
    if (!seen.has(key)) {
      seen.add(key)
      unique.push(schema)
    }
  }
  if (unique.length === 1) {
    return unique[0] ?? {}
  }
  return { anyOf: unique }
}

function inferArray(value: readonly unknown[], options: JsonSchemaOptions): JsonSchema {
  if (value.length === 0) {
    return { type: 'array', items: {} }
  }
  return {
    type: 'array',
    items: mergeSchemas(value.map((item) => inferValue(item, options))),
  }
}

function inferObject(
  value: Record<string, unknown>,
  options: JsonSchemaOptions,
): JsonSchema {
  const properties: Record<string, JsonSchema> = {}
  const keys = Object.keys(value)
  for (const key of keys) {
    properties[key] = inferValue(value[key], options)
  }
  const schema: JsonSchema = { type: 'object', properties }
  if (options.required && keys.length > 0) {
    schema.required = keys
  }
  return schema
}

function inferValue(value: unknown, options: JsonSchemaOptions): JsonSchema {
  if (value === null) {
    return { type: 'null' }
  }
  if (Array.isArray(value)) {
    return inferArray(value, options)
  }
  if (typeof value === 'string') {
    return inferString(value)
  }
  if (typeof value === 'number') {
    return { type: Number.isInteger(value) ? 'integer' : 'number' }
  }
  if (typeof value === 'boolean') {
    return { type: 'boolean' }
  }
  if (typeof value === 'object') {
    return inferObject(value as Record<string, unknown>, options)
  }
  return {}
}

/** 从任意 JSON 值推断 JSON Schema */
export function inferJsonSchema(
  value: unknown,
  options: Partial<JsonSchemaOptions> = {},
): JsonSchema {
  const resolved: JsonSchemaOptions = { ...DEFAULT_JSON_SCHEMA_OPTIONS, ...options }
  if (!JSON_SCHEMA_DRAFTS.includes(resolved.draft)) {
    throw new Error(`Unsupported JSON Schema draft: ${String(resolved.draft)}`)
  }
  const inferred = inferValue(value, resolved)
  return { $schema: DRAFT_URIS[resolved.draft], ...inferred }
}

/** 解析 JSON 文本并生成格式化后的 Schema 字符串 */
export function generateJsonSchema(
  input: string,
  options: Partial<JsonSchemaOptions> = {},
): string {
  if (input.trim() === '') {
    throw new Error('Input is empty')
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(input)
  } catch {
    throw new Error('Input is not valid JSON')
  }
  return JSON.stringify(inferJsonSchema(parsed, options), null, 2)
}
