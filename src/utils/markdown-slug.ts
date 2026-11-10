/**
 * GitHub 风格标题锚点：纯字符串运算，不依赖 markdown 解析器，
 * 供 Markdown 编辑器与目录生成器共用（避免把 marked / DOMPurify 拖进轻量工具）。
 */

/** 行内标记去噪：`## **加粗** 标题` 的锚点 id 应该是「加粗-标题」而不是带星号 */
export function stripInlineMarkdown(text: string): string {
  return text
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/~~/g, '')
    .replace(/[*_]/g, '')
}

/** GitHub 风格锚点：小写、丢标点、空白转 `-`，保留 CJK 与字母数字 */
export function slugifyHeading(text: string): string {
  const slug = stripInlineMarkdown(text)
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}\s_-]/gu, '')
    .replace(/\s+/g, '-')
    .slice(0, 64)
  return slug || 'section'
}

/** 同一份文档里重名标题追加 -1/-2 后缀，保证 id 唯一 */
export function createSlugCounter(): (text: string) => string {
  const seen = new Map<string, number>()
  return (text: string): string => {
    const base = slugifyHeading(text)
    const used = seen.get(base)
    if (used === undefined) {
      seen.set(base, 0)
      return base
    }
    seen.set(base, used + 1)
    return `${base}-${used + 1}`
  }
}
