import { BookOpenText } from 'lucide-react'

import { defineTool } from '../../define-tool'

export const tool = defineTool({
  name: 'readability-analyzer',
  path: '/readability-analyzer',
  keywords: [
    'readability',
    'flesch reading ease',
    'flesch kincaid',
    'gunning fog',
    'text analysis',
    '可读性',
    '易读性分析',
    '弗莱施指数',
    '阅读难度',
    '文本分析',
  ],
  icon: BookOpenText,
  component: () => import('./ReadabilityAnalyzer'),
  createdAt: '2026-11-10',
})
