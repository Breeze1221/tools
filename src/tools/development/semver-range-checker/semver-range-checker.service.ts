export type Semver = {
  readonly major: number
  readonly minor: number
  readonly patch: number
  readonly prerelease: readonly string[]
  readonly raw: string
}

export type RangeReason = 'wildcard' | 'matched' | 'no-match'

export type ComparatorResult = {
  readonly comparator: string
  readonly satisfied: boolean
}

export type RangeCheck = {
  readonly version: string
  readonly range: string
  readonly normalizedRange: string
  readonly satisfied: boolean
  /** 命中的那组 `||` 分支（已规范化），未命中为 null */
  readonly matchedSet: string | null
  readonly reason: RangeReason
  readonly comparators: readonly ComparatorResult[]
}

type PartialVersion = {
  readonly major: number
  readonly minor: number | null
  readonly patch: number | null
  readonly prerelease: readonly string[]
}

type Operator = '>=' | '<=' | '>' | '<' | '='

type Comparator = {
  readonly operator: Operator
  readonly version: Semver
}

type ComparatorSet = {
  readonly comparators: readonly Comparator[]
  readonly wildcard: boolean
}

const SEMVER_PATTERN = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/
const PARTIAL_PATTERN =
  /^v?(\d+)(?:\.(\d+|[xX*]))?(?:\.(\d+|[xX*]))?(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/
const HYPHEN_PATTERN = /^(\S+)\s+-\s+(\S+)$/
const OPERATORS: readonly Operator[] = ['>=', '<=', '>', '<', '=']

function toNumber(value: string): number {
  return Number.parseInt(value, 10)
}

function buildSemver(
  major: number,
  minor: number,
  patch: number,
  prerelease: readonly string[],
  raw: string,
): Semver {
  return { major, minor, patch, prerelease, raw }
}

/** 解析严格语义化版本（允许前导 v 与 build metadata，非法抛错） */
export function parseSemver(input: string): Semver {
  const text = input.trim()
  if (text === '') {
    throw new Error('Version is empty')
  }
  const match = SEMVER_PATTERN.exec(text)
  if (!match) {
    throw new Error(`Invalid semantic version: ${input}`)
  }
  const prerelease = (match[4] ?? '').split('.').filter((part) => part !== '')
  return buildSemver(toNumber(match[1] ?? '0'), toNumber(match[2] ?? '0'), toNumber(match[3] ?? '0'), prerelease, text)
}

function parsePartial(input: string): PartialVersion {
  const text = input.trim()
  if (text === '') {
    throw new Error('Range token is empty')
  }
  const match = PARTIAL_PATTERN.exec(text)
  if (!match) {
    throw new Error(`Invalid range version: ${input}`)
  }
  const minorText = match[2]
  const patchText = match[3]
  const isWildcard = (value: string | undefined) =>
    value === undefined || value === 'x' || value === 'X' || value === '*'
  return {
    major: toNumber(match[1] ?? '0'),
    minor: isWildcard(minorText) ? null : toNumber(minorText ?? '0'),
    patch: isWildcard(patchText) ? null : toNumber(patchText ?? '0'),
    prerelease: (match[4] ?? '').split('.').filter((part) => part !== ''),
  }
}

function toComparable(partial: PartialVersion): Semver {
  return buildSemver(
    partial.major,
    partial.minor ?? 0,
    partial.patch ?? 0,
    partial.prerelease,
    `${partial.major}.${partial.minor ?? 0}.${partial.patch ?? 0}`,
  )
}

function compareIdentifiers(a: string, b: string): number {
  const aNumeric = /^\d+$/.test(a)
  const bNumeric = /^\d+$/.test(b)
  if (aNumeric && bNumeric) {
    return Math.sign(Number(a) - Number(b))
  }
  if (aNumeric) {
    return -1
  }
  if (bNumeric) {
    return 1
  }
  return a < b ? -1 : a > b ? 1 : 0
}

function compareParsed(a: Semver, b: Semver): number {
  if (a.major !== b.major) {
    return Math.sign(a.major - b.major)
  }
  if (a.minor !== b.minor) {
    return Math.sign(a.minor - b.minor)
  }
  if (a.patch !== b.patch) {
    return Math.sign(a.patch - b.patch)
  }
  if (a.prerelease.length === 0 && b.prerelease.length === 0) {
    return 0
  }
  if (a.prerelease.length === 0) {
    return 1
  }
  if (b.prerelease.length === 0) {
    return -1
  }
  const length = Math.max(a.prerelease.length, b.prerelease.length)
  for (let index = 0; index < length; index += 1) {
    const left = a.prerelease[index]
    const right = b.prerelease[index]
    if (left === undefined) {
      return -1
    }
    if (right === undefined) {
      return 1
    }
    const result = compareIdentifiers(left, right)
    if (result !== 0) {
      return result
    }
  }
  return 0
}

/** 比较两个版本，a < b 返回负数，相等返回 0，a > b 返回正数 */
export function compareSemver(a: string | Semver, b: string | Semver): number {
  const left = typeof a === 'string' ? parseSemver(a) : a
  const right = typeof b === 'string' ? parseSemver(b) : b
  return compareParsed(left, right)
}

function upperBound(partial: PartialVersion, mode: 'caret' | 'tilde'): Semver {
  if (mode === 'tilde') {
    if (partial.minor === null) {
      return buildSemver(partial.major + 1, 0, 0, [], `${partial.major + 1}.0.0`)
    }
    return buildSemver(partial.major, partial.minor + 1, 0, [], `${partial.major}.${partial.minor + 1}.0`)
  }
  if (partial.major > 0) {
    return buildSemver(partial.major + 1, 0, 0, [], `${partial.major + 1}.0.0`)
  }
  if (partial.minor !== null && partial.minor > 0) {
    return buildSemver(0, partial.minor + 1, 0, [], `0.${partial.minor + 1}.0`)
  }
  if (partial.patch !== null) {
    return buildSemver(0, 0, partial.patch + 1, [], `0.0.${partial.patch + 1}`)
  }
  if (partial.minor !== null) {
    return buildSemver(0, partial.minor + 1, 0, [], `0.${partial.minor + 1}.0`)
  }
  return buildSemver(1, 0, 0, [], '1.0.0')
}

function wildcardRange(partial: PartialVersion): Comparator[] {
  if (partial.minor === null) {
    return [
      { operator: '>=', version: buildSemver(partial.major, 0, 0, [], `${partial.major}.0.0`) },
      { operator: '<', version: buildSemver(partial.major + 1, 0, 0, [], `${partial.major + 1}.0.0`) },
    ]
  }
  return [
    {
      operator: '>=',
      version: buildSemver(partial.major, partial.minor, 0, [], `${partial.major}.${partial.minor}.0`),
    },
    {
      operator: '<',
      version: buildSemver(partial.major, partial.minor + 1, 0, [], `${partial.major}.${partial.minor + 1}.0`),
    },
  ]
}

function parseToken(token: string): ComparatorSet {
  if (token === '*' || token === 'x' || token === 'X') {
    return { comparators: [], wildcard: true }
  }

  if (token.startsWith('^')) {
    const partial = parsePartial(token.slice(1))
    return {
      comparators: [
        { operator: '>=', version: toComparable(partial) },
        { operator: '<', version: upperBound(partial, 'caret') },
      ],
      wildcard: false,
    }
  }

  if (token.startsWith('~')) {
    const partial = parsePartial(token.slice(1))
    return {
      comparators: [
        { operator: '>=', version: toComparable(partial) },
        { operator: '<', version: upperBound(partial, 'tilde') },
      ],
      wildcard: false,
    }
  }

  const operator = OPERATORS.find((item) => token.startsWith(item))
  if (operator !== undefined) {
    const partial = parsePartial(token.slice(operator.length))
    if (operator === '=') {
      return { comparators: [{ operator: '=', version: toComparable(partial) }], wildcard: false }
    }
    return { comparators: [{ operator, version: toComparable(partial) }], wildcard: false }
  }

  const partial = parsePartial(token)
  if (partial.minor === null || partial.patch === null) {
    return { comparators: wildcardRange(partial), wildcard: false }
  }
  return { comparators: [{ operator: '=', version: toComparable(partial) }], wildcard: false }
}

function parseComparatorSet(text: string): ComparatorSet {
  const trimmed = text.trim()
  if (trimmed === '') {
    throw new Error('Range is empty')
  }
  const hyphen = HYPHEN_PATTERN.exec(trimmed)
  if (hyphen) {
    const lower = parsePartial(hyphen[1] ?? '')
    const upper = parsePartial(hyphen[2] ?? '')
    return {
      comparators: [
        { operator: '>=', version: toComparable(lower) },
        { operator: '<=', version: toComparable(upper) },
      ],
      wildcard: false,
    }
  }

  const comparators: Comparator[] = []
  let wildcard = false
  for (const token of trimmed.split(/\s+/)) {
    const set = parseToken(token)
    wildcard = wildcard || set.wildcard
    comparators.push(...set.comparators)
  }
  return { comparators, wildcard }
}

function parseRange(range: string): ComparatorSet[] {
  const text = range.trim()
  if (text === '') {
    throw new Error('Range is empty')
  }
  return text.split('||').map((part) => parseComparatorSet(part))
}

function comparatorText(comparator: Comparator): string {
  return `${comparator.operator}${comparator.version.raw}`
}

function setText(set: ComparatorSet): string {
  if (set.wildcard && set.comparators.length === 0) {
    return '*'
  }
  return set.comparators.map(comparatorText).join(' ')
}

/** 把范围展开成规范写法，如 `^1.2.3` → `>=1.2.3 <2.0.0` */
export function normalizeRange(range: string): string {
  return parseRange(range).map(setText).join(' || ')
}

function comparatorSatisfied(version: Semver, comparator: Comparator): boolean {
  const result = compareParsed(version, comparator.version)
  switch (comparator.operator) {
    case '>=':
      return result >= 0
    case '<=':
      return result <= 0
    case '>':
      return result > 0
    case '<':
      return result < 0
    case '=':
      return result === 0
    default:
      return false
  }
}

/** 检查版本是否落在范围内，并返回命中的分支与逐个比较器结果 */
export function checkRange(version: string, range: string): RangeCheck {
  const parsedVersion = parseSemver(version)
  const sets = parseRange(range)
  const normalizedRange = sets.map(setText).join(' || ')

  for (const set of sets) {
    const comparators = set.comparators.map((comparator) => ({
      comparator: comparatorText(comparator),
      satisfied: comparatorSatisfied(parsedVersion, comparator),
    }))
    if (comparators.every((item) => item.satisfied)) {
      return {
        version: parsedVersion.raw,
        range: range.trim(),
        normalizedRange,
        satisfied: true,
        matchedSet: setText(set),
        reason: set.comparators.length === 0 ? 'wildcard' : 'matched',
        comparators,
      }
    }
  }

  const first = sets[0]
  return {
    version: parsedVersion.raw,
    range: range.trim(),
    normalizedRange,
    satisfied: false,
    matchedSet: null,
    reason: 'no-match',
    comparators:
      first === undefined
        ? []
        : first.comparators.map((comparator) => ({
            comparator: comparatorText(comparator),
            satisfied: comparatorSatisfied(parsedVersion, comparator),
          })),
  }
}

/** 版本是否满足范围（支持 ^ ~ 比较符 * x 连字符区间与 ||） */
export function satisfiesRange(version: string, range: string): boolean {
  return checkRange(version, range).satisfied
}
