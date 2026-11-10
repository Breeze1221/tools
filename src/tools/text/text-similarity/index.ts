import { GitCompareArrows } from 'lucide-react'

import { defineTool } from '../../define-tool'

export const tool = defineTool({
  name: 'text-similarity',
  path: '/text-similarity',
  keywords: [
    'text similarity',
    'levenshtein',
    'edit distance',
    'jaccard',
    'text compare',
    '文本相似度',
    '编辑距离',
    '莱文斯坦',
    '文本对比',
    '相似度计算',
  ],
  icon: GitCompareArrows,
  component: () => import('./TextSimilarity'),
  createdAt: '2026-11-10',
})
