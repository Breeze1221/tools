/** 随机源：返回 [0, 1) 的数，注入后便于测试固定结果 */
export type Rng = () => number

export type Team = {
  /** 队伍序号，从 1 开始 */
  readonly index: number
  readonly name: string
  readonly members: readonly string[]
}

export type SplitTeamsOptions = {
  /** 按队数均分，与 teamSize 二选一 */
  readonly teamCount?: number
  /** 按每队人数分组，与 teamCount 二选一 */
  readonly teamSize?: number
  /** 队伍显示名（由 UI 按语言提供），缺省用 `#1` 这类中性序号 */
  readonly teamNames?: readonly string[]
  readonly rng?: Rng
}

export type SplitTeamsResult = {
  /** 清洗后的名单（去空名、去重、保持原始顺序） */
  readonly members: readonly string[]
  readonly teams: readonly Team[]
}

/** Fisher–Yates 洗牌，返回新数组，不修改入参 */
export function shuffleArray<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i -= 1) {
    const random = rng()
    const index = Math.min(i, Math.max(0, Math.floor(random * (i + 1))))
    const current = result[i]
    result[i] = result[index]
    result[index] = current
  }
  return result
}

/** 去空名、去重（完全相同的字符串只保留第一次出现） */
export function normalizeNames(names: readonly string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const raw of names) {
    const name = raw.trim()
    if (name === '' || seen.has(name)) {
      continue
    }
    seen.add(name)
    result.push(name)
  }
  return result
}

/** 按换行、中英文逗号、分号、顿号拆分名单 */
export function parseNameList(input: string): string[] {
  return normalizeNames(input.split(/[\r\n,，;；、]+/))
}

/** 按队数或每队人数随机分队；非法输入抛英文 Error */
export function splitTeams(
  names: readonly string[],
  options: SplitTeamsOptions = {},
): SplitTeamsResult {
  const members = normalizeNames(names)
  if (members.length < 2) {
    throw new Error('At least 2 people are required')
  }

  const hasCount = options.teamCount !== undefined
  const hasSize = options.teamSize !== undefined
  if (hasCount === hasSize) {
    throw new Error('Provide either teamCount or teamSize')
  }

  const shuffled = shuffleArray(members, options.rng)
  const groups: string[][] = []

  if (options.teamCount !== undefined) {
    const teamCount = options.teamCount
    if (!Number.isInteger(teamCount) || teamCount < 2 || teamCount > members.length) {
      throw new Error(`Team count must be an integer between 2 and ${members.length}`)
    }
    for (let index = 0; index < teamCount; index += 1) {
      groups.push([])
    }
    shuffled.forEach((name, index) => {
      groups[index % teamCount].push(name)
    })
  } else {
    const teamSize = options.teamSize ?? 0
    if (!Number.isInteger(teamSize) || teamSize < 1 || teamSize >= members.length) {
      throw new Error(`Team size must be an integer between 1 and ${members.length - 1}`)
    }
    for (let start = 0; start < shuffled.length; start += teamSize) {
      groups.push(shuffled.slice(start, start + teamSize))
    }
  }

  const teams = groups.map((group, index) => ({
    index: index + 1,
    name: options.teamNames?.[index]?.trim() || `#${index + 1}`,
    members: group,
  }))

  return { members, teams }
}
