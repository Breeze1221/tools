/** 支持的标志：g 全局、i 忽略大小写、m 多行、s 点号匹配换行、u Unicode */
export const regexFlags = ['g', 'i', 'm', 's', 'u'] as const

export type RegexFlag = (typeof regexFlags)[number]

export type RegexMatch = {
  /** 完整匹配到的文本 */
  readonly text: string
  /** 在原文中的起始下标 */
  readonly index: number
  /** 捕获组（不含完整匹配），未参与匹配的组为 undefined */
  readonly groups: readonly (string | undefined)[]
  /** 命名捕获组，未参与匹配的组为 undefined */
  readonly namedGroups: Readonly<Record<string, string | undefined>>
}

export type HighlightSegment = {
  readonly text: string
  readonly matched: boolean
}

/** 去掉非法（含 y、d、v 等）与重复标志，并按 regexFlags 的固定顺序输出 */
export function normalizeFlags(flags: string): string {
  return regexFlags.filter((flag) => flags.includes(flag)).join('')
}

/** 编译正则；pattern 非法时抛 Error（英文技术信息），由 UI 层翻译展示 */
export function compileRegex(pattern: string, flags: string): RegExp {
  try {
    return new RegExp(pattern, normalizeFlags(flags))
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Invalid regular expression: ${message}`, { cause: error })
  }
}

/** 找出全文所有匹配；始终按全局模式迭代，零长度匹配手动前进 lastIndex */
export function findMatches(pattern: string, flags: string, text: string): RegexMatch[] {
  if (pattern === '') {
    return []
  }

  const activeFlags = normalizeFlags(flags)
  const regex = compileRegex(pattern, activeFlags.includes('g') ? activeFlags : `${activeFlags}g`)
  const matches: RegexMatch[] = []

  let match = regex.exec(text)
  while (match !== null) {
    const groups: readonly (string | undefined)[] = Array.from(match).slice(1)
    matches.push({
      text: match[0],
      index: match.index,
      groups,
      namedGroups: { ...(match.groups ?? {}) },
    })

    // 零长度匹配不会推进 lastIndex，不手动前进会原地死循环
    if (match[0] === '') {
      regex.lastIndex += 1
    }
    match = regex.exec(text)
  }

  return matches
}

/**
 * 按替换串改写文本：$1 / $2 引用捕获组，$<name> 引用命名捕获组。
 * 与 String#replace 一致，只有标志里带 g 时才替换全部。
 */
export function replaceMatches(
  pattern: string,
  flags: string,
  text: string,
  replacement: string,
): string {
  if (pattern === '') {
    return text
  }
  return text.replace(compileRegex(pattern, flags), replacement)
}

/** 把文本按匹配区间切成「命中 / 未命中」片段，供 UI 用 React 节点安全渲染 */
export function highlightSegments(
  text: string,
  matches: readonly RegexMatch[],
): readonly HighlightSegment[] {
  const segments: HighlightSegment[] = []
  let cursor = 0

  for (const match of matches) {
    const end = match.index + match.text.length
    // 跳过零长度与越界/重叠的区间，保证拼接结果始终等于原文
    if (match.text === '' || match.index < cursor || end > text.length) {
      continue
    }
    if (match.index > cursor) {
      segments.push({ text: text.slice(cursor, match.index), matched: false })
    }
    segments.push({ text: match.text, matched: true })
    cursor = end
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), matched: false })
  }

  return segments
}
