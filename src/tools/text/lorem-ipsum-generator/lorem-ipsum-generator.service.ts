/** 生成模式：段落 / 句子 / 单词 */
export const loremTypes = ['paragraph', 'sentence', 'word'] as const
export type LoremType = (typeof loremTypes)[number]

/** 语种：拉丁占位文 / 中文占位文 */
export const loremLanguages = ['latin', 'chinese'] as const
export type LoremLanguage = (typeof loremLanguages)[number]

export const LOREM_COUNT_MIN = 1
export const LOREM_COUNT_MAX = 20

export interface LoremOptions {
  type: LoremType
  count: number
  startWithLorem: boolean
  language: LoremLanguage
}

/** 经典开头句：拉丁模式选中「以 Lorem ipsum 开头」时整句打头 */
const LATIN_OPENING =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.'
const LATIN_OPENING_WORDS = ['Lorem', 'ipsum', 'dolor', 'sit', 'amet'] as const

/** 中文模式的固定开头句，保证中文输出里不出现拉丁字母 */
const CHINESE_OPENING = '这是一段用于排版演示的占位文本，可以替换成真实内容。'
const CHINESE_OPENING_WORDS = ['这是', '一段', '中文', '占位', '文本'] as const

/** 拉丁单词库（≥ 60 词），单词模式按数量精确取用 */
export const latinWords = [
  'lorem',
  'ipsum',
  'dolor',
  'sit',
  'amet',
  'consectetur',
  'adipiscing',
  'elit',
  'sed',
  'do',
  'eiusmod',
  'tempor',
  'incididunt',
  'ut',
  'labore',
  'et',
  'dolore',
  'magna',
  'aliqua',
  'enim',
  'ad',
  'minim',
  'veniam',
  'quis',
  'nostrud',
  'exercitation',
  'ullamco',
  'laboris',
  'nisi',
  'aliquip',
  'ex',
  'ea',
  'commodo',
  'consequat',
  'duis',
  'aute',
  'irure',
  'in',
  'reprehenderit',
  'voluptate',
  'velit',
  'esse',
  'cillum',
  'fugiat',
  'nulla',
  'pariatur',
  'excepteur',
  'sint',
  'occaecat',
  'cupidatat',
  'non',
  'proident',
  'sunt',
  'culpa',
  'qui',
  'officia',
  'deserunt',
  'mollit',
  'anim',
  'id',
  'est',
  'laborum',
  'design',
  'layout',
  'content',
  'sample',
  'placeholder',
  'draft',
  'review',
  'report',
  'project',
  'team',
] as const

/**
 * 拉丁句子的构件：主语 + 谓语 + 宾语 + 状语，拼出来始终是完整的「主谓宾」结构，
 * 而不是随机词拼贴。
 */
const LATIN_SUBJECTS = [
  'The design team',
  'The engineer',
  'The writer',
  'The reviewer',
  'The client',
  'The architect',
  'The editor',
  'The student',
  'The manager',
  'The developer',
  'The analyst',
  'The researcher',
  'A careful reader',
  'A new contributor',
  'A senior editor',
  'Every participant',
] as const

const LATIN_VERBS = [
  'prepares',
  'reviews',
  'builds',
  'explains',
  'tests',
  'improves',
  'documents',
  'delivers',
  'refines',
  'organizes',
  'describes',
  'evaluates',
  'summarizes',
  'compares',
  'collects',
  'publishes',
] as const

const LATIN_OBJECTS = [
  'a new layout',
  'the monthly report',
  'a simple prototype',
  'the final draft',
  'a clear summary',
  'the visual style',
  'the release notes',
  'a better workflow',
  'the project timeline',
  'the sample data',
  'a short checklist',
  'the shared document',
  'a detailed plan',
  'the first version',
  'a quick estimate',
  'the next milestone',
] as const

const LATIN_TAILS = [
  ' before the deadline.',
  ' during the review.',
  ' in the new release.',
  ' with little effort.',
  ' for the whole team.',
  ' after a short break.',
  ' without any delay.',
  ' in the shared workspace.',
] as const

/** 中文占位句库（≥ 20 句），句子自带句号，拼接时不再补标点 */
const CHINESE_SENTENCES = [
  '这是一段用于排版演示的占位文本，可以替换成真实内容。',
  '页面设计需要保持清晰的层级与稳定的留白节奏。',
  '我们会在每次评审之后更新文档与设计稿。',
  '良好的排印细节能够显著提升内容的可读性。',
  '团队约定每周整理一次组件库与样式令牌。',
  '新的交互方案将在下一版本中逐步上线。',
  '请根据实际数据调整卡片与列表的展示顺序。',
  '内容区域应当在不同屏幕尺寸下保持自然对齐。',
  '这段文字仅用于预览效果，不代表最终文案。',
  '若需要更长的段落，可以重复使用这些句子。',
  '用户研究的结果为设计决策提供了可靠依据。',
  '我们把复杂的操作拆成了几个简单的步骤。',
  '反馈渠道已经开放，欢迎随时提出改进建议。',
  '一致的用词与标点能让界面读起来更顺畅。',
  '移动端的操作区域需要留出足够的点击空间。',
  '这份草稿还需要补充数据来源与参考链接。',
  '合理的行高可以缓解长时间阅读带来的疲劳。',
  '视觉稿与实现之间应当保持同步更新。',
  '在正式发布之前，我们会完成一轮完整的测试。',
  '以上内容均为示例，可以根据场景自由删改。',
  '清晰的说明文字能够降低用户的理解成本。',
  '每个模块都应当有明确的标题与结论。',
] as const

/** 中文单词库，供单词模式按数量取用 */
const CHINESE_WORDS = [
  '占位',
  '文本',
  '排版',
  '设计',
  '页面',
  '内容',
  '组件',
  '样式',
  '交互',
  '版本',
  '团队',
  '文档',
  '评审',
  '数据',
  '列表',
  '卡片',
  '布局',
  '留白',
  '节奏',
  '标题',
  '段落',
  '句子',
  '示例',
  '场景',
  '用户',
  '反馈',
  '流程',
  '步骤',
  '测试',
  '发布',
  '更新',
  '说明',
  '细节',
  '可读性',
  '移动端',
  '屏幕',
  '尺寸',
  '效果',
  '方案',
  '草稿',
] as const

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

function randomBetween(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1))
}

function latinSentence(): string {
  return `${pick(LATIN_SUBJECTS)} ${pick(LATIN_VERBS)} ${pick(LATIN_OBJECTS)}${pick(LATIN_TAILS)}`
}

function chineseSentence(): string {
  return pick(CHINESE_SENTENCES)
}

/** 一段 = 3–5 句；第一段按需以开头句打头 */
function paragraph(language: LoremLanguage, startWithLorem: boolean): string {
  const sentences = Array.from({ length: randomBetween(3, 5) }, () =>
    language === 'latin' ? latinSentence() : chineseSentence(),
  )
  if (startWithLorem) {
    sentences[0] = language === 'latin' ? LATIN_OPENING : CHINESE_OPENING
  }
  // 中文句子之间不留空格，拉丁句子之间用一个空格分隔
  return sentences.join(language === 'latin' ? ' ' : '')
}

function words(language: LoremLanguage, count: number, startWithLorem: boolean): string {
  const seed: readonly string[] = startWithLorem
    ? language === 'latin'
      ? LATIN_OPENING_WORDS
      : CHINESE_OPENING_WORDS
    : []
  const pool = language === 'latin' ? latinWords : CHINESE_WORDS
  const rest = Array.from({ length: Math.max(0, count - seed.length) }, () => pick(pool))
  return [...seed, ...rest].slice(0, count).join(' ')
}

function assertCount(count: number): void {
  if (!Number.isInteger(count) || count < LOREM_COUNT_MIN || count > LOREM_COUNT_MAX) {
    throw new Error(
      `Count must be an integer between ${LOREM_COUNT_MIN} and ${LOREM_COUNT_MAX}, received ${count}`,
    )
  }
}

/**
 * 生成占位文本。
 *
 * - 段落模式：`count` 段，段间以空行分隔（纯文本，UI 负责按段落渲染 `<p>`）
 * - 句子模式：`count` 句，单行
 * - 单词模式：精确 `count` 个词
 *
 * 中文模式以中文开头句替代「Lorem ipsum dolor sit amet」，避免中文输出混入拉丁字母。
 */
export function generateLorem(options: LoremOptions): string {
  const { type, count, startWithLorem, language } = options
  assertCount(count)

  if (type === 'word') {
    return words(language, count, startWithLorem)
  }

  if (type === 'sentence') {
    const sentences = Array.from({ length: count }, () =>
      language === 'latin' ? latinSentence() : chineseSentence(),
    )
    if (startWithLorem) {
      sentences[0] = language === 'latin' ? LATIN_OPENING : CHINESE_OPENING
    }
    return sentences.join(language === 'latin' ? ' ' : '')
  }

  return Array.from({ length: count }, () => paragraph(language, startWithLorem)).join('\n\n')
}
