import { describe, expect, it } from 'vitest'

import {
  checkRange,
  compareSemver,
  normalizeRange,
  parseSemver,
  satisfiesRange,
} from '@/tools/development/semver-range-checker/semver-range-checker.service'

describe('semver-range-checker service', () => {
  describe('parseSemver', () => {
    it('parses a plain version', () => {
      expect(parseSemver('1.2.3')).toMatchObject({ major: 1, minor: 2, patch: 3, prerelease: [] })
    })

    it('parses prerelease identifiers', () => {
      expect(parseSemver('1.2.3-alpha.1').prerelease).toEqual(['alpha', '1'])
    })

    it('throws for empty and malformed versions', () => {
      expect(() => parseSemver('')).toThrow('Version is empty')
      expect(() => parseSemver('1.2')).toThrow('Invalid semantic version')
      expect(() => parseSemver('abc')).toThrow('Invalid semantic version')
    })
  })

  describe('compareSemver', () => {
    it('orders numeric components', () => {
      expect(compareSemver('1.2.3', '1.2.4')).toBeLessThan(0)
      expect(compareSemver('2.0.0', '1.9.9')).toBeGreaterThan(0)
      expect(compareSemver('1.2.3', '1.2.3')).toBe(0)
    })

    it('treats prerelease versions as lower than releases', () => {
      expect(compareSemver('1.2.3-alpha', '1.2.3')).toBeLessThan(0)
      expect(compareSemver('1.2.3-alpha.2', '1.2.3-alpha.10')).toBeLessThan(0)
    })
  })

  describe('satisfiesRange', () => {
    it('supports caret ranges', () => {
      expect(satisfiesRange('1.5.0', '^1.2.3')).toBe(true)
      expect(satisfiesRange('2.0.0', '^1.2.3')).toBe(false)
      expect(satisfiesRange('0.2.5', '^0.2.3')).toBe(true)
      expect(satisfiesRange('0.3.0', '^0.2.3')).toBe(false)
    })

    it('supports tilde ranges with partial versions', () => {
      expect(satisfiesRange('1.2.9', '~1.2')).toBe(true)
      expect(satisfiesRange('1.3.0', '~1.2')).toBe(false)
    })

    it('supports comparison operators and AND sets', () => {
      expect(satisfiesRange('2.5.0', '>=2 <3')).toBe(true)
      expect(satisfiesRange('3.0.0', '>=2 <3')).toBe(false)
      expect(satisfiesRange('1.2.3', '<=1.2.3')).toBe(true)
      expect(satisfiesRange('1.2.4', '>1.2.3')).toBe(true)
      expect(satisfiesRange('1.2.3', '=1.2.3')).toBe(true)
    })

    it('supports wildcards and x ranges', () => {
      expect(satisfiesRange('1.9.9', '1.x')).toBe(true)
      expect(satisfiesRange('2.0.0', '1.x')).toBe(false)
      expect(satisfiesRange('9.9.9', '*')).toBe(true)
      expect(satisfiesRange('1.2.5', '1.2.x')).toBe(true)
    })

    it('supports hyphen ranges and or branches', () => {
      expect(satisfiesRange('2.0.0', '1.2.3 - 2.3.4')).toBe(true)
      expect(satisfiesRange('2.4.0', '1.2.3 - 2.3.4')).toBe(false)
      expect(satisfiesRange('3.1.0', '^1.0.0 || >=3.0.0')).toBe(true)
      expect(satisfiesRange('2.5.0', '^1.0.0 || >=3.0.0')).toBe(false)
    })

    it('handles prerelease comparisons', () => {
      expect(satisfiesRange('1.2.3-beta', '>=1.2.3-alpha')).toBe(true)
      expect(satisfiesRange('1.2.3-alpha', '>=1.2.3')).toBe(false)
    })

    it('throws for empty or invalid ranges and versions', () => {
      expect(() => satisfiesRange('1.2.3', '')).toThrow('Range is empty')
      expect(() => satisfiesRange('1.2.3', 'not-a-range')).toThrow('Invalid range version')
      expect(() => satisfiesRange('1.2', '^1.0.0')).toThrow('Invalid semantic version')
    })
  })

  describe('normalizeRange', () => {
    it('expands caret and tilde ranges', () => {
      expect(normalizeRange('^1.2.3')).toBe('>=1.2.3 <2.0.0')
      expect(normalizeRange('~1.2')).toBe('>=1.2.0 <1.3.0')
    })

    it('expands hyphen ranges and keeps or branches', () => {
      expect(normalizeRange('1.2.3 - 2.3.4')).toBe('>=1.2.3 <=2.3.4')
      expect(normalizeRange('^1.0.0 || ~2.1.0')).toBe('>=1.0.0 <2.0.0 || >=2.1.0 <2.2.0')
    })
  })

  describe('checkRange', () => {
    it('reports the matched branch and comparator results', () => {
      const result = checkRange('1.5.0', '^1.2.3 || >=2.0.0')

      expect(result.satisfied).toBe(true)
      expect(result.reason).toBe('matched')
      expect(result.matchedSet).toBe('>=1.2.3 <2.0.0')
      expect(result.comparators).toEqual([
        { comparator: '>=1.2.3', satisfied: true },
        { comparator: '<2.0.0', satisfied: true },
      ])
    })

    it('marks a wildcard match', () => {
      const result = checkRange('0.0.1', '*')

      expect(result.reason).toBe('wildcard')
      expect(result.matchedSet).toBe('*')
      expect(result.comparators).toEqual([])
    })

    it('reports no match with the first branch comparators', () => {
      const result = checkRange('3.0.0', '^1.0.0 || ~2.0.0')

      expect(result.satisfied).toBe(false)
      expect(result.reason).toBe('no-match')
      expect(result.matchedSet).toBeNull()
      expect(result.comparators[0]).toEqual({ comparator: '>=1.0.0', satisfied: true })
    })
  })
})
