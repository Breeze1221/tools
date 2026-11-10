export const TSCONFIG_TARGETS = [
  'ES5',
  'ES2015',
  'ES2016',
  'ES2017',
  'ES2018',
  'ES2019',
  'ES2020',
  'ES2021',
  'ES2022',
  'ESNext',
] as const
export type TsconfigTarget = (typeof TSCONFIG_TARGETS)[number]

export const TSCONFIG_MODULES = [
  'CommonJS',
  'ES2015',
  'ES2020',
  'ES2022',
  'ESNext',
  'NodeNext',
  'Bundler',
] as const
export type TsconfigModule = (typeof TSCONFIG_MODULES)[number]

export const TSCONFIG_MODULE_RESOLUTIONS = [
  'Classic',
  'Node',
  'Node10',
  'Node16',
  'NodeNext',
  'Bundler',
] as const
export type TsconfigModuleResolution = (typeof TSCONFIG_MODULE_RESOLUTIONS)[number]

export const TSCONFIG_JSX = ['none', 'preserve', 'react', 'react-jsx', 'react-jsxdev'] as const
export type TsconfigJsx = (typeof TSCONFIG_JSX)[number]

export const TSCONFIG_LIBS = [
  'ES2020',
  'ES2021',
  'ES2022',
  'DOM',
  'DOM.Iterable',
  'WebWorker',
] as const
export type TsconfigLib = (typeof TSCONFIG_LIBS)[number]

export type TsconfigOptions = {
  readonly target: TsconfigTarget
  readonly module: TsconfigModule
  readonly moduleResolution: TsconfigModuleResolution
  /** none 时省略 jsx 字段 */
  readonly jsx: TsconfigJsx
  readonly strict: boolean
  readonly lib: readonly TsconfigLib[]
  /** 空字符串时省略 baseUrl */
  readonly baseUrl: string
  readonly paths: Record<string, readonly string[]>
  /** 空字符串时省略 outDir */
  readonly outDir: string
  readonly declaration: boolean
  readonly sourceMap: boolean
  readonly esModuleInterop: boolean
  readonly skipLibCheck: boolean
}

export type TsconfigPreset = {
  readonly id: 'vite-react' | 'node' | 'library'
  readonly options: TsconfigOptions
}

export const DEFAULT_TSCONFIG_OPTIONS: TsconfigOptions = {
  target: 'ES2022',
  module: 'ESNext',
  moduleResolution: 'Bundler',
  jsx: 'react-jsx',
  strict: true,
  lib: ['ES2022', 'DOM', 'DOM.Iterable'],
  baseUrl: '.',
  paths: {},
  outDir: 'dist',
  declaration: false,
  sourceMap: true,
  esModuleInterop: true,
  skipLibCheck: true,
}

export const TSCONFIG_PRESETS: readonly TsconfigPreset[] = [
  {
    id: 'vite-react',
    options: {
      target: 'ES2022',
      module: 'ESNext',
      moduleResolution: 'Bundler',
      jsx: 'react-jsx',
      strict: true,
      lib: ['ES2022', 'DOM', 'DOM.Iterable'],
      baseUrl: '.',
      paths: { '@/*': ['./src/*'] },
      outDir: 'dist',
      declaration: false,
      sourceMap: true,
      esModuleInterop: true,
      skipLibCheck: true,
    },
  },
  {
    id: 'node',
    options: {
      target: 'ES2022',
      module: 'NodeNext',
      moduleResolution: 'NodeNext',
      jsx: 'none',
      strict: true,
      lib: ['ES2022'],
      baseUrl: '',
      paths: {},
      outDir: 'dist',
      declaration: false,
      sourceMap: true,
      esModuleInterop: true,
      skipLibCheck: true,
    },
  },
  {
    id: 'library',
    options: {
      target: 'ES2022',
      module: 'ESNext',
      moduleResolution: 'Bundler',
      jsx: 'react-jsx',
      strict: true,
      lib: ['ES2022', 'DOM'],
      baseUrl: 'src',
      paths: { '@/*': ['./src/*'] },
      outDir: 'dist',
      declaration: true,
      sourceMap: true,
      esModuleInterop: true,
      skipLibCheck: true,
    },
  },
]

function assertOneOf<T extends string>(
  values: readonly T[],
  value: string,
  label: string,
): asserts value is T {
  if (!(values as readonly string[]).includes(value)) {
    throw new Error(`Invalid ${label}: ${value}`)
  }
}

function validatePaths(paths: Record<string, readonly string[]>): Record<string, string[]> {
  const result: Record<string, string[]> = {}
  for (const [key, targets] of Object.entries(paths)) {
    if (key.trim() === '' || (!key.startsWith('@') && !key.startsWith('*'))) {
      throw new Error(`Invalid paths key: ${key}`)
    }
    if (!Array.isArray(targets) || targets.length === 0) {
      throw new Error(`Invalid paths targets for ${key}`)
    }
    const cleaned = targets.map((target) => target.trim()).filter((target) => target !== '')
    if (cleaned.length === 0) {
      throw new Error(`Invalid paths targets for ${key}`)
    }
    result[key] = cleaned
  }
  return result
}

/** 生成格式稳定（2 空格缩进、键顺序固定）的 tsconfig.json */
export function generateTsconfig(options: Partial<TsconfigOptions> = {}): string {
  const resolved: TsconfigOptions = { ...DEFAULT_TSCONFIG_OPTIONS, ...options }
  assertOneOf(TSCONFIG_TARGETS, resolved.target, 'target')
  assertOneOf(TSCONFIG_MODULES, resolved.module, 'module')
  assertOneOf(TSCONFIG_MODULE_RESOLUTIONS, resolved.moduleResolution, 'moduleResolution')
  assertOneOf(TSCONFIG_JSX, resolved.jsx, 'jsx')

  const compilerOptions: Record<string, unknown> = {
    target: resolved.target,
  }

  const lib = resolved.lib.filter((item) => item.trim() !== '')
  if (lib.length > 0) {
    compilerOptions.lib = lib
  }

  compilerOptions.module = resolved.module
  compilerOptions.moduleResolution = resolved.moduleResolution

  if (resolved.jsx !== 'none') {
    compilerOptions.jsx = resolved.jsx
  }

  compilerOptions.strict = resolved.strict
  compilerOptions.esModuleInterop = resolved.esModuleInterop
  compilerOptions.skipLibCheck = resolved.skipLibCheck
  compilerOptions.declaration = resolved.declaration
  compilerOptions.sourceMap = resolved.sourceMap

  const baseUrl = resolved.baseUrl.trim()
  if (baseUrl !== '') {
    compilerOptions.baseUrl = baseUrl
  }

  const paths = validatePaths(resolved.paths)
  if (Object.keys(paths).length > 0) {
    compilerOptions.paths = paths
  }

  const outDir = resolved.outDir.trim()
  if (outDir !== '') {
    compilerOptions.outDir = outDir
  }

  return `${JSON.stringify({ compilerOptions }, null, 2)}\n`
}
