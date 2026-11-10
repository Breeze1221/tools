export type JsonlIssue = {
  line: number
  message: string
}

export type JsonlValidation = {
  /** 非空行数量 */
  lineCount: number
  /** 成功解析的行数 */
  validCount: number
  errorCount: number
  errors: JsonlIssue[]
  warnings: JsonlIssue[]
}

export type JsonlParseResult = JsonlValidation & {
  json: string
}

const NON_OBJECT_WARNING = 'Line is not a JSON object'

type ParsedLines = {
  values: unknown[]
  errors: JsonlIssue[]
  warnings: JsonlIssue[]
  lineCount: number
}

/** 逐行解析 JSONL：忽略空行，行号按原始文件行计算 */
function parseLines(input: string): ParsedLines {
  const values: unknown[] = []
  const errors: JsonlIssue[] = []
  const warnings: JsonlIssue[] = []
  let lineCount = 0

  input.split(/\r?\n/).forEach((raw, index) => {
    if (raw.trim() === '') {
      return
    }
    lineCount += 1

    let value: unknown
    try {
      value = JSON.parse(raw)
    } catch (error) {
      errors.push({
        line: index + 1,
        message: error instanceof Error ? error.message : 'Invalid JSON',
      })
      return
    }

    values.push(value)
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      warnings.push({ line: index + 1, message: NON_OBJECT_WARNING })
    }
  })

  return { values, errors, warnings, lineCount }
}

/** 单行序列化：pretty 时压缩缩进为行内空格，仍保持一行一个对象 */
function stringifyLine(value: unknown, pretty: boolean): string {
  if (!pretty) {
    const compact = JSON.stringify(value)
    if (typeof compact !== 'string') {
      throw new Error('Value cannot be serialized to JSON')
    }
    return compact
  }

  const text = JSON.stringify(value, null, 2)
  if (typeof text !== 'string') {
    throw new Error('Value cannot be serialized to JSON')
  }
  return text
    .split('\n')
    .map((line) => line.trim())
    .join(' ')
}

/** JSON 数组 → JSONL，每行一个元素；非数组或非法 JSON 抛错 */
export function jsonArrayToJsonl(input: string, pretty = false): string {
  if (input.trim() === '') {
    throw new Error('Input is empty')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(input)
  } catch {
    throw new Error('Input is not valid JSON')
  }

  if (!Array.isArray(parsed)) {
    throw new Error('Input JSON must be an array')
  }

  return parsed.map((item) => stringifyLine(item, pretty)).join('\n')
}

/** JSONL → JSON 数组；逐行校验，返回错误行号与无法解析的原因 */
export function jsonlToJsonArray(input: string, pretty = false): JsonlParseResult {
  if (input.trim() === '') {
    throw new Error('Input is empty')
  }

  const { values, errors, warnings, lineCount } = parseLines(input)
  return {
    json: JSON.stringify(values, null, pretty ? 2 : 0),
    errors,
    warnings,
    lineCount,
    validCount: values.length,
    errorCount: errors.length,
  }
}

/** 只统计 JSONL 的行数与错误，不生成 JSON */
export function validateJsonl(input: string): JsonlValidation {
  if (input.trim() === '') {
    return { lineCount: 0, validCount: 0, errorCount: 0, errors: [], warnings: [] }
  }

  const { values, errors, warnings, lineCount } = parseLines(input)
  return {
    lineCount,
    validCount: values.length,
    errorCount: errors.length,
    errors,
    warnings,
  }
}
