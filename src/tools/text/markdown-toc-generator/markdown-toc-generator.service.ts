import { createSlugCounter, stripInlineMarkdown } from '@/utils/markdown-slug'

export { slugifyHeading } from '@/utils/markdown-slug'

export interface TocHeading {
  /** 标题层级 1–6 */
  depth: number
  /** 去掉行内标记后的标题文本 */
  text: string
}

export interface TocOptions {
  /** 最大层级 1–6，超出的标题不进目录 */
  maxLevel: number
  /** 是否输出 `[标题](#锚点)` 链接 */
  links: boolean
  /** 有序列表（1.）或无序列表（-） */
  ordered: boolean
  /** 是否按层级缩进嵌套 */
  nested: boolean
}

/** 围栏代码块起始：``` 或 ~~~，允许最多 3 个前导空格 */
const FENCE_RE = /^\s{0,3}(`{3,}|~{3,})/

/** ATX 标题：1–6 个 # + 空格 + 标题文本（结尾的 # 可省略） */
const HEADING_RE = /^\s{0,3}(#{1,6})\s+(.*?)(?:\s+#+)?\s*$/

/**
 * 从 Markdown 源码里提取标题，跳过围栏代码块（``` / ~~~）与 HTML 注释内的 `#` 行。
 * 返回结果保持源码顺序，`text` 已去掉行内标记（`**`、链接语法等）。
 */
export function extractHeadings(markdown: string): TocHeading[] {
  const headings: TocHeading[] = []
  let fence: string | null = null
  let inComment = false

  for (const line of markdown.split(/\r?\n/)) {
    if (inComment) {
      if (line.includes('-->')) {
        inComment = false
      }
      continue
    }

    const fenceMatch = FENCE_RE.exec(line)
    if (fence !== null) {
      // 只有同种字符、长度不短于开围栏的行才能关闭代码块
      if (
        fenceMatch !== null &&
        fenceMatch[1][0] === fence[0] &&
        fenceMatch[1].length >= fence.length
      ) {
        fence = null
      }
      continue
    }
    if (fenceMatch !== null) {
      fence = fenceMatch[1]
      continue
    }

    const commentStart = line.indexOf('<!--')
    if (commentStart >= 0) {
      if (!line.slice(commentStart).includes('-->')) {
        inComment = true
      }
      continue
    }

    const headingMatch = HEADING_RE.exec(line)
    if (headingMatch === null) {
      continue
    }
    const text = stripInlineMarkdown(headingMatch[2]).trim()
    if (text === '') {
      continue
    }
    headings.push({ depth: headingMatch[1].length, text })
  }

  return headings
}

/** 链接文本里的方括号要转义，否则会提前闭合 `[…]` */
function escapeLinkText(text: string): string {
  return text.replace(/([[\]]|\\)/g, '\\$1')
}

/**
 * 标题列表 → Markdown 目录。
 *
 * 锚点与 GitHub 一致（重名标题依次追加 -1、-2），层级缩进按最浅标题对齐；
 * 没有任何可见标题时返回空字符串。
 */
export function buildToc(headings: readonly TocHeading[], options: TocOptions): string {
  const maxLevel = Math.min(6, Math.max(1, Math.trunc(options.maxLevel)))
  const nextSlug = createSlugCounter()
  // 锚点按全文标题顺序分配，未进目录的标题同样占用序号，与 GitHub 一致
  const withSlugs = headings.map((heading) => ({ ...heading, slug: nextSlug(heading.text) }))
  const visible = withSlugs.filter((heading) => heading.depth <= maxLevel)
  if (visible.length === 0) {
    return ''
  }

  const topLevel = Math.min(...visible.map((heading) => heading.depth))
  const counters = new Map<number, number>()

  const lines = visible.map((heading) => {
    for (const depth of [...counters.keys()]) {
      if (depth > heading.depth) {
        counters.delete(depth)
      }
    }
    const count = (counters.get(heading.depth) ?? 0) + 1
    counters.set(heading.depth, count)

    const indent = options.nested ? '  '.repeat(heading.depth - topLevel) : ''
    const marker = options.ordered ? `${count}.` : '-'
    const label = options.links
      ? `[${escapeLinkText(heading.text)}](#${heading.slug})`
      : heading.text
    return `${indent}${marker} ${label}`
  })

  return lines.join('\n')
}
