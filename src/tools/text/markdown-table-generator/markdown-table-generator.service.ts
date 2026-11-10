/** 自动识别的候选分隔符：制表符 / 逗号 / 分号 / 竖线 */
const CANDIDATE_DELIMITERS = ['\t', ',', ';', '|'] as const

/** 空白对齐表格：连续两个以上空格视作列分隔 */
const ALIGNED_SPACE_DELIMITER = ' '

/** 对齐方式，整表统一 */
export const tableAligns = ['none', 'left', 'center', 'right'] as const
export type TableAlign = (typeof tableAligns)[number]

export interface MarkdownTableOptions {
  align: TableAlign
  /** 首行是否作为表头 */
  header: boolean
  /** 单元格内的 `|` 是否转义成 `\|` */
  escapePipe: boolean
}

const ALIGN_MARKERS: Record<TableAlign, string> = {
  none: '---',
  left: ':---',
  center: ':---:',
  right: '---:',
}

function assertNotEmpty(input: string): void {
  if (input.trim() === '') {
    throw new Error('Input is empty')
  }
}

/** 统计一行里未被引号包裹的分隔符个数 */
function countOutsideQuotes(line: string, delimiter: string): number {
  let count = 0
  let quoted = false
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        index += 1
        continue
      }
      quoted = !quoted
      continue
    }
    if (!quoted && char === delimiter) {
      count += 1
    }
  }
  return count
}

/** 连续两个以上空格的个数，用于空白对齐表格 */
function countAlignedSpaces(line: string): number {
  const matches = line.trim().match(/\s{2,}/g)
  return matches === null ? 0 : matches.length
}

function delimiterCountsPerLine(input: string, delimiter: string): number[] {
  return input
    .replaceAll('\r\n', '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '')
    .map((line) =>
      delimiter === ALIGNED_SPACE_DELIMITER
        ? countAlignedSpaces(line)
        : countOutsideQuotes(line, delimiter),
    )
    .filter((count) => count > 0)
}

/**
 * 给候选分隔符打分：多数行的列数一致且出现次数多者胜出。
 * 一致性不足 75% 视为不是该分隔符（例如正文里的逗号）。
 */
function scoreDelimiter(input: string, delimiter: string): number {
  const counts = delimiterCountsPerLine(input, delimiter)
  if (counts.length === 0) {
    return 0
  }
  const frequency = new Map<number, number>()
  for (const count of counts) {
    frequency.set(count, (frequency.get(count) ?? 0) + 1)
  }
  let mode = 0
  let hits = 0
  for (const [count, times] of frequency) {
    if (times > hits || (times === hits && count > mode)) {
      mode = count
      hits = times
    }
  }
  const consistency = hits / counts.length
  return consistency < 0.75 ? 0 : consistency * 10 + mode
}

/** 自动识别分隔符：返回 '\t'、','、';'、'|' 或 ' '（= 连续空格对齐），默认为逗号 */
export function detectDelimiter(input: string): string {
  assertNotEmpty(input)
  let picked = ''
  let pickedScore = 0
  for (const delimiter of CANDIDATE_DELIMITERS) {
    const score = scoreDelimiter(input, delimiter)
    if (score > pickedScore) {
      picked = delimiter
      pickedScore = score
    }
  }
  if (picked !== '') {
    return picked
  }
  return scoreDelimiter(input, ALIGNED_SPACE_DELIMITER) > 0 ? ALIGNED_SPACE_DELIMITER : ','
}

/** 逐字符扫描：支持引号包裹、`""` 转义引号与单元格内换行 */
function parseDelimited(input: string, delimiter: string): string[][] {
  const text = input.replaceAll('\r\n', '\n')
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    if (quoted) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          field += '"'
          index += 1
        } else {
          quoted = false
        }
      } else {
        field += char
      }
      continue
    }
    if (char === '"') {
      quoted = true
      continue
    }
    if (char === delimiter) {
      row.push(field.trim())
      field = ''
      continue
    }
    if (char === '\n') {
      row.push(field.trim())
      rows.push(row)
      row = []
      field = ''
      continue
    }
    field += char
  }

  if (field !== '' || row.length > 0) {
    row.push(field.trim())
    rows.push(row)
  }

  // 空白行不参与建表，但保留「全是空单元格」的有效行（由调用方决定列数补齐）
  return rows.filter((item) => item.some((cell) => cell !== ''))
}

/**
 * 解析分隔文本为二维数组。
 *
 * - 不传 delimiter 时自动识别
 * - `' '` 表示空白对齐表格（连续两个以上空格分列）
 * - 处理引号包裹、`""` 转义引号与单元格内换行
 */
export function parseRows(input: string, delimiter?: string): string[][] {
  assertNotEmpty(input)
  const separator = delimiter ?? detectDelimiter(input)
  if (separator === ALIGNED_SPACE_DELIMITER) {
    return input
      .replaceAll('\r\n', '\n')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line !== '')
      .map((line) =>
        line
          .split(/\s{2,}/)
          .map((cell) => cell.trim())
          .filter((cell) => cell !== ''),
      )
      .filter((cells) => cells.length > 0)
  }
  return parseDelimited(input, separator)
}

function formatCell(value: string, escapePipe: boolean): string {
  // Markdown 单元格不能换行，统一折成 <br>
  const singleLine = value.replaceAll(/\r?\n/g, '<br>')
  return escapePipe ? singleLine.replaceAll('|', '\\|') : singleLine
}

function rowToLine(cells: string[]): string {
  return `| ${cells.join(' | ')} |`
}

/** 二维数组 → Markdown 表格；列数不齐时用空串补齐 */
export function toMarkdownTable(rows: string[][], options: MarkdownTableOptions): string {
  if (rows.length === 0) {
    throw new Error('Input is empty')
  }
  const width = Math.max(...rows.map((row) => row.length))
  if (width === 0) {
    throw new Error('Input is empty')
  }

  const cellsOf = (row: string[]): string[] =>
    Array.from({ length: width }, (_, index) => formatCell(row[index] ?? '', options.escapePipe))

  const body = rows.map(cellsOf)
  const alignRow = Array.from({ length: width }, () => ALIGN_MARKERS[options.align])
  const lines: string[] = []

  if (options.header) {
    const [head, ...rest] = body
    lines.push(rowToLine(head), rowToLine(alignRow), ...rest.map(rowToLine))
  } else {
    // 没有表头时补一行空表头，保证输出仍是合法的 Markdown 表格
    lines.push(rowToLine(Array.from({ length: width }, () => '')), rowToLine(alignRow))
    lines.push(...body.map(rowToLine))
  }

  return lines.join('\n')
}

/** 拆一行 Markdown 表格，处理首尾竖线与 `\|` 转义 */
function splitMarkdownRow(line: string): string[] {
  let text = line.trim()
  if (text.startsWith('|')) {
    text = text.slice(1)
  }
  if (text.endsWith('|') && !text.endsWith('\\|')) {
    text = text.slice(0, -1)
  }

  const cells: string[] = []
  let field = ''
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    if (char === '\\' && text[index + 1] === '|') {
      field += '|'
      index += 1
      continue
    }
    if (char === '|') {
      cells.push(field.trim())
      field = ''
      continue
    }
    field += char
  }
  cells.push(field.trim())
  return cells
}

function isSeparatorLine(line: string): boolean {
  const cells = splitMarkdownRow(line)
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell))
}

/** 单元格还原：`\|` → `|`，`<br>` → 换行 */
function unformatCell(value: string): string {
  return value.replaceAll('<br>', '\n').replaceAll('<br/>', '\n').replaceAll('\\|', '|')
}

function csvField(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`
  }
  return value
}

/** Markdown 表格 → CSV（分隔符固定为逗号，含逗号/引号/换行的字段自动加引号） */
export function markdownTableToCsv(input: string): string {
  assertNotEmpty(input)
  const lines = input
    .replaceAll('\r\n', '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '' && line.includes('|'))
  if (lines.length === 0) {
    throw new Error('Input is empty')
  }

  const rows = lines
    .filter((line) => !isSeparatorLine(line))
    .map((line) => splitMarkdownRow(line).map(unformatCell))

  return rows.map((row) => row.map(csvField).join(',')).join('\n')
}
