export type FindAndReplaceOptions = {
  /** 要查找的内容：普通文本或正则源码 */
  readonly find: string
  /** 替换内容：正则模式下支持 $1 等分组引用 */
  readonly replacement: string
  /** 是否把 find 当作正则表达式，默认 false */
  readonly useRegex?: boolean
  /** 是否区分大小写，默认 false */
  readonly caseSensitive?: boolean
  /** 是否只匹配完整单词（\b 边界），默认 false */
  readonly wholeWord?: boolean
  /** 是否替换全部匹配，默认 true */
  readonly replaceAll?: boolean
}

export type FindAndReplaceResult = {
  readonly output: string
  /** 实际被替换的匹配数量 */
  readonly count: number
}

/** 转义正则元字符，让普通文本按字面量匹配 */
export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function buildSource(find: string, options: FindAndReplaceOptions): string {
  const source = options.useRegex === true ? find : escapeRegExp(find)
  return options.wholeWord === true ? `\\b(?:${source})\\b` : source
}

function buildRegExp(find: string, options: FindAndReplaceOptions, global: boolean): RegExp {
  const flags = `${global ? 'g' : ''}${options.caseSensitive === true ? '' : 'i'}`
  try {
    return new RegExp(buildSource(find, options), flags)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Invalid regular expression: ${message}`, { cause: error })
  }
}

/** 统计匹配数量（始终统计全部匹配，与 replaceAll 无关） */
export function countMatches(input: string, options: FindAndReplaceOptions): number {
  if (options.find === '') {
    return 0
  }
  const pattern = buildRegExp(options.find, options, true)
  return input.match(pattern)?.length ?? 0
}

/** 查找并替换；空 find 原样返回，非法正则抛错 */
export function findAndReplace(
  input: string,
  options: FindAndReplaceOptions,
): FindAndReplaceResult {
  if (options.find === '') {
    return { output: input, count: 0 }
  }

  const replaceAll = options.replaceAll !== false
  const pattern = buildRegExp(options.find, options, replaceAll)

  // 非正则模式下 replacement 按字面量处理，避免 $& / $1 被误解析
  const output =
    options.useRegex === true
      ? input.replace(pattern, options.replacement)
      : input.replace(pattern, () => options.replacement)
  const count = replaceAll ? countMatches(input, options) : Math.min(1, countMatches(input, options))

  return { output, count }
}
