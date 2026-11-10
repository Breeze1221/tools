import { Replace } from 'lucide-react'

import { defineTool } from '../../define-tool'

export const tool = defineTool({
  name: 'find-and-replace',
  path: '/find-and-replace',
  keywords: [
    'find and replace',
    'replace text',
    'search',
    'regex replace',
    '查找替换',
    '文本替换',
    '正则替换',
    '批量替换',
    '搜索',
  ],
  icon: Replace,
  component: () => import('./FindAndReplace'),
  createdAt: '2026-11-10',
})
