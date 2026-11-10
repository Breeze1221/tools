const VARIABLE_PATTERN = /\{\{\s*([^{}]+?)\s*\}\}/g

export type FillTemplateResult = {
  /** 填充后的文本；未提供值的变量保留原样 */
  readonly output: string
  /** 模板中出现但未提供值的变量名（去重，按首次出现顺序） */
  readonly missing: string[]
}

/** 提取模板中的所有变量名（支持 {{name}} 与 {{ name }}，去重保序） */
export function detectVariables(template: string): string[] {
  const variables: string[] = []
  const seen = new Set<string>()

  for (const match of template.matchAll(VARIABLE_PATTERN)) {
    const name = match[1].trim()
    if (name === '' || seen.has(name)) {
      continue
    }
    seen.add(name)
    variables.push(name)
  }
  return variables
}

/** 用 values 填充模板；缺失变量保留原始占位符并记录到 missing */
export function fillTemplate(
  template: string,
  values: Readonly<Record<string, string>>,
): FillTemplateResult {
  const output = template.replace(VARIABLE_PATTERN, (match, name: string) => {
    const key = name.trim()
    return Object.hasOwn(values, key) ? values[key] : match
  })

  const missing = detectVariables(template).filter((name) => !Object.hasOwn(values, name))
  return { output, missing }
}

/** 解析每行 key=value 的文本；忽略空行、注释行与缺少键或等号的行，值可包含等号 */
export function parseKeyValuePairs(input: string): Record<string, string> {
  const values: Record<string, string> = {}

  for (const line of input.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (trimmed === '' || trimmed.startsWith('#')) {
      continue
    }
    const separator = trimmed.indexOf('=')
    if (separator <= 0) {
      continue
    }
    const key = trimmed.slice(0, separator).trim()
    if (key === '') {
      continue
    }
    values[key] = trimmed.slice(separator + 1).trim()
  }

  return values
}
