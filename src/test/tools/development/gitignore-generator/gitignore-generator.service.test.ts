import { describe, expect, it } from 'vitest'

import {
  buildGitignore,
  composeGitignore,
  gitignoreTemplates,
} from '@/tools/development/gitignore-generator/gitignore-generator.service'

const REQUIRED_IDS = [
  'node',
  'react',
  'next',
  'vue',
  'vite',
  'python',
  'java',
  'go',
  'rust',
  'dotnet',
  'macos',
  'windows',
  'linux',
  'jetbrains',
  'vscode',
  'docker',
  'env',
] as const

describe('gitignoreTemplates', () => {
  it('contains at least 15 templates', () => {
    expect(gitignoreTemplates.length).toBeGreaterThanOrEqual(15)
  })

  it('contains every required template id', () => {
    const ids = gitignoreTemplates.map((template) => template.id)
    for (const id of REQUIRED_IDS) {
      expect(ids).toContain(id)
    }
  })

  it('gives every template a label key and at least one pattern', () => {
    for (const template of gitignoreTemplates) {
      expect(template.labelKey).not.toBe('')
      expect(template.patterns.length).toBeGreaterThan(0)
    }
  })

  it('places system templates before language templates', () => {
    const systemIndex = gitignoreTemplates.findIndex((t) => t.group === 'system')
    const languageIndex = gitignoreTemplates.findIndex((t) => t.group === 'language')
    expect(systemIndex).toBeGreaterThanOrEqual(0)
    expect(languageIndex).toBeGreaterThanOrEqual(0)
    expect(systemIndex).toBeLessThan(languageIndex)
  })
})

describe('buildGitignore', () => {
  it('throws when no template is selected and extra is empty', () => {
    expect(() => buildGitignore([])).toThrow('At least one template must be selected')
    expect(() => buildGitignore([], '')).toThrow('At least one template must be selected')
  })

  it('returns non-empty output when at least one template is selected', () => {
    const output = buildGitignore(['node'])
    expect(output.length).toBeGreaterThan(0)
    expect(output.startsWith('# Node.js')).toBe(true)
    expect(output).toContain('node_modules/')
  })

  it('supports extra custom lines appended at the end', () => {
    const output = buildGitignore(['node'], '*.log\n.env.secret')
    expect(output).toContain('*.log')
    expect(output).toContain('.env.secret')
    // Custom block appears after Node block
    expect(output.indexOf('# Node.js')).toBeLessThan(output.indexOf('# Custom'))
  })

  it('supports extra-only mode (no template selected but extra provided)', () => {
    const output = buildGitignore([], '*.log')
    expect(output).toContain('*.log')
    expect(output.startsWith('# Custom')).toBe(true)
  })

  it('deduplicates repeated ids', () => {
    const once = buildGitignore(['node'])
    const twice = buildGitignore(['node', 'node'])
    expect(twice).toBe(once)
  })

  it('deduplicates patterns case-insensitively across templates', () => {
    // node 有 node_modules/，额外的额外行如果加了 NODE_MODULES/ 应该被忽略
    const output = buildGitignore(['node'], 'NODE_MODULES/')
    const occurrences = (output.match(/node_modules/gi) ?? []).length
    expect(occurrences).toBe(1)
  })

  it('keeps group order (OS → language → editor → tool) regardless of selection order', () => {
    const osFirst = buildGitignore(['linux', 'python'])
    const langFirst = buildGitignore(['python', 'linux'])
    expect(osFirst).toBe(langFirst)
    expect(osFirst.indexOf('# Linux')).toBeLessThan(osFirst.indexOf('# Python'))
  })

  it('throws on an unknown template id', () => {
    expect(() => buildGitignore(['unknown'])).toThrow(/Unknown gitignore template/)
  })

  it('renders multiple templates separated by blank lines', () => {
    const output = buildGitignore(['node', 'python'])
    expect(output).toContain('\n\n# Python')
  })
})

describe('composeGitignore (legacy wrapper)', () => {
  it('returns empty string for empty selection (UI convenience)', () => {
    expect(composeGitignore([])).toBe('')
  })

  it('delegates to buildGitignore for non-empty selection', () => {
    expect(composeGitignore(['node'])).toBe(buildGitignore(['node']))
  })
})
