import { sanitizeFileName } from '@/utils/file-name'

export { sanitizeFileName }

/** 生成规则：序号 = startIndex + 文件下标，按 indexPadding 补零 */
export type RenameRules = {
  prefix: string
  suffix: string
  startIndex: number
  indexPadding: number
  separator: RenameSeparator
  find: string
  replace: string
  letterCase: RenameCase
}

export type RenameSeparator = '-' | '_' | ''
export type RenameCase = 'keep' | 'lower' | 'upper'

export type RenameSource = {
  name: string
}

export type RenamePlanItem = {
  originalName: string
  newName: string
  /** 生成名与已有文件重名，已自动追加 -2、-3… */
  hasConflict: boolean
}

export const MIN_INDEX_PADDING = 1
export const MAX_INDEX_PADDING = 6

export const DEFAULT_RENAME_RULES: RenameRules = {
  prefix: '',
  suffix: '',
  startIndex: 1,
  indexPadding: 3,
  separator: '-',
  find: '',
  replace: '',
  letterCase: 'keep',
}

function clampIndexPadding(padding: number): number {
  if (!Number.isFinite(padding)) return DEFAULT_RENAME_RULES.indexPadding
  return Math.min(MAX_INDEX_PADDING, Math.max(MIN_INDEX_PADDING, Math.floor(padding)))
}

function normalizeStartIndex(startIndex: number): number {
  if (!Number.isFinite(startIndex)) return DEFAULT_RENAME_RULES.startIndex
  return Math.max(0, Math.floor(startIndex))
}

function transformCase(value: string, letterCase: RenameCase): string {
  if (letterCase === 'lower') return value.toLowerCase()
  if (letterCase === 'upper') return value.toUpperCase()
  return value
}

function splitExtension(name: string): { base: string; extension: string } {
  const dot = name.lastIndexOf('.')
  if (dot <= 0) return { base: name, extension: '' }
  return { base: name.slice(0, dot), extension: name.slice(dot + 1) }
}

/** 清理扩展名：去掉点号与非法字符，限长 10 位，保留原始大小写 */
export function sanitizeExtension(extension: string): string {
  return extension
    .trim()
    .replace(/^\.+/, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 10)
}

/**
 * 按规则生成单个文件名：查找替换只作用于原文件名（不含扩展名），
 * 大小写作用于最终主名，扩展名原样保留。
 */
export function applyRenameRules(originalName: string, rules: RenameRules, index: number): string {
  const { base, extension } = splitExtension(originalName)
  const replaced = rules.find === '' ? base : base.split(rules.find).join(rules.replace)

  const sequence = normalizeStartIndex(rules.startIndex) + Math.max(0, Math.floor(index))
  const paddedIndex = String(sequence).padStart(clampIndexPadding(rules.indexPadding), '0')

  const parts = [rules.prefix, replaced, paddedIndex].filter((part) => part !== '')
  const joined = `${parts.join(rules.separator)}${rules.suffix}`
  const stem = sanitizeFileName(transformCase(joined, rules.letterCase), 'image')
  const safeExtension = sanitizeExtension(extension)

  return safeExtension === '' ? stem : `${stem}.${safeExtension}`
}

/** 在扩展名前追加去重序号：cat-001.png → cat-001-2.png（不区分大小写） */
export function makeUniqueFileName(candidate: string, usedNames: ReadonlySet<string>): string {
  const used = new Set(Array.from(usedNames, (name) => name.toLowerCase()))
  if (!used.has(candidate.toLowerCase())) {
    return candidate
  }

  const { base, extension } = splitExtension(candidate)
  const withCounter = (counter: number) =>
    extension === '' ? `${base}-${counter}` : `${base}-${counter}.${extension}`

  let counter = 2
  let next = withCounter(counter)
  while (used.has(next.toLowerCase())) {
    counter += 1
    next = withCounter(counter)
  }
  return next
}

/**
 * 批量生成重命名计划。重名判断不区分大小写（Windows / macOS 默认如此），
 * 冲突时自动追加 -2、-3… 并标记 hasConflict。
 */
export function buildRenamePlan(
  files: readonly RenameSource[],
  rules: RenameRules,
): RenamePlanItem[] {
  const usedNames = new Set<string>()

  return files.map((file, index) => {
    const candidate = applyRenameRules(file.name, rules, index)
    const newName = makeUniqueFileName(candidate, usedNames)
    usedNames.add(newName.toLowerCase())
    return {
      originalName: file.name,
      newName,
      hasConflict: newName !== candidate,
    }
  })
}
