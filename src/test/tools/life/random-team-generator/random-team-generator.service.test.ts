import { describe, expect, it } from 'vitest'

import {
  normalizeNames,
  parseNameList,
  shuffleArray,
  splitTeams,
} from '@/tools/life/random-team-generator/random-team-generator.service'

/** 固定随机源，返回 0.5 使 Fisher–Yates 的交换位置可预测 */
const halfway = () => 0.5

describe('shuffleArray', () => {
  it('shuffles deterministically with an injected rng', () => {
    expect(shuffleArray(['a', 'b', 'c', 'd'], halfway)).toEqual(['a', 'd', 'b', 'c'])
    expect(shuffleArray([1, 2, 3, 4], halfway)).toEqual([1, 4, 2, 3])
  })

  it('returns a new array and leaves the input untouched', () => {
    const source = ['a', 'b', 'c']
    const shuffled = shuffleArray(source, halfway)
    expect(shuffled).not.toBe(source)
    expect(source).toEqual(['a', 'b', 'c'])
    expect([...shuffled].sort()).toEqual(['a', 'b', 'c'])
  })

  it('clamps an out-of-range rng to a safe index', () => {
    expect(shuffleArray(['a', 'b', 'c'], () => 1)).toEqual(['a', 'b', 'c'])
    expect([...shuffleArray(['a', 'b', 'c'], () => -1)].sort()).toEqual(['a', 'b', 'c'])
  })
})

describe('normalizeNames', () => {
  it('trims names and drops blanks and duplicates', () => {
    expect(normalizeNames([' Ann ', '', 'Bob', 'Ann', '   ', 'Bob', 'Cara'])).toEqual([
      'Ann',
      'Bob',
      'Cara',
    ])
  })

  it('returns an empty array for empty input', () => {
    expect(normalizeNames([])).toEqual([])
    expect(normalizeNames(['', '  '])).toEqual([])
  })
})

describe('parseNameList', () => {
  it('splits on newlines and common separators', () => {
    expect(parseNameList('a, b，c\nd；e、f')).toEqual(['a', 'b', 'c', 'd', 'e', 'f'])
  })

  it('removes blanks and duplicates across the whole input', () => {
    expect(parseNameList(' a \n\n b, a\n c ')).toEqual(['a', 'b', 'c'])
  })

  it('returns an empty array for an empty or separator-only input', () => {
    expect(parseNameList('')).toEqual([])
    expect(parseNameList(' ,\n，;')).toEqual([])
  })
})

describe('splitTeams', () => {
  it('splits evenly by team count using the injected rng', () => {
    const result = splitTeams(['a', 'b', 'c', 'd'], { teamCount: 2, rng: halfway })
    expect(result.teams.map((team) => team.members)).toEqual([
      ['a', 'b'],
      ['d', 'c'],
    ])
    expect(result.members).toEqual(['a', 'b', 'c', 'd'])
  })

  it('hands the remainder to the first teams', () => {
    const result = splitTeams(['a', 'b', 'c', 'd', 'e'], { teamCount: 3, rng: halfway })
    expect(result.teams.map((team) => team.members.length)).toEqual([2, 2, 1])
  })

  it('splits by team size with a smaller last team', () => {
    const result = splitTeams(['a', 'b', 'c', 'd', 'e', 'f', 'g'], {
      teamSize: 3,
      rng: halfway,
    })
    expect(result.teams.map((team) => team.members.length)).toEqual([3, 3, 1])
    expect(result.teams.flatMap((team) => team.members).sort()).toEqual([
      'a',
      'b',
      'c',
      'd',
      'e',
      'f',
      'g',
    ])
  })

  it('uses provided team names and falls back to neutral indexes', () => {
    const named = splitTeams(['a', 'b', 'c', 'd'], {
      teamCount: 2,
      teamNames: ['Red', 'Blue'],
      rng: halfway,
    })
    expect(named.teams.map((team) => team.name)).toEqual(['Red', 'Blue'])
    expect(named.teams.map((team) => team.index)).toEqual([1, 2])

    const fallback = splitTeams(['a', 'b', 'c', 'd'], { teamCount: 2, rng: halfway })
    expect(fallback.teams.map((team) => team.name)).toEqual(['#1', '#2'])
  })

  it('deduplicates and trims names before splitting', () => {
    const result = splitTeams([' Ann ', '', 'Ann', ' Bob '], { teamCount: 2, rng: halfway })
    expect(result.members).toEqual(['Ann', 'Bob'])
    expect(result.teams.flatMap((team) => team.members)).toEqual(['Ann', 'Bob'])
  })

  it('rejects fewer than two distinct members', () => {
    expect(() => splitTeams([], { teamCount: 2 })).toThrow()
    expect(() => splitTeams(['a'], { teamCount: 2 })).toThrow()
    expect(() => splitTeams(['a', ' ', 'a'], { teamSize: 1 })).toThrow()
  })

  it('requires exactly one grouping option', () => {
    expect(() => splitTeams(['a', 'b', 'c'])).toThrow()
    expect(() => splitTeams(['a', 'b', 'c'], { teamCount: 2, teamSize: 2 })).toThrow()
  })

  it('validates the team count', () => {
    const names = ['a', 'b', 'c', 'd']
    expect(() => splitTeams(names, { teamCount: 1 })).toThrow()
    expect(() => splitTeams(names, { teamCount: 5 })).toThrow()
    expect(() => splitTeams(names, { teamCount: 2.5 })).toThrow()
  })

  it('validates the team size', () => {
    const names = ['a', 'b', 'c', 'd']
    expect(() => splitTeams(names, { teamSize: 0 })).toThrow()
    expect(() => splitTeams(names, { teamSize: 4 })).toThrow()
    expect(() => splitTeams(names, { teamSize: 1.5 })).toThrow()
  })
})
