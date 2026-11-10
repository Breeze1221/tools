import { SpellCheck } from 'lucide-react'

import { defineTool } from '../../define-tool'

export const tool = defineTool({
  name: 'unicode-inspector',
  path: '/unicode-inspector',
  keywords: [
    'unicode',
    'code point',
    'utf-8',
    'utf-16',
    'surrogate pair',
    'character inspector',
    'Unicode 检查',
    '码点',
    '字符编码',
    '代理对',
    '字符统计',
    'emoji 编码',
  ],
  icon: SpellCheck,
  component: () => import('./UnicodeInspector'),
  createdAt: '2026-11-10',
})
