import { TextCursorInput } from 'lucide-react'

import { defineTool } from '../../define-tool'

export const tool = defineTool({
  name: 'text-template',
  path: '/text-template',
  keywords: [
    'text template',
    'template variables',
    'placeholder',
    'mustache',
    'fill template',
    '文本模板',
    '模板变量',
    '占位符',
    '变量填充',
    '批量替换',
  ],
  icon: TextCursorInput,
  component: () => import('./TextTemplate'),
  createdAt: '2026-11-10',
})
