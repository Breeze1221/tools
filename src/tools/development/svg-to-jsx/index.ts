import { Code2 } from 'lucide-react'

import { defineTool } from '../../define-tool'

export const tool = defineTool({
  name: 'svg-to-jsx',
  path: '/svg-to-jsx',
  keywords: [
    'svg',
    'jsx',
    'react',
    'component',
    'convert',
    'typescript',
    'SVG 转 React',
    '组件',
    '转换',
    '图标',
  ],
  icon: Code2,
  component: () => import('./SvgToJsx'),
  createdAt: '2026-11-10',
})
