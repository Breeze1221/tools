import { describe, expect, it } from 'vitest'

import {
  DEFAULT_TSCONFIG_OPTIONS,
  TSCONFIG_PRESETS,
  generateTsconfig,
} from '@/tools/development/tsconfig-generator/tsconfig-generator.service'

type GeneratedConfig = {
  compilerOptions: Record<string, unknown>
}

function parse(output: string): GeneratedConfig {
  return JSON.parse(output) as GeneratedConfig
}

describe('tsconfig-generator service', () => {
  describe('TSCONFIG_PRESETS', () => {
    it('produces valid JSON for every preset', () => {
      for (const preset of TSCONFIG_PRESETS) {
        const result = parse(generateTsconfig(preset.options))
        expect(result.compilerOptions.target).toBe('ES2022')
      }
    })

    it('keeps the vite-react preset on bundler resolution', () => {
      const preset = TSCONFIG_PRESETS.find((item) => item.id === 'vite-react')
      expect(preset).toBeDefined()
      const result = parse(generateTsconfig(preset?.options ?? {}))

      expect(result.compilerOptions.moduleResolution).toBe('Bundler')
      expect(result.compilerOptions.jsx).toBe('react-jsx')
      expect(result.compilerOptions.paths).toEqual({ '@/*': ['./src/*'] })
    })

    it('omits jsx for the node preset', () => {
      const preset = TSCONFIG_PRESETS.find((item) => item.id === 'node')
      const result = parse(generateTsconfig(preset?.options ?? {}))

      expect(result.compilerOptions.jsx).toBeUndefined()
      expect(result.compilerOptions.baseUrl).toBeUndefined()
      expect(result.compilerOptions.module).toBe('NodeNext')
    })

    it('emits declarations for the library preset', () => {
      const preset = TSCONFIG_PRESETS.find((item) => item.id === 'library')
      const result = parse(generateTsconfig(preset?.options ?? {}))

      expect(result.compilerOptions.declaration).toBe(true)
      expect(result.compilerOptions.outDir).toBe('dist')
    })
  })

  describe('generateTsconfig', () => {
    it('uses stable defaults', () => {
      const result = parse(generateTsconfig())

      expect(result.compilerOptions.target).toBe(DEFAULT_TSCONFIG_OPTIONS.target)
      expect(result.compilerOptions.strict).toBe(true)
      expect(result.compilerOptions.esModuleInterop).toBe(true)
    })

    it('serializes booleans and arrays', () => {
      const result = parse(
        generateTsconfig({ strict: false, declaration: true, lib: ['ES2020', 'DOM'] }),
      )

      expect(result.compilerOptions.strict).toBe(false)
      expect(result.compilerOptions.declaration).toBe(true)
      expect(result.compilerOptions.lib).toEqual(['ES2020', 'DOM'])
    })

    it('keeps compiler option keys in a fixed order', () => {
      const output = generateTsconfig()

      const targetIndex = output.indexOf('"target"')
      const moduleIndex = output.indexOf('"module"')
      const baseUrlIndex = output.indexOf('"baseUrl"')
      const outDirIndex = output.indexOf('"outDir"')

      expect(targetIndex).toBeGreaterThan(-1)
      expect(targetIndex).toBeLessThan(moduleIndex)
      expect(moduleIndex).toBeLessThan(baseUrlIndex)
      expect(baseUrlIndex).toBeLessThan(outDirIndex)
    })

    it('throws for invalid paths mappings', () => {
      expect(() => generateTsconfig({ paths: { 'src/*': ['./src/*'] } })).toThrow(
        'Invalid paths key: src/*',
      )
      expect(() => generateTsconfig({ paths: { '@/*': [] } })).toThrow(
        'Invalid paths targets for @/*',
      )
      expect(() => generateTsconfig({ paths: { '@/*': ['   '] } })).toThrow(
        'Invalid paths targets for @/*',
      )
    })

    it('throws for unknown enum values', () => {
      expect(() =>
        generateTsconfig({ target: 'ES2099' as typeof DEFAULT_TSCONFIG_OPTIONS.target }),
      ).toThrow('Invalid target')
    })
  })
})
