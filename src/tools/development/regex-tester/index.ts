import { Regex } from 'lucide-react'

import { defineTool } from '../../define-tool'

export const tool = defineTool({
  name: 'regex-tester',
  path: '/regex-tester',
  keywords: [
    'regex',
    'regexp',
    'regular expression',
    'match',
    'pattern',
    'capture group',
    'replace',
    '正则',
    '正则表达式',
    '匹配',
    '捕获组',
    '替换',
  ],
  icon: Regex,
  component: () => import('./RegexTester'),
  createdAt: '2026-11-09',
})
