import { Sigma } from 'lucide-react'

import { defineTool } from '../../define-tool'

export const tool = defineTool({
  name: 'word-frequency-counter',
  path: '/word-frequency-counter',
  keywords: [
    'word frequency',
    'word count',
    'frequency counter',
    'keyword density',
    'segmenter',
    '词频',
    '词频统计',
    '单词计数',
    '关键词密度',
    '文本分析',
  ],
  icon: Sigma,
  component: () => import('./WordFrequencyCounter'),
  createdAt: '2026-11-10',
})
