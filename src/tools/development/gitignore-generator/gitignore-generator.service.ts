/** 模板分组：OS 在前、语言在中、框架/工具在后 */
export const gitignoreTemplateGroups = ['system', 'language', 'editor', 'tool'] as const

export type GitignoreTemplateGroup = (typeof gitignoreTemplateGroups)[number]

export type GitignoreTemplate = {
  readonly id: string
  /** 注释头与英文兜底显示名 */
  readonly label: string
  /** UI 文案的 i18n 键（相对 gitignore-generator 前缀） */
  readonly labelKey: string
  readonly group: GitignoreTemplateGroup
  readonly patterns: readonly string[]
}

/** 按分组顺序声明（system → language → editor → tool）；同组内按声明顺序合并 */
export const gitignoreTemplates: readonly GitignoreTemplate[] = [
  // ---- OS 系统 ----
  {
    id: 'macos',
    label: 'macOS',
    labelKey: 'templates.macos',
    group: 'system',
    patterns: [
      '.DS_Store',
      '.AppleDouble',
      '.LSOverride',
      'Icon\\r',
      '._*',
      '.Spotlight-V100',
      '.Trashes',
    ],
  },
  {
    id: 'windows',
    label: 'Windows',
    labelKey: 'templates.windows',
    group: 'system',
    patterns: [
      'Thumbs.db',
      'ehthumbs.db',
      'Desktop.ini',
      '$RECYCLE.BIN/',
      '*.cab',
      '*.msi',
      '*.msm',
      '*.msp',
      '*.lnk',
    ],
  },
  {
    id: 'linux',
    label: 'Linux',
    labelKey: 'templates.linux',
    group: 'system',
    patterns: ['*~', '.directory', '.Trash-*', '.nfs*'],
  },

  // ---- 语言 ----
  {
    id: 'node',
    label: 'Node.js',
    labelKey: 'templates.node',
    group: 'language',
    patterns: [
      'node_modules/',
      'npm-debug.log*',
      'yarn-debug.log*',
      'yarn-error.log*',
      'pnpm-debug.log*',
      '.pnpm-store/',
      '.npm/',
      '.node_repl_history',
      '*.tsbuildinfo',
    ],
  },
  {
    id: 'python',
    label: 'Python',
    labelKey: 'templates.python',
    group: 'language',
    patterns: [
      '__pycache__/',
      '*.py[cod]',
      '*.egg-info/',
      '*.egg',
      '.venv/',
      'venv/',
      'build/',
      'dist/',
      '.pytest_cache/',
      '.mypy_cache/',
      '.ruff_cache/',
    ],
  },
  {
    id: 'java',
    label: 'Java',
    labelKey: 'templates.java',
    group: 'language',
    patterns: [
      'target/',
      'build/',
      '*.class',
      '*.war',
      '*.ear',
      '.gradle/',
      '.classpath',
      '.project',
      '.settings/',
      'hs_err_pid*',
    ],
  },
  {
    id: 'go',
    label: 'Go',
    labelKey: 'templates.go',
    group: 'language',
    patterns: ['*.exe', '*.test', '*.out', 'bin/'],
  },
  {
    id: 'rust',
    label: 'Rust',
    labelKey: 'templates.rust',
    group: 'language',
    patterns: ['target/', '**/*.rs.bk'],
  },
  {
    id: 'dotnet',
    label: '.NET',
    labelKey: 'templates.dotnet',
    group: 'language',
    patterns: [
      'bin/',
      'obj/',
      '*.user',
      '*.suo',
      '.vs/',
      '*.userosscache',
      '*.sln.docstates',
    ],
  },
  {
    id: 'ruby',
    label: 'Ruby',
    labelKey: 'templates.ruby',
    group: 'language',
    patterns: ['.bundle/', 'vendor/bundle/', '*.gem', '.ruby-version', '.ruby-gemset', '.idea/'],
  },
  {
    id: 'php',
    label: 'PHP',
    labelKey: 'templates.php',
    group: 'language',
    patterns: ['vendor/', '.phpunit.result.cache', 'coverage/', '*.log'],
  },
  {
    id: 'c-cpp',
    label: 'C / C++',
    labelKey: 'templates.c-cpp',
    group: 'language',
    patterns: ['*.o', '*.obj', '*.so', '*.dylib', '*.dll', '*.exe', 'build/', 'dist/'],
  },
  {
    id: 'swift',
    label: 'Swift',
    labelKey: 'templates.swift',
    group: 'language',
    patterns: ['build/', '.build/', 'DerivedData/', '*.xcuserdata', 'xcuserdata/'],
  },

  // ---- 框架 ----
  {
    id: 'react',
    label: 'React',
    labelKey: 'templates.react',
    group: 'language',
    patterns: ['build/', '.cache/', '.eslintcache', '.env.local', '.env.*.local'],
  },
  {
    id: 'next',
    label: 'Next.js',
    labelKey: 'templates.next',
    group: 'language',
    patterns: ['.next/', 'out/', '.vercel/', 'next-env.d.ts', '*.tsbuildinfo'],
  },
  {
    id: 'vue',
    label: 'Vue',
    labelKey: 'templates.vue',
    group: 'language',
    patterns: ['.nuxt/', '.output/', '.vuepress/dist/', '.vitepress/cache/', '.vitepress/dist/'],
  },
  {
    id: 'vite',
    label: 'Vite',
    labelKey: 'templates.vite',
    group: 'language',
    patterns: ['dist/', 'dist-ssr/', '*.local', '.vite/'],
  },
  {
    id: 'angular',
    label: 'Angular',
    labelKey: 'templates.angular',
    group: 'language',
    patterns: ['angular-debug.log*', '.angular/', 'dist/', 'coverage/', '.tmp/'],
  },
  {
    id: 'svelte',
    label: 'Svelte',
    labelKey: 'templates.svelte',
    group: 'language',
    patterns: ['svelte-kit/', 'dist/', '.svelte-kit/'],
  },
  {
    id: 'spring',
    label: 'Spring',
    labelKey: 'templates.spring',
    group: 'language',
    patterns: ['target/', '*.class', '*.jar', '*.war', '.springBeans', '.settings/'],
  },
  {
    id: 'flutter',
    label: 'Flutter',
    labelKey: 'templates.flutter',
    group: 'language',
    patterns: ['.dart_tool/', '.flutter-plugins', '.flutter-plugins-dependencies', 'build/'],
  },
  {
    id: 'android',
    label: 'Android',
    labelKey: 'templates.android',
    group: 'language',
    patterns: ['.gradle/', 'build/', 'captures/', 'externalNativeBuild/', '*.keystore'],
  },
  {
    id: 'ios',
    label: 'iOS',
    labelKey: 'templates.ios',
    group: 'language',
    patterns: ['build/', 'DerivedData/', '*.xcuserstate', 'xcuserdata/', '.xcode/'],
  },

  // ---- 编辑器 / IDE ----
  {
    id: 'jetbrains',
    label: 'JetBrains',
    labelKey: 'templates.jetbrains',
    group: 'editor',
    patterns: ['.idea/', '*.iml', '*.ipr', '*.iws', 'out/'],
  },
  {
    id: 'vscode',
    label: 'VS Code',
    labelKey: 'templates.vscode',
    group: 'editor',
    patterns: ['.vscode/*', '!.vscode/extensions.json'],
  },
  {
    id: 'xcode',
    label: 'Xcode',
    labelKey: 'templates.xcode',
    group: 'editor',
    patterns: ['DerivedData/', '*.xcuserstate', 'xcuserdata/', '.xcode/'],
  },
  {
    id: 'intellij',
    label: 'IntelliJ',
    labelKey: 'templates.intellij',
    group: 'editor',
    patterns: ['.idea/', '*.iml', '*.ipr', '*.iws', 'out/'],
  },

  // ---- 工具 ----
  {
    id: 'docker',
    label: 'Docker',
    labelKey: 'templates.docker',
    group: 'tool',
    patterns: ['.docker/', 'docker-compose.override.yml'],
  },
  {
    id: 'env',
    label: 'Environment variables',
    labelKey: 'templates.env',
    group: 'tool',
    patterns: ['.env', '.env.local', '.env.*.local', '!.env.example'],
  },
]

const templatesById = new Map(gitignoreTemplates.map((template) => [template.id, template]))

/** 从一组行中提取非空行并记录已见 key，返回 { lines, seen } */
function dedupeLines(
  rawLines: readonly string[],
  seen: Set<string>,
): string[] {
  const result: string[] = []
  for (const raw of rawLines) {
    const line = raw.trim()
    if (line === '') {
      continue
    }
    const key = line.toLowerCase()
    if (seen.has(key)) {
      continue
    }
    seen.add(key)
    result.push(line)
  }
  return result
}

/**
 * 按 templates 的固定顺序合成 .gitignore：
 * - 空选择且 extra 为空时抛 Error('At least one template must be selected')
 * - 每个被选中的模板生成一个注释头块，块间空一行
 * - 自定义追加行 extra 合并去重后追加到末尾
 * - 跨模板 / extra 全局大小写去重
 * - 未知 id 抛 Error
 */
export function buildGitignore(
  selected: readonly string[],
  extra: string = '',
): string {
  const selectedSet = new Set(selected)

  for (const id of selectedSet) {
    if (!templatesById.has(id)) {
      throw new Error(`Unknown gitignore template: ${id}`)
    }
  }

  const extraTrimmed = extra.trim()
  if (selectedSet.size === 0 && extraTrimmed === '') {
    throw new Error('At least one template must be selected')
  }

  const seen = new Set<string>()
  const selectedTemplates = gitignoreTemplates.filter((template) => selectedSet.has(template.id))

  const blocks: string[] = selectedTemplates.map((template) => {
    const deduped = dedupeLines(template.patterns, seen)
    return `# ${template.label}\n${deduped.join('\n')}`
  })

  if (extraTrimmed !== '') {
    const rawExtraLines = extraTrimmed.split('\n')
    const dedupedExtra = dedupeLines(rawExtraLines, seen)
    if (dedupedExtra.length > 0) {
      blocks.push(`# Custom\n${dedupedExtra.join('\n')}`)
    }
  }

  return `${blocks.join('\n\n')}\n`
}

/**
 * 兼容旧签名：空选择时返回空串（UI 层处理），实际委托给 buildGitignore。
 * @deprecated Prefer `buildGitignore(selected, extra)` which handles empty-input errors.
 */
export function composeGitignore(ids: readonly string[]): string {
  if (ids.length === 0) {
    return ''
  }
  return buildGitignore(ids)
}
